import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_public: boolean;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  date: string;          // YYYY-MM-DD
  photo_url: string;     // Supabase Storage public URL
  caption: string | null;
  tags: string[];
  created_at: string;
  profile?: Pick<Profile, 'username' | 'display_name' | 'avatar_url' | 'is_public'>;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_by: string;
  is_private: boolean;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
}

export interface FeedFilters {
  dateFilter?: 'week' | 'month' | 'all';
  communityId?: string;
  tag?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getMyProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (data) return data;
  // Profile row missing (user signed up before trigger was added) — create it now
  const username = user.email ? user.email.split('@')[0] : user.id.slice(0, 8);
  const { data: created } = await supabase
    .from('profiles')
    .insert({ id: user.id, username, display_name: username })
    .select()
    .single();
  return created;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return data;
}

export async function updateProfile(userId: string, updates: Partial<Pick<Profile, 'username' | 'display_name' | 'avatar_url' | 'is_public'>>) {
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
  if (error) throw error;
  return data as Profile;
}

export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  const ext = localUri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const path = `avatars/${userId}.${ext}`;
  const fileData = await uriToBlob(localUri);
  const { error } = await supabase.storage.from('outfit-photos').upload(path, fileData, { upsert: true, contentType: `image/${ext}` });
  if (error) throw error;
  const { data } = supabase.storage.from('outfit-photos').getPublicUrl(path);
  return data.publicUrl;
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export async function getMyPosts(): Promise<Post[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function getPost(userId: string, date: string): Promise<Post | null> {
  const { data } = await supabase
    .from('posts')
    .select('*, profile:profiles(username, display_name, avatar_url, is_public)')
    .eq('user_id', userId)
    .eq('date', date)
    .single();
  return data as Post | null;
}

export async function upsertPost(
  date: string,
  photoUri: string,
  caption: string,
  tags: string[]
): Promise<Post> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not logged in');

  // Upload photo
  const photoUrl = await uploadPhoto(user.id, date, photoUri);

  const { data, error } = await supabase
    .from('posts')
    .upsert(
      { user_id: user.id, date, photo_url: photoUrl, caption: caption.trim() || null, tags },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single();
  if (error) throw error;
  return data as Post;
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) throw error;
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

export async function getFeed(filters: FeedFilters = {}): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select('*, profile:profiles!posts_user_id_fkey(username, display_name, avatar_url, is_public)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (filters.dateFilter === 'week') {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    query = query.gte('date', since.toISOString().slice(0, 10));
  } else if (filters.dateFilter === 'month') {
    const since = new Date();
    since.setMonth(since.getMonth() - 1);
    query = query.gte('date', since.toISOString().slice(0, 10));
  }

  if (filters.tag) {
    query = query.contains('tags', [filters.tag]);
  }

  if (filters.communityId) {
    // Get member IDs of this community, then filter posts
    const { data: members } = await supabase
      .from('community_members')
      .select('user_id')
      .eq('community_id', filters.communityId);
    const memberIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
    if (memberIds.length === 0) return [];
    query = query.in('user_id', memberIds);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Post[];
}

// ─── Communities ──────────────────────────────────────────────────────────────

export async function getMyCommunities(): Promise<Community[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('community_members')
    .select('community:communities(*)')
    .eq('user_id', user.id);
  if (error) throw error;
  return (data ?? []).map((row: any) => row.community) as Community[];
}

export async function getAllCommunities(): Promise<Community[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  if (!user || !data) return (data ?? []) as Community[];

  // Mark which ones the user is already a member of
  const { data: memberships } = await supabase
    .from('community_members')
    .select('community_id')
    .eq('user_id', user.id);
  const memberSet = new Set((memberships ?? []).map((m: any) => m.community_id));
  return data.map(c => ({ ...c, is_member: memberSet.has(c.id) })) as Community[];
}

export async function getCommunity(id: string): Promise<Community | null> {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;

  const { data: { user } } = await supabase.auth.getUser();
  const { count } = await supabase
    .from('community_members')
    .select('*', { count: 'exact', head: true })
    .eq('community_id', id);

  let is_member = false;
  if (user) {
    const { data: mem } = await supabase
      .from('community_members')
      .select('user_id')
      .eq('community_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    is_member = !!mem;
  }

  return { ...data, member_count: count ?? 0, is_member } as Community;
}

export async function joinCommunity(communityId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not logged in');
  const { error } = await supabase
    .from('community_members')
    .insert({ community_id: communityId, user_id: user.id });
  if (error) throw error;
}

export async function leaveCommunity(communityId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not logged in');
  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', user.id);
  if (error) throw error;
}

export async function createCommunity(input: { name: string; slug: string; description: string }): Promise<Community> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not logged in');
  const { data, error } = await supabase
    .from('communities')
    .insert({ ...input, created_by: user.id })
    .select()
    .single();
  if (error) throw error;
  // Auto-join as admin
  await supabase.from('community_members').insert({ community_id: data.id, user_id: user.id, role: 'admin' });
  return data as Community;
}

export async function getCommunityPosts(communityId: string): Promise<Post[]> {
  const { data: members } = await supabase
    .from('community_members')
    .select('user_id')
    .eq('community_id', communityId);
  const memberIds = (members ?? []).map((m: any) => m.user_id);
  if (memberIds.length === 0) return [];

  const { data, error } = await supabase
    .from('posts')
    .select('*, profile:profiles!posts_user_id_fkey(username, display_name, avatar_url, is_public)')
    .in('user_id', memberIds)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Post[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function uploadPhoto(userId: string, date: string, localUri: string): Promise<string> {
  // Confirm session is active before attempting storage upload
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('not logged in — please sign out and sign back in');

  const path = `posts/${userId}/${date}.jpg`;
  const fileData = await uriToBlob(localUri);
  // Remove existing file first (ignore error if it doesn't exist), then insert fresh
  await supabase.storage.from('outfit-photos').remove([path]);
  const { error } = await supabase.storage
    .from('outfit-photos')
    .upload(path, fileData, { contentType: 'image/jpeg' });
  if (error) throw new Error(`storage [uid=${session.user.id.slice(0, 8)} path=${path}]: ${error.message}`);
  const { data } = supabase.storage.from('outfit-photos').getPublicUrl(path);
  return data.publicUrl;
}

async function uriToBlob(uri: string): Promise<Blob> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return response.blob();
  }
  // Native: read as base64 then convert to blob
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const byteChars = atob(base64);
  const byteArr = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteArr[i] = byteChars.charCodeAt(i);
  }
  return new Blob([byteArr], { type: 'image/jpeg' });
}
