import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, spacing, typography } from '@/theme';

// Mirrors web /faq (views/FAQ.tsx): "Frequently Asked Questions" + search +
// category filter buttons + accordion groups. Content comes from
// faq_categories/faq_items (active, sort-ordered) with the same hardcoded
// fallback the web uses when the tables are empty.

type FaqItem = { question: string; answer: string | string[] };
type FaqCategory = { id: string; title: string; icon: keyof typeof Ionicons.glyphMap; items: FaqItem[] };

const FALLBACK: FaqCategory[] = [
  {
    id: 'general', title: 'General Questions', icon: 'business-outline',
    items: [
      { question: 'What is ShieldVase?', answer: 'ShieldVase is a B2B marketplace for industrial materials, connecting suppliers and buyers.' },
      { question: 'How do I sign up?', answer: 'Click the "Sign Up" button, fill in your details, and verify your email.' },
      { question: 'Can I order without using the website?', answer: 'Yes — message our WhatsApp bot to add items to your cart, see your full price breakdown, and pay with a secure link sent right in the chat. See the Order via WhatsApp page for details.' },
      { question: 'Do I need an account to use the WhatsApp bot?', answer: 'No existing account or password is needed — the bot sets one up for you as you go. The same login works on the website afterward too.' },
    ],
  },
  {
    id: 'buying', title: 'Buying & Orders', icon: 'cart-outline',
    items: [
      { question: 'How do I place an order?', answer: ['Browse products', 'Add items to cart', 'Proceed to checkout', 'Complete payment'] },
      { question: 'Can I buy in bulk?', answer: 'Yes, bulk pricing is available. Discounts are applied automatically.' },
      { question: 'What payment methods do you accept?', answer: 'We accept credit/debit cards, bank transfers, and PayPal.' },
    ],
  },
  {
    id: 'deals', title: 'Price Lock & Group Buy', icon: 'pricetag-outline',
    items: [
      { question: 'What is ShieldVase Price Lock?', answer: "Price Lock lets you secure a verified vendor's current price on a material by paying a deposit up front. The price is held for that deal's lock period even if the vendor's price changes before you complete the purchase. See the Price Lock page for full details." },
      { question: 'What is ShieldVase Group Buy?', answer: "Group Buy lets multiple buyers pool their order quantities toward one vendor's volume target on a specific deal. Once the target is reached, everyone in that deal gets the discounted group price. See the Group Buy page for full details." },
      { question: 'Do I need to be a registered SME to join a deal?', answer: "Yes — Price Lock and Group Buy deals are joined from your SME dashboard, so you'll need a ShieldVase account to participate." },
    ],
  },
  {
    id: 'shipping', title: 'Shipping & Delivery', icon: 'car-outline',
    items: [
      { question: 'How long does delivery take?', answer: 'Delivery times depend on your location and supplier availability. Estimated times are displayed at checkout.' },
      { question: 'Do you offer international shipping?', answer: 'Yes, we facilitate global shipping for selected products.' },
    ],
  },
  {
    id: 'returns', title: 'Returns & Refunds', icon: 'refresh-outline',
    items: [
      { question: 'What is the return policy?', answer: 'Returns are accepted within 7 days if the item is defective or incorrect.' },
      { question: 'How do I request a refund?', answer: 'Contact support@shieldvase.io with your order details.' },
    ],
  },
  {
    id: 'security', title: 'Security & Account Management', icon: 'lock-closed-outline',
    items: [
      { question: 'Is my data secure?', answer: 'Yes, we use SSL encryption and follow strict security protocols.' },
      { question: 'How do I reset my password?', answer: 'Go to the Login page, click "Forgot Password," and follow the instructions.' },
    ],
  },
];

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  building: 'business-outline', cart: 'cart-outline', tag: 'pricetag-outline',
  truck: 'car-outline', refresh: 'refresh-outline', lock: 'lock-closed-outline',
  shield: 'shield-outline', help: 'help-circle-outline',
};

export default function FaqScreen() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: dbCategories } = useQuery<FaqCategory[] | null>({
    queryKey: ['faqs', 'public'],
    queryFn: async () => {
      const { data: cats, error: catErr } = await (supabase as any)
        .from('faq_categories')
        .select('id, slug, title, icon, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (catErr) throw catErr;
      if (!cats?.length) return null;
      const { data: items, error: itemErr } = await (supabase as any)
        .from('faq_items')
        .select('id, category_id, question, answer, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (itemErr) throw itemErr;
      return cats.map((c: any): FaqCategory => ({
        id: c.slug,
        title: c.title,
        icon: ICON_MAP[c.icon] ?? 'help-circle-outline',
        items: (items ?? [])
          .filter((i: any) => i.category_id === c.id)
          .map((i: any) => ({
            question: i.question,
            answer: Array.isArray(i.answer) && i.answer.length === 1 ? i.answer[0] : i.answer,
          })),
      }));
    },
  });

  const categories = dbCategories?.length ? dbCategories : FALLBACK;

  const filtered = useMemo(() => {
    let list = categories;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list
        .map(c => ({
          ...c,
          items: c.items.filter(i => {
            const qm = i.question.toLowerCase().includes(q);
            const am = typeof i.answer === 'string'
              ? i.answer.toLowerCase().includes(q)
              : i.answer.some(a => a.toLowerCase().includes(q));
            return qm || am;
          }),
        }))
        .filter(c => c.items.length > 0);
    }
    if (activeCategory) list = list.filter(c => c.id === activeCategory);
    return list;
  }, [categories, query, activeCategory]);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'FAQs' }} />
      <ScrollView contentContainerStyle={{ paddingVertical: spacing.lg, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <ScreenColumn>
          <Text style={styles.h1}>Frequently Asked Questions</Text>
          <Text style={styles.sub}>Find answers to common questions about ShieldVase&apos;s services</Text>

          {/* Search — web FAQSearch */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search questions…"
              placeholderTextColor={colors.textFaint}
              value={query}
              onChangeText={setQuery}
            />
            {!!query && (
              <Pressable onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Category filter buttons */}
          <View style={styles.catRow}>
            {categories.map(c => {
              const on = activeCategory === c.id;
              return (
                <Pressable
                  key={c.id}
                  style={[styles.catBtn, on && styles.catBtnOn]}
                  onPress={() => setActiveCategory(on ? null : c.id)}
                >
                  <Ionicons name={c.icon} size={14} color={on ? colors.textOnPrimary : colors.primary} />
                  <Text style={[styles.catBtnText, on && styles.catBtnTextOn]}>{c.title}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Accordion groups */}
          {filtered.length > 0 ? (
            filtered.map(cat => (
              <View key={cat.id} style={styles.group}>
                <View style={styles.groupHead}>
                  <Ionicons name={cat.icon} size={18} color={colors.primary} />
                  <Text style={styles.groupTitle}>{cat.title}</Text>
                </View>
                {cat.items.map((item, i) => {
                  const id = `${cat.id}-${i}`;
                  const open = openId === id;
                  return (
                    <Pressable key={id} style={styles.faqCard} onPress={() => setOpenId(open ? null : id)}>
                      <View style={styles.faqRow}>
                        <Text style={styles.faqQ}>{item.question}</Text>
                        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
                      </View>
                      {open && (
                        typeof item.answer === 'string' ? (
                          <Text style={styles.faqA}>{item.answer}</Text>
                        ) : (
                          item.answer.map((a, idx) => (
                            <Text key={idx} style={styles.faqA}>• {a}</Text>
                          ))
                        )
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No FAQs match your search.</Text>
          )}
        </ScreenColumn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  h1: { ...typography.h1, color: colors.primary, textAlign: 'center' },
  sub: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: 6, marginBottom: spacing.lg },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.sm, paddingVertical: 4, backgroundColor: '#fff',
  },
  searchInput: { flex: 1, ...typography.body, color: colors.text, paddingVertical: spacing.sm },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs, marginVertical: spacing.lg },
  catBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill,
    paddingHorizontal: spacing.sm, paddingVertical: 7, backgroundColor: '#fff',
  },
  catBtnOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  catBtnText: { ...typography.captionStrong, color: colors.text },
  catBtnTextOn: { color: colors.textOnPrimary },
  group: { marginBottom: spacing.lg },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  groupTitle: { ...typography.h3, color: colors.text },
  faqCard: {
    backgroundColor: colors.surfaceRaised, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.xs,
  },
  faqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  faqQ: { ...typography.bodyStrong, color: colors.text, flex: 1 },
  faqA: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 22 },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
