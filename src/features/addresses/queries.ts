import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';

// Port of web useUserAddresses — `user_addresses` CRUD with is_primary.

export interface UserAddress {
  id: string;
  user_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  street_address: string;
  city: string;
  state: string;
  postal_code?: string;
  digital_postcode?: string;
  country: string;
  delivery_instructions?: string;
  is_primary: boolean;
  label?: string;
  created_at: string;
  updated_at: string;
}

export type AddressInput = {
  full_name: string;
  phone?: string;
  street_address: string;
  city: string;
  state: string;
  postal_code?: string;
  country?: string;
  delivery_instructions?: string;
  is_primary?: boolean;
  label?: string;
};

export function useUserAddresses(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-addresses', userId],
    enabled: !!userId,
    queryFn: async (): Promise<UserAddress[]> => {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId!)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function usePrimaryAddress(userId: string | undefined) {
  return useQuery({
    queryKey: ['primary-address', userId],
    enabled: !!userId,
    queryFn: async (): Promise<UserAddress | null> => {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId!)
        .eq('is_primary', true)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });
}

export function useSaveAddress(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddressInput & { id?: string }): Promise<void> => {
      if (!userId) throw new Error('Not authenticated');
      const { id, ...fields } = input;
      const payload = {
        ...fields,
        user_id: userId,
        country: fields.country || 'Nigeria',
        label: fields.label || 'Home',
        is_primary: fields.is_primary ?? false,
      };
      const query = id
        ? supabase.from('user_addresses').update(payload).eq('id', id).eq('user_id', userId)
        : supabase.from('user_addresses').insert(payload as any);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-addresses'] });
      qc.invalidateQueries({ queryKey: ['primary-address'] });
    },
  });
}

export function useDeleteAddress(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-addresses'] });
      qc.invalidateQueries({ queryKey: ['primary-address'] });
    },
  });
}
