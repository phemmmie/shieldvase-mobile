import { useQuery } from '@tanstack/react-query';
import {
  fetchActiveGroupBuys,
  fetchActivePriceLocks,
  fetchDealPaymentState,
  fetchGroupBuyById,
  fetchGroupBuyBySlug,
  fetchMyGroupBuyParticipation,
  fetchMyGroupBuys,
  fetchMyPriceLockParticipation,
  fetchMyPriceLocks,
  fetchPriceLockById,
  fetchPriceLockBySlug,
  fetchProductDeals,
} from './api';

export const useActiveGroupBuys = () =>
  useQuery({ queryKey: ['active-group-buys'], queryFn: fetchActiveGroupBuys });

export const useActivePriceLocks = () =>
  useQuery({ queryKey: ['active-price-locks'], queryFn: fetchActivePriceLocks });

export const useGroupBuyBySlug = (slug: string | undefined) =>
  useQuery({
    queryKey: ['group-buy', slug],
    queryFn: () => fetchGroupBuyBySlug(slug!),
    enabled: !!slug,
  });

export const usePriceLockBySlug = (slug: string | undefined) =>
  useQuery({
    queryKey: ['price-lock', slug],
    queryFn: () => fetchPriceLockBySlug(slug!),
    enabled: !!slug,
  });

export const useGroupBuy = (id: string | undefined) =>
  useQuery({
    queryKey: ['group-buy-id', id],
    queryFn: () => fetchGroupBuyById(id!),
    enabled: !!id,
  });

export const usePriceLock = (id: string | undefined) =>
  useQuery({
    queryKey: ['price-lock-id', id],
    queryFn: () => fetchPriceLockById(id!),
    enabled: !!id,
  });

export const useProductDeals = (unifiedProductId: string | undefined) =>
  useQuery({
    queryKey: ['product-deals', unifiedProductId],
    queryFn: () => fetchProductDeals(unifiedProductId!),
    enabled: !!unifiedProductId,
  });

export const useMyGroupBuys = (userId: string | undefined) =>
  useQuery({
    queryKey: ['joined-group-buys', userId],
    queryFn: () => fetchMyGroupBuys(userId!),
    enabled: !!userId,
  });

export const useMyPriceLocks = (userId: string | undefined) =>
  useQuery({
    queryKey: ['locked-prices', userId],
    queryFn: () => fetchMyPriceLocks(userId!),
    enabled: !!userId,
  });

export const useMyGroupBuyParticipation = (
  groupBuyId: string | undefined,
  userId: string | undefined,
) =>
  useQuery({
    queryKey: ['gb-participation', groupBuyId, userId],
    queryFn: () => fetchMyGroupBuyParticipation(groupBuyId!, userId!),
    enabled: !!groupBuyId && !!userId,
  });

export const useMyPriceLockParticipation = (
  priceLockId: string | undefined,
  userId: string | undefined,
) =>
  useQuery({
    queryKey: ['user-price-lock-participation', priceLockId, userId],
    queryFn: () => fetchMyPriceLockParticipation(priceLockId!, userId!),
    enabled: !!priceLockId && !!userId,
  });

export const useDealPaymentState = (
  dealType: 'group_buy' | 'price_lock' | undefined,
  participantId: string | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: ['deal-payment', dealType, participantId],
    queryFn: () => fetchDealPaymentState(dealType!, participantId!),
    enabled: !!dealType && !!participantId && enabled,
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
  });
