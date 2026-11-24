import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, spacing, typography } from '@/theme';

// Mirrors web /rfq (views/RFQ.tsx): "Request for Quotation (RFQ)" header +
// tabs — Upload Document / Create Manually / My RFQs (auth only).
// Upload tab → rfq-documents storage + rfqs row (source: 'uploaded'),
// same as web UploadRFQTab. Create/Track tabs navigate to the existing
// native screens (/rfq/new, /(tabs)/rfqs).

type Tab = 'upload' | 'create' | 'tracking';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
];

export default function RfqHubScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const pickAndUpload = async () => {
    if (!user && (!guestName.trim() || !guestEmail.trim())) {
      return Alert.alert('Contact details required', 'Please enter your name and email so suppliers can respond.');
    }
    const res = await DocumentPicker.getDocumentAsync({ type: ACCEPTED_TYPES, copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    setFileName(asset.name);
    setUploading(true);
    try {
      const ext = asset.name.split('.').pop() ?? 'bin';
      const path = `${user?.id ?? 'guest'}/${Date.now()}.${ext}`;
      const blob = await (await fetch(asset.uri)).blob();
      const { error: upErr } = await supabase.storage.from('rfq-documents').upload(path, blob, { contentType: asset.mimeType });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('rfq-documents').getPublicUrl(path);
      // Same columns as web UploadRFQTab: title from filename, attachments[],
      // status 'draft', source 'uploaded'; guests carry contact fields + is_guest.
      const { error } = await supabase.from('rfqs').insert(
        user
          ? {
              sme_id: user.id,
              title: asset.name.replace(/\.[^/.]+$/, ''),
              attachments: [publicUrl],
              status: 'draft',
              source: 'uploaded',
              attachment_format: asset.mimeType,
            }
          : {
              is_guest: true,
              sme_id: null,
              guest_name: guestName.trim(),
              guest_email: guestEmail.trim(),
              guest_phone: guestPhone.trim() || null,
              title: asset.name.replace(/\.[^/.]+$/, ''),
              attachments: [publicUrl],
              status: 'draft',
              source: 'uploaded',
              attachment_format: asset.mimeType,
            },
      );
      if (error) throw error;
      Alert.alert('RFQ Submitted', "Your document has been received. We'll match it with suppliers shortly.", [
        { text: 'OK', onPress: () => user && router.push('/(tabs)/rfqs' as any) },
      ]);
      setFileName(null);
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Please try again.');
    } finally {
      setUploading(false);
    }
    return undefined;
  };

  const tabs: { key: Tab; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { key: 'upload', icon: 'cloud-upload-outline', label: 'Upload' },
    { key: 'create', icon: 'document-text-outline', label: 'Create' },
    ...(user ? [{ key: 'tracking' as Tab, icon: 'list-outline' as const, label: 'Track' }] : []),
  ];

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'RFQ' }} />
      <ScrollView contentContainerStyle={{ paddingVertical: spacing.lg, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <ScreenColumn>
          {/* Page Header — verbatim from web */}
          <Text style={styles.h1}>Request for Quotation (RFQ)</Text>
          <Text style={styles.sub}>
            Submit bulk order requests to multiple suppliers. Upload your procurement document or
            create one manually — {user ? ' track all your submissions below.' : ' no account required to get started.'}
          </Text>

          {/* Tab bar — web TabsList (2-col grid on mobile) */}
          <View style={styles.tabBar}>
            {tabs.map(t => {
              const on = tab === t.key;
              return (
                <Pressable key={t.key} style={[styles.tabBtn, on && styles.tabBtnOn]} onPress={() => setTab(t.key)}>
                  <Ionicons name={t.icon} size={15} color={on ? colors.text : colors.textMuted} />
                  <Text style={[styles.tabText, on && styles.tabTextOn]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {tab === 'upload' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Upload RFQ Document</Text>
              <Text style={styles.cardSub}>
                Upload your prepared procurement document (PDF, Excel, or image) and we&apos;ll
                process it for supplier matching.
              </Text>
              {!user && (
                <View style={styles.guestBlock}>
                  <TextInput style={styles.input} placeholder="Full name" placeholderTextColor={colors.textFaint} value={guestName} onChangeText={setGuestName} />
                  <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.textFaint} value={guestEmail} onChangeText={setGuestEmail} keyboardType="email-address" autoCapitalize="none" />
                  <TextInput style={styles.input} placeholder="Phone (optional)" placeholderTextColor={colors.textFaint} value={guestPhone} onChangeText={setGuestPhone} keyboardType="phone-pad" />
                </View>
              )}
              <Pressable style={[styles.dropzone, uploading && { opacity: 0.6 }]} onPress={pickAndUpload} disabled={uploading}>
                <Ionicons name="cloud-upload-outline" size={36} color={colors.primary} />
                <Text style={styles.dropTitle}>{uploading ? 'Uploading…' : 'Tap to upload document'}</Text>
                <Text style={styles.dropSub}>PDF, Excel, JPG or PNG</Text>
                {fileName && !uploading && <Text style={styles.dropFile}>{fileName}</Text>}
              </Pressable>
            </View>
          )}

          {tab === 'create' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Create RFQ Manually</Text>
              <Text style={styles.cardSub}>
                Add products one by one with quantities, delivery dates, and specifications.
              </Text>
              <Pressable style={styles.primaryBtn} onPress={() => router.push('/rfq/new' as any)}>
                <Ionicons name="add" size={16} color={colors.textOnPrimary} />
                <Text style={styles.primaryBtnText}>Create RFQ</Text>
              </Pressable>
            </View>
          )}

          {tab === 'tracking' && user && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>My RFQs</Text>
              <Text style={styles.cardSub}>Track the status of all your quotation requests.</Text>
              <Pressable style={styles.primaryBtn} onPress={() => router.push('/(tabs)/rfqs' as any)}>
                <Ionicons name="list-outline" size={16} color={colors.textOnPrimary} />
                <Text style={styles.primaryBtnText}>View My RFQs</Text>
              </Pressable>
            </View>
          )}
        </ScreenColumn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  h1: { ...typography.h1, color: colors.text },
  sub: { ...typography.body, color: colors.textMuted, marginTop: 6 },
  tabBar: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.lg, marginBottom: spacing.md },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderRadius: radius.md, backgroundColor: colors.surfaceAlt,
  },
  tabBtnOn: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  tabText: { ...typography.captionStrong, color: colors.textMuted },
  tabTextOn: { color: colors.text },
  card: { backgroundColor: colors.surfaceRaised, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardTitle: { ...typography.h3, color: colors.text },
  cardSub: { ...typography.caption, color: colors.textMuted, marginTop: 4, lineHeight: 19 },
  guestBlock: { marginTop: spacing.md, gap: spacing.sm },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm + 3,
    ...typography.body, color: colors.text, backgroundColor: '#fff',
  },
  dropzone: {
    marginTop: spacing.lg, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.borderStrong,
    borderRadius: radius.lg, paddingVertical: spacing.xl, alignItems: 'center', gap: 6,
    backgroundColor: colors.surface,
  },
  dropTitle: { ...typography.bodyStrong, color: colors.text, marginTop: spacing.xs },
  dropSub: { ...typography.caption, color: colors.textMuted },
  dropFile: { ...typography.captionStrong, color: colors.primary, marginTop: 4 },
  primaryBtn: {
    marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md,
  },
  primaryBtnText: { ...typography.bodyStrong, color: colors.textOnPrimary },
});
