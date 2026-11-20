import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/api/supabase';
import { env } from '@/config/env';

// Auth flows ported from the web app (useAuth.tsx, SocialAuthButtons.tsx,
// LoginForm.tsx) — shared Supabase project means shared accounts.

WebBrowser.maybeCompleteAuthSession();

export type RegisterInput = {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  userType?: 'sme' | 'vendor';
};

/** Web parity: rpc email_is_registered pre-check → signUp with metadata. */
export async function register(input: RegisterInput) {
  const email = input.email.trim();
  const { data: alreadyRegistered } = await (supabase as any).rpc(
    'email_is_registered',
    { p_email: email },
  );
  if (alreadyRegistered === true) {
    return { error: new Error('An account with this email already exists.') };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      emailRedirectTo: `${env.siteUrl}/`,
      data: {
        full_name: input.fullName?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
        user_type: input.userType ?? 'sme',
      },
    },
  });
  return { data, error };
}

/** check-phone-availability edge fn — same contract as web phoneValidation.ts. */
export async function checkPhoneAvailable(phone: string): Promise<boolean> {
  try {
    const normalized = phone.replace(/[\s()-]/g, '');
    const { data, error } = await supabase.functions.invoke(
      'check-phone-availability',
      { body: { phone_number: normalized } },
    );
    if (error) return true; // don't block registration on a check failure
    return data?.available !== false;
  } catch {
    return true;
  }
}

/** Passwordless sign-in for existing accounts only (web parity: shouldCreateUser:false). */
export async function sendEmailOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: false },
  });
  return { error };
}

export async function verifyEmailOtp(email: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: 'email',
  });
  return { error };
}

/** Reset email → deep link back into the app's reset screen.
 * Requires `shieldvase://**` in Supabase Auth allowed redirect URLs. */
export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: 'shieldvase://auth/reset-password',
  });
  return { error };
}

const OAUTH_REDIRECT = 'shieldvase://auth/callback';

/**
 * Google OAuth — Expo pattern: get the provider URL with skipBrowserRedirect,
 * run it through the system auth session, then exchange the returned code.
 */
export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  const redirectTo = OAUTH_REDIRECT;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });
  if (error || !data?.url) return { error: error ?? new Error('No OAuth URL returned') };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') {
    return { error: new Error(result.type === 'cancel' ? 'Sign-in cancelled' : 'Sign-in failed') };
  }

  const params = new URL(result.url).searchParams;
  const code = params.get('code');
  const oauthError = params.get('error_description') ?? params.get('error');
  if (oauthError) return { error: new Error(oauthError) };
  if (!code) return { error: new Error('Missing auth code in callback') };

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  return { error: exchangeError };
}

/** Exchange a code from any auth deep link (OAuth, recovery, magic link). */
export async function exchangeCodeFromUrl(url: string) {
  const code = Linking.parse(url).queryParams?.code as string | undefined;
  if (!code) return { error: new Error('Missing auth code in link') };
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return { error };
}
