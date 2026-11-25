import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, spacing, typography } from '@/theme';

// Mirrors web /privacy-policy (views/PrivacyPolicy.tsx): accordion sections,
// same copy, plus Contact Us card → support@shieldvase.io.

type Section = { id: string; icon: keyof typeof Ionicons.glyphMap; title: string; body?: string; bullets?: string[] };

const SECTIONS: Section[] = [
  {
    id: 'introduction', icon: 'document-text-outline', title: 'Introduction',
    body: 'Welcome to ShieldVase! Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our platform.',
  },
  {
    id: 'collection', icon: 'server-outline', title: 'Information We Collect',
    bullets: [
      'Personal Information: Name, email, phone number, company details, and billing information.',
      'Transaction Data: Purchases, orders, and payment details.',
      'Usage Data: IP address, browser type, device information, and site interactions.',
      'Cookies & Tracking Technologies: To improve user experience and analyze website traffic.',
    ],
  },
  {
    id: 'usage', icon: 'analytics-outline', title: 'How We Use Your Information',
    bullets: [
      'Providing Services: Facilitating purchases, processing payments, and delivering products.',
      'Improving Our Platform: Enhancing user experience, security, and performance.',
      'Marketing & Communication: Sending updates, promotional offers, and industry insights.',
      'Legal Compliance: Preventing fraud, enforcing terms, and complying with laws.',
    ],
  },
  {
    id: 'sharing', icon: 'people-outline', title: 'Sharing Your Information',
    bullets: [
      'Suppliers & Vendors: To fulfill your orders.',
      'Payment Processors: Secure payment transactions.',
      'Analytics & Advertising Partners: For site optimization and marketing.',
    ],
  },
  {
    id: 'security', icon: 'lock-closed-outline', title: 'Data Security',
    bullets: [
      'We use SSL encryption and secure servers.',
      'We limit access to personal information.',
      'We comply with GDPR and data protection laws.',
    ],
  },
  {
    id: 'rights', icon: 'person-outline', title: 'Your Rights',
    bullets: [
      'Request access to your data.',
      'Update or delete your information.',
      'Opt-out of marketing emails.',
    ],
  },
  {
    id: 'updates', icon: 'refresh-outline', title: 'Updates to This Policy',
    body: 'We may update this policy periodically. Any changes will be posted on this page.',
  },
];

export default function PrivacyPolicyScreen() {
  const [openId, setOpenId] = useState<string | null>('introduction');

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Privacy Policy' }} />
      <ScrollView contentContainerStyle={{ paddingVertical: spacing.lg, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <ScreenColumn>
          <Text style={styles.h1}>Privacy Policy</Text>
          {SECTIONS.map(s => {
            const open = openId === s.id;
            return (
              <Pressable key={s.id} style={styles.item} onPress={() => setOpenId(open ? null : s.id)}>
                <View style={styles.itemHead}>
                  <Ionicons name={s.icon} size={18} color={colors.primary} />
                  <Text style={styles.itemTitle}>{s.title}</Text>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
                </View>
                {open && (
                  <View style={styles.itemBody}>
                    {s.body && <Text style={styles.bodyText}>{s.body}</Text>}
                    {s.bullets?.map(b => <Text key={b} style={styles.bodyText}>• {b}</Text>)}
                  </View>
                )}
              </Pressable>
            );
          })}

          {/* Contact Us — web's closing card */}
          <View style={styles.contactCard}>
            <Text style={styles.contactTitle}>Contact Us</Text>
            <Pressable style={styles.contactBtn} onPress={() => Linking.openURL('mailto:support@shieldvase.io')}>
              <Text style={styles.contactBtnText}>support@shieldvase.io</Text>
            </Pressable>
          </View>
        </ScreenColumn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  h1: { ...typography.h1, color: colors.text, textAlign: 'center', marginBottom: spacing.lg },
  item: { backgroundColor: colors.surfaceRaised, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemTitle: { ...typography.bodyStrong, color: colors.text, flex: 1 },
  itemBody: { marginTop: spacing.sm, gap: spacing.xs, paddingLeft: spacing.lg + spacing.xs },
  bodyText: { ...typography.body, color: colors.textMuted, lineHeight: 22 },
  contactCard: { marginTop: spacing.lg, alignItems: 'center' },
  contactTitle: { ...typography.h3, color: colors.text },
  contactBtn: { marginTop: spacing.sm, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 4 },
  contactBtnText: { ...typography.bodyStrong, color: colors.primary },
});
