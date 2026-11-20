import { StyleProp, useWindowDimensions, View, ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { colors, spacing } from '@/theme';

export const CONTENT_MAX_WIDTH = 560;

/** True on tablets / desktop web — content should constrain to a column. */
export function useIsWide() {
  const { width } = useWindowDimensions();
  return width > CONTENT_MAX_WIDTH + 2 * spacing.lg;
}

/**
 * Centers content in a phone-width column on wide screens so the app
 * renders correctly on desktop web previews and tablets. On phones the
 * column simply fills the viewport.
 */
export function ScreenColumn({
  children,
  pad = true,
  style,
}: {
  children: ReactNode;
  pad?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const wide = useIsWide();
  return (
    <View
      style={[
        {
          width: '100%',
          maxWidth: wide ? CONTENT_MAX_WIDTH : undefined,
          alignSelf: 'center',
          paddingHorizontal: pad ? spacing.lg : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Full-bleed screen background with centered column content (for ScrollViews). */
export function WideShell({ children }: { children: ReactNode }) {
  return <View style={{ flex: 1, backgroundColor: colors.surface }}>{children}</View>;
}
