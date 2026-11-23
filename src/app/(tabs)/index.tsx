import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthContext';
import { useCategories, useFeaturedProducts } from '@/features/catalog/queries';
import { supabase } from '@/api/supabase';
import { ErrorState } from '@/components/States';
import { RowSkeleton } from '@/components/Skeleton';
import { ScreenColumn, CONTENT_MAX_WIDTH } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import { buildProductParam } from '@/utils/productUrl';

// ── Web homepage parity — content mirrors shieldvase.io section for section ──

const HERO_IMAGES = [
  'https://shieldvase-bronze-images.s3.eu-north-1.amazonaws.com/static/assets/hero-banner-1_optimized.jpg',
  'https://shieldvase-bronze-images.s3.eu-north-1.amazonaws.com/static/assets/hero-banner-2_optimized.jpg',
  'https://shieldvase-bronze-images.s3.eu-north-1.amazonaws.com/static/assets/hero-banner-3_optimized.jpg',
];

const HERO_TAGLINES = [
  'Live construction material prices across Nigeria, updated daily.',
  'Verified suppliers for cement, steel, and building materials — no middlemen.',
  'Building in Nigeria from abroad? Source, pay, and track delivery from one place.',
  "Lock today's price or buy in bulk with other buyers — save on every order.",
];

const DIFFERENTIATORS = [
  { icon: 'cash-outline', tint: '#FDB347', title: 'Competitive Pricing', body: 'Get the best market rates for your industrial raw materials' },
  { icon: 'card-outline', tint: '#007749', title: 'Flexible Payment', body: 'Multiple payment options and credit facilities available' },
  { icon: 'globe-outline', tint: '#E42D40', title: 'Global Network', body: 'Access to international suppliers and quality products' },
  { icon: 'cube-outline', tint: '#0067A5', title: 'Quality Assured', body: 'All products meet international quality standards' },
  { icon: 'people-outline', tint: '#7C3AED', title: 'Expert Support', body: 'Dedicated team to assist with your requirements' },
] as const;

const SERVICES = [
  { icon: 'cart-outline', title: 'Buy & Sell With Us', body: 'One-stop solution for raw material sourcing and selling' },
  { icon: 'trending-up-outline', title: 'Raw Materials Prices', body: 'Get live prices for the materials you need' },
  { icon: 'newspaper-outline', title: 'Raw Materials News', body: 'Stay updated with daily news and market insights' },
  { icon: 'card-outline', title: 'Grow With Credit', body: 'Access credit solutions for manufacturers and contractors' },
  { icon: 'phone-portrait-outline', title: 'Industry Digital First', body: 'Track orders in real-time with our app and web platform' },
] as const;

const FAQS: { icon: keyof typeof Ionicons.glyphMap; tint: string; q: string; a: string }[] = [
  {
    icon: 'settings-outline',
    tint: '#E42D40',
    q: 'What is the difference between mild steel and stainless steel?',
    a: 'Mild steel is an iron alloy with low carbon content, making it softer and more malleable. Stainless steel contains chromium, making it more resistant to corrosion and rust. Stainless steel is typically more expensive but offers better durability in harsh environments.',
  },
  {
    icon: 'settings-outline',
    tint: '#007749',
    q: 'How do I choose the right type of metal for my project?',
    a: 'Consider factors like the environment (indoor/outdoor), required strength, budget, and specific application. For example, aluminum is lightweight and corrosion-resistant, while steel offers superior strength. Contact our experts for personalized recommendations.',
  },
  {
    icon: 'construct-outline',
    tint: '#FDB347',
    q: 'What are the standard sizes available for metal sheets?',
    a: 'Metal sheets typically come in standard sizes of 4x8 feet, with thicknesses ranging from 0.5mm to 12mm. Custom sizes are available upon request. The choice depends on your specific application and requirements.',
  },
  {
    icon: 'business-outline',
    tint: '#0067A5',
    q: 'How are metals priced in the market?',
    a: 'Metal prices are determined by factors including global market rates, quantity ordered, grade/quality, processing requirements, and transportation costs. Prices are usually quoted per ton or per square meter for sheets.',
  },
];

const SITE = 'https://shieldvase.io';

const WHATSAPP_LINK = `https://wa.me/2347051277149?text=${encodeURIComponent(
  "Hi, I'd like to place an order",
)}`;

interface PodcastEpisode {
  id: string;
  episode_number: string;
  title: string;
  host: string;
  duration: string;
  color: string;
}

const usePodcastEpisodes = () =>
  useQuery({
    queryKey: ['home-podcast-episodes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('podcast_episodes')
        .select('id, title, episode_number, host, duration, color')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as PodcastEpisode[];
    },
    staleTime: 10 * 60 * 1000,
  });

const useSearchPlaceholders = () =>
  useQuery({
    queryKey: ['home-search-placeholders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_products')
        .select('name')
        .eq('status', 'active')
        .eq('marketplace_visible', true)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      const names = [...new Set((data ?? []).map((p: any) => p.name).filter(Boolean))];
      return names.length ? (names as string[]) : ['Cement', 'Rods', 'Blocks', 'Roofing Sheets'];
    },
    staleTime: 10 * 60 * 1000,
  });

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  // Align rail content to the centered column on wide screens, page edge on phones.
  const railPad = Math.max((windowWidth - CONTENT_MAX_WIDTH) / 2 + spacing.md, spacing.md);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const categories = useCategories();
  const featured = useFeaturedProducts();
  const episodes = usePodcastEpisodes();
  const placeholders = useSearchPlaceholders();

  // Product marquee parity: web maps each category's representative
  // products into cards showing {category name, product, price}.
  const categoryNameById = new Map((categories.data ?? []).map((c) => [c.id, c.name]));

  const [heroIndex, setHeroIndex] = useState(0);
  const [tagIndex, setTagIndex] = useState(0);
  const [phIndex, setPhIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [productsY, setProductsY] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHeroIndex((i) => (i + 1) % HERO_IMAGES.length), 6000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setTagIndex((i) => (i + 1) % HERO_TAGLINES.length), 4500);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(
      () => setPhIndex((i) => (i + 1) % (placeholders.data?.length || 1)),
      3000,
    );
    return () => clearInterval(t);
  }, [placeholders.data?.length]);

  const submitSearch = () => {
    const term = searchTerm.trim();
    router.push(term ? (`/search?q=${encodeURIComponent(term)}` as any) : ('/search' as any));
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Category nav bar — mirrors MainNavbar (dark navy rail) ── */}
      <View style={styles.catNav}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.catNavRail, { paddingHorizontal: railPad }]}
        >
          {(categories.data ?? []).map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} asChild>
              <Pressable
                style={({ pressed }) => [styles.catNavItem, pressed && { opacity: 0.75 }]}
              >
                <Ionicons name="cube-outline" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.catNavText}>{c.name}</Text>
              </Pressable>
            </Link>
          ))}
        </ScrollView>
        {/* Right-edge fade — signals the rail scrolls, like the web's snap rail */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(26,31,44,0)', 'rgba(26,31,44,1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.catNavFade}
        />
      </View>

      {/* ── WhatsApp banner — mirrors WhatsAppBotBanner ── */}
      <Pressable
        onPress={() => Linking.openURL(WHATSAPP_LINK)}
        style={styles.whatsappStrip}
        accessibilityLabel="Order via WhatsApp"
      >
        <Ionicons name="logo-whatsapp" size={15} color="#FFFFFF" />
        <Text style={styles.whatsappText}>
          Now ordering via WhatsApp — no app, no password needed
        </Text>
        <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
      </Pressable>

      <ScreenColumn>
        {/* ── Deals promo cards — mirrors DealsNotificationBanner ── */}
        <View style={styles.dealPromoRow}>
          <Pressable
            onPress={() => router.push('/deals' as any)}
            style={[styles.dealPromo, styles.dealPromoRed]}
          >
            <View style={styles.dealPromoHead}>
              <View style={[styles.dealPromoIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="people" size={14} color={colors.primary} />
              </View>
              <View style={[styles.dealPromoTag, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.dealPromoTagText, { color: colors.primary }]}>Save More</Text>
              </View>
            </View>
            <Text style={styles.dealPromoTitle}>Group Buys</Text>
            <Text style={styles.dealPromoBody} numberOfLines={2}>
              Share costs & save on shipping
            </Text>
            <View style={styles.dealPromoCta}>
              <Text style={[styles.dealPromoCtaText, { color: colors.primary }]}>View Deals</Text>
              <Ionicons name="chevron-forward" size={12} color={colors.primary} />
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push('/deals' as any)}
            style={[styles.dealPromo, styles.dealPromoGreen]}
          >
            <View style={styles.dealPromoHead}>
              <View style={[styles.dealPromoIcon, { backgroundColor: colors.secondarySoft }]}>
                <Ionicons name="lock-closed" size={14} color={colors.secondary} />
              </View>
              <View style={[styles.dealPromoTag, { backgroundColor: colors.secondarySoft }]}>
                <Text style={[styles.dealPromoTagText, { color: colors.secondary }]}>Secure Now</Text>
              </View>
            </View>
            <Text style={styles.dealPromoTitle}>Price Locks</Text>
            <Text style={styles.dealPromoBody} numberOfLines={2}>
              Lock today&apos;s price now
            </Text>
            <View style={styles.dealPromoCta}>
              <Text style={[styles.dealPromoCtaText, { color: colors.secondary }]}>View Deals</Text>
              <Ionicons name="chevron-forward" size={12} color={colors.secondary} />
            </View>
          </Pressable>
        </View>
      </ScreenColumn>

      {/* ── Hero — mirrors HeroSection ── */}
      <View style={styles.hero}>
        {HERO_IMAGES.map((uri, i) => (
          <Image
            key={uri}
            source={{ uri }}
            style={[styles.heroImg, i === heroIndex ? styles.heroImgOn : styles.heroImgOff]}
            contentFit="cover"
            transition={600}
          />
        ))}
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)']}
          style={StyleSheet.absoluteFill}
        />
        <ScreenColumn>
          <View style={styles.heroInner}>
            <Text style={styles.heroTitle}>
              Nigeria&apos;s B2B Marketplace for Construction &amp; Industrial Materials
            </Text>
            <Text style={styles.heroSub}>
              Compare live prices, source from verified suppliers, and procure materials from
              anywhere in Nigeria — with seamless RFQs and reliable delivery.
            </Text>
            <View style={styles.taglineWrap}>
              <Text style={styles.tagline}>{HERO_TAGLINES[tagIndex]}</Text>
            </View>

            {/* Search — same pill + embedded submit as web */}
            <View style={styles.heroSearch}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.heroInput}
                placeholder={`Search for ${placeholders.data?.[phIndex] ?? 'Cement'}...`}
                placeholderTextColor={colors.textMuted}
                value={searchTerm}
                onChangeText={setSearchTerm}
                onSubmitEditing={submitSearch}
                returnKeyType="search"
              />
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  submitSearch();
                }}
                style={styles.heroSearchBtn}
              >
                <Text style={styles.heroSearchBtnText}>Search</Text>
              </Pressable>
            </View>

            <View style={styles.heroCtas}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  scrollRef.current?.scrollTo({ y: productsY, animated: true });
                }}
                style={styles.ctaPrimary}
              >
                <Text style={styles.ctaPrimaryText}>Explore Products</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </Pressable>
              {!user && (
                <Pressable
                  onPress={() => router.push('/(auth)/sign-up' as any)}
                  style={styles.ctaOutline}
                >
                  <Text style={styles.ctaOutlineText}>Get Started</Text>
                </Pressable>
              )}
            </View>
          </View>
        </ScreenColumn>
      </View>

      <ScreenColumn>
        {/* ── Categories — mirrors ProductCategories + ProductMarqueeSlider ── */}
        <View style={styles.sectionHeadCenter}>
          <Text style={styles.sectionTitle}>Explore Our Product Categories</Text>
          <Text style={styles.sectionSub}>
            Access a wide range of raw materials and industrial products tailored to your business
            needs
          </Text>
        </View>
        {featured.isLoading ? (
          <RowSkeleton />
        ) : featured.isError ? (
          <ErrorState onRetry={() => featured.refetch()} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.marqueeRail}
          >
            {(featured.data ?? []).map((p) => (
              <View key={p.id} style={styles.marqueeCard}>
                <View style={styles.marqueeImgWrap}>
                  {p.images?.[0] ? (
                    <Image
                      source={{ uri: p.images[0] }}
                      style={styles.marqueeImg}
                      contentFit="contain"
                    />
                  ) : (
                    <View style={[styles.marqueeImg, styles.marqueeImgFallback]}>
                      <Ionicons name="cube-outline" size={30} color={colors.textFaint} />
                    </View>
                  )}
                  {/* Black/60 bottom overlay — same as web card */}
                  <View style={styles.marqueeOverlay}>
                    <Text style={styles.marqueeCat} numberOfLines={1}>
                      {categoryNameById.get(p.category_id ?? '') ?? 'Materials'}
                    </Text>
                    <Text style={styles.marqueeTitle} numberOfLines={1}>
                      {p.name}
                    </Text>
                  </View>
                </View>
                <View style={styles.marqueeBody}>
                  <Text style={styles.marqueeDesc} numberOfLines={2}>
                    {p.description || `High-quality ${p.name.toLowerCase()}`}
                  </Text>
                  {p.min_price != null && (
                    <Text style={styles.marqueePrice}>{formatNaira(p.min_price)}</Text>
                  )}
                  <Link href={`/product/${buildProductParam(p)}`} asChild>
                    <Pressable
                      style={({ pressed }) => [styles.marqueeBtn, pressed && { opacity: 0.8 }]}
                    >
                      <Ionicons name="information-circle-outline" size={15} color={colors.primary} />
                      <Text style={styles.marqueeBtnText}>View Details</Text>
                    </Pressable>
                  </Link>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* ── Why Choose — mirrors WhyChooseShieldVase ── */}
        <View onLayout={(e) => setProductsY(e.nativeEvent.layout.y)} style={styles.sectionWhite}>
          <View style={styles.sectionHeadCenter}>
            <Text style={styles.sectionTitle}>Why Choose ShieldVase?</Text>
            <Text style={styles.sectionSub}>
              We provide comprehensive solutions for all your industrial raw material needs
            </Text>
          </View>
          {DIFFERENTIATORS.map((d, i) => (
            <Animated.View
              key={d.title}
              entering={FadeInDown.delay(i * 60).duration(350)}
              style={styles.diffCard}
            >
              <Ionicons name={d.icon as any} size={34} color={d.tint} />
              <View style={styles.diffBody}>
                <Text style={styles.diffTitle}>{d.title}</Text>
                <Text style={styles.diffText}>{d.body}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* ── Services — mirrors ServicesSection ── */}
        <View style={styles.sectionHeadCenter}>
          <Text style={styles.sectionTitle}>Our Services</Text>
          <Text style={styles.sectionSub}>
            Delivering value to buyers, suppliers, and partners across Africa.
          </Text>
        </View>
        {SERVICES.map((s, i) => (
          <Animated.View
            key={s.title}
            entering={FadeInDown.delay(i * 50).duration(300)}
            style={styles.serviceRow}
          >
            <View style={styles.serviceIcon}>
              <Ionicons name={s.icon as any} size={20} color={colors.primary} />
            </View>
            <View style={styles.serviceBody}>
              <Text style={styles.serviceTitle}>{s.title}</Text>
              <Text style={styles.serviceText}>{s.body}</Text>
            </View>
          </Animated.View>
        ))}
        <Pressable
          onPress={() => Linking.openURL(`${SITE}/services`)}
          style={({ pressed }) => [styles.servicesBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.servicesBtnText}>Learn More About Our Services</Text>
        </Pressable>

        {/* ── Podcasts — mirrors RecentPodcastsSection ── */}
        {(episodes.data?.length ?? 0) > 0 && (
          <>
            <View style={styles.podHead}>
              <Ionicons name="headset-outline" size={24} color="#0FA0CE" />
              <Text style={styles.sectionTitle}>Podcasts on Metal Materials</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.podRail}
            >
              {episodes.data!.map((ep) => {
                const slug = ep.title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/-+/g, '-');
                return (
                  <View key={ep.id} style={styles.podCard}>
                    {/* Colored tile — number top-left, duration bottom-left */}
                    <View style={[styles.podTile, { backgroundColor: ep.color || colors.navy }]}>
                      <View style={styles.podTileTop}>
                        <Ionicons name="headset" size={14} color="#374151" />
                        <Text style={styles.podNumber}>{ep.episode_number}</Text>
                      </View>
                      <View style={styles.podDuration}>
                        <Ionicons name="time-outline" size={12} color="#374151" />
                        <Text style={styles.podDurationText}>{ep.duration}</Text>
                      </View>
                    </View>
                    <View style={styles.podBody}>
                      <Text numberOfLines={2} style={styles.podTitle}>
                        {ep.title}
                      </Text>
                      <View style={styles.podMeta}>
                        <Ionicons name="play" size={11} color={colors.textMuted} />
                        <Text numberOfLines={1} style={styles.podMetaText}>
                          {ep.host}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => Linking.openURL(`${SITE}/podcast/${slug}`)}
                        style={({ pressed }) => [styles.podBtn, pressed && { opacity: 0.85 }]}
                      >
                        <Ionicons name="headset" size={13} color="#FFFFFF" />
                        <Text style={styles.podBtnText}>Listen Now</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* ── FAQs — mirrors FAQsSection ── */}
        <View style={styles.faqHead}>
          <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        </View>
        {FAQS.map((f, i) => {
          const open = openFaq === i;
          return (
            <Pressable key={f.q} onPress={() => setOpenFaq(open ? null : i)} style={styles.faqCard}>
              <View style={styles.faqRow}>
                <Ionicons name={f.icon} size={20} color={f.tint} />
                <Text style={styles.faqQ}>{f.q}</Text>
                <Ionicons
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.textMuted}
                />
              </View>
              {open && <Text style={styles.faqA}>{f.a}</Text>}
            </Pressable>
          );
        })}
      </ScreenColumn>

      {/* ── CTA — mirrors CTASection (same tricolor gradient) ── */}
      <LinearGradient
        colors={['#E42D40', '#000000', '#007749']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.ctaStrip}
      >
        <ScreenColumn>
          <Text style={styles.ctaTitle}>Ready to Transform Your Supply Chain?</Text>
          <Text style={styles.ctaSub}>
            Join ShieldVase today and experience seamless procurement, competitive pricing, and
            reliable supply chains.
          </Text>
          <Pressable
            onPress={() => Linking.openURL(`${SITE}/contact`)}
            style={styles.ctaBtn}
          >
            <Text style={styles.ctaBtnText}>Contact Us</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.text} />
          </Pressable>
        </ScreenColumn>
      </LinearGradient>

      {/* ── Footer — mirrors FooterSection ── */}
      <View style={styles.footer}>
        <ScreenColumn>
          <Text style={styles.footerBrand}>ShieldVase</Text>
          <Text style={styles.footerTag}>
            Nigeria&apos;s B2B marketplace for construction and industrial materials — verified vendors,
            transparent pricing, and seamless RFQs.
          </Text>
          <View style={styles.socialRow}>
            {[
              { icon: 'logo-facebook', url: 'https://facebook.com/shieldvase' },
              { icon: 'logo-instagram', url: 'https://instagram.com/shieldvase' },
              { icon: 'logo-linkedin', url: 'https://linkedin.com/company/shieldvase' },
            ].map((s) => (
              <Pressable
                key={s.icon}
                onPress={() => Linking.openURL(s.url)}
                style={styles.socialBtn}
                accessibilityLabel={s.icon}
              >
                <Ionicons name={s.icon as any} size={18} color="#FFFFFF" />
              </Pressable>
            ))}
          </View>

          <Text style={styles.footerHead}>Help & Support</Text>
          {[
            { label: 'FAQs', url: `${SITE}/faq` },
            { label: 'Privacy Policy', url: `${SITE}/privacy-policy` },
            { label: 'Terms & Conditions', url: `${SITE}/terms-and-conditions` },
            { label: 'Rewards & Benefits', route: '/rewards' },
          ].map((l) => (
            <Pressable
              key={l.label}
              onPress={() =>
                l.route ? router.push(l.route as any) : Linking.openURL(l.url!)
              }
              style={styles.footerLink}
            >
              <Text style={styles.footerLinkText}>{l.label}</Text>
            </Pressable>
          ))}

          <Text style={styles.footerHead}>Quick Links</Text>
          {[
            { label: 'Our Services', url: `${SITE}/services` },
            { label: 'About Us', url: `${SITE}/about` },
            { label: 'Contact', url: `${SITE}/contact` },
            { label: 'Guides', url: `${SITE}/guides` },
          ].map((l) => (
            <Pressable
              key={l.label}
              onPress={() => Linking.openURL(l.url!)}
              style={styles.footerLink}
            >
              <Text style={styles.footerLinkText}>{l.label}</Text>
            </Pressable>
          ))}

          <Text style={styles.footerHead}>Contact Us</Text>
          <View style={styles.footerContact}>
            <Ionicons name="location-outline" size={15} color={colors.textMuted} />
            <Text style={styles.footerContactText}>Lagos, Nigeria</Text>
          </View>
          <Pressable
            onPress={() => Linking.openURL('mailto:support@shieldvase.io')}
            style={styles.footerContact}
          >
            <Ionicons name="mail-outline" size={15} color={colors.textMuted} />
            <Text style={styles.footerContactText}>support@shieldvase.io</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL('tel:+2348035757500')}
            style={styles.footerContact}
          >
            <Ionicons name="call-outline" size={15} color={colors.textMuted} />
            <Text style={styles.footerContactText}>+234 803 575 7500</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(WHATSAPP_LINK)} style={styles.footerContact}>
            <Ionicons name="logo-whatsapp" size={15} color="#25D366" />
            <Text style={styles.footerContactText}>Order via WhatsApp</Text>
          </Pressable>

          <Text style={styles.copyright}>
            © {new Date().getFullYear()} shieldvase.io — a product of Optiforge Limited. All
            rights reserved.
          </Text>
        </ScreenColumn>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FDF5E6' },
  content: { paddingBottom: spacing['4xl'] },

  catNav: { backgroundColor: colors.navy },
  catNavRail: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  catNavFade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 40,
  },
  catNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.sm,
  },
  catNavText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },

  whatsappStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#128C7E',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  whatsappText: { ...typography.caption, color: '#FFFFFF', fontWeight: '600', flexShrink: 1 },

  dealPromoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  dealPromo: {
    width: '48.5%',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    ...shadows.card,
  },
  dealPromoRed: { borderColor: 'rgba(228,45,64,0.2)' },
  dealPromoGreen: { borderColor: 'rgba(0,119,73,0.2)' },
  dealPromoHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 6 },
  dealPromoIcon: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealPromoTag: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  dealPromoTagText: { ...typography.micro, fontWeight: '600' },
  dealPromoTitle: { ...typography.bodyStrong, color: colors.text },
  dealPromoBody: { ...typography.micro, color: colors.textMuted, marginTop: 2, marginBottom: 6 },
  dealPromoCta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  dealPromoCtaText: { ...typography.micro, fontWeight: '700' },

  hero: { minHeight: 480, justifyContent: 'center' },
  heroImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroImgOn: { opacity: 1 },
  heroImgOff: { opacity: 0 },
  heroInner: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.sm,
  },
  heroTitle: {
    ...typography.h1,
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 34,
    textAlign: 'center',
  },
  heroSub: {
    ...typography.body,
    color: 'rgba(229,231,235,1)',
    textAlign: 'center',
    marginTop: spacing.md,
    maxWidth: 420,
  },
  taglineWrap: { minHeight: 22, marginTop: spacing.sm },
  tagline: { ...typography.caption, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
  heroSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.pill,
    height: 48,
    paddingLeft: spacing.md,
    paddingRight: 5,
    marginTop: spacing.lg,
    width: '100%',
    ...shadows.raised,
  },
  heroInput: { flex: 1, ...typography.body, color: colors.text, marginLeft: spacing.sm },
  heroSearchBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSearchBtnText: { ...typography.bodyStrong, color: '#FFFFFF' },
  heroCtas: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl, flexWrap: 'wrap', justifyContent: 'center' },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    height: 48,
    ...shadows.raised,
  },
  ctaPrimaryText: { ...typography.bodyStrong, color: '#FFFFFF' },
  ctaOutline: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    height: 48,
  },
  ctaOutlineText: { ...typography.bodyStrong, color: '#FFFFFF' },

  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionHeadCenter: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.md },
  sectionTitle: { ...typography.h2, color: colors.text, fontSize: 19, textAlign: 'center' },
  sectionSub: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 400,
  },
  seeAll: { ...typography.captionStrong, color: colors.primary },

  marqueeRail: { gap: spacing.md, paddingBottom: spacing.xs },
  marqueeCard: {
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  marqueeImgWrap: { height: 170, backgroundColor: '#FFFFFF', position: 'relative' },
  marqueeImg: { width: '100%', height: '100%' },
  marqueeImgFallback: { alignItems: 'center', justifyContent: 'center' },
  marqueeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  marqueeCat: { ...typography.micro, color: '#FFFFFF', fontWeight: '500' },
  marqueeTitle: { ...typography.bodyStrong, color: '#FFFFFF' },
  marqueeBody: { padding: spacing.md },
  marqueeDesc: { ...typography.caption, color: colors.textMuted, minHeight: 30 },
  marqueePrice: { ...typography.bodyStrong, color: colors.primary, marginTop: spacing.xs },
  marqueeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 9,
    marginTop: spacing.sm,
  },
  marqueeBtnText: { ...typography.caption, color: colors.primary, fontWeight: '600' },

  sectionWhite: { marginTop: spacing.xs },
  diffCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  diffBody: { flex: 1 },
  diffTitle: { ...typography.bodyStrong, color: colors.text },
  diffText: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  serviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceBody: { flex: 1 },
  serviceTitle: { ...typography.bodyStrong, color: colors.text },
  serviceText: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  podHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  podRail: { gap: spacing.md, paddingBottom: spacing.xs },
  podCard: {
    width: 230,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  podTile: { height: 110, padding: spacing.md },
  podTileTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  podNumber: { ...typography.bodyStrong, color: '#374151' },
  podDuration: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  podDurationText: { ...typography.micro, color: '#374151' },
  podBody: { padding: spacing.md },
  podTitle: { ...typography.bodyStrong, color: colors.text, marginBottom: 6 },
  podMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.sm },
  podMetaText: { ...typography.micro, color: colors.textMuted, flex: 1 },
  podBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0FA0CE',
    borderRadius: radius.md,
    paddingVertical: 9,
  },
  podBtnText: { ...typography.caption, color: '#FFFFFF', fontWeight: '700' },

  servicesBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
    marginTop: spacing.sm,
  },
  servicesBtnText: { ...typography.bodyStrong, color: colors.primary },

  faqHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  faqRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  faqQ: { ...typography.bodyStrong, color: colors.text, flex: 1 },
  faqA: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 20 },

  ctaStrip: { marginTop: spacing.xl, paddingVertical: spacing['2xl'] },
  ctaTitle: { ...typography.h2, color: '#FFFFFF', textAlign: 'center', fontSize: 22 },
  ctaSub: {
    ...typography.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: spacing.md,
    maxWidth: 420,
    alignSelf: 'center',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    height: 48,
    marginTop: spacing.xl,
    ...shadows.raised,
  },
  ctaBtnText: { ...typography.bodyStrong, color: colors.text },

  footer: { backgroundColor: '#000000', paddingTop: spacing['2xl'], paddingBottom: spacing.xl },
  footerBrand: { ...typography.h2, color: '#FFFFFF', fontSize: 22 },
  footerTag: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: spacing.sm, lineHeight: 18 },
  socialRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  socialBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerHead: { ...typography.bodyStrong, color: '#FFFFFF', marginTop: spacing.xl, marginBottom: spacing.sm },
  footerLink: { paddingVertical: 5 },
  footerLinkText: { ...typography.body, color: 'rgba(255,255,255,0.7)' },
  footerContact: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 5 },
  footerContactText: { ...typography.body, color: 'rgba(255,255,255,0.7)' },
  copyright: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
});
