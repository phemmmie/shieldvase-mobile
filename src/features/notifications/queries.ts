import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';

// Port of web useSmeNotifications — same table, fields and read semantics.

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['sme-notifications', userId],
    enabled: !!userId,
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, title, message, action_url, action_text, is_read, created_at')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []).map((n) => ({
        id: n.id,
        type: (n.type as AppNotification['type']) || 'info',
        title: n.title,
        message: n.message,
        actionUrl: (n as any).action_url || undefined,
        actionText: (n as any).action_text || undefined,
        isRead: n.is_read ?? false,
        createdAt: n.created_at,
      }));
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sme-notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sme-notifications'] }),
  });

  const unreadCount = (query.data || []).filter((n) => !n.isRead).length;

  return {
    notifications: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    unreadCount,
    markAsRead,
    markAllRead,
  };
}
