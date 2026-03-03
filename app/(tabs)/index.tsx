import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

import { Theme } from '@/constants/Theme';
import { getMyPosts, Post } from '@/utils/api';
import { useAuth } from '@/utils/auth';
import {
  calculateStreak,
  getLastNDays,
  todayString,
  formatDate,
} from '@/utils/dates';
import { CalendarGrid } from '@/components/CalendarGrid';

const SCREEN_WIDTH = Math.min(Dimensions.get('window').width, 390);
const SCREEN_HEIGHT = Dimensions.get('window').height;

const BLOB_W = Math.round(SCREEN_WIDTH * 0.84);

const PHOTO_W = Math.round(SCREEN_WIDTH * 0.82);
const PHOTO_H = Math.round(PHOTO_W * (4 / 3));
const PHOTO_R = 20;

const HEADER_H_EST = 62;
const LIME_PEEK = 22;

// Sliding panel: diagonal gradient, yellow top-left → pink bottom-right
const PANEL_COLORS = ['#fdf5b9', '#f0c8e8', '#e9b3ee'] as const;

// 6-lobe organic blob: two top bumps with notch, wide sides, two bottom bumps with notch
// Viewbox 200×350 approximates the portrait aspect ratio of the blob area
const BLOB_PATH =
  'M 55,32 ' +
  'C 80,5 120,5 155,32 ' +        // top notch between upper-left and upper-right bumps
  'C 178,58 195,120 192,175 ' +   // upper-right → right side bulge
  'C 190,232 175,285 148,320 ' +  // right bulge → lower-right bump
  'C 128,300 72,300 52,320 ' +    // bottom notch between lower bumps (control pts pull inward)
  'C 25,298 5,230 8,175 ' +       // lower-left bump → left side bulge
  'C 10,118 22,58 55,32 Z';       // left bulge → back to upper-left bump

function BlobMirror({ width, height, children }: { width: number; height: number; children?: React.ReactNode }) {
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox="0 0 200 350" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id="bg" x1="20%" y1="0%" x2="80%" y2="100%">
            <Stop offset="0%" stopColor="#CCE0EE" />
            <Stop offset="50%" stopColor="#A6C2D7" />
            <Stop offset="100%" stopColor="#82A9BF" />
          </SvgGradient>
        </Defs>
        <Path d={BLOB_PATH} fill="url(#bg)" />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', gap: 14 }]}>
        {children}
      </View>
    </View>
  );
}

function postToEntry(p: Post) {
  return { date: p.date, photoUri: p.photo_url };
}

export default function JournalHome() {
  const router = useRouter();
  const { session, profile } = useAuth();
  const now = new Date();
  const [posts, setPosts] = useState<Post[]>([]);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [containerH, setContainerH] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (session) {
        getMyPosts().then(all => {
          setPosts([...all].sort((a, b) => b.date.localeCompare(a.date)));
        });
      }
    }, [session])
  );

  const entries = posts.map(postToEntry);
  const todayStr = todayString();
  const todayPost = posts.find(p => p.date === todayStr) ?? null;
  const streak = calculateStreak(entries);
  const last7 = getLastNDays(entries, 7);
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const handleDayPress = (date: string, hasEntry: boolean) => {
    if (hasEntry) {
      router.push({ pathname: '/entry/[date]' as any, params: { date } });
      return;
    }
    const [y, m, d] = date.split('-').map(Number);
    const dayMs = new Date(y, m - 1, d).getTime();
    const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (dayMs <= todayMs) {
      router.push({ pathname: '/add' as any, params: { date } });
    }
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else { setViewMonth(m => m - 1); }
  };

  const handleNextMonth = () => {
    if (!isCurrentMonth) {
      if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
      else { setViewMonth(m => m + 1); }
    }
  };

  const thisMonthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const thisMonthCount = posts.filter(p => p.date.startsWith(thisMonthPrefix)).length;

  const goToAdd = () => router.push({ pathname: '/add' as any, params: { date: todayStr } });
  const goToTodayEntry = () => router.push({ pathname: '/entry/[date]' as any, params: { date: todayStr } });

  const spacerH = containerH > 0 ? containerH - LIME_PEEK : SCREEN_HEIGHT - LIME_PEEK;
  const blobAreaH = spacerH - HEADER_H_EST;
  const BLOB_H = Math.round(blobAreaH * 0.88);

  const initials = (profile?.display_name ?? profile?.username ?? '?')[0].toUpperCase();

  return (
    <SafeAreaView
      style={styles.safe}
      onLayout={e => setContainerH(e.nativeEvent.layout.height)}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Theme.colors.background} />

      {/* Hero background — visual only, no interactions */}
      <View style={[styles.heroLayer, { height: spacerH }]} pointerEvents="none">
        <View style={{ height: HEADER_H_EST }} />
        <View style={styles.blobWrapper}>
          {!session ? (
            <BlobMirror width={BLOB_W} height={BLOB_H}>
              <Text style={styles.blobTitle}>{'SIGN IN\nTO START'}</Text>
            </BlobMirror>
          ) : !todayPost ? (
            <BlobMirror width={BLOB_W} height={BLOB_H}>
              <View style={styles.cameraRing}>
                <Feather name="camera" size={28} color="#0B0B0B" />
              </View>
              <Text style={styles.blobTitle}>{'ADD\nTODAY\'S\nLOOK'}</Text>
            </BlobMirror>
          ) : (
            <View style={styles.photoTouchable}>
              <Image
                source={{ uri: todayPost.photo_url }}
                style={styles.photoImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(11,11,11,0.72)']}
                style={styles.photoOverlay}
              >
                <Text style={styles.photoDate}>{formatDate(todayStr)}</Text>
                <View style={styles.photoLoggedRow}>
                  <Text style={styles.photoLoggedText}>today's look</Text>
                  <View style={styles.checkBadge}>
                    <Feather name="check" size={11} color="#0B0B0B" />
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}
        </View>
      </View>

      {/* Scroll overlay */}
      <ScrollView
        style={StyleSheet.absoluteFill}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollsToTop={false}
        onScroll={e => setScrollY(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        <View style={{ height: spacerH }} pointerEvents="none" />

        <LinearGradient
          colors={PANEL_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.limeCard, { minHeight: containerH || SCREEN_HEIGHT }]}
        >
          <View style={styles.handleBarContainer}>
            <View style={styles.handleBar} />
          </View>

          <View style={styles.streakRow}>
            <View style={styles.streakLeft}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <View>
                <Text style={styles.streakNumber}>{streak > 0 ? streak : '—'}</Text>
                <Text style={styles.streakLabel}>day streak</Text>
              </View>
            </View>
            <View style={styles.dotsCol}>
              <View style={styles.dotsRow}>
                {last7.map((d, i) => (
                  <View
                    key={i}
                    style={[styles.dot, d.hasEntry ? styles.dotFilled : styles.dotEmpty]}
                  />
                ))}
              </View>
              <Text style={styles.dotsLabel}>last 7 days</Text>
            </View>
          </View>

          <CalendarGrid
            year={viewYear}
            month={viewMonth}
            entries={entries}
            onDayPress={handleDayPress}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            canGoNext={!isCurrentMonth}
          />

          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              {thisMonthCount === 0
                ? 'no looks logged yet this month'
                : `${thisMonthCount} look${thisMonthCount !== 1 ? 's' : ''} this month`}
            </Text>
          </View>
        </LinearGradient>
      </ScrollView>

      {/* Hero interactive overlay — rendered after ScrollView so taps reach it.
          Disabled when scrolled so the lime card content stays tappable. */}
      <View
        style={[styles.heroLayer, { height: spacerH }]}
        pointerEvents={scrollY < 50 ? 'box-none' : 'none'}
      >
        <View style={{ height: HEADER_H_EST }} />
        <View style={styles.blobWrapper}>
          {!session ? (
            <TouchableOpacity
              onPress={() => router.push('/auth' as any)}
              activeOpacity={0.86}
              style={[styles.blobTouchable, { height: BLOB_H }]}
            />
          ) : !todayPost ? (
            <TouchableOpacity
              onPress={goToAdd}
              activeOpacity={0.86}
              style={[styles.blobTouchable, { height: BLOB_H }]}
            />
          ) : (
            <TouchableOpacity
              onPress={goToTodayEntry}
              activeOpacity={0.9}
              style={styles.photoTouchable}
            />
          )}
        </View>
      </View>

      {/* Header rendered last = above scroll, touches reach it */}
      <View style={styles.header} pointerEvents="box-none">
        <Text style={styles.wordmark}>muse</Text>
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => router.push('/profile' as any)}
          activeOpacity={0.8}
        >
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  scrollContent: {},

  heroLayer: { position: 'absolute', top: 0, left: 0, right: 0 },

  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  wordmark: {
    fontFamily: Theme.font.brand, fontSize: 40,
    color: Theme.colors.brandWarm, letterSpacing: -0.5,
  },
  avatarBtn: {},
  avatarImg: { width: 34, height: 34, borderRadius: 17 },
  avatarPlaceholder: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1.5, borderColor: Theme.colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: Theme.font.sm, fontWeight: '700', color: Theme.colors.primary },

  blobWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  blobTouchable: { width: BLOB_W },
  blobContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  cameraRing: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(11,11,11,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(11,11,11,0.22)',
  },
  blobTitle: {
    fontSize: 30, fontWeight: '900', color: '#0B0B0B',
    textAlign: 'center', textTransform: 'uppercase', letterSpacing: -1, lineHeight: 32,
  },

  photoTouchable: { width: PHOTO_W, height: PHOTO_H, borderRadius: PHOTO_R, overflow: 'hidden' },
  photoImage: { width: PHOTO_W, height: PHOTO_H },
  photoOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 24, paddingTop: 60,
  },
  photoDate: { fontSize: Theme.font.xs, color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
  photoLoggedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  photoLoggedText: { fontSize: Theme.font.md, fontWeight: '700', color: Theme.colors.white },
  checkBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Theme.colors.accent, alignItems: 'center', justifyContent: 'center',
  },

  limeCard: {
    borderTopLeftRadius: 44, borderTopRightRadius: 44, paddingBottom: 56,
  },
  handleBarContainer: { alignItems: 'center', paddingTop: 12, paddingBottom: 16 },
  handleBar: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.18)' },

  streakRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 24,
  },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakEmoji: { fontSize: 28 },
  streakNumber: {
    fontSize: Theme.font.xl, fontWeight: '800', color: Theme.colors.limeText,
    letterSpacing: -1, lineHeight: Theme.font.xl + 2,
  },
  streakLabel: {
    fontSize: Theme.font.xs, color: Theme.colors.limeMuted,
    fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.6,
  },
  dotsCol: { alignItems: 'flex-end', gap: 4 },
  dotsRow: { flexDirection: 'row', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotFilled: { backgroundColor: Theme.colors.limeText },
  dotEmpty: { backgroundColor: 'rgba(0,0,0,0.15)', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.25)' },
  dotsLabel: {
    fontSize: 9, color: Theme.colors.limeMuted,
    fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5,
  },

  summary: { paddingHorizontal: 20, paddingTop: 18 },
  summaryText: { fontSize: Theme.font.sm, color: Theme.colors.limeMuted },
});
