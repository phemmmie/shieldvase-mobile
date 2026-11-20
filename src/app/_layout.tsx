import { useEffect } from 'react';
import { Stack, useGlobalSearchParams, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { CartProvider } from '@/features/cart/CartContext';
import { ToastProvider } from '@/components/Toast';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2 },
  },
});

function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const params = useGlobalSearchParams<{ redirect?: string }>();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    // First launch → onboarding welcome (stitch 01).
    AsyncStorage.getItem('shieldvase:onboarded').then((seen) => {
      if (!seen && segments[0] !== 'onboarding') router.replace('/onboarding' as any);
    }).catch(() => {});
    const inAuthGroup = segments[0] === '(auth)';
    // Guests may browse the marketplace (per doc 10) — the gate only sends
    // a signed-in user out of the auth screens, honouring ?redirect=.
    if (session && inAuthGroup) {
      const target = typeof params.redirect === 'string' && params.redirect
        ? params.redirect
        : '/(tabs)';
      router.replace(target as any);
    }
  }, [session, loading, segments, params.redirect, router]);

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen
        name="(auth)/sign-in"
        options={{ title: 'Sign in', presentation: 'modal' }}
      />
      <Stack.Screen
        name="(auth)/sign-up"
        options={{ title: 'Create account', presentation: 'modal' }}
      />
      <Stack.Screen
        name="(auth)/verify-email"
        options={{ title: 'Verify email', presentation: 'modal' }}
      />
      <Stack.Screen
        name="(auth)/forgot-password"
        options={{ title: 'Reset password', presentation: 'modal' }}
      />
      <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
      <Stack.Screen
        name="payment-callback/[ref]"
        options={{ title: 'Payment', headerBackVisible: false }}
      />
      <Stack.Screen name="order/[id]" options={{ title: 'Order' }} />
      <Stack.Screen name="rfq/new" options={{ title: 'Request a quote' }} />
      <Stack.Screen name="rfq/[id]" options={{ title: 'RFQ' }} />
      <Stack.Screen name="store/[slug]" options={{ title: 'Supplier' }} />
      <Stack.Screen name="deals/index" options={{ title: 'Deals' }} />
      <Stack.Screen
        name="deals/group-buy/[slug]"
        options={{ title: 'Group Buy' }}
      />
      <Stack.Screen
        name="deals/price-lock/[slug]"
        options={{ title: 'Price Lock' }}
      />
      <Stack.Screen
        name="deals/join/group-buy/[id]"
        options={{ title: 'Join group buy' }}
      />
      <Stack.Screen
        name="deals/join/price-lock/[id]"
        options={{ title: 'Lock price' }}
      />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="saved" options={{ title: 'Saved products' }} />
      <Stack.Screen name="addresses" options={{ title: 'Addresses' }} />
      <Stack.Screen name="address-form" options={{ title: 'Address' }} />
      <Stack.Screen name="rewards" options={{ title: 'Refer & Earn' }} />
      <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
      <Stack.Screen name="auth/reset-password" options={{ title: 'New password' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <AuthGate />
              <StatusBar style="dark" />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
