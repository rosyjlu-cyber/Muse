import { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Theme } from '@/constants/Theme';
import { getPost, deletePost, Post } from '@/utils/api';
import { formatDate } from '@/utils/dates';
import { useAuth } from '@/utils/auth';

const SCREEN_WIDTH = Math.min(Dimensions.get('window').width, 390);

export default function EntryScreen() {
  const { date, userId } = useLocalSearchParams<{ date: string; userId?: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const [post, setPost] = useState<Post | null>(null);

  // userId param lets us view other people's posts; falls back to own
  const targetUserId = userId ?? session?.user.id ?? '';
  const isOwn = !userId || userId === session?.user.id;

  useFocusEffect(
    useCallback(() => {
      if (date && targetUserId) {
        getPost(targetUserId, date).then(setPost);
      }
    }, [date, targetUserId])
  );

  const handleDelete = () => {
    Alert.alert('delete this look?', "you can't undo this.", [
      { text: 'keep it', style: 'cancel' },
      {
        text: 'delete',
        style: 'destructive',
        onPress: async () => {
          if (!post) return;
          try {
            await deletePost(post.id);
            router.back();
          } catch {
            Alert.alert('oops', 'could not delete this look. try again?');
          }
        },
      },
    ]);
  };

  const handleReplace = () => {
    if (date) router.push({ pathname: '/add' as any, params: { date } });
  };

  if (!post) return null;

  const photoWidth = SCREEN_WIDTH - 32;
  const photoHeight = Math.round(photoWidth * (4 / 3));

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backText}>‹ back</Text>
        </TouchableOpacity>
        {isOwn && (
          <TouchableOpacity onPress={handleDelete} hitSlop={12}>
            <Text style={styles.deleteText}>delete</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Author (for others' posts) */}
        {!isOwn && post.profile && (
          <Text style={styles.authorText}>@{post.profile.username}</Text>
        )}

        {/* Photo */}
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: post.photo_url }}
            style={[styles.photo, { width: photoWidth, height: photoHeight }]}
            resizeMode="cover"
          />
        </View>

        {/* Date */}
        <Text style={styles.dateText}>{formatDate(post.date)}</Text>

        {/* Caption */}
        {post.caption ? (
          <View style={styles.captionCard}>
            <Text style={styles.captionText}>{post.caption}</Text>
          </View>
        ) : isOwn ? (
          <TouchableOpacity onPress={handleReplace} activeOpacity={0.7}>
            <Text style={styles.addHint}>+ add a caption</Text>
          </TouchableOpacity>
        ) : null}

        {/* Tags */}
        {post.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {post.tags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Replace (own posts only) */}
        {isOwn && (
          <TouchableOpacity style={styles.replaceBtn} onPress={handleReplace} activeOpacity={0.8}>
            <Text style={styles.replaceBtnText}>replace this look</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {},
  backText: { fontSize: Theme.font.base, color: Theme.colors.primary, fontWeight: '600' },
  deleteText: { fontSize: Theme.font.base, color: '#D9534F', fontWeight: '500' },
  content: { paddingHorizontal: 16, paddingBottom: 48 },
  authorText: {
    fontSize: Theme.font.sm, color: Theme.colors.secondary,
    fontWeight: '600', marginBottom: 10,
  },
  photoContainer: { borderRadius: Theme.radius.lg, overflow: 'hidden', marginBottom: 16 },
  photo: { borderRadius: Theme.radius.lg },
  dateText: {
    fontSize: Theme.font.lg, fontWeight: '700', color: Theme.colors.primary,
    letterSpacing: -0.3, marginBottom: 10,
  },
  captionCard: {
    backgroundColor: Theme.colors.surface, borderRadius: Theme.radius.md,
    borderWidth: 1, borderColor: Theme.colors.border,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12,
  },
  captionText: { fontSize: Theme.font.base, color: Theme.colors.primary, lineHeight: 22 },
  addHint: { fontSize: Theme.font.sm, color: Theme.colors.disabled, marginBottom: 12 },
  tagsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 24,
  },
  tag: {
    backgroundColor: Theme.colors.accent, borderRadius: 100,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  tagText: {
    fontSize: Theme.font.xs, fontWeight: '700',
    color: Theme.colors.background, letterSpacing: 0.2,
  },
  replaceBtn: {
    borderWidth: 1.5, borderColor: Theme.colors.border,
    borderRadius: Theme.radius.md, paddingVertical: 13, alignItems: 'center',
  },
  replaceBtnText: {
    fontSize: Theme.font.sm, fontWeight: '600',
    color: Theme.colors.secondary, letterSpacing: 0.2,
  },
});
