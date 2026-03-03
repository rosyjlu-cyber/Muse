import { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Theme } from '@/constants/Theme';
import { upsertPost } from '@/utils/api';
import { formatDate, todayString } from '@/utils/dates';
import { TagInput } from '@/components/TagInput';

const SCREEN_WIDTH = Math.min(Dimensions.get('window').width, 390);

export default function AddScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('camera access needed', 'allow camera access in your settings to take fit pics.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('photo library access needed', 'allow photo library access in your settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!photoUri || !date) return;
    setSaving(true);
    setSaveError(null);
    try {
      await upsertPost(date, photoUri, caption, tags);
      router.replace({ pathname: '/entry/[date]' as any, params: { date } });
    } catch (e: any) {
      setSaveError(e?.message ?? 'could not save your fit. try again?');
      setSaving(false);
    }
  };

  // ── Photo picker screen ───────────────────────────────────────────────────
  if (!photoUri) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} hitSlop={16}>
          <Feather name="x" size={22} color={Theme.colors.primary} />
        </TouchableOpacity>
        <View style={styles.pickerContent}>
          <Text style={styles.pickerDate}>{date ? formatDate(date) : ''}</Text>
          <Text style={styles.pickerTitle}>
            {date === todayString() ? "add today's look" : 'add a look'}
          </Text>
<View style={styles.pickerButtons}>
            <TouchableOpacity style={styles.pickerBtn} onPress={takePhoto} activeOpacity={0.82}>
              <View style={styles.pickerIconRing}>
                <Feather name="camera" size={28} color={Theme.colors.accent} />
              </View>
              <Text style={styles.pickerBtnLabel}>take photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerBtn} onPress={pickFromLibrary} activeOpacity={0.82}>
              <View style={styles.pickerIconRing}>
                <Feather name="image" size={28} color={Theme.colors.accent} />
              </View>
              <Text style={styles.pickerBtnLabel}>choose from library</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Preview + save screen ─────────────────────────────────────────────────
  const cardWidth = SCREEN_WIDTH - 32;
  const cardHeight = Math.round(cardWidth * (4 / 3));

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.cancelText}>cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerDate}>{date ? formatDate(date) : ''}</Text>
          <TouchableOpacity onPress={() => setPhotoUri(null)} hitSlop={12}>
            <Text style={styles.retakeText}>retake</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Photo preview */}
          <View style={[styles.photoContainer, { height: cardHeight }]}>
            <Image
              source={{ uri: photoUri }}
              style={{ width: cardWidth, height: cardHeight }}
              resizeMode="cover"
            />
          </View>

          {/* Caption */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.captionInput}
              placeholder="add a caption... (optional)"
              placeholderTextColor={Theme.colors.disabled}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={280}
              returnKeyType="done"
            />
          </View>

          {/* Tags */}
          <TagInput value={tags} onChange={setTags} placeholder="add tags, e.g. streetwear, vintage..." />

          {/* Save error */}
          {saveError ? (
            <Text style={styles.errorText}>{saveError}</Text>
          ) : null}

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={Theme.colors.background} />
            ) : (
              <Text style={styles.saveBtnText}>log this fit</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },

  // Picker
  closeBtn: {
    position: 'absolute', top: 56, right: 20, zIndex: 10,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  pickerContent: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingBottom: 40,
  },
  pickerDate: {
    fontSize: Theme.font.xs, color: Theme.colors.secondary,
    marginBottom: 8, letterSpacing: 0.3, textTransform: 'uppercase',
  },
  pickerTitle: {
    fontFamily: Theme.font.brand, fontSize: 32, color: Theme.colors.primary,
    letterSpacing: -0.5, textAlign: 'center', marginBottom: 6,
  },
  pickerSub: { fontSize: Theme.font.sm, color: Theme.colors.secondary, marginBottom: 40 },
  pickerButtons: { flexDirection: 'row', gap: 16, marginTop: 40 },
  pickerBtn: {
    flex: 1, backgroundColor: Theme.colors.surface, borderRadius: Theme.radius.lg,
    borderWidth: 1, borderColor: Theme.colors.border,
    alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 12,
  },
  pickerIconRing: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Theme.colors.accentLight,
    alignItems: 'center', justifyContent: 'center',
  },
  pickerBtnLabel: {
    fontSize: Theme.font.sm, fontWeight: '600',
    color: Theme.colors.primary, textAlign: 'center',
  },

  // Preview
  kav: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 12,
  },
  cancelText: { fontSize: Theme.font.base, color: Theme.colors.secondary, fontWeight: '500' },
  headerDate: {
    fontSize: Theme.font.sm, color: Theme.colors.primary,
    fontWeight: '700', textAlign: 'center', flex: 1, marginHorizontal: 8,
  },
  retakeText: { fontSize: Theme.font.base, color: Theme.colors.accent, fontWeight: '600' },
  photoContainer: { borderRadius: Theme.radius.lg, overflow: 'hidden', marginBottom: 12 },
  inputRow: {
    backgroundColor: Theme.colors.surface, borderRadius: Theme.radius.md,
    borderWidth: 1, borderColor: Theme.colors.border,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, minHeight: 64,
  },
  captionInput: {
    fontSize: Theme.font.base, color: Theme.colors.primary, lineHeight: 22,
  },
  saveBtn: {
    backgroundColor: Theme.colors.accent, borderRadius: Theme.radius.md,
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    marginTop: 12, marginBottom: 8,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: {
    fontSize: Theme.font.base, fontWeight: '700',
    color: Theme.colors.background, letterSpacing: -0.2,
  },
  errorText: {
    fontSize: Theme.font.sm, color: '#D9534F',
    textAlign: 'center', marginTop: 8, marginBottom: 4,
  },
});
