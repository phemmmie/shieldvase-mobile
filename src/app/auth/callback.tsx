import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { exchangeCodeFromUrl } from '@/features/auth/api';
import { ErrorState, LoadingState } from '@/components/States';

/**
 * Deep-link landing for shieldvase://auth/callback — handles PKCE code
 * exchange when the OS delivers the OAuth/recovery URL instead of
 * openAuthSessionAsync resolving it in-place.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [failed, setFailed] = useState(false);
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    (async () => {
      let code = params.code as string | undefined;
      if (!code) {
        const initial = await Linking.getInitialURL();
        code = initial ? (Linking.parse(initial).queryParams?.code as string) : undefined;
      }
      if (!code) {
        setFailed(true);
        return;
      }
      const { error } = await exchangeCodeFromUrl(`shieldvase://auth/callback?code=${code}`);
      if (error) {
        console.warn('Auth callback exchange failed:', error.message);
        setFailed(true);
        return;
      }
      router.replace('/(tabs)');
    })();
  }, [params.code, router]);

  if (failed) return <ErrorState onRetry={() => router.replace('/(auth)/sign-in')} />;
  return <LoadingState label="Signing you in…" />;
}
