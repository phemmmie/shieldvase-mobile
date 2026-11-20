import { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import {
  AuthScreen,
  AuthTitle,
  Field,
  FormError,
  PrimaryButton,
} from '@/features/auth/components';
import { colors, spacing, typography } from '@/theme';

/**
 * Landing screen for shieldvase://auth/reset-password recovery links.
 * By the time this renders, the deep-link handler has exchanged the code
 * for a recovery session — updateUser sets the new password.
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (e) setError(e.message);
    else setDone(true);
  };

  if (done) {
    return (
      <AuthScreen>
        <AuthTitle title="Password updated" />
        <Text style={styles.notice}>Your password has been changed.</Text>
        <PrimaryButton label="Continue" onPress={() => router.replace('/(tabs)')} />
      </AuthScreen>
    );
  }

  if (!session) {
    return (
      <AuthScreen>
        <AuthTitle
          title="Link expired"
          subtitle="This reset link is invalid or has expired. Request a new one."
        />
        <PrimaryButton
          label="Request new link"
          onPress={() => router.replace('/(auth)/forgot-password')}
        />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen>
      <AuthTitle title="Set a new password" />
      <Field
        placeholder="New password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Field
        placeholder="Confirm password"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
      />
      <FormError message={error} />
      <PrimaryButton
        label="Update password"
        onPress={submit}
        busy={busy}
        disabled={!password || !confirm}
      />
    </AuthScreen>
  );
}

const styles = {
  notice: { ...typography.body, color: colors.secondary, marginBottom: spacing.lg },
};
