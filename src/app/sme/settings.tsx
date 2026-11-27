import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useSMEProfile, useUpdateSMEProfile } from '@/features/sme/queries';
import type { ProfileWithUser } from '@/features/sme/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { EmptyState, LoadingState } from '@/components/States';
import { useToast } from '@/components/Toast';
import { colors, radius, spacing, typography } from '@/theme';

type FormState = {
  full_name: string;
  business_name: string;
  industry: string;
  business_type: string;
  company_size: string;
  registration_number: string;
  tax_number: string;
  website_url: string;
  description: string;
  country: string;
  state: string;
  city: string;
  postal_code: string;
  company_email: string;
  company_phone: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
};

function formFromProfile(profile: ProfileWithUser): FormState {
  return {
    full_name: profile.full_name ?? '',
    business_name: profile.business_name ?? '',
    industry: profile.industry ?? '',
    business_type: profile.business_type ?? '',
    company_size: profile.company_size ?? '',
    registration_number: profile.registration_number ?? '',
    tax_number: profile.tax_number ?? '',
    website_url: profile.website_url ?? '',
    description: profile.description ?? '',
    country: profile.country ?? '',
    state: profile.state ?? '',
    city: profile.city ?? '',
    postal_code: profile.postal_code ?? '',
    company_email: profile.company_email ?? '',
    company_phone: profile.company_phone ?? '',
    contact_person: profile.contact_person ?? '',
    contact_email: profile.contact_email ?? '',
    contact_phone: profile.contact_phone ?? '',
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ProfileForm({ profile, userId }: { profile: ProfileWithUser; userId: string }) {
  const [form, setForm] = useState<FormState>(() => formFromProfile(profile));
  const updateProfile = useUpdateSMEProfile(userId);
  const toast = useToast();

  const set = (key: keyof FormState) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const save = () => {
    const updates: Partial<ProfileWithUser> = {};
    for (const key of Object.keys(form) as (keyof FormState)[]) {
      const value = form[key].trim();
      if (value !== (formFromProfile(profile)[key] ?? '')) {
        (updates as Record<string, string>)[key] = value;
      }
    }
    if (Object.keys(updates).length === 0) {
      toast.show('info', 'No changes to save');
      return;
    }
    updateProfile.mutate(updates, {
      onError: (err) => toast.show('error', err instanceof Error ? err.message : 'Failed to save profile'),
    });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {profile.sme_id ? (
        <View style={styles.smeIdCard}>
          <Text style={styles.smeIdLabel}>SME ID</Text>
          <Text style={styles.smeIdValue}>{profile.sme_id}</Text>
        </View>
      ) : null}

      <Section title="Account">
        <Input label="Full name" value={form.full_name} onChangeText={set('full_name')} autoCapitalize="words" />
        {profile.email ? <Input label="Email" value={profile.email} editable={false} /> : null}
        {profile.phone ? <Input label="Phone" value={profile.phone} editable={false} /> : null}
      </Section>

      <Section title="Business">
        <Input label="Business name" value={form.business_name} onChangeText={set('business_name')} />
        <Input label="Industry" value={form.industry} onChangeText={set('industry')} />
        <Input label="Business type" value={form.business_type} onChangeText={set('business_type')} />
        <Input label="Company size" value={form.company_size} onChangeText={set('company_size')} />
        <Input label="Registration number" value={form.registration_number} onChangeText={set('registration_number')} />
        <Input label="Tax number" value={form.tax_number} onChangeText={set('tax_number')} />
        <Input
          label="Website"
          value={form.website_url}
          onChangeText={set('website_url')}
          autoCapitalize="none"
          keyboardType="url"
        />
        <Input
          label="Description"
          value={form.description}
          onChangeText={set('description')}
          multiline
          numberOfLines={3}
        />
      </Section>

      <Section title="Location">
        <Input label="Country" value={form.country} onChangeText={set('country')} />
        <Input label="State" value={form.state} onChangeText={set('state')} />
        <Input label="City" value={form.city} onChangeText={set('city')} />
        <Input label="Postal code" value={form.postal_code} onChangeText={set('postal_code')} autoCapitalize="characters" />
      </Section>

      <Section title="Contact">
        <Input label="Company email" value={form.company_email} onChangeText={set('company_email')} autoCapitalize="none" keyboardType="email-address" />
        <Input label="Company phone" value={form.company_phone} onChangeText={set('company_phone')} keyboardType="phone-pad" />
        <Input label="Contact person" value={form.contact_person} onChangeText={set('contact_person')} autoCapitalize="words" />
        <Input label="Contact email" value={form.contact_email} onChangeText={set('contact_email')} autoCapitalize="none" keyboardType="email-address" />
        <Input label="Contact phone" value={form.contact_phone} onChangeText={set('contact_phone')} keyboardType="phone-pad" />
      </Section>

      <Button title="Save changes" onPress={save} loading={updateProfile.isPending} />
    </ScrollView>
  );
}

export default function SMESettingsScreen() {
  const { user, userType, loading: authLoading } = useAuth();
  const { data: profile, isLoading } = useSMEProfile(user?.id);

  if (authLoading || isLoading) return <LoadingState label="Loading settings..." />;
  if (!user) return <EmptyState title="Sign in required" hint="Sign in to manage your settings." />;
  if (userType !== 'sme') {
    return <EmptyState title="SME accounts only" hint="Switch to an SME account to manage settings." />;
  }
  if (!profile) {
    return <EmptyState title="No SME profile" hint="Your SME profile could not be found." />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <ProfileForm profile={profile} userId={user.id} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['2xl'], gap: spacing.md },
  smeIdCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  smeIdLabel: { ...typography.captionStrong, color: colors.primary },
  smeIdValue: { ...typography.bodyStrong, color: colors.text },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
});
