import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { COLORS, INTERACTION, RADII, withAlpha } from "../../constants";
import { TYPOGRAPHY } from "../../constants/typography";
import { getLocalDateString } from "../../utils/dateUtils";
import DateDisplay from "./DateDisplay";
import IconButton from "./IconButton";
import Button from "../Button";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

type CalendarCell = {
  key: string;
  day: number;
  dateKey: string;
  inCurrentMonth: boolean;
};

const toDateKey = (year: number, month: number, day: number): string =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

type CalendarDayProps = {
  selected: boolean;
  isToday: boolean;
  disabled: boolean;
  faded: boolean;
  label: number;
  onPress: () => void;
};

/** Day button with a barely-there tap pop; selection applies instantly. */
function CalendarDay({
  selected,
  isToday,
  disabled,
  faded,
  label,
  onPress,
}: CalendarDayProps) {
  const pop = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(pop, {
        toValue: 0.88,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.spring(pop, {
        toValue: 1,
        friction: 7,
        tension: 380,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={[styles.dayWrap, { transform: [{ scale: pop }] }]}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.day,
          selected && styles.selectedDay,
          isToday && !selected && styles.todayDay,
          pressed && !disabled && styles.pressed,
        ]}
      >
        <RNText
          style={[
            styles.dayText,
            faded && styles.adjacentDayText,
            selected && styles.selectedDayText,
            disabled && styles.disabledDayText,
          ]}
        >
          {label}
        </RNText>
      </Pressable>
    </Animated.View>
  );
}

type LocalizedDatePickerProps = {
  visible: boolean;
  /** Selected date as YYYY-MM-DD. */
  value: string;
  /** Days after this YYYY-MM-DD are disabled. */
  maximumDate?: string;
  onSelect: (date: string) => void;
  onClose: () => void;
};

/**
 * In-app calendar sheet. Unlike the OS date dialog (which follows the
 * device locale on Android), every string here comes from the selected
 * app language.
 */
export default function LocalizedDatePicker({
  visible,
  value,
  maximumDate,
  onSelect,
  onClose,
}: LocalizedDatePickerProps) {
  const { t } = useTranslation();
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(1);
  const [pending, setPending] = useState(value);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const dialogAnim = useRef(new Animated.Value(0)).current;
  const gridFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    backdropAnim.setValue(0);
    dialogAnim.setValue(0);
    Animated.timing(backdropAnim, {
      toValue: 1,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    Animated.timing(dialogAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.bezier(0.05, 0.7, 0.1, 1),
      useNativeDriver: true,
    }).start();
  }, [visible, backdropAnim, dialogAnim]);

  useEffect(() => {
    if (!visible) return;
    setPending(value);
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (match) {
      setViewYear(Number(match[1]));
      setViewMonth(Number(match[2]));
      return;
    }
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth() + 1);
  }, [visible, value]);

  const monthKey = String(viewMonth).padStart(2, "0");

  const cells = useMemo<CalendarCell[]>(() => {
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const leadingCount = new Date(viewYear, viewMonth - 1, 1).getDay();
    const prevMonthDays = new Date(viewYear, viewMonth - 1, 0).getDate();
    const prev = new Date(viewYear, viewMonth - 2, 1);
    const prevYear = prev.getFullYear();
    const prevMonth = prev.getMonth() + 1;
    const next = new Date(viewYear, viewMonth, 1);
    const nextYear = next.getFullYear();
    const nextMonth = next.getMonth() + 1;

    // Always 42 cells (6 fixed rows) so the sheet never changes height
    // when switching months.
    const list: CalendarCell[] = [];
    for (
      let day = prevMonthDays - leadingCount + 1;
      day <= prevMonthDays;
      day += 1
    ) {
      list.push({
        key: `prev-${day}`,
        day,
        dateKey: toDateKey(prevYear, prevMonth, day),
        inCurrentMonth: false,
      });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      list.push({
        key: `current-${day}`,
        day,
        dateKey: toDateKey(viewYear, viewMonth, day),
        inCurrentMonth: true,
      });
    }
    let nextDay = 1;
    while (list.length < 42) {
      list.push({
        key: `next-${nextDay}`,
        day: nextDay,
        dateKey: toDateKey(nextYear, nextMonth, nextDay),
        inCurrentMonth: false,
      });
      nextDay += 1;
    }
    return list;
  }, [viewYear, viewMonth]);

  const canGoNext = useMemo(() => {
    if (!maximumDate) return true;
    const match = /^(\d{4})-(\d{2})/.exec(maximumDate);
    if (!match) return true;
    const maxYear = Number(match[1]);
    const maxMonth = Number(match[2]);
    return viewYear < maxYear || (viewYear === maxYear && viewMonth < maxMonth);
  }, [maximumDate, viewYear, viewMonth]);

  const shiftMonth = (delta: number) => {
    // Swap immediately and breathe the new month in: feels instant,
    // with only a whisper of a fade.
    gridFade.stopAnimation();
    gridFade.setValue(0.35);
    const next = new Date(viewYear, viewMonth - 1 + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth() + 1);
    Animated.timing(gridFade, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const todayKey = getLocalDateString();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
            style={StyleSheet.absoluteFill}
            onPress={onClose}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.dialog,
            {
              opacity: dialogAnim,
              transform: [
                {
                  scale: dialogAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={styles.sheet}
          >
            <View style={styles.monthRow}>
              <IconButton
                icon="chevron-left"
                accessibilityLabel={t("datePicker.previousMonth")}
                onPress={() => shiftMonth(-1)}
                size={32}
                iconSize={20}
              />
              <Animated.View
                style={[styles.monthLabelWrap, { opacity: gridFade }]}
              >
                <RNText style={styles.monthLabel} numberOfLines={1}>
                  {`${t(`months.${monthKey}`)} ${viewYear}`}
                </RNText>
              </Animated.View>
              <View style={{ opacity: canGoNext ? 1 : 0.3 }}>
                <IconButton
                  icon="chevron-right"
                  accessibilityLabel={t("datePicker.nextMonth")}
                  onPress={() => canGoNext && shiftMonth(1)}
                  size={32}
                  iconSize={20}
                />
              </View>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAY_KEYS.map((key) => (
                <RNText key={key} style={styles.weekday}>
                  {t(`datePicker.weekdays.${key}`)}
                </RNText>
              ))}
            </View>

            <Animated.View style={[styles.grid, { opacity: gridFade }]}>
              {cells.map((cell) => {
                const disabled = maximumDate
                  ? cell.dateKey > maximumDate
                  : false;
                const selected = cell.dateKey === pending;
                const isToday = cell.dateKey === todayKey;
                const handlePress = () => {
                  if (!cell.inCurrentMonth) {
                    shiftMonth(
                      cell.dateKey < toDateKey(viewYear, viewMonth, 1) ? -1 : 1,
                    );
                  }
                  setPending(cell.dateKey);
                };
                return (
                  <View key={cell.key} style={styles.cell}>
                    <CalendarDay
                      selected={selected}
                      isToday={isToday}
                      disabled={disabled}
                      faded={!cell.inCurrentMonth}
                      label={cell.day}
                      onPress={handlePress}
                    />
                  </View>
                );
              })}
            </Animated.View>

            <DateDisplay date={pending} style={styles.pendingDate} />

            <View style={styles.footer}>
              <Button
                variant="outline"
                size="sm"
                style={styles.footerButton}
                disabled={maximumDate ? todayKey > maximumDate : false}
                onPress={() => {
                  const now = new Date();
                  setViewYear(now.getFullYear());
                  setViewMonth(now.getMonth() + 1);
                  setPending(todayKey);
                }}
              >
                <RNText style={styles.todayLabel}>
                  {t("datePicker.today")}
                </RNText>
              </Button>
              <Button
                variant="primary"
                size="sm"
                style={styles.footerButton}
                onPress={() => onSelect(pending)}
              >
                <RNText style={styles.confirmLabel}>
                  {t("common.confirm")}
                </RNText>
              </Button>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  backdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: withAlpha("#0F172A", 0.5),
  },
  dialog: { width: "100%", maxWidth: 420, alignSelf: "center" },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 24,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  monthLabelWrap: { flex: 1, alignItems: "center" },
  monthLabel: {
    fontSize: TYPOGRAPHY.bodyLarge,
    fontWeight: "800",
    color: COLORS.text,
  },
  weekRow: { flexDirection: "row", marginBottom: 2 },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: TYPOGRAPHY.caption,
    fontWeight: "700",
    color: COLORS.muted,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 8 },
  cell: {
    width: "14.2857%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 1,
  },
  dayWrap: { width: "100%", height: "100%" },
  day: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADII.pill,
  },
  selectedDay: { backgroundColor: COLORS.brand },
  todayDay: { borderWidth: 1, borderColor: COLORS.brand },
  pressed: { opacity: INTERACTION.pressedOpacity },
  dayText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: "600",
    color: COLORS.text,
  },
  adjacentDayText: { color: COLORS.muted, opacity: 0.45 },
  selectedDayText: { color: COLORS.white, fontWeight: "800" },
  disabledDayText: { color: COLORS.muted, opacity: 0.35 },
  pendingDate: {
    textAlign: "center",
    fontSize: TYPOGRAPHY.bodyLarge,
    fontWeight: "800",
    color: COLORS.brand,
    marginTop: 6,
  },
  footer: { flexDirection: "row", gap: 12, marginTop: 8 },
  footerButton: { flex: 1 },
  todayLabel: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  confirmLabel: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
});
