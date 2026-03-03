import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';
import { signIn, signUp } from '@/utils/api';

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await signUp(email.trim(), password);
        if (error) {
          Alert.alert('error', error.message.toLowerCase());
        } else if (!data.session) {
          // Email confirmation is enabled — session won't exist until confirmed
          Alert.alert(
            'check your email',
            'we sent you a confirmation link. click it, then come back and sign in.',
            [{ text: 'ok', onPress: () => setMode('signin') }]
          );
        } else {
          router.replace('/(tabs)' as any);
        }
      } else {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          Alert.alert('error', error.message.toLowerCase());
        } else {
          router.replace('/(tabs)' as any);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <Text style={styles.wordmark}>muse</Text>
        <Text style={styles.tagline}>your daily outfit journal.</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="email"
            placeholderTextColor={Theme.colors.disabled}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            placeholder="password"
            placeholderTextColor={Theme.colors.disabled}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Theme.colors.background} />
            ) : (
              <Text style={styles.btnText}>
                {mode === 'signup' ? 'create account' : 'sign in'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setMode(m => m === 'signin' ? 'signup' : 'signin')}>
          <Text style={styles.toggleText}>
            {mode === 'signin'
              ? "don't have an account? sign up"
              : 'already have an account? sign in'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  kav: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  wordmark: {
    fontFamily: Theme.font.brand,
    fontSize: 52,
    color: Theme.colors.brandWarm,
    letterSpacing: -1,
    marginBottom: 4,
  },
  tagline: {
    fontSize: Theme.font.sm,
    color: Theme.colors.secondary,
    marginBottom: 32,
    letterSpacing: 0.2,
  },
  form: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  input: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: Theme.font.base,
    color: Theme.colors.primary,
  },
  btn: {
    backgroundColor: Theme.colors.accent,
    borderRadius: Theme.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    fontSize: Theme.font.base,
    fontWeight: '700',
    color: Theme.colors.background,
    letterSpacing: -0.2,
  },
  toggleText: {
    fontSize: Theme.font.sm,
    color: Theme.colors.secondary,
    textAlign: 'center',
  },
});
