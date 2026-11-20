import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { checkPhoneAvailable, register, signInWithGoogle } from '@/features/auth/api';
import { AuthScreen, FormError } from '@/features/auth/components';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';

function Check({ value, onPress }: { value: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <View style={[styles.checkbox, value && styles.checkboxOn]}>
        {value && <Ionicons name="checkmark" size={12} color={colors.textOnPrimary} />}
      </View>
    </Pressable>
  );
}

export default function SignUpScreen() {
  const router = useRouter();
  const [role, setRole] = useState<'sme' | 'vendor'>('sme');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);

    if (password.length < 6) {
      setBusy(false);
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!acceptTerms) {
      setBusy(false);
      setError('Accept the ShieldVase B2B Procurement Terms to continue.');
      return;
    }

    if (phone.trim()) {
      const available = await checkPhoneAvailable(phone);
      if (!available) {
        setBusy(false);
        setError('This phone number is already linked to an account.');
        return;
      }
    }

    const { data, error: e } = await register({
      email,
      password,
      fullName: company.trim() ? `${fullName.trim()} (${company.trim()})` : fullName,
      phone,
      userType: role,
    });
    setBusy(false);

    if (e) {
      setError(e.message);
    } else if (data?.session) {
      router.replace('/(tabs)');
    } else {
      setNotice('Check your email to confirm your account, then sign in.');
    }
  };

  const google = async () => {
    setBusy(true);
    setError(null);
    const { error: e } = await signInWithGoogle();
    setBusy(false);
    if (e) setError(e.message);
    else router.replace('/(tabs)');
  };

  return (
    <AuthScreen>
      <ScreenColumn>
        <View style={styles.headChips}>
          <View style={styles.chip}>
            <Ionicons name="business" size={12} color={colors.secondary} />
            <Text style={styles.chipText}>CAC & BIN SECURE PORTAL</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="shield-checkmark" size={12} color={colors.secondary} />
            <Text style={styles.chipText}>NATIONWIDE ESCROW</Text>
          </View>
        </View>

        <Text style={styles.title}>Create Your B2B Account</Text>
        <Text style={styles.subtitle}>
          Source direct from verified manufacturers, depots & quarry operators across
          Nigeria.
        </Text>

        {/* Role selector */}
        <View style={styles.segment}>
          {([['sme', 'Buyer / SME Contractor'], ['vendor', 'Depot / Supplier']] as const).map(([k, label]) => (
            <Pressable
              key={k}
              onPress={() => { setRole(k); Haptics.selectionAsync(); }}
              style={[styles.segItem, role === k && styles.segItemActive]}
            >
              <Ionicons
                name={k === 'sme' ? 'hammer-outline' : 'business-outline'}
                size={15}
                color={role === k ? colors.text : colors.textMuted}
              />
              <Text style={[styles.segText, role === k && styles.segTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.fieldLabel}>FULL NAME / CONTACT PERSON</Text>
        <Input placeholder="e.g. Engr. Babatunde Adeleke" value={fullName} onChangeText={setFullName} />

        <Text style={styles.fieldLabel}>REGISTERED ENTERPRISE NAME</Text>
        <Input placeholder="e.g. BuildCraft Engineering Ltd" value={company} onChangeText={setCompany} />

        <Text style={styles.fieldLabel}>WORK EMAIL (FOR RFQ STATEMENTS)</Text>
        <Input
          placeholder="e.g. procurement@buildcraft.ng"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.fieldLabel}>NIGERIAN MOBILE NUMBER</Text>
        <Input
          placeholder="803 555 0100"
          keyboardType="phone-pad"
          autoComplete="tel"
          value={phone}
          onChangeText={setPhone}
        />

        <Pressable style={styles.checkRow} onPress={() => setWhatsappOptIn(!whatsappOptIn)}>
          <Check value={whatsappOptIn} onPress={() => setWhatsappOptIn(!whatsappOptIn)} />
          <View style={{ flex: 1 }}>
            <Text style={styles.checkTitle}>WhatsApp Dispatch Updates</Text>
            <Text style={styles.checkBody}>Receive quarry weightbridge slips, driver manifest & RFQ bids.</Text>
          </View>
        </Pressable>

        <Text style={styles.fieldLabel}>SECURITY PASSWORD</Text>
        <Input
          placeholder="Enter at least 8 characters"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={styles.checkRow} onPress={() => setAcceptTerms(!acceptTerms)}>
          <Check value={acceptTerms} onPress={() => setAcceptTerms(!acceptTerms)} />
          <Text style={styles.checkBody}>
            I accept the <Text style={styles.linkInline}>ShieldVase B2B Procurement Terms</Text> & CBN-compliant escrow flow.
          </Text>
        </Pressable>

        <FormError message={error} />
        {!!notice && <Text style={styles.notice}>{notice}</Text>}

        <Button
          title="Create B2B Account"
          icon={<Ionicons name="briefcase" size={18} color={colors.textOnPrimary} />}
          onPress={submit}
          loading={busy}
          disabled={!email.trim() || !password}
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>FAST TRACK REGISTRATION</Text>
          <View style={styles.dividerLine} />
        </View>
        <Button
          title="Register instantly with Google"
          variant="secondary"
          icon={<Ionicons name="logo-google" size={18} color={colors.textOnPrimary} />}
          onPress={google}
          loading={busy}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an enterprise account? </Text>
          <Link href="/(auth)/sign-in" style={styles.link}>
            Sign In
          </Link>
        </View>

        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={14} color={colors.secondary} />
            <Text style={styles.trustText}>Tier-1 Partner NIBSS Real-time Escrow</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="ribbon" size={14} color={colors.warning} />
            <Text style={styles.trustText}>Quality Guarantee NIS & SON Certified</Text>
          </View>
        </View>
      </ScreenColumn>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  headChips: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  chipText: { ...typography.micro, color: colors.secondary, letterSpacing: 0.4 },
  title: { ...typography.h1, color: colors.text, fontSize: 23 },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.lg,
  },
  segItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  segItemActive: { backgroundColor: colors.surfaceRaised, ...shadows.card },
  segText: { ...typography.caption, color: colors.textMuted },
  segTextActive: { ...typography.captionStrong, color: colors.text },
  fieldLabel: { ...typography.micro, color: colors.textMuted, letterSpacing: 0.5, marginBottom: 6 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  checkRow: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.md },
  checkTitle: { ...typography.captionStrong, color: colors.text },
  checkBody: { ...typography.caption, color: colors.textMuted, flex: 1 },
  linkInline: { color: colors.secondary, fontFamily: 'Inter_600SemiBold' },
  notice: { ...typography.body, color: colors.secondary, marginBottom: spacing.md },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.micro, color: colors.textMuted },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  footerText: { ...typography.body, color: colors.textMuted },
  link: { ...typography.bodyStrong, color: colors.primary },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  trustText: { ...typography.micro, color: colors.textMuted, flex: 1 },
});
