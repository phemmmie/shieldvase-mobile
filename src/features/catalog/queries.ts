import { useQuery } from '@tanstack/react-query';
import {
  fetchCategories,
  fetchFeaturedProducts,
  fetchProductsByCategory,
  fetchProductBySlug,
  fetchVendorOffers,
  searchProducts,
} from './api';

export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

export const useFeaturedProducts = () =>
  useQuery({ queryKey: ['products', 'featured'], queryFn: () => fetchFeaturedProducts() });

export const useCategoryProducts = (categoryId: string | undefined) =>
  useQuery({
    queryKey: ['products', 'category', categoryId],
    queryFn: () => fetchProductsByCategory(categoryId!),
    enabled: !!categoryId,
  });

export const useProductSearch = (term: string) =>
  useQuery({
    queryKey: ['products', 'search', term],
    queryFn: () => searchProducts(term),
    enabled: term.trim().length >= 2,
  });

export const useProduct = (slug: string | undefined) =>
  useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProductBySlug(slug!),
    enabled: !!slug,
  });

export const useVendorOffers = (unifiedProductId: string | undefined) =>
  useQuery({
    queryKey: ['offers', unifiedProductId],
    queryFn: () => fetchVendorOffers(unifiedProductId!),
    enabled: !!unifiedProductId,
  });
