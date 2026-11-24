import { useState } from 'react';
import { Alert, FlatList, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStorefront, useVendorListings } from '@/features/vendors/queries';
import { MarketplaceCard } from '@/features/catalog/MarketplaceCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { Button } from '@/components/Button';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { ScreenColumn } from '@/components/Responsive';
import { supabase } from '@/api/supabase';
import type { MarketplaceProduct } from '@/features/catalog/marketplaceApi';
import type { VendorListing } from '@/features/vendors/api';

// Mirrors web StorefrontPage: banner, logo + vendor id + tagline + location +
// Verified Vendor badge, Share Storefront, products grid (marketplace card),
// and the "Enquire about this vendor" form -> storefront_enquiries.

const toMarketplaceProduct = (l: VendorListing): MarketplaceProduct => ({
  id: l.unified_product_id ?? l.id,
  name: l.product_name ?? 'Product',
  slug: l.product_slug,
  description: null,
  images: l.product_images ?? [],
  category_id: null,
  subcategory_id: null,
  category_name: null,
  subcategory_name: null,
  subcategory_slug: l.category_slug,
  display_price: l.price,
  price_unit: l.price_unit,
  vendor_count: 1,
  in_stock: (l.stock_quantity ?? 0) > 0,
  cities: [],
  brands: [],
  cheapest_vendor_product_id: l.id,
  cheapest_vendor_id: null,
});

export default function StorefrontScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const storefront = useStorefront(slug);
  const listings = useVendorListings(storefront.data?.vendor_id);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);

  if (storefront.isLoading) return <LoadingState />;
  if (storefront.isError) return <ErrorState onRetry={() => storefront.refetch()} />;
  if (!storefront.data) return <EmptyState title="Storefront not found" />;

  const sf = storefront.data;
  const verified =
    sf.verification_status === 'verified' || sf.verification_status === 'approved';
  const products = (listings.data ?? []).filter((l) => l.product_slug).map(toMarketplaceProduct);

  const shareStorefront = () =>
    Share.share({
      message: `${sf.vendor_display_id ?? 'Vendor'} — https://shieldvase.io/store/${slug}?ref=${slug}`,
    });

  const submitEnquiry = async () => {
    if (!sf || !form.name.trim() || !form.message.trim() || sending) return;
    setSending(true);
    const { error } = await (supabase.from as any)('storefront_enquiries').insert({
      storefront_id: sf.id,
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      message: form.message.trim(),
    });
    setSending(false);
    if (error) {
      Alert.alert('Could not send', 'Please try again.');
    } else {
      setForm({ name: '', email: '', phone: '', message: '' });
      Alert.alert('Enquiry sent', 'The team will connect you with this vendor.');
    }
  };

  const footer = (
    <View style={styles.enquire}>
      <View style={styles.enquireHead}>
        <Ionicons name="mail-outline" size={15} color={colors.text} />
        <Text style={styles.enquireTitle}>Enquire about this vendor</Text>
      </View>
      <Text style={styles.enquireSub}>Send a message — our team forwards it to the vendor.</Text>
      <TextInput
        style={styles.input}
        placeholder="Your name *"
        placeholderTextColor={colors.textMuted}
        value={form.name}
        onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        keyboardType="email-address"
        autoCapitalize="none"
        value={form.email}
        onChangeText={(v) => setForm((p) => ({ ...p, email: v }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone"
        placeholderTextColor={colors.textMuted}
        keyboardType="phone-pad"
        value={form.phone}
        onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
      />
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Your message *"
        placeholderTextColor={colors.textMuted}
        multiline
        value={form.message}
        onChangeText={(v) => setForm((p) => ({ ...p, message: v }))}
      />
      <Button
        title={sending ? 'Sending…' : 'Send Enquiry'}
        onPress={submitEnquiry}
        disabled={sending || !form.name.trim() || !form.message.trim()}
      />
    </View>
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: sf.vendor_display_id ?? 'Vendor Storefront' }} />
      <FlatList
        data={products}
        keyExtractor={(l) => l.id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md }}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <ScreenColumn pad={false}>
            {sf.banner_url ? (
              <Image source={{ uri: sf.banner_url }} style={styles.banner} contentFit="cover" />
            ) : (
              <View style={[styles.banner, styles.bannerFallback]} />
            )}

            <View style={styles.header}>
              {sf.logo_url ? (
                <Image source={{ uri: sf.logo_url }} style={styles.logo} contentFit="cover" />
              ) : (
                <View style={[styles.logo, styles.logoFallback]}>
                  <Ionicons name="storefront-outline" size={24} color={colors.textMuted} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{sf.vendor_display_id ?? 'Vendor Storefront'}</Text>
                {!!sf.tagline && <Text style={styles.tagline}>{sf.tagline}</Text>}
                <View style={styles.metaRow}>
                  {(sf.city || sf.state) && (
                    <View style={styles.locRow}>
                      <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                      <Text style={styles.location}>
                        {[sf.city, sf.state].filter(Boolean).join(', ')}
                      </Text>
                    </View>
                  )}
                  {verified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>Verified Vendor</Text>
                    </View>
                  )}
                </View>
              </View>
              <Pressable style={styles.shareBtn} onPress={shareStorefront} hitSlop={6}>
                <Ionicons name="share-social-outline" size={14} color={colors.text} />
                <Text style={styles.shareBtnText}>Share Storefront</Text>
              </Pressable>
            </View>

            {!!sf.about && <Text style={styles.about}>{sf.about}</Text>}

            <View style={styles.sectionRow}>
              <Ionicons name="cube-outline" size={17} color={colors.text} />
              <Text style={styles.section}>Products</Text>
            </View>
            {listings.isLoading && <LoadingState label="Loading products…" />}
            {!listings.isLoading && products.length === 0 && (
              <EmptyState title="No active listings." />
            )}
          </ScreenColumn>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <MarketplaceCard product={item} />
          </View>
        )}
        ListFooterComponent={<ScreenColumn pad={false}>{footer}</ScreenColumn>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: spacing['4xl'], gap: spacing.md },
  banner: { height: 140, borderRadius: radius.lg, backgroundColor: colors.surface },
  bannerFallback: {},
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginTop: -20,
    marginBottom: spacing.md,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 2,
    borderColor: colors.background,
  },
  logoFallback: { alignItems: 'center', justifyContent: 'center' },
  name: { ...typography.h2, color: colors.text },
  tagline: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 4, flexWrap: 'wrap' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  location: { ...typography.micro, color: colors.textMuted },
  verifiedBadge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  verifiedText: { ...typography.micro, color: colors.text, fontSize: 11 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceRaised,
  },
  shareBtnText: { ...typography.captionStrong, color: colors.text, fontSize: 12 },
  about: { ...typography.body, color: colors.textMuted, lineHeight: 22, marginBottom: spacing.md },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  section: { ...typography.h3, color: colors.text },
  cardWrap: { flex: 1 },
  enquire: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.sm,
    ...shadows.card,
  },
  enquireHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  enquireTitle: { ...typography.bodyStrong, color: colors.text },
  enquireSub: { ...typography.micro, color: colors.textMuted, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  textarea: { minHeight: 72, textAlignVertical: 'top' },
});
