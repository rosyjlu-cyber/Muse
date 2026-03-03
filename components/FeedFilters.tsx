import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Theme } from '@/constants/Theme';
import { Community, FeedFilters } from '@/utils/api';

interface FeedFiltersProps {
  filters: FeedFilters;
  onChange: (f: FeedFilters) => void;
  communities: Community[];
  availableTags: string[];
}

const DATE_OPTIONS: { label: string; value: FeedFilters['dateFilter'] }[] = [
  { label: 'all time', value: 'all' },
  { label: 'this week', value: 'week' },
  { label: 'this month', value: 'month' },
];

export function FeedFiltersBar({ filters, onChange, communities, availableTags }: FeedFiltersProps) {
  const set = (patch: Partial<FeedFilters>) => onChange({ ...filters, ...patch });

  const toggleDate = (v: FeedFilters['dateFilter']) =>
    set({ dateFilter: filters.dateFilter === v ? 'all' : v });

  const toggleCommunity = (id: string) =>
    set({ communityId: filters.communityId === id ? undefined : id });

  const toggleTag = (tag: string) =>
    set({ tag: filters.tag === tag ? undefined : tag });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {/* Date pills */}
      {DATE_OPTIONS.filter(o => o.value !== 'all').map(o => (
        <Pill
          key={o.value}
          label={o.label}
          active={filters.dateFilter === o.value}
          onPress={() => toggleDate(o.value)}
        />
      ))}

      {communities.length > 0 && <Divider />}

      {/* Community pills */}
      {communities.map(c => (
        <Pill
          key={c.id}
          label={c.name}
          active={filters.communityId === c.id}
          onPress={() => toggleCommunity(c.id)}
        />
      ))}

      {availableTags.length > 0 && <Divider />}

      {/* Tag pills */}
      {availableTags.slice(0, 12).map(tag => (
        <Pill
          key={tag}
          label={tag}
          active={filters.tag === tag}
          onPress={() => toggleTag(tag)}
        />
      ))}
    </ScrollView>
  );
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, backgroundColor: Theme.colors.background },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  pillActive: {
    backgroundColor: Theme.colors.accent,
    borderColor: Theme.colors.accent,
  },
  pillText: {
    fontSize: Theme.font.xs,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.55)',
    letterSpacing: 0.2,
  },
  pillTextActive: {
    color: '#fff',
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: Theme.colors.border,
    marginHorizontal: 2,
  },
});
