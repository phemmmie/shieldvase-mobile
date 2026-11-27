import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelSMEOrder,
  fetchOrderShipping,
  fetchSMEInvoices,
  fetchSMEOrders,
  fetchSMEProfile,
  fetchSMEStatistics,
  updateSMEProfile,
  type ProfileWithUser,
} from './api';

export const useSMEOrders = (userId: string | undefined) =>
  useQuery({
    queryKey: ['sme-orders', userId],
    queryFn: () => fetchSMEOrders(userId!),
    enabled: !!userId,
    refetchInterval: 30000,
  });

export const useSMEStatistics = (userId: string | undefined) =>
  useQuery({
    queryKey: ['sme-statistics', userId],
    queryFn: () => fetchSMEStatistics(userId!),
    enabled: !!userId,
    refetchInterval: 60000,
  });

export const useSMEInvoices = (userId: string | undefined) =>
  useQuery({
    queryKey: ['sme-invoices', userId],
    queryFn: () => fetchSMEInvoices(userId!),
    enabled: !!userId,
  });

export const useSMEProfile = (userId: string | undefined) =>
  useQuery({
    queryKey: ['sme-profile', userId],
    queryFn: () => fetchSMEProfile(userId!),
    enabled: !!userId,
  });

export const useOrderShipping = (orderId: string | undefined) =>
  useQuery({
    queryKey: ['order-shipping', orderId],
    queryFn: () => fetchOrderShipping(orderId!),
    enabled: !!orderId,
  });

export const useCancelSMEOrder = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      cancelSMEOrder(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sme-orders', userId] });
      queryClient.invalidateQueries({ queryKey: ['sme-statistics', userId] });
      queryClient.invalidateQueries({ queryKey: ['orders', userId] });
    },
  });
};

export const useUpdateSMEProfile = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<ProfileWithUser>) =>
      updateSMEProfile(userId!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sme-profile', userId] });
    },
  });
};
