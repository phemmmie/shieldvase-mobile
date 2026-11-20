import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { sendEmailOtp, verifyEmailOtp } from '@/features/auth/api';
import {
  AuthScreen,
  AuthTitle,
  Field,
  FormError,
  GhostButton,
  PrimaryButton,
} from '@/features/auth/components';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email, redirect } = useLocalSearchParams<{ email: string; redirect?: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);

  const submit = async () => {
    if (!email) return;
    setBusy(true);
    setError(null);
    const { error: e } = await verifyEmailOtp(email, code);
    setBusy(false);
    if (e) setError(e.message);
    else if (redirect) router.replace(redirect as any);
    else router.replace('/(tabs)');
  };

  const resend = async () => {
    if (!email) return;
    setResent(false);
    const { error: e } = await sendEmailOtp(email);
    if (e) setError(e.message);
    else setResent(true);
  };

  return (
    <AuthScreen>
      <AuthTitle
        title="Check your email"
        subtitle={`We sent a 6-digit code to ${email ?? 'your email'}`}
      />

      <Field
        placeholder="6-digit code"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />

      <FormError message={error} />

      <PrimaryButton
        label="Verify & sign in"
        onPress={submit}
        busy={busy}
        disabled={code.trim().length !== 6}
      />

      <GhostButton
        label={resent ? 'Code sent — check your inbox' : 'Resend code'}
        onPress={resend}
      />
    </AuthScreen>
  );
}
