import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/constants/supabase';

// expo-secure-store only works on native; fall back to localStorage on web.
// Guard typeof localStorage because Expo Router runs a node SSR pass where
// Platform.OS === 'web' but localStorage doesn't exist yet.
const storage = Platform.OS === 'web'
  ? {
      getItem: (key: string) =>
        typeof localStorage !== 'undefined'
          ? Promise.resolve(localStorage.getItem(key))
          : Promise.resolve(null),
      setItem: (key: string, value: string) =>
        typeof localStorage !== 'undefined'
          ? Promise.resolve(localStorage.setItem(key, value))
          : Promise.resolve(),
      removeItem: (key: string) =>
        typeof localStorage !== 'undefined'
          ? Promise.resolve(localStorage.removeItem(key))
          : Promise.resolve(),
    }
  : {
      getItem: (key: string) => SecureStore.getItemAsync(key),
      setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
      removeItem: (key: string) => SecureStore.deleteItemAsync(key),
    };

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
