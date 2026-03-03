import { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';

import { Theme } from '@/constants/Theme';
import {
  getMyProfile,
  getMyPosts,
  getMyCommunities,
  updateProfile,
  uploadAvatar,
  createCommunity,
  leaveCommunity,
  signOut,
  Community,
  Post,
  Profile,
} from '@/utils/api';
import { useAuth } from '@/utils/auth';
import { formatShortDate } from '@/utils/dates';

export default function ProfileScreen() {
  const router = useRouter();
  const { session, profile: authProfile, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(authProfile);
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);

  // Edit state
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // New community form
  const [showCommunityForm, setShowCommunityForm] = useState(false);
  const [communityName, setCommunityName] = useState('');
  const [communitySlug, setCommunitySlug] = useState('');
  const [communityDesc, setCommunityDesc] = useState('');
  const [creatingCommunity, setCreatingCommunity] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      Promise.all([getMyProfile(), getMyPosts(), getMyCommunities()]).then(
        ([p, ps, cs]) => {
          setProfile(p);
          setPosts(ps);
          setCommunities(cs);
        }
      );
    }, [session])
  );

  if (!session) return null;

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Theme.colors.accent} />
      </SafeAreaView>
    );
  }

  const handleAvatarPress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;
    try {
      const url = await uploadAvatar(profile.id, result.assets[0].uri);
      const updated = await updateProfile(profile.id, { avatar_url: url });
      setProfile(updated);
      refreshProfile();
    } catch (e: any) {
      Alert.alert('error', e?.message ?? 'could not upload avatar');
    }
  };

  const handleTogglePublic = async (val: boolean) => {
    try {
      const updated = await updateProfile(profile.id, { is_public: val });
      setProfile(updated);
      refreshProfile();
    } catch {
      Alert.alert('error', 'could not update privacy setting');
    }
  };

  const saveName = async () => {
    if (!draftName.trim()) return;
    setSavingName(true);
    try {
      const updated = await updateProfile(profile.id, { display_name: draftName.trim() });
      setProfile(updated);
      refreshProfile();
      setEditingName(false);
    } catch (e: any) {
      Alert.alert('error', e?.message ?? 'could not save name');
    } finally {
      setSavingName(false);
    }
  };

  const handleLeave = (community: Community) => {
    Alert.alert(`leave ${community.name}?`, '', [
      { text: 'cancel', style: 'cancel' },
      {
        text: 'leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveCommunity(community.id);
            setCommunities(cs => cs.filter(c => c.id !== community.id));
          } catch {
            Alert.alert('error', 'could not leave community');
          }
        },
      },
    ]);
  };

  const handleCreateCommunity = async () => {
    if (!communityName.trim() || !communitySlug.trim()) return;
    setCreatingCommunity(true);
    try {
      const c = await createCommunity({
        name: communityName.trim(),
        slug: communitySlug.trim().toLowerCase().replace(/\s+/g, '-'),
        description: communityDesc.trim(),
      });
      setCommunities(cs => [c, ...cs]);
      setCommunityName('');
      setCommunitySlug('');
      setCommunityDesc('');
      setShowCommunityForm(false);
    } catch (e: any) {
      Alert.alert('error', e?.message ?? 'could not create community');
    } finally {
      setCreatingCommunity(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    // AuthGate will redirect to /auth once session becomes null
  };

  const displayName = profile.display_name ?? profile.username;
  const initials = displayName[0].toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backText}>‹ back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>profile</Text>
        <TouchableOpacity onPress={handleSignOut} hitSlop={12}>
          <Text style={styles.signOutText}>sign out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Avatar */}
        <TouchableOpacity style={styles.avatarArea} onPress={handleAvatarPress} activeOpacity={0.8}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            <Feather name="camera" size={12} color={Theme.colors.background} />
          </View>
        </TouchableOpacity>

        {/* Display name */}
        {editingName ? (
          <View style={styles.nameEditRow}>
            <TextInput
              style={styles.nameInput}
              value={draftName}
              onChangeText={setDraftName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveName}
              placeholderTextColor={Theme.colors.disabled}
            />
            <TouchableOpacity onPress={saveName} disabled={savingName} style={styles.nameSaveBtn}>
              {savingName
                ? <ActivityIndicator size="small" color={Theme.colors.background} />
                : <Text style={styles.nameSaveBtnText}>save</Text>
              }
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => { setDraftName(displayName); setEditingName(true); }}>
            <Text style={styles.displayName}>{displayName}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.username}>@{profile.username}</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{posts.length}</Text>
            <Text style={styles.statLabel}>posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{communities.length}</Text>
            <Text style={styles.statLabel}>communities</Text>
          </View>
        </View>

        {/* Public toggle */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>public profile</Text>
              <Text style={styles.rowSub}>your posts appear in the social feed</Text>
            </View>
            <Switch
              value={profile.is_public}
              onValueChange={handleTogglePublic}
              trackColor={{ false: Theme.colors.surface, true: Theme.colors.accent }}
              thumbColor={Theme.colors.primary}
            />
          </View>
        </View>

        {/* Communities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>communities</Text>
            <TouchableOpacity onPress={() => setShowCommunityForm(v => !v)}>
              <Text style={styles.sectionAction}>+ create new</Text>
            </TouchableOpacity>
          </View>

          {showCommunityForm && (
            <View style={styles.communityForm}>
              <TextInput
                style={styles.formInput}
                placeholder="community name"
                placeholderTextColor={Theme.colors.disabled}
                value={communityName}
                onChangeText={v => {
                  setCommunityName(v);
                  setCommunitySlug(v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                }}
              />
              <TextInput
                style={styles.formInput}
                placeholder="slug (e.g. vintage-fits)"
                placeholderTextColor={Theme.colors.disabled}
                value={communitySlug}
                onChangeText={setCommunitySlug}
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.formInput, { minHeight: 60 }]}
                placeholder="description (optional)"
                placeholderTextColor={Theme.colors.disabled}
                value={communityDesc}
                onChangeText={setCommunityDesc}
                multiline
              />
              <TouchableOpacity
                style={[styles.createBtn, creatingCommunity && { opacity: 0.5 }]}
                onPress={handleCreateCommunity}
                disabled={creatingCommunity}
              >
                {creatingCommunity
                  ? <ActivityIndicator color={Theme.colors.background} />
                  : <Text style={styles.createBtnText}>create community</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          {communities.length === 0 ? (
            <Text style={styles.emptyCommunities}>you haven't joined any communities yet.</Text>
          ) : (
            communities.map(c => (
              <View key={c.id} style={styles.communityRow}>
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/community/[id]' as any, params: { id: c.id } })}
                  style={{ flex: 1 }}
                >
                  <Text style={styles.communityName}>{c.name}</Text>
                  {c.description ? <Text style={styles.communityDesc} numberOfLines={1}>{c.description}</Text> : null}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleLeave(c)} hitSlop={8}>
                  <Text style={styles.leaveText}>leave</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
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
  backText: { fontSize: Theme.font.base, color: Theme.colors.primary, fontWeight: '600' },
  headerTitle: {
    fontFamily: Theme.font.brand, fontSize: 22,
    color: Theme.colors.primary, letterSpacing: -0.3,
  },
  signOutText: { fontSize: Theme.font.sm, color: '#D9534F', fontWeight: '500' },

  content: { paddingHorizontal: 20, paddingBottom: 60, alignItems: 'center' },

  avatarArea: { marginTop: 12, marginBottom: 14, position: 'relative' },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarPlaceholder: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Theme.colors.surface,
    borderWidth: 2, borderColor: Theme.colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 32, fontWeight: '700', color: Theme.colors.primary },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Theme.colors.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Theme.colors.background,
  },

  displayName: {
    fontSize: Theme.font.xl, fontWeight: '800',
    color: Theme.colors.primary, letterSpacing: -0.5, textAlign: 'center',
  },
  username: { fontSize: Theme.font.sm, color: Theme.colors.secondary, marginTop: 2 },

  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    fontSize: Theme.font.xl, fontWeight: '800', color: Theme.colors.primary,
    borderBottomWidth: 1.5, borderBottomColor: Theme.colors.accent,
    minWidth: 160, paddingBottom: 2,
  },
  nameSaveBtn: {
    backgroundColor: Theme.colors.accent, borderRadius: Theme.radius.sm,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  nameSaveBtnText: { fontSize: Theme.font.sm, fontWeight: '700', color: Theme.colors.background },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 28, marginTop: 20, marginBottom: 8,
  },
  stat: { alignItems: 'center', gap: 2 },
  statNum: { fontSize: Theme.font.lg, fontWeight: '800', color: Theme.colors.primary },
  statLabel: { fontSize: Theme.font.xs, color: Theme.colors.secondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 28, backgroundColor: Theme.colors.border },

  section: {
    width: '100%', marginTop: 24,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    borderWidth: 1, borderColor: Theme.colors.border,
    padding: 16,
    gap: 12,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: Theme.font.base, fontWeight: '700', color: Theme.colors.primary },
  sectionAction: { fontSize: Theme.font.sm, color: Theme.colors.accent, fontWeight: '600' },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { fontSize: Theme.font.base, fontWeight: '600', color: Theme.colors.primary },
  rowSub: { fontSize: Theme.font.xs, color: Theme.colors.secondary, marginTop: 2 },

  communityForm: { gap: 8 },
  formInput: {
    backgroundColor: Theme.colors.background, borderRadius: Theme.radius.md,
    borderWidth: 1, borderColor: Theme.colors.border,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: Theme.font.base, color: Theme.colors.primary,
  },
  createBtn: {
    backgroundColor: Theme.colors.accent, borderRadius: Theme.radius.md,
    paddingVertical: 12, alignItems: 'center', marginTop: 4,
  },
  createBtnText: { fontSize: Theme.font.base, fontWeight: '700', color: Theme.colors.background },

  communityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 6, borderTopWidth: 1, borderTopColor: Theme.colors.border,
  },
  communityName: { fontSize: Theme.font.base, fontWeight: '600', color: Theme.colors.primary },
  communityDesc: { fontSize: Theme.font.xs, color: Theme.colors.secondary, marginTop: 1 },
  leaveText: { fontSize: Theme.font.sm, color: Theme.colors.secondary },
  emptyCommunities: { fontSize: Theme.font.sm, color: Theme.colors.secondary },
});
