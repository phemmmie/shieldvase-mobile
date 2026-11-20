import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';

const DEAL_TABLES = [
  'group_buys',
  'group_buy_participants',
  'price_locks',
  'price_lock_participants',
] as const;

const DEAL_KEYS = [
  'active-group-buys',
  'active-price-locks',
  'group-buy',
  'group-buy-id',
  'price-lock',
  'price-lock-id',
  'joined-group-buys',
  'locked-prices',
  'gb-participation',
  'user-price-lock-participation',
  'product-deals',
  'deal-payment',
] as const;

/**
 * Supabase Realtime invalidation for deal data — progress bars, capacity and
 * participation status update live as webhooks mutate rows. Mount on any
 * screen that renders deal state.
 */
export function useDealRealtimeSync() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`deal-sync-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        if (!DEAL_TABLES.includes(payload.table as any)) return;
        DEAL_KEYS.forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
