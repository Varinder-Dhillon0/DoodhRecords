import React, { useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import type { FocusEvent } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { COLORS, ICON_SIZES, INTERACTION, RADII, SPACING } from "../../constants";
import { TYPOGRAPHY } from "../../constants/typography";
import {
  formatFieldValue,
  type SmartField,
  type SmartSuggestion,
} from "../../utils/smartEntry";
import Text, { ScaledTextInput as TextInput } from "../ScaledText";
import Chip from "./Chip";

type StepperInputProps = {
  label: string;
  title: string;
  value: string;
  suffix?: string;
  icon: "cup-water" | "water";
  tone: "blue" | "amber";
  step: number;
  max: number;
  field: SmartField;
  chips: SmartSuggestion[];
  onChange: (value: string) => void;
  onFocus: (event: FocusEvent) => void;
};

/** A tap is instant; holding for half a second starts the accelerating run. */
const HOLD_REPEAT_DELAY_MS = 500;
const START_REPEAT_MS = 220;
const MIN_REPEAT_MS = 70;
const REPEAT_ACCELERATION = 0.82;

export default function StepperInput({
  label,
  title,
  value,
  suffix,
  icon,
  tone,
  step,
  max,
  field,
  chips,
  onChange,
  onFocus,
}: StepperInputProps) {
  const { t } = useTranslation();
  const numericValue = Number(value || 0);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatIntervalRef = useRef(START_REPEAT_MS);
  const repeatDirectionRef = useRef<1 | -1>(1);

  // The repeat timer must build on the latest value, not the value captured
  // when the press started, otherwise every tick rewrites the same number.
  const latestValue = useRef(numericValue);
  latestValue.current = numericValue;

  const applyDelta = (amount: number) => {
    const base = Number.isFinite(latestValue.current) ? latestValue.current : 0;
    const next = Math.min(max, Math.max(0, base + amount));
    onChange(formatFieldValue(field, next));
  };

  const stopRepeat = () => {
    if (holdTimerRef.current !== null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (repeatTimerRef.current !== null) {
      clearTimeout(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
  };

  // Each tick is slower than the last, so a long hold eases into a fast run
  // instead of blasting through the whole range at once.
  const scheduleRepeat = () => {
    repeatTimerRef.current = setTimeout(() => {
      applyDelta(repeatDirectionRef.current * step);
      repeatIntervalRef.current = Math.max(
        MIN_REPEAT_MS,
        Math.round(repeatIntervalRef.current * REPEAT_ACCELERATION),
      );
      scheduleRepeat();
    }, repeatIntervalRef.current);
  };

  // A tap steps once and stops. Holding for HOLD_REPEAT_DELAY_MS hands over to
  // the accelerating repeat.
  const startRepeat = (direction: 1 | -1) => {
    stopRepeat();
    repeatDirectionRef.current = direction;
    applyDelta(direction * step);
    repeatIntervalRef.current = START_REPEAT_MS;
    holdTimerRef.current = setTimeout(scheduleRepeat, HOLD_REPEAT_DELAY_MS);
  };

  useEffect(() => stopRepeat, []);

  const isBlue = tone === "blue";

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.icon,
              isBlue ? styles.iconBlue : styles.iconAmber,
            ]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={ICON_SIZES.xs}
              color={isBlue ? COLORS.blue : COLORS.amber}
            />
          </View>
          <Text style={styles.title}>{label}</Text>
        </View>
      </View>

      <View style={styles.stepper}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} ${t("common.decrease")}`}
          onPressIn={() => startRepeat(-1)}
          onPressOut={stopRepeat}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons name="minus" size={18} color={COLORS.text} />
        </Pressable>
        <View style={styles.valueWrap}>
          <TextInput
            value={value}
            onFocus={onFocus}
            onChangeText={onChange}
            keyboardType="decimal-pad"
            selectTextOnFocus
            style={styles.value}
            textAlign="center"
            accessibilityLabel={`${title} ${label}`}
          />
          {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} ${t("common.increase")}`}
          onPressIn={() => startRepeat(1)}
          onPressOut={stopRepeat}
          style={({ pressed }) => [
            styles.button,
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons name="plus" size={18} color={COLORS.white} />
        </Pressable>
      </View>

      {chips.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {chips.map((chip) => (
            <Chip
              key={chip.value}
              label={
                suffix
                  ? `${formatFieldValue(field, chip.value)}${suffix}`
                  : `${formatFieldValue(field, chip.value)} ${t("common.kg")}`
              }
              selected={Math.abs(numericValue - chip.value) < 0.01}
              onPress={() => onChange(formatFieldValue(field, chip.value))}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: RADII.card,
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  icon: {
    width: 24,
    height: 24,
    borderRadius: RADII.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBlue: { backgroundColor: COLORS.blueFixed },
  iconAmber: { backgroundColor: COLORS.amberFixed },
  title: {
    flex: 1,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: "700",
    color: COLORS.text,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    padding: SPACING.xs,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: { backgroundColor: COLORS.greenAccent },
  valueWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  value: {
    minWidth: 44,
    padding: 0,
    color: COLORS.text,
    fontSize: TYPOGRAPHY.body,
    fontWeight: "800",
  },
  suffix: {
    color: COLORS.muted,
    fontSize: TYPOGRAPHY.micro,
    fontWeight: "700",
  },
  chips: { gap: 6, paddingRight: 4 },
  pressed: { opacity: INTERACTION.pressedOpacity },
});
