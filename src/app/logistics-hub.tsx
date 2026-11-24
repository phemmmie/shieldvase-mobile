import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { ScreenColumn } from '@/components/Responsive';
import { LoadingState } from '@/components/States';
import { colors, radius, spacing, typography } from '@/theme';

// Mirrors web /logistics-hub (views/LogisticsHub.tsx): admin-gated logistics
// provider registration → logistics_companies insert. Non-admins get the
// "Access Restricted" card verbatim from web.

const FLEET_OPTIONS = [
  { value: 'motorbike', label: 'Motorbikes / Dispatch Bikes' },
  { value: 'tricycle', label: 'Tricycles / Keke' },
  { value: 'car', label: 'Cars' },
  { value: 'suv', label: 'SUVs / Crossovers' },
  { value: 'minivan', label: 'Minivans / MPVs' },
  { value: 'cargo_van', label: 'Cargo Vans' },
  { value: 'pickup_truck', label: 'Pickup Trucks' },
  { value: 'box_truck', label: 'Box Trucks' },
  { value: 'flatbed_truck', label: 'Flatbed Trucks' },
  { value: 'tipper_truck', label: 'Tipper Trucks' },
  { value: 'tanker_truck', label: 'Tanker Trucks' },
  { value: 'refrigerated_truck', label: 'Refrigerated Trucks' },
  { value: 'crane_truck', label: 'Crane Trucks / Hiab' },
  { value: 'lowbed_trailer', label: 'Lowbed / Heavy Haulage Trailers' },
  { value: 'container_truck', label: 'Container / Articulated Trucks' },
];
const OWNERSHIP_MODELS = [
  { value: 'owned', label: 'Owned fleet' },
  { value: 'leased', label: 'Leased fleet' },
  { value: 'partner_fleet', label: 'Partner / subcontracted fleet' },
  { value: 'mixed', label: 'Mixed fleet model' },
];
const PRODUCT_HANDLING = [
  { value: 'cement_bulk_construction', label: 'Cement, aggregates & bulk construction' },
  { value: 'steel_long_materials', label: 'Steel, timber, pipes & long materials' },
  { value: 'fragile_finishing', label: 'Glass, tiles, sanitary ware & fragile finishing' },
  { value: 'paints_chemicals', label: 'Paints, solvents & industrial chemicals' },
  { value: 'hazardous_goods', label: 'Hazardous goods (permit required)' },
  { value: 'agricultural_produce_feed', label: 'Produce, grains & animal feed' },
  { value: 'farm_inputs', label: 'Fertilizers, pesticides & farm inputs' },
  { value: 'agricultural_machinery', label: 'Agricultural machinery & spare parts' },
  { value: 'cold_chain_perishables', label: 'Cold chain, perishables & veterinary supplies' },
  { value: 'energy_equipment', label: 'Generators, solar, batteries & energy equipment' },
  { value: 'polymers_packaging', label: 'Polymer resins, plastics & packaging materials' },
];
const SERVICE_OPTIONS = [
  { value: 'same_day', label: 'Same Day' },
  { value: 'next_day', label: 'Next Day' },
  { value: 'standard', label: 'Standard Delivery' },
  { value: 'express', label: 'Express Delivery' },
  { value: 'scheduled', label: 'Scheduled Delivery' },
  { value: 'last_mile', label: 'Last-Mile Delivery' },
  { value: 'interstate_haulage', label: 'Inter-State Haulage' },
  { value: 'international', label: 'International / Cross-Border' },
  { value: 'pickup_dropoff', label: 'Vendor Pickup & Buyer Drop-Off' },
  { value: 'warehousing', label: 'Warehousing / Storage' },
  { value: 'distribution', label: 'Distribution & Multi-Drop' },
  { value: 'reverse_logistics', label: 'Reverse Logistics / Returns' },
  { value: 'port_clearance', label: 'Port Clearance Support' },
  { value: 'white_glove', label: 'White-Glove / Assisted Delivery' },
  { value: 'installation_support', label: 'Delivery + Installation Support' },
];
const LOADING_EQUIPMENT = [
  { value: 'tail_lift', label: 'Tail lift' },
  { value: 'pallet_jack', label: 'Pallet jack' },
  { value: 'forklift_access', label: 'Forklift access' },
  { value: 'mobile_crane', label: 'Mobile crane / crane support' },
  { value: 'winch', label: 'Winch / loading ramps' },
  { value: 'straps_blankets', label: 'Straps, blankets & cargo nets' },
  { value: 'hand_trucks', label: 'Hand trucks / dollies' },
];
const PACKAGING_SUPPORT = [
  { value: 'palletizing', label: 'Palletizing' },
  { value: 'crating', label: 'Crating' },
  { value: 'shrink_wrapping', label: 'Shrink wrapping' },
  { value: 'strapping', label: 'Strapping' },
  { value: 'labeling', label: 'Labeling' },
  { value: 'delivery_documentation', label: 'Delivery documentation' },
];
const TRACKING_METHODS = [
  { value: 'gps', label: 'GPS tracking' },
  { value: 'telematics', label: 'Fleet telematics' },
  { value: 'driver_app', label: 'Driver mobile app' },
  { value: 'manual_updates', label: 'Manual dispatch updates' },
  { value: 'api_tracking', label: 'API / system tracking' },
];
const PROOF_OF_DELIVERY = [
  { value: 'signature', label: 'Signature' },
  { value: 'photo', label: 'Photo evidence' },
  { value: 'otp', label: 'OTP / code confirmation' },
  { value: 'geotag', label: 'Geotagged delivery' },
];
const OPERATING_DAYS = [
  { value: 'monday', label: 'Mon' }, { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' }, { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' }, { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
];

const REQUIRED: [string, string][] = [
  ['companyName', 'Company name'], ['registrationNumber', 'Registration number'],
  ['contactPerson', 'Contact person'], ['contactPersonEmail', 'Contact email'],
  ['contactPersonPhone', 'Contact phone'], ['email', 'Company email'],
  ['phone', 'Company phone'], ['address', 'Street address'],
  ['country', 'Country'], ['state', 'State / region'], ['city', 'City'],
  ['postalCode', 'Postal code'], ['insuranceProvider', 'Insurance provider'],
  ['insurancePolicyNumber', 'Insurance policy number'], ['insuranceExpiry', 'Insurance expiry date'],
  ['bankName', 'Bank name'], ['accountNumber', 'Account number'], ['accountName', 'Account name'],
];

const num = (v: string) => { const n = Number(v); return v.trim() && !Number.isNaN(n) ? n : null; };
const splitList = (v: string) => v.split(',').map(s => s.trim()).filter(Boolean);

export default function LogisticsHubScreen() {
  const router = useRouter();
  const { user, userType, loading } = useAuth();
  const [f, setF] = useState<Record<string, string>>({ country: 'Nigeria' });
  const [fleet, setFleet] = useState<Record<string, string>>({});
  const [lists, setLists] = useState<Record<string, string[]>>({
    deliveryTypes: [], productHandling: [], loadingEquipment: [],
    packagingSupport: [], trackingMethods: [], proofOfDelivery: [], operatingDays: [],
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (k: string) => (v: string) => setF(p => ({ ...p, [k]: v }));
  const toggle = (key: string, v: string) =>
    setLists(p => ({ ...p, [key]: p[key].includes(v) ? p[key].filter(x => x !== v) : [...p[key], v] }));

  if (loading) return <View style={styles.screen}><Stack.Screen options={{ title: 'Logistics Hub' }} /><LoadingState /></View>;

  if (!user || userType !== 'admin') {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ title: 'Logistics Hub' }} />
        <View style={styles.restrictedWrap}>
          <View style={styles.restrictedCard}>
            <View style={styles.restrictedIcon}>
              <Ionicons name="shield-outline" size={24} color={colors.destructive} />
            </View>
            <Text style={styles.restrictedTitle}>Access Restricted</Text>
            <Text style={styles.restrictedText}>
              The Logistics Hub is currently available to administrators only. Please check back later.
            </Text>
            <Pressable style={styles.restrictedBtn} onPress={() => router.back()}>
              <Text style={styles.restrictedBtnText}>Go Back</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const submit = async () => {
    const missing = REQUIRED.filter(([k]) => !(f[k] ?? '').trim()).map(([, l]) => l);
    if (missing.length) {
      return Alert.alert('Application is incomplete', `Please complete: ${missing.join(', ')}.`);
    }
    setSubmitting(true);
    const vehicleTypes = FLEET_OPTIONS
      .map(o => ({ type: o.value, count: Number(fleet[o.value] || 0) }))
      .filter(v => v.count > 0);
    const { error } = await supabase.from('logistics_companies').insert([{
      company_name: f.companyName,
      registration_number: f.registrationNumber,
      contact_person_name: f.contactPerson,
      company_email: f.email,
      company_phone: f.phone,
      street_address: f.address,
      city: f.city,
      state: f.state,
      country: f.country,
      postal_code: f.postalCode,
      website_url: f.websiteUrl || null,
      tax_id: f.taxId || null,
      total_vehicles: vehicleTypes.reduce((s, v) => s + v.count, 0),
      vehicle_types: vehicleTypes,
      fleet_details: {
        vehicle_ownership_model: f.vehicleOwnershipModel || null,
        max_payload_weight_kg: num(f.maxPayloadWeightKg ?? ''),
        max_cargo_volume_m3: num(f.maxCargoVolumeM3 ?? ''),
        max_cargo_length_m: num(f.maxCargoLengthM ?? ''),
        driver_count: num(f.driverCount ?? ''),
        helper_count: num(f.helperCount ?? ''),
        loading_equipment: lists.loadingEquipment,
        packaging_support: lists.packagingSupport,
        tracking_methods: lists.trackingMethods,
        proof_of_delivery: lists.proofOfDelivery,
        dispatch_contact: { name: f.dispatchContactName || null, email: f.dispatchContactEmail || null, phone: f.dispatchContactPhone || null },
        emergency_contact_phone: f.emergencyContactPhone || null,
      },
      service_cities: splitList(f.serviceCities ?? ''),
      service_states: splitList(f.serviceStates ?? ''),
      coverage_radius_km: num(f.coverageRadiusKm ?? ''),
      delivery_types: lists.deliveryTypes,
      specializations: lists.productHandling,
      insurance_provider: f.insuranceProvider,
      insurance_policy_number: f.insurancePolicyNumber,
      insurance_expiry_date: f.insuranceExpiry,
      insurance_coverage_amount: num(f.insuranceCoverageAmount ?? ''),
      bank_name: f.bankName,
      bank_code: f.bankCode || null,
      account_number: f.accountNumber,
      account_name: f.accountName,
      contact_person_position: f.contactPersonPosition || null,
      contact_person_email: f.contactPersonEmail,
      contact_person_phone: f.contactPersonPhone,
      years_in_operation: num(f.yearsInOperation ?? ''),
      average_daily_deliveries: num(f.averageDailyDeliveries ?? ''),
      certifications: splitList(f.certifications ?? ''),
      licenses: splitList(f.licenses ?? ''),
      operating_hours: { days: lists.operatingDays, opens_at: f.operatingHoursStart || null, closes_at: f.operatingHoursEnd || null },
      notes: f.notes || null,
      submitted_by_user_id: user.id,
      onboarding_source: 'self_service',
      metadata: { street_latitude: f.latitude || null, street_longitude: f.longitude || null, application_channel: 'logistics_hub' },
    }]);
    setSubmitting(false);
    if (error) return Alert.alert('Submission failed', error.message);
    Alert.alert('Registration Submitted', 'Your logistics provider application has been received.', [{ text: 'OK', onPress: () => router.back() }]);
    return undefined;
  };

  const fld = (label: string, key: string, props: object = {}) => (
    <View style={styles.fieldWrap} key={key}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={f[key] ?? ''} onChangeText={set(key)} placeholderTextColor={colors.textFaint} {...props} />
    </View>
  );
  const chips = (label: string, key: string, opts: { value: string; label: string }[]) => (
    <View style={styles.fieldWrap} key={key}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipsRow}>
        {opts.map(o => {
          const on = lists[key].includes(o.value);
          return (
            <Pressable key={o.value} style={[styles.chip, on && styles.chipOn]} onPress={() => toggle(key, o.value)}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Logistics Hub' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingVertical: spacing.lg, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
          <ScreenColumn>
            <Text style={styles.h1}>Logistics Hub</Text>
            <Text style={styles.sub}>Join our network of trusted logistics providers</Text>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Provider Registration</Text>
              <Text style={styles.cardSub}>Fill out the form below to register as a logistics provider on our platform</Text>

              <Text style={styles.secTitle}><Ionicons name="cube-outline" size={16} />  Company Information</Text>
              {fld('Company name *', 'companyName')}
              {fld('Registration number *', 'registrationNumber')}
              {fld('Tax ID', 'taxId')}
              {fld('Website URL', 'websiteUrl', { autoCapitalize: 'none' })}
              {fld('Years in operation', 'yearsInOperation', { keyboardType: 'numeric' })}
              {fld('Average daily deliveries', 'averageDailyDeliveries', { keyboardType: 'numeric' })}
              {fld('Certifications (comma-separated)', 'certifications')}
              {fld('Licenses (comma-separated)', 'licenses')}

              <Text style={styles.secTitle}><Ionicons name="person-outline" size={16} />  Contact Details</Text>
              {fld('Contact person *', 'contactPerson')}
              {fld('Contact person position', 'contactPersonPosition')}
              {fld('Contact email *', 'contactPersonEmail', { keyboardType: 'email-address', autoCapitalize: 'none' })}
              {fld('Contact phone *', 'contactPersonPhone', { keyboardType: 'phone-pad' })}
              {fld('Company email *', 'email', { keyboardType: 'email-address', autoCapitalize: 'none' })}
              {fld('Company phone *', 'phone', { keyboardType: 'phone-pad' })}
              {fld('Street address *', 'address')}
              {fld('City *', 'city')}
              {fld('State / region *', 'state')}
              {fld('Country *', 'country')}
              {fld('Postal code *', 'postalCode')}
              {fld('Street latitude', 'latitude', { keyboardType: 'numeric' })}
              {fld('Street longitude', 'longitude', { keyboardType: 'numeric' })}

              <Text style={styles.secTitle}><Ionicons name="bus-outline" size={16} />  Fleet Composition</Text>
              <Text style={styles.hint}>Record every vehicle type that can support marketplace deliveries, including heavy, cold-chain, hazardous, and last-mile cargo.</Text>
              {FLEET_OPTIONS.map(o => (
                <View key={o.value} style={styles.fleetRow}>
                  <Text style={styles.fleetLabel}>{o.label}</Text>
                  <TextInput style={styles.fleetInput} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textFaint} value={fleet[o.value] ?? ''} onChangeText={v => setFleet(p => ({ ...p, [o.value]: v }))} />
                </View>
              ))}
              {chips('Vehicle ownership model', 'vehicleOwnershipModel', OWNERSHIP_MODELS)}
              {fld('Max payload weight (kg)', 'maxPayloadWeightKg', { keyboardType: 'numeric' })}
              {fld('Max cargo volume (m³)', 'maxCargoVolumeM3', { keyboardType: 'numeric' })}
              {fld('Max cargo length (m)', 'maxCargoLengthM', { keyboardType: 'numeric' })}
              {fld('Driver count', 'driverCount', { keyboardType: 'numeric' })}
              {fld('Helper count', 'helperCount', { keyboardType: 'numeric' })}

              <Text style={styles.secTitle}>Service Coverage & Marketplace Fit</Text>
              {fld('Service cities (comma-separated)', 'serviceCities')}
              {fld('Service states (comma-separated)', 'serviceStates')}
              {fld('Coverage radius (km)', 'coverageRadiusKm', { keyboardType: 'numeric' })}
              {chips('Delivery types', 'deliveryTypes', SERVICE_OPTIONS)}
              {chips('Product handling / specializations', 'productHandling', PRODUCT_HANDLING)}

              <Text style={styles.secTitle}>Dispatch, Handling & Tracking</Text>
              {chips('Loading equipment', 'loadingEquipment', LOADING_EQUIPMENT)}
              {chips('Packaging support', 'packagingSupport', PACKAGING_SUPPORT)}
              {chips('Tracking methods', 'trackingMethods', TRACKING_METHODS)}
              {chips('Proof of delivery', 'proofOfDelivery', PROOF_OF_DELIVERY)}
              {fld('Dispatch contact name', 'dispatchContactName')}
              {fld('Dispatch contact email', 'dispatchContactEmail', { keyboardType: 'email-address', autoCapitalize: 'none' })}
              {fld('Dispatch contact phone', 'dispatchContactPhone', { keyboardType: 'phone-pad' })}
              {fld('Emergency contact phone', 'emergencyContactPhone', { keyboardType: 'phone-pad' })}
              {chips('Operating days', 'operatingDays', OPERATING_DAYS)}
              {fld('Operating hours — opens at (e.g. 08:00)', 'operatingHoursStart')}
              {fld('Operating hours — closes at (e.g. 18:00)', 'operatingHoursEnd')}

              <Text style={styles.secTitle}>Insurance & Risk Coverage</Text>
              {fld('Insurance provider *', 'insuranceProvider')}
              {fld('Insurance policy number *', 'insurancePolicyNumber')}
              {fld('Insurance expiry date (YYYY-MM-DD) *', 'insuranceExpiry', { placeholder: 'YYYY-MM-DD' })}
              {fld('Insurance coverage amount (₦)', 'insuranceCoverageAmount', { keyboardType: 'numeric' })}

              <Text style={styles.secTitle}>Settlement / Banking Information</Text>
              {fld('Bank name *', 'bankName')}
              {fld('Bank code', 'bankCode')}
              {fld('Account number *', 'accountNumber', { keyboardType: 'numeric' })}
              {fld('Account name *', 'accountName')}

              {fld('Additional notes', 'notes', { multiline: true, style: [styles.input, styles.textarea] })}

              <Pressable style={[styles.submit, submitting && { opacity: 0.6 }]} onPress={submit} disabled={submitting}>
                <Text style={styles.submitText}>{submitting ? 'Submitting…' : 'Submit Registration'}</Text>
              </Pressable>
            </View>
          </ScreenColumn>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  h1: { ...typography.h1, color: colors.text },
  sub: { ...typography.body, color: colors.textMuted, marginTop: 4, marginBottom: spacing.lg },
  card: { backgroundColor: colors.surfaceRaised, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardTitle: { ...typography.h3, color: colors.text },
  cardSub: { ...typography.caption, color: colors.textMuted, marginTop: 4, marginBottom: spacing.sm },
  secTitle: { ...typography.bodyStrong, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm },
  hint: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
  fieldWrap: { marginTop: spacing.sm },
  label: { ...typography.captionStrong, color: colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm + 3,
    ...typography.body, color: colors.text, backgroundColor: '#fff',
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  fleetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  fleetLabel: { ...typography.caption, color: colors.text, flex: 1 },
  fleetInput: {
    width: 64, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.sm, paddingVertical: 6, ...typography.body, color: colors.text, textAlign: 'center',
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 6, backgroundColor: '#fff' },
  chipOn: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textMuted },
  chipTextOn: { color: colors.primary },
  submit: { marginTop: spacing.xl, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  submitText: { ...typography.bodyStrong, color: colors.textOnPrimary },
  restrictedWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  restrictedCard: { backgroundColor: colors.surfaceRaised, borderRadius: radius.lg, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, alignItems: 'center', maxWidth: 380 },
  restrictedIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.destructiveSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  restrictedTitle: { ...typography.h3, color: colors.text },
  restrictedText: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  restrictedBtn: { marginTop: spacing.lg, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 4 },
  restrictedBtnText: { ...typography.bodyStrong, color: colors.text },
});
