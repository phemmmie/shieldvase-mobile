import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, spacing, typography } from '@/theme';

// Mirrors web /terms-and-conditions (views/TermsAndConditions.tsx): all 12
// sections verbatim + Table of Contents + sticky "I Agree" button.

type Section = { id: string; title: string; intro?: string; body?: string; bullets?: string[]; prohibited?: boolean };

const SECTIONS: Section[] = [
  { id: 'section-1', title: '1. Introduction', body: 'These Terms & Conditions govern your use of ShieldVase. By accessing our platform, you agree to comply with these terms.' },
  {
    id: 'section-2', title: '2. User Accounts & Responsibilities',
    bullets: ['Users must provide accurate registration details.', 'You are responsible for maintaining account security.', 'Fraudulent activities will result in account suspension.'],
  },
  {
    id: 'section-3', title: '3. Buying & Selling on ShieldVase',
    bullets: ['Buyers must confirm product specifications before purchasing.', 'Sellers must ensure product descriptions are accurate.', 'ShieldVase is not responsible for disputes between buyers and sellers but offers mediation support.'],
  },
  {
    id: 'section-4', title: '4. Payments & Fees',
    bullets: ['All transactions are processed securely.', 'Sellers are subject to transaction fees per sale.', 'Late payments may incur penalties.'],
  },
  {
    id: 'section-5', title: '5. Shipping & Delivery',
    bullets: ['Delivery times are estimated but not guaranteed.', 'Buyers must provide correct shipping addresses.', 'Damaged or missing items must be reported within 48 hours.'],
  },
  {
    id: 'section-6', title: '6. Cancellations & Refunds',
    bullets: ['Orders can be canceled before shipment.', 'Refunds are issued for defective or misrepresented products.', 'Refund requests must be made within 7 days of receiving the product.'],
  },
  {
    id: 'section-7', title: '7. Intellectual Property',
    bullets: ['All content on ShieldVase is protected by copyright and trademarks.', 'Users may not copy, reproduce, or distribute content without permission.'],
  },
  {
    id: 'section-8', title: '8. Prohibited Activities', intro: 'Users may not:', prohibited: true,
    bullets: ['Use the platform for illegal activities.', 'Upload false or misleading product information.', 'Attempt to hack or exploit vulnerabilities.'],
  },
  {
    id: 'section-9', title: '9. Limitation of Liability', intro: 'ShieldVase is not liable for:',
    bullets: ['Losses due to supplier delays.', 'Technical issues beyond our control.', 'Financial damages from transactions.'],
  },
  {
    id: 'section-10', title: '10. Governing Law & Dispute Resolution',
    bullets: ['These terms are governed by the laws of Nigeria.', 'Disputes will be resolved through arbitration before legal action.'],
  },
  { id: 'section-11', title: '11. Changes to Terms', body: 'We may update these terms at any time. Users will be notified of significant changes.' },
  {
    id: 'section-12', title: '12. Contact Information',
    body: 'For inquiries, contact support@shieldvase.io',
  },
];

export default function TermsScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Terms & Conditions' }} />
      <ScrollView contentContainerStyle={{ paddingVertical: spacing.lg, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <ScreenColumn>
          {/* Table of Contents */}
          <View style={styles.toc}>
            <Text style={styles.tocTitle}>Table of Contents</Text>
            {SECTIONS.map((s, i) => (
              <Text key={s.id} style={styles.tocItem}>{s.title}</Text>
            ))}
          </View>

          <Text style={styles.h1}>Terms & Conditions</Text>
          {SECTIONS.map(s => (
            <View key={s.id} style={styles.section}>
              <Text style={styles.secTitle}>{s.title}</Text>
              {s.intro && <Text style={styles.body}>{s.intro}</Text>}
              {s.body && <Text style={styles.body}>{s.body}</Text>}
              {s.bullets?.map(b => (
                <View key={b} style={styles.bulletRow}>
                  <Text style={s.prohibited ? styles.prohibitMark : styles.bulletMark}>{s.prohibited ? '✕' : '•'}</Text>
                  <Text style={styles.body}>{b}</Text>
                </View>
              ))}
              {s.id === 'section-12' && (
                <Pressable onPress={() => Linking.openURL('mailto:support@shieldvase.io')}>
                  <Text style={styles.link}>support@shieldvase.io</Text>
                </Pressable>
              )}
            </View>
          ))}
        </ScreenColumn>
      </ScrollView>

      {/* Sticky agree bar — web's bottom Button */}
      <View style={styles.agreeBar}>
        <Pressable style={styles.agreeBtn} onPress={() => router.back()}>
          <Text style={styles.agreeText}>I Agree to the Terms & Conditions</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  toc: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  tocTitle: { ...typography.bodyStrong, color: colors.primary, marginBottom: spacing.sm },
  tocItem: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  h1: { ...typography.h1, color: colors.text, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingBottom: spacing.lg },
  secTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.text, lineHeight: 22 },
  bulletRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs, paddingLeft: spacing.xs },
  bulletMark: { ...typography.body, color: colors.textMuted },
  prohibitMark: { ...typography.body, color: colors.destructive, fontWeight: '700' },
  link: { ...typography.bodyStrong, color: colors.primary, marginTop: spacing.xs },
  agreeBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md, paddingBottom: spacing.lg },
  agreeBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  agreeText: { ...typography.bodyStrong, color: colors.textOnPrimary },
});
