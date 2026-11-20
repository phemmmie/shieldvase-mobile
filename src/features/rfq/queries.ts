import { useQuery } from '@tanstack/react-query';
import { fetchMyRfqs, fetchRfqDetail } from './api';

export const useMyRfqs = (userId: string | undefined) =>
  useQuery({
    queryKey: ['rfqs', userId],
    queryFn: () => fetchMyRfqs(userId!),
    enabled: !!userId,
  });

export const useRfqDetail = (rfqId: string | undefined) =>
  useQuery({
    queryKey: ['rfq', rfqId],
    queryFn: () => fetchRfqDetail(rfqId!),
    enabled: !!rfqId,
  });
