import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';

// Port of web useVariantAxes.ts + VariantPicker helpers.

export interface VariantAxis {
  name: string;
  label: string;
  type?: string;
  options?: { label: string; value: string }[];
  group?: string;
}

export function useVariantAxes(
  unifiedProductId: string | null | undefined,
  vendorId?: string | null,
) {
  const { data: schema, isLoading: schemaLoading } = useQuery({
    queryKey: ['variant-axes-schema', unifiedProductId],
    enabled: !!unifiedProductId,
    queryFn: async () => {
      const client = supabase as any;
      const { data: up } = await client
        .from('unified_products')
        .select('id, category_id, subcategory_id')
        .eq('id', unifiedProductId)
        .maybeSingle();
      if (!up) return { axes: [] as VariantAxis[] };

      const leafId = up.subcategory_id || up.category_id;
      if (!leafId) return { axes: [] as VariantAxis[] };

      const { data: cat } = await client
        .from('categories')
        .select('id, metadata, parent_id')
        .eq('id', leafId)
        .maybeSingle();

      const fields: any[] = cat?.metadata?.field_schema || [];
      const axes: VariantAxis[] = fields
        .filter((f) => f?.variant_axis === true)
        .map((f) => ({
          name: f.name,
          label: f.label || f.name,
          type: f.type,
          options: Array.isArray(f.options) ? f.options : [],
          group: f.group,
        }));
      return { axes };
    },
  });

  const { data: values, isLoading: valuesLoading } = useQuery({
    queryKey: ['variant-axes-values', unifiedProductId, vendorId || null],
    enabled: !!unifiedProductId && !!schema?.axes?.length,
    queryFn: async () => {
      const client = supabase as any;
      let q = client
        .from('vendor_products')
        .select('id, vendor_id, category_data, stock_quantity, status')
        .eq('unified_product_id', unifiedProductId)
        .eq('status', 'active');
      if (vendorId) q = q.eq('vendor_id', vendorId);
      const { data: vps } = await q;

      const map: Record<string, Set<string>> = {};
      (schema?.axes || []).forEach((a) => (map[a.name] = new Set()));
      (vps || []).forEach((vp: any) => {
        if ((vp.stock_quantity ?? 0) <= 0) return;
        const cd = vp.category_data || {};
        (schema?.axes || []).forEach((a) => {
          const v = cd[a.name];
          if (Array.isArray(v)) v.forEach((x) => x != null && map[a.name].add(String(x)));
          else if (v != null && v !== '') map[a.name].add(String(v));
        });
      });
      const out: Record<string, string[]> = {};
      Object.keys(map).forEach((k) => (out[k] = Array.from(map[k])));
      return out;
    },
  });

  return {
    axes: (schema?.axes || []) as VariantAxis[],
    availableValues: (values || {}) as Record<string, string[]>,
    isLoading: schemaLoading || valuesLoading,
  };
}

export function variantValueLabel(axis: VariantAxis, value: string): string {
  const opt = (axis.options || []).find((o) => String(o.value) === String(value));
  return opt?.label || String(value);
}

/** Options per axis: admin-eligible values intersected with stocked values. */
export function resolveAxisOptions(
  axis: VariantAxis,
  eligibleVariants: Record<string, string[]>,
  availableValues: Record<string, string[]>,
): string[] {
  const admin = eligibleVariants[axis.name] || [];
  const stocked = availableValues[axis.name] || [];
  if (admin.length === 0) return stocked;
  if (stocked.length === 0) return admin;
  const stockSet = new Set(stocked);
  const intersection = admin.filter((v) => stockSet.has(v));
  return intersection.length > 0 ? intersection : admin;
}

/** Validate buyer made a choice for every required axis (web getMissingAxes). */
export function getMissingAxes(
  axes: VariantAxis[],
  eligible: Record<string, string[]>,
  available: Record<string, string[]>,
  value: Record<string, string>,
): string[] {
  return axes
    .filter((a) => {
      const opts = (eligible[a.name]?.length ? eligible[a.name] : available[a.name]) || [];
      return opts.length > 1 && !value[a.name];
    })
    .map((a) => a.label);
}
