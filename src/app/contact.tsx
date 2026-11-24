import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/api/supabase';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, spacing, typography } from '@/theme';

// Mirrors web /contact (views/Contact.tsx → contact/ContactForm + ContactInfo
// + SocialLinks): inquiry form → contact_submissions, info card, socials.
// Web's Map embed is omitted (needs a maps embed; not app-critical).

const INQUIRY_TYPES = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'support', label: 'Support' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'sales', label: 'Sales' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'complaint', label: 'Complaint' },
];

const WHATSAPP_URL =
  'https://wa.me/2347051277149?text=' + encodeURIComponent("Hi, I'd like to place an order");

const SOCIALS: { icon: keyof typeof Ionicons.glyphMap; href: string; label: string }[] = [
  { icon: 'logo-facebook', href: 'https://facebook.com/shieldvase', label: 'Facebook' },
  { icon: 'logo-twitter', href: 'https://twitter.com/shieldvase', label: 'Twitter' },
  { icon: 'logo-linkedin', href: 'https://linkedin.com/company/shieldvase', label: 'LinkedIn' },
  { icon: 'logo-instagram', href: 'https://instagram.com/shieldvase', label: 'Instagram' },
];

export default function ContactScreen() {
  const [inquiryType, setInquiryType] = useState('');
  const [typeOpen, setTypeOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!inquiryType) return Alert.alert('Missing field', 'Please select an inquiry type.');
    if (!name.trim() || !email.trim()) {
      return Alert.alert('Missing fields', 'Name and email are required.');
    }
    if (message.trim().length < 10) {
      return Alert.alert('Message too short', 'Message must be at least 10 characters.');
    }
    setSending(true);
    const { error } = await supabase.from('contact_submissions').insert({
      inquiry_type: inquiryType,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      message: message.trim(),
    });
    setSending(false);
    if (error) return Alert.alert('Could not send', error.message);
    Alert.alert('Message Sent!', "We'll get back to you as soon as possible.");
    setInquiryType(''); setName(''); setEmail(''); setPhone(''); setMessage('');
    return undefined;
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Contact Us' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingVertical: spacing.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <ScreenColumn>
            <Text style={styles.pageTitle}>Contact Us</Text>

            {/* Send us a Message — web ContactForm */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Send us a Message</Text>
              <Text style={styles.label}>Inquiry Type</Text>
              <Pressable style={styles.select} onPress={() => setTypeOpen(o => !o)}>
                <Text style={inquiryType ? styles.selectValue : styles.selectPlaceholder}>
                  {INQUIRY_TYPES.find(i => i.value === inquiryType)?.label ?? 'Select inquiry type'}
                </Text>
                <Ionicons name={typeOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
              </Pressable>
              {typeOpen && (
                <View style={styles.selectList}>
                  {INQUIRY_TYPES.map(it => (
                    <Pressable key={it.value} style={styles.selectItem} onPress={() => { setInquiryType(it.value); setTypeOpen(false); }}>
                      <Text style={[styles.selectItemText, it.value === inquiryType && { color: colors.primary }]}>
                        {it.label}
                      </Text>
                      {it.value === inquiryType && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                    </Pressable>
                  ))}
                </View>
              )}
              <Text style={styles.label}>Name</Text>
              <TextInput style={styles.input} placeholder="Your name" placeholderTextColor={colors.textFaint} value={name} onChangeText={setName} />
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} placeholder="Your email" placeholderTextColor={colors.textFaint} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <Text style={styles.label}>Phone (Optional)</Text>
              <TextInput style={styles.input} placeholder="Your phone number" placeholderTextColor={colors.textFaint} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <Text style={styles.label}>Message</Text>
              <TextInput style={[styles.input, styles.textarea]} placeholder="Type your message here" placeholderTextColor={colors.textFaint} value={message} onChangeText={setMessage} multiline />
              <Pressable style={[styles.submit, sending && { opacity: 0.6 }]} onPress={submit} disabled={sending}>
                <Text style={styles.submitText}>{sending ? 'Sending...' : 'Send Message'}</Text>
              </Pressable>
            </View>

            {/* Contact Information — web ContactInfo */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Contact Information</Text>
              <InfoRow icon="location-outline" title="Office Address">
                <Text style={styles.infoText}>Block 37, Flat 7, LSDPC Estate, Ogba, Lagos State, Nigeria</Text>
              </InfoRow>
              <InfoRow icon="call-outline" title="Phone Number" onPress={() => Linking.openURL('tel:+2348035757500')}>
                <Text style={styles.infoLink}>0803 575 7500</Text>
              </InfoRow>
              <InfoRow icon="logo-whatsapp" iconColor="#25D366" title="Prefer WhatsApp?" onPress={() => Linking.openURL(WHATSAPP_URL)}>
                <Text style={styles.infoText}>
                  <Text style={styles.infoLink}>Order directly through our WhatsApp bot</Text>
                  {' '}-- no app or account needed.
                </Text>
              </InfoRow>
              <InfoRow icon="mail-outline" title="Email Address" onPress={() => Linking.openURL('mailto:info@shieldvase.io')}>
                <Text style={styles.infoLink}>info@shieldvase.io</Text>
              </InfoRow>
              <InfoRow icon="time-outline" title="Working Hours">
                <Text style={styles.infoText}>Monday - Friday: 9:00 AM - 5:00 PM</Text>
                <Text style={styles.infoText}>Saturday: 10:00 AM - 2:00 PM</Text>
                <Text style={styles.infoText}>Sunday: Closed</Text>
              </InfoRow>
            </View>

            {/* Connect With Us — web SocialLinks */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Connect With Us</Text>
              <View style={styles.socialRow}>
                {SOCIALS.map(s => (
                  <Pressable key={s.label} style={styles.socialBtn} onPress={() => Linking.openURL(s.href)} accessibilityLabel={s.label}>
                    <Ionicons name={s.icon} size={26} color={colors.textMuted} />
                  </Pressable>
                ))}
              </View>
            </View>
          </ScreenColumn>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function InfoRow({
  icon, iconColor, title, onPress, children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  onPress?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable style={styles.infoRow} onPress={onPress} disabled={!onPress}>
      <Ionicons name={icon} size={22} color={iconColor ?? colors.text} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoTitle}>{title}</Text>
        {children}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FDF5E6' },
  pageTitle: { ...typography.h1, color: colors.text, textAlign: 'center', marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surfaceRaised, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  cardTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  label: { ...typography.captionStrong, color: colors.text, marginBottom: 6, marginTop: spacing.sm },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm + 3,
    ...typography.body, color: colors.text, backgroundColor: '#fff',
  },
  textarea: { minHeight: 110, textAlignVertical: 'top' },
  select: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm + 4,
  },
  selectValue: { ...typography.body, color: colors.text },
  selectPlaceholder: { ...typography.body, color: colors.textFaint },
  selectList: {
    marginTop: 4, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, backgroundColor: '#fff', overflow: 'hidden',
  },
  selectItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm + 3,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  selectItemText: { ...typography.body, color: colors.text },
  submit: {
    marginTop: spacing.lg, backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  submitText: { ...typography.bodyStrong, color: colors.textOnPrimary },
  infoRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  infoTitle: { ...typography.captionStrong, color: colors.text },
  infoText: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  infoLink: { ...typography.captionStrong, color: '#128C7E', marginTop: 2 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, paddingVertical: spacing.xs },
  socialBtn: { padding: 6 },
});
