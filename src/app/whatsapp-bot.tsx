import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, spacing, typography } from '@/theme';

// Mirrors web /whatsapp-bot (views/WhatsAppBot.tsx): "Order on WhatsApp"
// hero w/ bot link, 6 capability cards, "New here? No problem." card,
// 5 verticals, bottom CTA.

const WA_GREEN = '#25D366';
const BOT_LINK = 'https://wa.me/2347051277149?text=' + encodeURIComponent("Hi, I'd like to start shopping");

const CAPABILITIES: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }[] = [
  { icon: 'cart-outline', title: 'Add to cart', description: 'Tell the bot what you need and it builds your cart as you go.' },
  { icon: 'receipt-outline', title: 'See the full price', description: 'Subtotal, admin fee, VAT and delivery — shown before you pay, no surprises.' },
  { icon: 'card-outline', title: 'Pay right in the chat', description: 'Checkout sends you a secure, hosted payment link — no separate app.' },
  { icon: 'document-text-outline', title: 'Request a quote', description: 'Need a custom or bulk order? Submit an RFQ straight from WhatsApp.' },
  { icon: 'close-circle-outline', title: 'Cancel before it ships', description: 'Change your mind? Cancel an order yourself, pre-shipping.' },
  { icon: 'notifications-outline', title: 'Get notified instantly', description: 'The moment your payment clears, the bot lets you know.' },
];

const VERTICALS: { icon: keyof typeof Ionicons.glyphMap; name: string; examples: string }[] = [
  { icon: 'business-outline', name: 'Construction materials', examples: 'cement, steel & reinforcement, blocks' },
  { icon: 'cube-outline', name: 'Polymers & packaging', examples: '' },
  { icon: 'flame-outline', name: 'Energy & petroleum', examples: '' },
  { icon: 'flask-outline', name: 'Chemicals', examples: '' },
  { icon: 'leaf-outline', name: 'Agriculture & animal feed', examples: '' },
];

export default function WhatsAppBotScreen() {
  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Order via WhatsApp' }} />
      <ScrollView contentContainerStyle={{ paddingVertical: spacing.xl, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <ScreenColumn>
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="logo-whatsapp" size={30} color={WA_GREEN} />
            </View>
            <Text style={styles.heroTitle}>Order on WhatsApp — no app, no password</Text>
            <Text style={styles.heroSub}>
              Message our bot to browse your options, build an order, and pay —
              all from the chat you already have open.
            </Text>
            <Pressable style={styles.waBtn} onPress={() => Linking.openURL(BOT_LINK)}>
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
              <Text style={styles.waBtnText}>Chat with the bot now</Text>
            </Pressable>
          </View>

          {/* What you can do — 6 cards */}
          <Text style={styles.h2}>What you can do</Text>
          <View style={styles.grid}>
            {CAPABILITIES.map(c => (
              <View key={c.title} style={styles.capCard}>
                <View style={styles.capIcon}>
                  <Ionicons name={c.icon} size={20} color={colors.primary} />
                </View>
                <Text style={styles.capTitle}>{c.title}</Text>
                <Text style={styles.capDesc}>{c.description}</Text>
              </View>
            ))}
          </View>

          {/* New here? */}
          <View style={styles.newCard}>
            <View style={styles.newIcon}>
              <Ionicons name="person-add-outline" size={22} color={WA_GREEN} />
            </View>
            <Text style={styles.newTitle}>New here? No problem.</Text>
            <Text style={styles.newText}>
              You don&apos;t need an existing ShieldVase account or a password. Message the
              bot and it sets one up for you as you go. The same login works on the
              website too, any time you want to pick up where you left off.
            </Text>
          </View>

          {/* What we sell — 5 verticals */}
          <Text style={styles.h2}>What we sell</Text>
          <View style={styles.grid}>
            {VERTICALS.map(v => (
              <View key={v.name} style={styles.vertCard}>
                <Ionicons name={v.icon} size={22} color={colors.primary} />
                <Text style={styles.vertName}>{v.name}</Text>
                {!!v.examples && <Text style={styles.vertEx}>{v.examples}</Text>}
              </View>
            ))}
          </View>

          {/* Bottom CTA */}
          <Pressable style={[styles.waBtn, { alignSelf: 'center', marginTop: spacing.xl }]} onPress={() => Linking.openURL(BOT_LINK)}>
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            <Text style={styles.waBtnText}>Chat with the bot now</Text>
          </Pressable>
        </ScreenColumn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  heroIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(37,211,102,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  heroTitle: { ...typography.h1, color: colors.text, textAlign: 'center' },
  heroSub: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  waBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: WA_GREEN, borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  waBtnText: { ...typography.bodyStrong, color: '#fff' },
  h2: { ...typography.h2, color: colors.text, textAlign: 'center', marginTop: spacing.xl, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  capCard: { width: '47%', backgroundColor: colors.surfaceRaised, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  capIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  capTitle: { ...typography.captionStrong, color: colors.text },
  capDesc: { ...typography.caption, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  newCard: { marginTop: spacing.xl, backgroundColor: colors.surfaceRaised, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  newIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(37,211,102,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  newTitle: { ...typography.h3, color: colors.text },
  newText: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 },
  vertCard: { width: '47%', backgroundColor: colors.surfaceRaised, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  vertName: { ...typography.captionStrong, color: colors.text, textAlign: 'center', marginTop: spacing.sm },
  vertEx: { ...typography.micro, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
});
