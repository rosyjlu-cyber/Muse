import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Theme } from '@/constants/Theme';
import { getFeed, getMyCommunities, Post, Community, FeedFilters } from '@/utils/api';
import { useAuth } from '@/utils/auth';
import { PostCard } from '@/components/PostCard';
import { FeedFiltersBar } from '@/components/FeedFilters';

export default function FeedScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filters, setFilters] = useState<FeedFilters>({ dateFilter: 'all' });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    const [feedPosts, myCommunities] = await Promise.all([
      getFeed(filters).catch(() => [] as Post[]),
      getMyCommunities().catch(() => [] as Community[]),
    ]);
    setPosts(feedPosts);
    setCommunities(myCommunities);
  }, [session, filters]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Collect unique tags from current feed for the filter bar
  const availableTags = Array.from(
    new Set(posts.flatMap(p => p.tags))
  ).slice(0, 20);

  const handlePostPress = (post: Post) => {
    router.push({
      pathname: '/entry/[date]' as any,
      params: { date: post.date, userId: post.user_id },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>feed</Text>
      </View>

      {/* Filters */}
      <FeedFiltersBar
        filters={filters}
        onChange={setFilters}
        communities={communities}
        availableTags={availableTags}
      />

      {/* Feed list */}
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PostCard post={item} onPress={() => handlePostPress(item)} />
        )}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Theme.colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Feather name="image" size={28} color={Theme.colors.disabled} />
            </View>
            <Text style={styles.emptyTitle}>nothing here yet</Text>
            <Text style={styles.emptyBody}>
              looks from public profiles and your{'\n'}communities will show up here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },

  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },
  wordmark: {
    fontFamily: Theme.font.brand,
    fontSize: 40,
    color: Theme.colors.brandWarm,
    letterSpacing: -0.5,
  },

  list: { flex: 1, backgroundColor: Theme.colors.background },
  listContent: { paddingTop: 8, paddingBottom: 32 },

  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Theme.colors.surface,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: Theme.font.md, fontWeight: '700',
    color: Theme.colors.primary, letterSpacing: -0.2,
  },
  emptyBody: {
    fontSize: Theme.font.sm, color: Theme.colors.secondary,
    textAlign: 'center', lineHeight: 20,
  },
});
