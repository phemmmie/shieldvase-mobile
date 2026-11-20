import { useQuery } from '@tanstack/react-query';
import {
  fetchOrder,
  fetchOrderGroupPaymentState,
  fetchOrderItems,
  fetchOrders,
  fetchOrderStatusHistory,
} from './api';

export const useOrders = (userId: string | undefined) =>
  useQuery({
    queryKey: ['orders', userId],
    queryFn: () => fetchOrders(userId!),
    enabled: !!userId,
  });

export const useOrder = (orderId: string | undefined) =>
  useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId!),
    enabled: !!orderId,
  });

export const useOrderItems = (orderId: string | undefined) =>
  useQuery({
    queryKey: ['order-items', orderId],
    queryFn: () => fetchOrderItems(orderId!),
    enabled: !!orderId,
  });

export const useOrderStatusHistory = (orderId: string | undefined) =>
  useQuery({
    queryKey: ['order-history', orderId],
    queryFn: () => fetchOrderStatusHistory(orderId!),
    enabled: !!orderId,
  });

/**
 * Payment-result polling — the only client-side status check allowed post-
 * payment (doc 06): poll the orders table; never trust redirect params.
 */
export const useOrderGroupPaymentState = (
  orderGroupId: string | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: ['order-group-payment', orderGroupId],
    queryFn: () => fetchOrderGroupPaymentState(orderGroupId!),
    enabled: !!orderGroupId && enabled,
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
  });
