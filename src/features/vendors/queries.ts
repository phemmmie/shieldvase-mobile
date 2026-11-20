import { useQuery } from '@tanstack/react-query';
import {
  fetchStorefrontBySlug,
  fetchStorefrontByVendorId,
  fetchVendorListings,
} from './api';

export const useStorefront = (slug: string | undefined) =>
  useQuery({
    queryKey: ['storefront', slug],
    queryFn: () => fetchStorefrontBySlug(slug!),
    enabled: !!slug,
  });

export const useStorefrontByVendor = (vendorUserId: string | undefined) =>
  useQuery({
    queryKey: ['storefront-by-vendor', vendorUserId],
    queryFn: () => fetchStorefrontByVendorId(vendorUserId!),
    enabled: !!vendorUserId,
  });

export const useVendorListings = (vendorUserId: string | undefined) =>
  useQuery({
    queryKey: ['vendor-listings', vendorUserId],
    queryFn: () => fetchVendorListings(vendorUserId!),
    enabled: !!vendorUserId,
  });
