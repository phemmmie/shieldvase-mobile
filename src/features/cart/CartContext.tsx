import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/api/supabase';
import {
  deleteAnonymousSessionCartItems,
  fetchAnonymousSessionCartItems,
} from '@/api/anonCart';

// Port of the web app's CartContext (D8): server-side `cart_items` keyed by
// an anonymous `cart_session_id` for guests, merged into `user_id` rows on
// sign-in. Vendor-scoped dedupe preserved verbatim.

export interface CartItem {
  id: string;
  product_id?: string;
  vendor_product_id?: string;
  unified_product_id?: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  vendor_id?: string | null;
  category?: string | null;
  session_id?: string | null;
  user_id?: string | null;
  source?: string | null;
  rfq_id?: string | null;
  rfq_item_id?: string | null;
  selected_specs?: Record<string, { label: string; value: string }> | null;
}

type CartContextType = {
  items: CartItem[];
  addToCart: (
    item: Omit<CartItem, 'quantity' | 'id'> & { quantity?: number; id?: string },
  ) => Promise<boolean>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  loading: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);
const SESSION_KEY = 'cart_session_id';

const getCartItemKey = (row: any) => {
  const vid = row?.vendor_id || '';
  return (
    (row?.vendor_product_id && `vp:${row.vendor_product_id}`) ||
    (row?.unified_product_id && `up:${row.unified_product_id}|${vid}`) ||
    (row?.product_id && `p:${row.product_id}|${vid}`) ||
    row?.name ||
    row?.id
  );
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const itemsRef = useRef<CartItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');

  const fetchCartItems = useCallback(async (sid: string) => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let query = supabase.from('cart_items').select('*');
      query = user ? query.eq('user_id', user.id) : query.eq('session_id', sid);

      const { data, error } = await query;
      if (error) throw error;
      setItems((data ?? []) as CartItem[]);
    } catch (error) {
      console.warn('Error fetching cart items:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Merge anonymous session cart into the user cart on sign-in. Session rows
  // are read/deleted through the anon REST client because RLS hides them from
  // the authed client (same as web).
  const migrateSessionCartToUser = useCallback(
    async (sid: string, userId: string) => {
      try {
        setLoading(true);
        const sessionItems = await fetchAnonymousSessionCartItems(sid);

        if (sessionItems?.length) {
          const { data: userItems, error: userError } = await supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', userId);
          if (userError) throw userError;

          const userByKey = new Map<string, any>();
          for (const ui of userItems ?? []) userByKey.set(getCartItemKey(ui), ui);

          for (const si of sessionItems) {
            const existing = userByKey.get(getCartItemKey(si));
            if (existing) {
              const { error } = await supabase
                .from('cart_items')
                .update({ quantity: (existing.quantity || 0) + (si.quantity || 0) })
                .eq('id', existing.id);
              if (error) throw error;
            } else {
              const { id, created_at, updated_at, user_id, session_id, ...rest } =
                si as any;
              const { error } = await supabase
                .from('cart_items')
                .insert([{ ...rest, user_id: userId, session_id: null }]);
              if (error) throw error;
            }
          }

          await deleteAnonymousSessionCartItems(sid);
        }

        const { data: finalUserItems, error: finalError } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', userId);
        if (finalError) throw finalError;
        setItems((finalUserItems ?? []) as CartItem[]);
      } catch (error) {
        console.warn('Error migrating cart items:', error);
        try {
          const { data } = await supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', userId);
          setItems((data ?? []) as CartItem[]);
        } catch {
          // ignore
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let sid = '';
    (async () => {
      sid = (await AsyncStorage.getItem(SESSION_KEY)) ?? '';
      if (!sid) {
        sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem(SESSION_KEY, sid);
      }
      setSessionId(sid);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) await migrateSessionCartToUser(sid, user.id);
      else await fetchCartItems(sid);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!sid) return;
      if (event === 'SIGNED_IN' && session?.user) {
        migrateSessionCartToUser(sid, session.user.id);
      } else if (event === 'SIGNED_OUT') {
        fetchCartItems(sid);
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchCartItems, migrateSessionCartToUser]);

  // Realtime: refetch when cart_items change for this user/session (D8).
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    const setup = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const filter = user ? `user_id=eq.${user.id}` : `session_id=eq.${sessionId}`;
      const channel = supabase
        .channel(`rt:cart_items:${user?.id || sessionId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'cart_items', filter },
          () => {
            if (!cancelled) fetchCartItems(sessionId);
          },
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    };
    const cleanupPromise = setup();
    return () => {
      cancelled = true;
      cleanupPromise.then((fn) => fn && fn());
    };
  }, [sessionId, fetchCartItems]);

  const updateQuantity = useCallback(async (id: string, quantity: number) => {
    if (quantity <= 0) {
      const { error } = await supabase.from('cart_items').delete().eq('id', id);
      if (error) console.warn('Error removing item:', error);
      else setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', id);
    if (error) console.warn('Error updating quantity:', error);
    else setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  }, []);

  const addToCart = useCallback(
    async (
      item: Omit<CartItem, 'quantity' | 'id'> & { quantity?: number; id?: string },
    ): Promise<boolean> => {
      try {
        if (!item.vendor_product_id && !item.unified_product_id && !item.product_id) {
          console.warn('Cart item missing product IDs');
          return false;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();
        const itemQuantity = item.quantity || 1;

        // Vendor-scoped dedupe: same unified product from two vendors stays two rows.
        const sameVendor = (a?: string | null, b?: string | null) =>
          (a || null) === (b || null);
        const existingItem = itemsRef.current.find((i) => {
          if (item.vendor_product_id && i.vendor_product_id === item.vendor_product_id)
            return true;
          if (
            item.product_id &&
            i.product_id === item.product_id &&
            sameVendor(i.vendor_id, item.vendor_id)
          )
            return true;
          if (
            item.unified_product_id &&
            i.unified_product_id === item.unified_product_id &&
            sameVendor(i.vendor_id, item.vendor_id)
          )
            return true;
          return false;
        });

        if (existingItem) {
          await updateQuantity(existingItem.id, existingItem.quantity + itemQuantity);
          return true;
        }

        // Resolve vendor_id from vendor_product_id when missing — needed for
        // order splitting + per-vendor stock deduction in convert_cart_to_order.
        let resolvedVendorId = item.vendor_id || null;
        if (!resolvedVendorId && item.vendor_product_id) {
          try {
            const { data: vp } = await supabase
              .from('vendor_products')
              .select('vendor_id')
              .eq('id', item.vendor_product_id)
              .maybeSingle();
            resolvedVendorId = (vp as any)?.vendor_id || null;
          } catch {
            // best effort
          }
        }

        const cartItem = {
          vendor_product_id: item.vendor_product_id || null,
          unified_product_id: item.unified_product_id || null,
          product_id: item.product_id || null,
          name: item.name,
          price: item.price,
          quantity: itemQuantity,
          image: item.image || null,
          vendor_id: resolvedVendorId,
          category: item.category || null,
          session_id: user ? null : sessionId,
          user_id: user?.id || null,
          selected_specs: item.selected_specs ?? null,
        };

        const { data, error } = await supabase
          .from('cart_items')
          .insert([cartItem])
          .select()
          .single();
        if (error) throw error;
        setItems((prev) => [...prev, data as CartItem]);
        return true;
      } catch (error) {
        console.warn('Error adding to cart:', error);
        return false;
      }
    },
    [sessionId, updateQuantity],
  );

  const removeFromCart = useCallback(async (id: string) => {
    const { error } = await supabase.from('cart_items').delete().eq('id', id);
    if (error) console.warn('Error removing item:', error);
    else setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let query = supabase.from('cart_items').delete();
      query = user ? query.eq('user_id', user.id) : query.eq('session_id', sessionId);
      const { error } = await query;
      if (error) throw error;
      setItems([]);
    } catch (error) {
      console.warn('Error clearing cart:', error);
    }
  }, [sessionId]);

  const value = useMemo<CartContextType>(() => {
    const totalItems = items.reduce((s, i) => s + i.quantity, 0);
    const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return {
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      loading,
    };
  }, [items, addToCart, removeFromCart, updateQuantity, clearCart, loading]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
