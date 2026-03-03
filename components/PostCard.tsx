import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Theme } from '@/constants/Theme';
import { Post } from '@/utils/api';
import { formatShortDate } from '@/utils/dates';

const SCREEN_WIDTH = Math.min(Dimensions.get('window').width, 390);
const CARD_W = SCREEN_WIDTH - 32;
const CARD_H = Math.round(CARD_W * (4 / 3));
const CARD_R = 18;

interface PostCardProps {
  post: Post;
  onPress: () => void;
}

export function PostCard({ post, onPress }: PostCardProps) {
  const username = post.profile?.display_name ?? post.profile?.username ?? 'unknown';
  const avatarLetter = username[0].toUpperCase();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      {/* Author row above photo */}
      <View style={styles.authorRow}>
        {post.profile?.avatar_url ? (
          <Image source={{ uri: post.profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarLetter}>{avatarLetter}</Text>
          </View>
        )}
        <Text style={styles.username}>@{post.profile?.username ?? 'unknown'}</Text>
        <Text style={styles.dateText}>{formatShortDate(post.date)}</Text>
      </View>

      {/* Photo */}
      <Image source={{ uri: post.photo_url }} style={styles.photo} resizeMode="cover" />

      {/* Caption below photo */}
      {post.caption ? (
        <Text style={styles.caption}>{post.caption}</Text>
      ) : null}

      {/* Tags */}
      {post.tags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsRow}
          style={styles.tagsScroll}
        >
          {post.tags.map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    alignSelf: 'center',
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: CARD_R,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  avatar: { width: 30, height: 30, borderRadius: 15 },
  avatarPlaceholder: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Theme.colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: Theme.font.xs, fontWeight: '800', color: '#fff' },
  username: {
    fontSize: Theme.font.sm, fontWeight: '700',
    color: Theme.colors.accent, flex: 1,
  },
  dateText: { fontSize: Theme.font.xs, color: 'rgba(0,0,0,0.4)' },

  photo: { width: CARD_W, height: CARD_H },

  caption: {
    fontSize: Theme.font.sm,
    color: '#444',
    lineHeight: 20,
    paddingHorizontal: 12,
    paddingTop: 10,
  },

  tagsScroll: { paddingTop: 8, paddingBottom: 12 },
  tagsRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 12 },
  tag: {
    backgroundColor: Theme.colors.accent,
    borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3,
  },
  tagText: {
    fontSize: Theme.font.xs, fontWeight: '700',
    color: '#fff', letterSpacing: 0.2,
  },
});
