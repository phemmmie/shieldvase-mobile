import { useState } from 'react';
import { Text } from 'react-native';
import { sendPasswordReset } from '@/features/auth/api';
import {
  AuthScreen,
  AuthTitle,
  Field,
  FormError,
  PrimaryButton,
} from '@/features/auth/components';
import { colors, spacing, typography } from '@/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const { error: e } = await sendPasswordReset(email);
    setBusy(false);
    if (e) setError(e.message);
    else setSent(true);
  };

  return (
    <AuthScreen>
      <AuthTitle
        title="Reset your password"
        subtitle="We'll email you a link to set a new password"
      />

      {sent ? (
        <Text style={styles.notice}>
          If an account exists for {email.trim()}, a reset link is on its way.
          Open it on this device to continue in the app.
        </Text>
      ) : (
        <>
          <Field
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <FormError message={error} />
          <PrimaryButton
            label="Send reset link"
            onPress={submit}
            busy={busy}
            disabled={!email.trim()}
          />
        </>
      )}
    </AuthScreen>
  );
}

const styles = {
  notice: {
    ...typography.body,
    color: colors.secondary,
    lineHeight: 22,
    marginTop: spacing.md,
  },
};
