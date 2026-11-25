import AsyncStorage from '@react-native-async-storage/async-storage';

// Cart → checkout handoff for promo codes, reward credits and referral slugs.
// Web keeps these in CartContent state (cart + checkout modal share a page);
// on mobile they live on separate routes so they ride this module store.
// Mirrors the credit_applied / discount_code / referral_slug fields web writes
// into checkout_sessions.

export const REFERRAL_SLUG_KEY = 'sv_referral_slug';
export const REFERRAL_CHANNEL_KEY = 'sv_referral_channel';

export type CheckoutAdjustments = {
  promoCode: string | null;
  promoAmount: number;
  creditTransaction: number;
  creditDelivery: number;
  creditDiscount: number;
  referralSlug: string | null;
};

const DEFAULTS: CheckoutAdjustments = {
  promoCode: null,
  promoAmount: 0,
  creditTransaction: 0,
  creditDelivery: 0,
  creditDiscount: 0,
  referralSlug: null,
};

let current: CheckoutAdjustments = { ...DEFAULTS };

export const setCheckoutAdjustments = (next: Partial<CheckoutAdjustments>) => {
  current = { ...current, ...next };
};

export const getCheckoutAdjustments = (): CheckoutAdjustments => current;

export const resetCheckoutAdjustments = () => {
  current = { ...DEFAULTS };
};

export const creditTotal = (a: CheckoutAdjustments) =>
  a.creditTransaction + a.creditDelivery + a.creditDiscount;

export const getStoredReferralSlug = async () =>
  AsyncStorage.getItem(REFERRAL_SLUG_KEY);

export const storeReferralSlug = async (slug: string | null) => {
  if (slug) await AsyncStorage.setItem(REFERRAL_SLUG_KEY, slug);
  else await AsyncStorage.removeItem(REFERRAL_SLUG_KEY);
};
