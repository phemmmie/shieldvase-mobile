// Environment config — values come from EXPO_PUBLIC_* env vars.
// Anon key + URL only; NEVER a service key in this app.

export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  // Canonical site origin — used for auth/payment redirect URLs that must
  // resolve on the web (password reset, hosted payment bridge).
  siteUrl: process.env.EXPO_PUBLIC_SITE_URL ?? 'https://shieldvase.io',
  // PalmPay callBackUrl base. Preferred: hosted bridge
  // `${siteUrl}/app-return` (D14) once deployed — it app-links back into the
  // app. Fallback: the app's own deep-link route. PalmPay may reject
  // non-http(s) callbacks; flip via EXPO_PUBLIC_PAYMENT_CALLBACK_BASE.
  paymentCallbackBase:
    process.env.EXPO_PUBLIC_PAYMENT_CALLBACK_BASE ??
    'shieldvase://payment-callback',
} as const;

export function assertEnv() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    console.warn(
      '[env] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY not set — API calls will fail.',
    );
  }
}
