import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '@/constants/Theme';
import { DayCell, CELL_GAP, CELL_SIZE } from './DayCell';
import { OutfitEntry } from '@/utils/storage';
import { formatMonthYear, getCalendarDays } from '@/utils/dates';

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface CalendarGridProps {
  year: number;
  month: number;
  entries: OutfitEntry[];
  onDayPress: (date: string, hasEntry: boolean) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  canGoNext: boolean;
}

export function CalendarGrid({
  year,
  month,
  entries,
  onDayPress,
  onPrevMonth,
  onNextMonth,
  canGoNext,
}: CalendarGridProps) {
  const days = getCalendarDays(year, month);
  const entryMap = new Map(entries.map(e => [e.date, e.photoUri]));

  return (
    <View style={styles.container}>
      {/* Month navigator */}
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.navBtn} hitSlop={12}>
          <Text style={styles.navChevron}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>{formatMonthYear(year, month)}</Text>
        <TouchableOpacity
          onPress={onNextMonth}
          style={styles.navBtn}
          hitSlop={12}
          disabled={!canGoNext}
        >
          <Text style={[styles.navChevron, !canGoNext && styles.navDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Weekday labels */}
      <View style={styles.weekRow}>
        {WEEK_DAYS.map((d, i) => (
          <Text key={i} style={styles.weekDayText}>
            {d}
          </Text>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid}>
        {days.map(day => (
          <DayCell
            key={day.date}
            day={day.day}
            isCurrentMonth={day.isCurrentMonth}
            isToday={day.isToday}
            isFuture={day.isFuture}
            photoUri={entryMap.get(day.date)}
            onPress={() => onDayPress(day.date, entryMap.has(day.date))}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navChevron: {
    fontSize: 28,
    color: Theme.colors.limeText,
    lineHeight: 32,
  },
  navDisabled: {
    color: Theme.colors.disabledOnLime,
  },
  monthText: {
    fontSize: Theme.font.lg,
    fontWeight: '700',
    color: Theme.colors.limeText,
    letterSpacing: -0.3,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekDayText: {
    width: CELL_SIZE + CELL_GAP,
    textAlign: 'center',
    fontSize: Theme.font.xs,
    fontWeight: '600',
    color: Theme.colors.limeMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: CELL_GAP,
    rowGap: 8,
  },
});
