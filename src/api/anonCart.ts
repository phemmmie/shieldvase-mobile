import { env } from '@/config/env';

/**
 * Session-cart REST helpers that deliberately avoid createClient().
 * Mirrors the web app's anonClient.ts: after sign-in, RLS hides anonymous
 * (user_id IS NULL) cart rows from the authed client, so merge-on-login
 * must read/delete them with a bare anon request.
 */
const restHeaders = {
  apikey: env.supabaseAnonKey,
  Authorization: `Bearer ${env.supabaseAnonKey}`,
};

export const fetchAnonymousSessionCartItems = async (sessionId: string) => {
  const url = new URL(`${env.supabaseUrl}/rest/v1/cart_items`);
  url.searchParams.set('select', '*');
  url.searchParams.set('session_id', `eq.${sessionId}`);
  url.searchParams.set('user_id', 'is.null');

  const response = await fetch(url.toString(), { headers: restHeaders });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const deleteAnonymousSessionCartItems = async (sessionId: string) => {
  const url = new URL(`${env.supabaseUrl}/rest/v1/cart_items`);
  url.searchParams.set('session_id', `eq.${sessionId}`);
  url.searchParams.set('user_id', 'is.null');

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: { ...restHeaders, Prefer: 'return=minimal' },
  });
  if (!response.ok) throw new Error(await response.text());
};
