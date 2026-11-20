import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '@/theme';

type Kind = 'success' | 'error' | 'info';
type ToastItem = { id: number; kind: Kind; message: string };

const ToastContext = createContext<{ show: (kind: Kind, message: string) => void }>({
  show: () => {},
});

export const useToast = () => useContext(ToastContext);

const iconFor: Record<Kind, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

const colorFor: Record<Kind, string> = {
  success: colors.secondary,
  error: colors.destructive,
  info: colors.text,
};

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const insets = useSafeAreaInsets();

  const show = useCallback((kind: Kind, message: string) => {
    const id = ++nextId;
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toasts.map((t) => (
        <Animated.View
          key={t.id}
          entering={FadeInDown.springify()}
          exiting={FadeOutUp.duration(200)}
          style={[styles.toast, { top: insets.top + spacing.sm }]}
        >
          <Ionicons name={iconFor[t.kind]} size={20} color={colorFor[t.kind]} />
          <Text style={styles.text} numberOfLines={2}>
            {t.message}
          </Text>
        </Animated.View>
      ))}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    ...shadows.raised,
  },
  text: { ...typography.bodyStrong, color: colors.text, flexShrink: 1 },
});
