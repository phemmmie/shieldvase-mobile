import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';

// Port of web ReferralCard queries — referral_codes / referral_rewards /
// referral_clicks (the live ?ref= program, not the legacy sme_rewards one).

export interface ReferralCode {
  code: string;
  role: string | null;
}

export interface ReferralReward {
  id: string;
  order_amount: number;
  reward_amount: number;
  reward_kind: string;
  source: string | null;
  status: string;
  created_at: string;
}

export function useReferralCode(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-referral-code', userId],
    enabled: !!userId,
    queryFn: async (): Promise<ReferralCode | null> => {
      const { data } = await (supabase.from as any)('referral_codes')
        .select('code, role')
        .eq('user_id', userId!)
        .maybeSingle();
      return data;
    },
  });
}

export function useReferralRewards(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-referral-rewards', userId],
    enabled: !!userId,
    queryFn: async (): Promise<ReferralReward[]> => {
      const { data } = await (supabase.from as any)('referral_rewards')
        .select('id, order_amount, reward_amount, reward_kind, source, status, created_at')
        .eq('referrer_user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
  });
}

export function useReferralVisits(code: string | undefined) {
  return useQuery({
    queryKey: ['my-referral-visits', code],
    enabled: !!code,
    queryFn: async (): Promise<number> => {
      const { count } = await (supabase.from as any)('referral_clicks')
        .select('id', { count: 'exact', head: true })
        .eq('code', code!);
      return count || 0;
    },
  });
}
