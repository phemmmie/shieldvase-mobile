import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '@/features/catalog/api';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';

// Mirrors web /services (views/Services.tsx → services/ProductSection +
// CreditSection + ApplicationProcessSection + LoanCalculatorSection):
// category carousel cards, Trade Credit + BNPL cards, 4 eligibility cards,
// 5-step application process, loan calculator (10% annual, 6/12/24 months).

const ELIGIBILITY: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }[] = [
  { icon: 'business-outline', title: 'Business Age', description: 'Minimum of 2 years in operation' },
  { icon: 'bar-chart-outline', title: 'Annual Revenue', description: 'Minimum annual revenue of ₦10,000,000' },
  { icon: 'checkmark-circle-outline', title: 'Business Registration', description: 'Valid business registration and documentation' },
  { icon: 'alert-circle-outline', title: 'Credit History', description: 'Positive credit history (if applicable)' },
];

const STEPS: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }[] = [
  { icon: 'person-add-outline', title: 'Create an Account', description: 'Sign up or log in to your ShieldVase account.' },
  { icon: 'document-text-outline', title: 'Complete the Application Form', description: 'Provide your business details, including name, category, annual revenue, and credit amount required.' },
  { icon: 'cloud-upload-outline', title: 'Submit Supporting Documents', description: 'Upload valid business registration documents and financial statements.' },
  { icon: 'checkmark-circle-outline', title: 'Review and Approval', description: 'Our team will review your application and notify you of the approval status within 3-5 business days.' },
  { icon: 'card-outline', title: 'Access Your Credit', description: 'Once approved, you can start using your credit facility immediately.' },
];

const TERMS = ['6', '12', '24'];
const INTEREST_RATE = 10;

export default function ServicesScreen() {
  const router = useRouter();
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('12');
  const { monthly, totalInterest } = useMemo(() => {
    const principal = parseFloat(amount);
    const n = parseInt(term);
    if (!principal || !n) return { monthly: 0, totalInterest: 0 };
    const r = INTEREST_RATE / 12 / 100;
    const m = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return { monthly: Number.isNaN(m) ? 0 : m, totalInterest: Number.isNaN(m) ? 0 : m * n - principal };
  }, [amount, term]);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Our Services' }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Our Product Categories — web ProductSection (horizontal carousel) */}
        <View style={styles.section}>
          <Text style={styles.h2}>Our Product Categories</Text>
          <Text style={styles.h2Sub}>Explore our wide range of industrial products and raw materials</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
            {categories.map(c => (
              <View key={c.id} style={styles.catCard}>
                {c.image ? (
                  <Image source={{ uri: c.image }} style={styles.catImage} contentFit="cover" />
                ) : (
                  <View style={[styles.catImage, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="cube-outline" size={34} color={colors.primary} />
                  </View>
                )}
                <View style={styles.catBody}>
                  <Text style={styles.catName}>{c.name}</Text>
                  <Text style={styles.catDesc}>Explore our range of {c.name.toLowerCase()} products</Text>
                  <Pressable onPress={() => router.push(`/category/${c.slug}` as any)} style={styles.catLink}>
                    <Text style={styles.catLinkText}>Explore Category</Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Flexible Financing — web CreditSection */}
        <View style={[styles.section, styles.creditBg]}>
          <Text style={styles.h2}>Flexible Financing Solutions for Your Business</Text>
          <Text style={styles.h2Sub}>
            At ShieldVase, we offer a range of credit options to help you manage cash flow, grow your
            business, and meet your procurement needs. Choose the option that works best for you.
          </Text>
          <ScreenColumn pad={false}>
            <View style={styles.creditCard}>
              <View style={styles.creditHead}>
                <View style={styles.creditIcon}>
                  <Ionicons name="card-outline" size={22} color={colors.primary} />
                </View>
                <Text style={styles.creditTitle}>Trade Credit</Text>
              </View>
              <Text style={styles.creditText}>Purchase now and pay later with flexible repayment terms tailored to your business needs.</Text>
              {['Flexible repayment terms', 'No hidden fees', 'Quick approval process'].map(f => (
                <View key={f} style={styles.checkRow}>
                  <Ionicons name="checkmark-circle" size={17} color={colors.success} />
                  <Text style={styles.checkText}>{f}</Text>
                </View>
              ))}
              <Pressable style={styles.creditBtn}><Text style={styles.creditBtnText}>Apply Now</Text></Pressable>
            </View>
            <View style={styles.creditCard}>
              <View style={styles.creditHead}>
                <View style={styles.creditIcon}>
                  <Ionicons name="cash-outline" size={22} color={colors.primary} />
                </View>
                <Text style={styles.creditTitle}>Buy Now Pay Later (BNPL)</Text>
              </View>
              <Text style={styles.creditText}>Spread the cost of your purchases over time with interest-free or low-interest payment plans.</Text>
              {['Interest-free options available', 'Easy monthly installments', 'Transparent payment schedule'].map(f => (
                <View key={f} style={styles.checkRow}>
                  <Ionicons name="checkmark-circle" size={17} color={colors.success} />
                  <Text style={styles.checkText}>{f}</Text>
                </View>
              ))}
              <Pressable style={styles.creditBtn}><Text style={styles.creditBtnText}>Explore BNPL Options</Text></Pressable>
            </View>

            {/* Eligibility */}
            <Text style={[styles.h2, { marginTop: spacing.xl }]}>Are You Eligible for Credit?</Text>
            <Text style={styles.h2Sub}>To access our credit facilities, your business must meet the following criteria:</Text>
            <View style={styles.eligGrid}>
              {ELIGIBILITY.map(e => (
                <View key={e.title} style={styles.eligCard}>
                  <View style={styles.eligIcon}>
                    <Ionicons name={e.icon} size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.eligTitle}>{e.title}</Text>
                  <Text style={styles.eligDesc}>{e.description}</Text>
                </View>
              ))}
            </View>
          </ScreenColumn>
        </View>

        {/* How to Apply — web ApplicationProcessSection */}
        <View style={styles.section}>
          <Text style={styles.h2}>How to Apply for Credit</Text>
          <Text style={styles.h2Sub}>Applying for credit with ShieldVase is simple and straightforward. Follow these steps to get started:</Text>
          <ScreenColumn pad={false}>
            <View style={{ paddingHorizontal: spacing.xl }}>
              {STEPS.map((s, i) => (
                <View key={s.title} style={styles.stepRow}>
                  <View style={styles.stepIconWrap}>
                    <View style={styles.stepIcon}>
                      <Ionicons name={s.icon} size={20} color={colors.primary} />
                    </View>
                    {i < STEPS.length - 1 && <View style={styles.stepLine} />}
                  </View>
                  <View style={{ flex: 1, paddingBottom: spacing.lg }}>
                    <Text style={styles.stepTitle}>{s.title}</Text>
                    <Text style={styles.stepDesc}>{s.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScreenColumn>
        </View>

        {/* Loan Calculator — web LoanCalculatorSection */}
        <View style={[styles.section, styles.calcBg]}>
          <Text style={styles.h2}>Estimate Your Monthly Payments</Text>
          <Text style={styles.h2Sub}>Use our loan calculator to estimate your monthly repayments based on your credit amount and repayment term.</Text>
          <ScreenColumn pad={false}>
            <View style={styles.calcCard}>
              <Text style={styles.label}>Credit Amount (₦)</Text>
              <TextInput style={styles.input} placeholder="Enter amount" placeholderTextColor={colors.textFaint} keyboardType="numeric" value={amount} onChangeText={setAmount} />
              <Text style={styles.label}>Repayment Term (Months)</Text>
              <View style={styles.termRow}>
                {TERMS.map(v => (
                  <Pressable key={v} style={[styles.termBtn, term === v && styles.termBtnOn]} onPress={() => setTerm(v)}>
                    <Text style={[styles.termText, term === v && styles.termTextOn]}>{v} months</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.label}>Interest Rate (%)</Text>
              <View style={styles.rateBox}><Text style={styles.rateText}>{INTEREST_RATE}%</Text></View>
              {monthly > 0 && (
                <View style={styles.calcResult}>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Monthly Payment</Text>
                    <Text style={styles.calcValue}>{formatNaira(Math.round(monthly))}</Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Total Interest</Text>
                    <Text style={[styles.calcValue, { color: colors.textMuted }]}>{formatNaira(Math.round(totalInterest))}</Text>
                  </View>
                </View>
              )}
            </View>
          </ScreenColumn>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FDF5E6' },
  section: { paddingVertical: spacing.xl },
  h2: { ...typography.h2, color: colors.navy, textAlign: 'center', paddingHorizontal: spacing.xl },
  h2Sub: { ...typography.body, color: '#8E9196', textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.xl },
  catCard: { width: 240, backgroundColor: '#fff', borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  catImage: { height: 140, backgroundColor: colors.surfaceAlt },
  catBody: { padding: spacing.md },
  catName: { ...typography.bodyStrong, color: colors.text },
  catDesc: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  catLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  catLinkText: { ...typography.captionStrong, color: colors.primary },
  creditBg: { backgroundColor: '#F1F0FB' },
  creditCard: { backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.lg, marginHorizontal: spacing.xl, borderWidth: 1, borderColor: colors.border },
  creditHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  creditIcon: { padding: spacing.sm, backgroundColor: colors.primarySoft, borderRadius: radius.md },
  creditTitle: { ...typography.h3, color: colors.text },
  creditText: { ...typography.body, color: colors.textMuted, marginBottom: spacing.sm },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  checkText: { ...typography.body, color: colors.text },
  creditBtn: { marginTop: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  creditBtnText: { ...typography.bodyStrong, color: colors.textOnPrimary },
  eligGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.xl, marginTop: spacing.lg },
  eligCard: { width: '47%', backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  eligIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  eligTitle: { ...typography.captionStrong, color: colors.text, textAlign: 'center' },
  eligDesc: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
  stepRow: { flexDirection: 'row', gap: spacing.md },
  stepIconWrap: { alignItems: 'center', width: 48 },
  stepIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  stepLine: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 4 },
  stepTitle: { ...typography.bodyStrong, color: colors.text },
  stepDesc: { ...typography.body, color: colors.textMuted, marginTop: 4 },
  calcBg: { backgroundColor: '#F1F0FB' },
  calcCard: { backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.lg, marginHorizontal: spacing.xl, borderWidth: 1, borderColor: colors.border },
  label: { ...typography.captionStrong, color: colors.text, marginBottom: 6, marginTop: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm + 3, ...typography.body, color: colors.text },
  termRow: { flexDirection: 'row', gap: spacing.xs },
  termBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm + 2, alignItems: 'center' },
  termBtnOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  termText: { ...typography.captionStrong, color: colors.text },
  termTextOn: { color: colors.textOnPrimary },
  rateBox: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm + 3, paddingHorizontal: spacing.sm, backgroundColor: colors.surface },
  rateText: { ...typography.body, color: colors.textMuted },
  calcResult: { marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, gap: spacing.xs },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calcLabel: { ...typography.body, color: colors.textMuted },
  calcValue: { ...typography.h3, color: colors.primary },
});
