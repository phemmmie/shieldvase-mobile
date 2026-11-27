import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { fetchMaterialCityPrice } from './api';

/** Live current price for a curated material in one city (verified vendors only). */
export function useMaterialCityPrice(unifiedProductIds: string[], city?: string) {
  return useQuery({
    queryKey: ['material-city-price', city, unifiedProductIds],
    queryFn: () => fetchMaterialCityPrice(supabase, unifiedProductIds, city!),
    enabled: unifiedProductIds.length > 0 && !!city,
  });
}
