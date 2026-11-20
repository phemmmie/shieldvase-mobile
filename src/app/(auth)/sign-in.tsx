import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/api/supabase';
import { sendEmailOtp, signInWithGoogle } from '@/features/auth/api';
import { AuthScreen, FormError } from '@/features/auth/components';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';

export default function SignInScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [role, setRole] = useState<'buyer' | 'vendor'>('buyer');
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const done = () => {
    if (redirect) router.replace(redirect as any);
    else router.back();
  };

  const submitPassword = async () => {
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (e) setError(e.message);
    else done();
  };

  const submitOtp = async () => {
    setBusy(true);
    setError(null);
    const { error: e } = await sendEmailOtp(email);
    setBusy(false);
    if (e) {
      setError(e.message);
    } else {
      router.push({
        pathname: '/(auth)/verify-email',
        params: { email: email.trim(), redirect: redirect ?? '' },
      });
    }
  };

  const google = async () => {
    setBusy(true);
    setError(null);
    const { error: e } = await signInWithGoogle();
    setBusy(false);
    if (e) setError(e.message);
    else done();
  };

  return (
    <AuthScreen>
      <ScreenColumn>
        {/* Portal header */}
        <View style={styles.portalHead}>
          <View style={styles.portalIcon}>
            <Ionicons name="shield-checkmark" size={22} color={colors.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.portalKicker}>SECURED PORTAL</Text>
            <Text style={styles.title}>Welcome Back to ShieldVase</Text>
            <Text style={styles.subtitle}>
              Nigeria’s B2B marketplace for construction & industrial raw materials.
            </Text>
          </View>
        </View>

        {/* Role segment */}
        <View style={styles.segment}>
          {([['buyer', 'Contractor / Buyer'], ['vendor', 'Material Vendor / Depot']] as const).map(([k, label]) => (
            <Pressable
              key={k}
              onPress={() => { setRole(k); Haptics.selectionAsync(); }}
              style={[styles.segItem, role === k && styles.segItemActive]}
            >
              <Ionicons
                name={k === 'buyer' ? 'people-outline' : 'business-outline'}
                size={15}
                color={role === k ? colors.text : colors.textMuted}
              />
              <Text style={[styles.segText, role === k && styles.segTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Fast auth */}
        <View style={styles.fastHead}>
          <Ionicons name="flash" size={15} color={colors.secondary} />
          <Text style={styles.fastTitle}>Fast Authentication</Text>
          <View style={styles.otpChip}>
            <Text style={styles.otpChipText}>Instant OTP</Text>
          </View>
        </View>
        <Button
          title="One-Tap Sign In with Google"
          variant="secondary"
          icon={<Ionicons name="logo-google" size={18} color={colors.textOnPrimary} />}
          onPress={google}
          loading={busy}
        />
        <Pressable onPress={() => { setMode('otp'); Haptics.selectionAsync(); }} style={styles.altOtp}>
          <Text style={styles.altOtpText}>
            {mode === 'otp' ? 'Email OTP selected — enter your email below' : 'Prefer a code? Use email OTP instead'}
          </Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR SIGN IN WITH CREDENTIALS</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Credentials */}
        <Text style={styles.fieldLabel}>WORK EMAIL OR PHONE NUMBER</Text>
        <Input
          placeholder="procurement@company.ng or 0803 555 0100"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        {mode === 'password' && (
          <>
            <Text style={styles.fieldLabel}>MASTER PASSWORD / SITE PIN</Text>
            <Input
              placeholder="Enter your enterprise password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </>
        )}

        <View style={styles.credRow}>
          <Pressable style={styles.remember} onPress={() => setRemember(!remember)}>
            <View style={[styles.checkbox, remember && styles.checkboxOn]}>
              {remember && <Ionicons name="checkmark" size={12} color={colors.textOnPrimary} />}
            </View>
            <Text style={styles.rememberText}>Remember this device</Text>
          </Pressable>
          <Link href="/(auth)/forgot-password" style={styles.link}>
            Forgot Password?
          </Link>
        </View>

        <FormError message={error} />

        <Button
          title={mode === 'password' ? 'Sign In to Workspace' : 'Email me a sign-in code'}
          onPress={mode === 'password' ? submitPassword : submitOtp}
          loading={busy}
          disabled={!email.trim() || (mode === 'password' && !password)}
        />

        {/* Quick unlock options */}
        <View style={styles.quickRow}>
          <View style={styles.quickCard}>
            <Ionicons name="finger-print-outline" size={22} color={colors.textMuted} />
            <Text style={styles.quickTitle}>Face ID / Biometrics</Text>
            <Text style={styles.quickMeta}>Instant Site Unlock</Text>
          </View>
          <View style={styles.quickCard}>
            <Ionicons name="business-outline" size={22} color={colors.textMuted} />
            <Text style={styles.quickTitle}>Corporate SAML / CAC</Text>
            <Text style={styles.quickMeta}>Enterprise Single Sign-On</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don’t have an enterprise account yet? </Text>
          <Link href="/(auth)/sign-up" style={styles.link}>
            Create Account
          </Link>
        </View>
        <Text style={styles.footerNote}>
          Requires CAC Registration Number or Depot License
        </Text>
      </ScreenColumn>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  portalHead: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  portalIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalKicker: { ...typography.micro, color: colors.accent, letterSpacing: 0.6, marginBottom: 2 },
  title: { ...typography.h1, color: colors.text, fontSize: 23 },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
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
  fastHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  fastTitle: { ...typography.bodyStrong, color: colors.secondary },
  otpChip: {
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  otpChipText: { ...typography.micro, color: colors.secondary },
  altOtp: { alignItems: 'center', paddingVertical: spacing.sm },
  altOtpText: { ...typography.caption, color: colors.textMuted },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.micro, color: colors.textMuted },
  fieldLabel: { ...typography.micro, color: colors.textMuted, letterSpacing: 0.5, marginBottom: 6 },
  credRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  remember: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  rememberText: { ...typography.caption, color: colors.text },
  link: { ...typography.bodyStrong, color: colors.primary, fontSize: 14 },
  quickRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  quickCard: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    ...shadows.card,
  },
  quickTitle: { ...typography.captionStrong, color: colors.text, textAlign: 'center' },
  quickMeta: { ...typography.micro, color: colors.textMuted, textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { ...typography.body, color: colors.textMuted },
  footerNote: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
});
