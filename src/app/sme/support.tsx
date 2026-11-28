import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/api/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { EmptyState, LoadingState } from '@/components/States';
import { ScreenColumn } from '@/components/Responsive';
import { useToast } from '@/components/Toast';
import { colors, radius, shadows, spacing, typography } from '@/theme';

// Mirrors web /sme/support (views/sme/Support.tsx + SupportRequestModal):
// "N request(s)" header + New Request button, contact_submissions list
// filtered by the user's profile email, status badges, admin notes, and a
// topic+message request form (Dialog → RN Modal on mobile).

const SUPPORT_TOPICS = [
  { value: 'invoice_support', label: 'Invoice Support' },
  { value: 'product_enquiry', label: 'Product Enquiry' },
  { value: 'delivery_issue', label: 'Delivery Issue' },
  { value: 'order_problem', label: 'Order Problem' },
  { value: 'account_help', label: 'Account Help' },
  { value: 'rfq_support', label: 'RFQ Support' },
  { value: 'other', label: 'Other' },
];

interface Submission {
  id: string;
  inquiry_type: string;
  status: string;
  message: string;
  admin_notes: string | null;
  created_at: string;
}

const STATUS_META: Record<string, { label: string; fg: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  resolved: { label: 'Resolved', fg: '#166534', bg: '#DCFCE7', icon: 'checkmark-circle' },
  in_progress: { label: 'In Progress', fg: '#1E40AF', bg: '#DBEAFE', icon: 'chatbubble-ellipses-outline' },
};

const DEFAULT_STATUS = { label: 'Pending', fg: '#92400E', bg: '#FEF3C7', icon: 'time-outline' as const };

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

export default function SMESupportScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const queryKey = ['sme-support-submissions', user?.id];
  const { data: submissions = [], isLoading } = useQuery<Submission[]>({
    queryKey,
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', user!.id)
        .single();
      if (!profile?.email) return [];

      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .eq('email', profile.email)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Submission[];
    },
  });

  const submit = async () => {
    if (!topic || !message.trim()) {
      toast.show('error', 'Please select a topic and describe your issue.');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('contact_submissions').insert({
        name: (user?.user_metadata as any)?.full_name || user?.email || 'SME User',
        email: user?.email || '',
        phone: (user?.user_metadata as any)?.phone || null,
        inquiry_type: topic,
        message: message.trim(),
      });
      if (error) throw error;
      toast.show('success', 'Support request sent. Our team will get back to you shortly.');
      setTopic('');
      setMessage('');
      setFormOpen(false);
      await queryClient.invalidateQueries({ queryKey });
    } catch (err: any) {
      toast.show('error', err?.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return <EmptyState title="Sign in required" hint="Sign in to contact support." />;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Contact Support' }} />
      <ScreenColumn pad={false} style={styles.container}>
        <Text style={styles.subtitle}>Manage your support requests and get help from our team</Text>
        <View style={styles.headerRow}>
          <View style={styles.countRow}>
            <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.countText}>{submissions.length} request(s)</Text>
          </View>
          <Button
            title="New Request"
            size="sm"
            fullWidth={false}
            onPress={() => setFormOpen(true)}
            icon={<Ionicons name="add" size={14} color={colors.textOnPrimary} />}
          />
        </View>

        {isLoading ? (
          <LoadingState label="Loading requests…" />
        ) : submissions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="help-circle-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No support requests yet</Text>
            <Text style={styles.emptyHint}>
              Click &quot;New Request&quot; to get help from our support team
            </Text>
          </View>
        ) : (
          <FlatList
            data={submissions}
            keyExtractor={s => s.id}
            scrollEnabled={false}
            contentContainerStyle={{ gap: spacing.sm }}
            renderItem={({ item }) => {
              const meta = STATUS_META[item.status] ?? DEFAULT_STATUS;
              return (
                <View style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.badgeRow}>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{item.inquiry_type}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                        <Ionicons name={meta.icon} size={11} color={meta.fg} />
                        <Text style={[styles.statusBadgeText, { color: meta.fg }]}>{meta.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                  </View>
                  <Text style={styles.messageText}>{item.message}</Text>
                  {!!item.admin_notes && (
                    <View style={styles.adminNotes}>
                      <Text style={styles.adminNotesText}>
                        <Text style={styles.adminNotesLabel}>Admin:</Text> {item.admin_notes}
                      </Text>
                    </View>
                  )}
                </View>
              );
            }}
          />
        )}
      </ScreenColumn>

      {/* New request — web SupportRequestModal Dialog → RN Modal */}
      <Modal visible={formOpen} animationType="slide" transparent onRequestClose={() => setFormOpen(false)}>
        <View style={styles.modalScrim}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Contact Support</Text>
            <Text style={styles.fieldLabel}>Topic</Text>
            <View style={styles.topicGrid}>
              {SUPPORT_TOPICS.map(t => (
                <Pressable
                  key={t.value}
                  style={[styles.topicChip, topic === t.value && styles.topicChipActive]}
                  onPress={() => setTopic(t.value)}
                >
                  <Text style={[styles.topicChipText, topic === t.value && styles.topicChipTextActive]}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Input
              label="Describe your issue"
              placeholder="Please provide details about your issue..."
              multiline
              numberOfLines={4}
              value={message}
              onChangeText={setMessage}
              style={styles.messageInput}
            />
            <Button title={submitting ? 'Sending…' : 'Submit Request'} loading={submitting} onPress={submit} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.xl },
  subtitle: { ...typography.caption, color: colors.textMuted },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, marginBottom: spacing.lg },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countText: { ...typography.caption, color: colors.textMuted },
  emptyCard: {
    alignItems: 'center', backgroundColor: colors.surfaceRaised, borderRadius: radius.lg,
    padding: spacing['2xl'], borderWidth: 1, borderColor: colors.border,
  },
  emptyTitle: { ...typography.bodyStrong, color: colors.textMuted, marginTop: spacing.md },
  emptyHint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  card: {
    backgroundColor: colors.surfaceRaised, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, ...shadows.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  typeBadge: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  typeBadgeText: { ...typography.micro, color: colors.textMuted },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: radius.pill,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  statusBadgeText: { ...typography.micro, fontWeight: '600' },
  dateText: { ...typography.micro, color: colors.textMuted },
  messageText: { ...typography.body, color: colors.text, marginTop: spacing.sm },
  adminNotes: { marginTop: spacing.sm, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm },
  adminNotesText: { ...typography.caption, color: colors.textMuted },
  adminNotesLabel: { color: colors.primary, fontWeight: '600' },
  modalScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.xl, paddingBottom: 40,
  },
  modalTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.lg },
  fieldLabel: { ...typography.captionStrong, color: colors.text, marginBottom: spacing.xs },
  topicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  topicChip: {
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceRaised, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  topicChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  topicChipText: { ...typography.caption, color: colors.textMuted },
  topicChipTextActive: { color: colors.textOnPrimary },
  messageInput: { minHeight: 96, textAlignVertical: 'top' },
});
