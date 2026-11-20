import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppHeader } from '@/components/AppHeader';
import { colors, shadows, typography } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({
  icon,
  color,
  size,
  focused,
}: {
  icon: IconName;
  color: string;
  size: number;
  focused: boolean;
}) {
  const name = focused ? (icon.replace('-outline', '') as IconName) : icon;
  return <Ionicons name={name} size={size} color={color} />;
}

function DealsCenterButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/deals' as any);
      }}
      style={({ pressed }) => [fab.wrap, pressed && { transform: [{ scale: 0.92 }] }]}
      accessibilityLabel="Deals"
    >
      <View style={fab.circle}>
        <Ionicons name="pricetags" size={24} color={colors.textOnPrimary} />
      </View>
      <Text style={fab.label}>Deals</Text>
    </Pressable>
  );
}

const fab = StyleSheet.create({
  wrap: { top: -18, alignItems: 'center', width: 64 },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.background,
    ...shadows.raised,
  },
  label: { ...typography.micro, color: colors.primary, marginTop: 2 },
});

const hapticTab = {
  tabPress: () => {
    Haptics.selectionAsync();
  },
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        header: ({ options, route }) => (
          <AppHeader
            title={(options.title as string) ?? 'ShieldVase'}
            brand={route.name === 'index'}
          />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        listeners={hapticTab}
        options={{
          title: 'ShieldVase',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon="home-outline" color={color as string} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="rfqs"
        listeners={hapticTab}
        options={{
          title: 'RFQs',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon="document-text-outline" color={color as string} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="deals-fab"
        options={{
          title: 'Deals',
          tabBarButton: () => <DealsCenterButton />,
        }}
        listeners={{
          tabPress: (e) => e.preventDefault(),
        }}
      />
      <Tabs.Screen
        name="orders"
        listeners={hapticTab}
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon="receipt-outline" color={color as string} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        listeners={hapticTab}
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon="person-outline" color={color as string} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen name="cart" options={{ href: null, title: 'Cart' }} />
    </Tabs>
  );
}
