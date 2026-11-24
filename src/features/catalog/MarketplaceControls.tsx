import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { EmptyState, ErrorState } from '@/components/States';
import { ProductGridSkeleton } from '@/components/Skeleton';
import { MarketplaceCard } from './MarketplaceCard';
import type {
  CategoryChip,
  MarketplaceProduct,
  SortKey,
} from './marketplaceApi';
import { SORT_OPTIONS } from './marketplaceApi';

/* ── Search bar — web's centered icon Input ── */
export function MarketplaceSearch({
  placeholder,
  value,
  onChange,
  accent,
}: {
  placeholder: string;
  value: string;
  onChange: (t: string) => void;
  accent: string;
}) {
  return (
    <View style={styles.searchWrap}>
      <Ionicons name="search" size={16} color={colors.textMuted} style={styles.searchIcon} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.searchInput, { borderColor: accent }]}
        autoCapitalize="none"
        returnKeyType="search"
      />
    </View>
  );
}

/* ── Horizontal category chips ── */
export function CategoryChips({
  options,
  selectedId,
  selectedSlug,
  onPick,
  accent,
}: {
  options: CategoryChip[];
  selectedId: string | null;
  selectedSlug: string | null;
  onPick: (chip: CategoryChip | null) => void;
  accent: string;
}) {
  const chip = (label: string, count: number | null, active: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={[
        styles.chip,
        active
          ? { backgroundColor: accent, borderColor: accent }
          : { backgroundColor: '#FFFFFF', borderColor: colors.border },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? '#FFFFFF' : colors.text }]} numberOfLines={1}>
        {label}
        {count != null ? ` (${count})` : ''}
      </Text>
    </Pressable>
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {chip('All Products', null, !selectedId && !selectedSlug, () => onPick(null))}
      {options.map((o) =>
        chip(
          o.name,
          o.count,
          o.id === selectedId || o.slug === selectedSlug,
          () => onPick(o),
        ),
      )}
    </ScrollView>
  );
}

/* ── Multi-select bottom sheet (Locations / Brands) ── */
export function MultiSelectSheet({
  visible,
  title,
  options,
  selected,
  onToggle,
  onClose,
  accent,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  onClose: () => void;
  accent: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHead}>
          <Text style={[styles.sheetTitle, { color: accent }]}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </Pressable>
        </View>
        <ScrollView style={{ maxHeight: 380 }}>
          {options.map((o) => {
            const on = selected.includes(o);
            return (
              <Pressable key={o} onPress={() => onToggle(o)} style={styles.sheetOption}>
                <View
                  style={[
                    styles.checkbox,
                    on && { backgroundColor: accent, borderColor: accent },
                  ]}
                >
                  {on && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                </View>
                <Text style={styles.sheetOptionText}>{o}</Text>
              </Pressable>
            );
          })}
          {!options.length && (
            <Text style={styles.sheetEmpty}>No options available</Text>
          )}
        </ScrollView>
        <Pressable onPress={onClose} style={[styles.sheetDone, { backgroundColor: accent }]}>
          <Text style={styles.sheetDoneText}>Done</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

/* ── "Locations (2)" / "Brands" trigger buttons + clear ── */
export function FilterBar({
  accent,
  locations,
  brands,
  selectedLocations,
  selectedBrands,
  onToggleLocation,
  onToggleBrand,
  activeCount,
  onClear,
}: {
  accent: string;
  locations: string[];
  brands: string[];
  selectedLocations: string[];
  selectedBrands: string[];
  onToggleLocation: (v: string) => void;
  onToggleBrand: (v: string) => void;
  activeCount: number;
  onClear: () => void;
}) {
  const [sheet, setSheet] = useState<'locations' | 'brands' | null>(null);
  const trigger = (label: string, count: number, onPress: () => void) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={[styles.filterBtn, { borderColor: accent }]}
    >
      <Text style={[styles.filterBtnText, { color: accent }]}>
        {label}
        {count > 0 ? ` (${count})` : ''}
      </Text>
      <Ionicons name="chevron-down" size={13} color={accent} />
    </Pressable>
  );

  return (
    <View style={styles.filterBar}>
      <View style={styles.filterTriggers}>
        {trigger('Locations', selectedLocations.length, () => setSheet('locations'))}
        {trigger('Brands', selectedBrands.length, () => setSheet('brands'))}
        {activeCount > 0 && (
          <Pressable onPress={onClear} style={styles.clearBtn} hitSlop={6}>
            <Ionicons name="close-circle-outline" size={13} color={accent} />
            <Text style={[styles.clearText, { color: accent }]}>Clear</Text>
          </Pressable>
        )}
      </View>
      <MultiSelectSheet
        visible={sheet === 'locations'}
        title="Locations"
        options={locations}
        selected={selectedLocations}
        onToggle={onToggleLocation}
        onClose={() => setSheet(null)}
        accent={accent}
      />
      <MultiSelectSheet
        visible={sheet === 'brands'}
        title="Brands"
        options={brands}
        selected={selectedBrands}
        onToggle={onToggleBrand}
        onClose={() => setSheet(null)}
        accent={accent}
      />
    </View>
  );
}

/* ── Sort dropdown (construction parity) ── */
export function SortPicker({
  value,
  onChange,
  accent,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
  accent: string;
}) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find((o) => o.key === value);
  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={[styles.filterBtn, { borderColor: accent }]}>
        <Text style={[styles.filterBtnText, { color: accent }]}>{current?.short ?? 'Sort by'}</Text>
        <Ionicons name="chevron-down" size={13} color={accent} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: spacing.lg }]}>
          <Text style={[styles.sheetTitle, { color: accent, marginBottom: spacing.sm }]}>
            Sort by
          </Text>
          {SORT_OPTIONS.filter((o) => o.key !== 'default').map((o) => (
            <Pressable
              key={o.key}
              onPress={() => {
                onChange(o.key);
                setOpen(false);
              }}
              style={styles.sheetOption}
            >
              <Text style={styles.sheetOptionText}>{o.label}</Text>
              {value === o.key && <Ionicons name="checkmark" size={16} color={accent} />}
            </Pressable>
          ))}
        </View>
      </Modal>
    </>
  );
}

/* ── "Prices vary by location and quantity" pill (energy/agri parity) ── */
export function InfoPill({ text, iconColor }: { text: string; iconColor: string }) {
  return (
    <View style={styles.infoPill}>
      <Ionicons name="information-circle-outline" size={13} color={iconColor} />
      <Text style={styles.infoPillText}>{text}</Text>
    </View>
  );
}

/* ── Centered section header ── */
export function MarketplaceSectionHeader({
  icon,
  title,
  subtitle,
  accent,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  accent: string;
}) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionTitleRow}>
        {icon && <Ionicons name={icon} size={20} color={accent} />}
        <Text style={[styles.sectionTitle, { color: accent }]}>{title}</Text>
      </View>
      {!!subtitle && <Text style={styles.sectionSub}>{subtitle}</Text>}
    </View>
  );
}

/* ── Product grid + states ── */
export function MarketplaceGrid({
  products,
  accent,
  loading,
  error,
  onRetry,
  emptyTitle,
  emptyHint,
}: {
  products: MarketplaceProduct[];
  accent: string;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  emptyTitle: string;
  emptyHint: string;
}) {
  if (loading) return <ProductGridSkeleton />;
  if (error) return <ErrorState onRetry={onRetry} />;
  if (!products.length) return <EmptyState title={emptyTitle} hint={emptyHint} />;
  return (
    <View style={styles.grid}>
      {products.map((p) => (
        <View key={p.id} style={styles.gridItem}>
          <MarketplaceCard product={p} accent={accent} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: { position: 'relative', justifyContent: 'center' },
  searchIcon: { position: 'absolute', left: spacing.md, zIndex: 1 },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    paddingLeft: spacing['3xl'],
    paddingRight: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  chipRow: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    maxWidth: 220,
  },
  chipText: { ...typography.caption, fontWeight: '600' },
  filterBar: { marginTop: spacing.sm },
  filterTriggers: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  filterBtnText: { ...typography.caption, fontWeight: '600' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, padding: 4 },
  clearText: { ...typography.caption, fontWeight: '600' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.raised,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sheetTitle: { ...typography.h3 },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  sheetOptionText: { ...typography.body, color: colors.text, flex: 1 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetEmpty: { ...typography.caption, color: colors.textMuted, paddingVertical: spacing.lg },
  sheetDone: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  sheetDoneText: { ...typography.bodyStrong, color: '#FFFFFF' },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0F4F8',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  infoPillText: { ...typography.micro, color: colors.textMuted },
  sectionHead: { alignItems: 'center', marginBottom: spacing.lg },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: { ...typography.h2 },
  sectionSub: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 420,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridItem: { width: '48%', flexGrow: 1 },
});
