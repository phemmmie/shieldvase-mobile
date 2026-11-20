import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/theme';

export type TimelineItem = {
  title: string;
  subtitle?: string;
  state: 'done' | 'current' | 'upcoming';
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <View>
      {items.map((item, i) => {
        const last = i === items.length - 1;
        const dotColor =
          item.state === 'done'
            ? colors.secondary
            : item.state === 'current'
              ? colors.primary
              : colors.border;
        return (
          <View key={i} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.dot, { borderColor: dotColor }]}>
                {item.state === 'done' ? (
                  <Ionicons name="checkmark" size={12} color={colors.secondary} />
                ) : item.state === 'current' ? (
                  <View style={styles.dotInner} />
                ) : null}
              </View>
              {!last && <View style={[styles.line, item.state === 'done' && { backgroundColor: colors.secondary }]} />}
            </View>
            <View style={styles.body}>
              <Text
                style={[
                  styles.title,
                  item.state === 'upcoming' && { color: colors.textMuted },
                ]}
              >
                {item.title}
              </Text>
              {!!item.subtitle && <Text style={styles.sub}>{item.subtitle}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  rail: { width: 28, alignItems: 'center' },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  dotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  line: { width: 2, flex: 1, backgroundColor: colors.border },
  body: { flex: 1, paddingLeft: spacing.md, paddingBottom: spacing.xl },
  title: { ...typography.bodyStrong, color: colors.text },
  sub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
