import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import DateTimePicker, {
  DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useDoodhContext } from "../context/DoodhContext";
import {
  formatDisplayDate,
  getLocalDateString,
  getYearAndMonth,
  parseLocalDate,
} from "../utils/dateUtils";
import { calculateEarnings } from "../utils/calculations";
import {
  formatFieldValue,
  getFieldStep,
  getFieldSuggestions,
  getNextCombination,
  isDayComplete,
  SmartField,
  SmartSuggestion,
} from "../utils/smartEntry";
import { formatCurrency } from "../utils/formatters";
import { Animal, MilkEntry, RootStackParamList, Shift } from "../types";
import Text, { ScaledTextInput as TextInput } from "../components/ScaledText";
import { COLORS, RADII, SHADOWS, withAlpha } from "../constants";
import { TYPOGRAPHY } from "../constants/typography";
import useKeyboardAwareScroll from "../hooks/useKeyboardAwareScroll";
import { useSnackbar } from "../context/SnackbarContext";

type NavigationProp = StackNavigationProp<RootStackParamList, "EntryForm">;
type EntryRoute = RouteProp<RootStackParamList, "EntryForm">;

type StepperFieldProps = {
  label: string;
  title: string;
  badge?: string;
  value: string;
  suffix?: string;
  icon: "cup-water" | "water";
  color: "blue" | "amber";
  step: number;
  max: number;
  field: SmartField;
  chips: SmartSuggestion[];
  onChange: (value: string) => void;
  onFocus: (event: any) => void;
};

/** A tap is instant; holding for half a second starts the accelerating run. */
const HOLD_REPEAT_DELAY_MS = 500;
const START_REPEAT_MS = 220;
const MIN_REPEAT_MS = 70;
const REPEAT_ACCELERATION = 0.82;

function StepperField({
  label,
  title,
  badge,
  value,
  suffix,
  icon,
  color,
  step,
  max,
  field,
  chips,
  onChange,
  onFocus,
}: StepperFieldProps) {
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

  const isBlue = color === "blue";

  return (
    <View style={styles.fieldSection}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldHeaderLeft}>
          <View
            style={[
              styles.fieldIcon,
              isBlue ? styles.fieldIconBlue : styles.fieldIconAmber,
            ]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={15}
              color={isBlue ? COLORS.blue : COLORS.amber}
            />
          </View>
          <Text style={styles.fieldTitle}>{label}</Text>
        </View>
        {badge && (
          <View
            style={[
              styles.fieldBadge,
              isBlue ? styles.fieldBadgeBlue : styles.fieldBadgeAmber,
            ]}
          >
            {isBlue ? null : (
              <MaterialCommunityIcons
                name="seal"
                size={12}
                color={COLORS.amber}
              />
            )}
            {badge && (
              <Text
                style={[
                  styles.fieldBadgeText,
                  isBlue
                    ? styles.fieldBadgeTextBlue
                    : styles.fieldBadgeTextAmber,
                ]}
              >
                {badge}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.stepperCard}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} decrease`}
          onPressIn={() => startRepeat(-1)}
          onPressOut={stopRepeat}
          style={({ pressed }) => [
            styles.stepperButton,
            pressed && styles.pressedControl,
          ]}
        >
          <MaterialCommunityIcons name="minus" size={18} color={COLORS.text} />
        </Pressable>
        <View style={styles.stepperValueWrap}>
          <TextInput
            value={value}
            onFocus={onFocus}
            onChangeText={onChange}
            keyboardType="decimal-pad"
            selectTextOnFocus
            style={styles.stepperValue}
            textAlign="center"
            accessibilityLabel={`${title} ${label}`}
          />
          {suffix ? <Text style={styles.stepperSuffix}>{suffix}</Text> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} increase`}
          onPressIn={() => startRepeat(1)}
          onPressOut={stopRepeat}
          style={({ pressed }) => [
            styles.stepperButton,
            styles.stepperButtonPrimary,
            pressed && styles.pressedControl,
          ]}
        >
          <MaterialCommunityIcons name="plus" size={18} color={COLORS.white} />
        </Pressable>
      </View>

      {chips.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipList}
        >
          {chips.map((chip) => {
            const selected = Math.abs(numericValue - chip.value) < 0.01;
            return (
              <Pressable
                key={chip.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onChange(formatFieldValue(field, chip.value))}
                style={({ pressed }) => [
                  styles.chip,
                  selected && styles.selectedChip,
                  pressed && styles.pressedControl,
                ]}
              >
                <Text
                  style={[styles.chipText, selected && styles.selectedChipText]}
                >
                  {suffix
                    ? `${formatFieldValue(field, chip.value)}${suffix}`
                    : `${formatFieldValue(field, chip.value)} kg`}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

export default function EntryFormScreen() {
  const { t, i18n } = useTranslation();
  const { showSnackbar } = useSnackbar();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EntryRoute>();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { scrollViewRef, onInputFocus } = useKeyboardAwareScroll(220);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const [isClosing, setIsClosing] = useState(false);

  // The backdrop fades in on its own, then the sheet follows slightly after, so
  // the two layers never read as one combined slide.
  useEffect(() => {
    Animated.timing(backdropAnim, {
      toValue: 1,
      duration: 190,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 340,
      delay: 110,
      easing: Easing.bezier(0.22, 1, 0.32, 1),
      useNativeDriver: true,
    }).start();
  }, [backdropAnim, sheetAnim]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    Animated.parallel([
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => navigation.goBack());
  };

  const entryToEdit = route.params?.entry || null;
  const isEditing = Boolean(entryToEdit && entryToEdit.id !== undefined);
  const { entries, pricingConfig, addEntry, updateEntry } = useDoodhContext();

  const [date, setDate] = useState(entryToEdit?.date || getLocalDateString());

  // Opening a date lands on the first slot that still needs filling. When
  // editing, the stored values always win.
  const initialCombination = useRef(
    isEditing ? null : getNextCombination(date, entries),
  ).current;

  const [animal, setAnimal] = useState<Animal>(
    entryToEdit?.animal || initialCombination?.animal || "Buffalo",
  );
  const [shift, setShift] = useState<Shift>(
    entryToEdit?.shift || initialCombination?.shift || "Morning",
  );
  const [milkQuantity, setMilkQuantity] = useState(
    entryToEdit?.milk_quantity !== undefined
      ? String(entryToEdit.milk_quantity)
      : "",
  );
  const [fatPercentage, setFatPercentage] = useState(
    entryToEdit?.fat_percentage !== undefined
      ? String(entryToEdit.fat_percentage)
      : "",
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const milkSuggestions = useMemo(
    () =>
      getFieldSuggestions(entries, {
        animal,
        shift,
        field: "milk",
        current: Number(milkQuantity || 0),
        referenceDate: date,
      }),
    [animal, date, entries, milkQuantity, shift],
  );

  const fatSuggestions = useMemo(
    () =>
      getFieldSuggestions(entries, {
        animal,
        shift,
        field: "fat",
        current: Number(fatPercentage || 0),
        referenceDate: date,
      }),
    [animal, date, entries, fatPercentage, shift],
  );

  // An empty field is prefilled from the user's own most likely value. Once the
  // user types or taps a suggestion, this never runs again.
  const hasEditedMilk = useRef(milkQuantity !== "");
  const hasEditedFat = useRef(fatPercentage !== "");
  const [milkPrefill] = useState(milkSuggestions);
  const [fatPrefill] = useState(fatSuggestions);

  useEffect(() => {
    if (hasEditedMilk.current) return;
    const seed = milkPrefill[0];
    if (seed) setMilkQuantity(formatFieldValue("milk", seed.value));
  }, [milkPrefill]);

  useEffect(() => {
    if (hasEditedFat.current) return;
    const seed = fatPrefill[0];
    if (seed) setFatPercentage(formatFieldValue("fat", seed.value));
  }, [fatPrefill]);

  const dayIsComplete = useMemo(
    () => isDayComplete(date, entries),
    [date, entries],
  );

  const priceInfo = useMemo(() => {
    const { year, month } = getYearAndMonth(date);
    const animalConfig = pricingConfig[year + "-" + month];
    return {
      cowPrice: Number(animalConfig?.Cow ?? 8),
      buffaloPrice: Number(animalConfig?.Buffalo ?? 9),
    };
  }, [date, pricingConfig]);

  const activeRate =
    animal === "Cow" ? priceInfo.cowPrice : priceInfo.buffaloPrice;
  const earningsPreview = useMemo(
    () =>
      calculateEarnings(
        Number(milkQuantity || 0),
        Number(fatPercentage || 0),
        activeRate,
      ),
    [activeRate, fatPercentage, milkQuantity],
  );

  // Suggestions are a convenience only: anything the user types or taps sticks.
  const handleMilkChange = (next: string) => {
    hasEditedMilk.current = true;
    setMilkQuantity(next);
  };

  const handleFatChange = (next: string) => {
    hasEditedFat.current = true;
    setFatPercentage(next);
  };

  const handleDateChange = (
    _: DateTimePickerChangeEvent,
    selectedDate: Date,
  ) => {
    setShowDatePicker(false);
    const nextDate = getLocalDateString(selectedDate);

    // Backstop for the picker's own maximumDate, in case a platform still
    // emits a future value.
    if (nextDate > getLocalDateString()) return;

    setDate(nextDate);

    // Picking a date is "opening" that day, so the slot is chosen again.
    const next = getNextCombination(nextDate, entries);
    if (next) {
      setShift(next.shift);
      setAnimal(next.animal);
    }
  };

  const handleSave = async () => {
    const qty = Number(milkQuantity);
    const fat = Number(fatPercentage);
    if (isNaN(qty) || qty <= 0 || qty > 500) {
      Alert.alert(
        t("entryForm.invalidMilkTitle"),
        t("entryForm.invalidMilkMessage"),
      );
      return;
    }
    if (isNaN(fat) || fat <= 0 || fat > 25) {
      Alert.alert(
        t("entryForm.invalidFatTitle"),
        t("entryForm.invalidFatMessage"),
      );
      return;
    }

    const normalizedData = {
      date,
      animal,
      shift,
      milk_quantity: qty,
      fat_percentage: fat,
      notes: entryToEdit?.notes || "",
    };
    try {
      if (isEditing && entryToEdit?.id !== undefined) {
        const entryToSave: MilkEntry = {
          ...normalizedData,
          id: entryToEdit.id,
          price: entryToEdit.price,
        };
        await updateEntry(entryToSave, entryToEdit.date);
        showSnackbar(t("entryForm.updateSuccess"));
      } else {
        await addEntry(normalizedData);
        showSnackbar(t("entryForm.addSuccess"));
      }
      handleClose();
    } catch (error) {
      console.error("Error saving entry:", error);
      showSnackbar(t("entryForm.saveFailedMessage"));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.root}
    >
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          {
            maxHeight: height * 0.92,
            opacity: sheetAnim,
            transform: [
              {
                translateY: sheetAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [height, 0],
                }),
              },
              {
                scale: sheetAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.96, 1],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.handleArea} accessibilityElementsHidden>
          <View style={styles.handle} />
        </View>

        <View
          style={[styles.sheetHeader, { paddingTop: insets.top > 0 ? 4 : 0 }]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
            onPress={handleClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressedControl,
            ]}
          >
            <MaterialCommunityIcons
              name="close"
              size={20}
              color={COLORS.muted}
            />
          </Pressable>
          <View style={styles.sheetHeading}>
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {isEditing
                ? t("entryForm.adjustDetails")
                : t("entryForm.logDetails")}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("entryForm.collectionDate")}
              onPress={() => setShowDatePicker(true)}
              style={styles.dateTrigger}
            >
              <MaterialCommunityIcons
                name="calendar-today"
                size={13}
                color={COLORS.brand}
              />
              <Text style={styles.sheetDate} numberOfLines={1}>
                {formatDisplayDate(date, i18n.language)}
              </Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isEditing ? t("entryForm.update") : t("entryForm.save")
            }
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.pressedSave,
            ]}
          >
            <MaterialCommunityIcons
              name="check"
              size={17}
              color={COLORS.white}
            />
            <Text style={styles.saveButtonText}>{t("common.save")}</Text>
          </Pressable>
        </View>

        {showDatePicker ? (
          <DateTimePicker
            value={parseLocalDate(date)}
            mode="date"
            maximumDate={new Date()}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            locale={i18n.language.startsWith("pa") ? "pa-IN" : undefined}
            onValueChange={handleDateChange}
            onDismiss={() => setShowDatePicker(false)}
          />
        ) : null}

        <ScrollView
          ref={scrollViewRef}
          style={styles.formScroll}
          contentContainerStyle={[
            styles.formContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!isEditing && dayIsComplete ? (
            <View style={styles.completeNotice}>
              <MaterialCommunityIcons
                name="check-circle"
                size={16}
                color={COLORS.greenAccent}
              />
              <Text style={styles.completeNoticeText}>
                {t("entryForm.allRecordsCompleted")}
              </Text>
            </View>
          ) : null}

          <View style={styles.switchGrid}>
            <View style={styles.switchField}>
              <Text style={styles.label}>{t("entryForm.shift")}</Text>
              <View style={styles.segmentedControl}>
                {(["Morning", "Evening"] as Shift[]).map((option) => {
                  const selected = shift === option;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setShift(option)}
                      style={({ pressed }) => [
                        styles.segment,
                        selected && styles.selectedSegment,
                        pressed && styles.pressedControl,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={
                          option === "Morning"
                            ? "weather-sunny"
                            : "weather-night"
                        }
                        size={14}
                        color={selected ? COLORS.white : COLORS.muted}
                      />
                      <Text
                        style={[
                          styles.segmentText,
                          selected && styles.selectedSegmentText,
                        ]}
                      >
                        {t("shifts." + option.toLowerCase())}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={styles.switchField}>
              <Text style={styles.label}>{t("entryForm.animal")}</Text>
              <View style={styles.segmentedControl}>
                {(["Buffalo", "Cow"] as Animal[]).map((option) => {
                  const selected = animal === option;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setAnimal(option)}
                      style={({ pressed }) => [
                        styles.segment,
                        selected && styles.selectedSegment,
                        pressed && styles.pressedControl,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="cow"
                        size={14}
                        color={selected ? COLORS.white : COLORS.muted}
                      />
                      <Text
                        style={[
                          styles.segmentText,
                          selected && styles.selectedSegmentText,
                        ]}
                      >
                        {t("animals." + option.toLowerCase())}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.earningsCard}>
            <View style={styles.earningsInfo}>
              <Text style={styles.earningsLabel}>
                {t("entryForm.estimatedEarnings")}
              </Text>
              <View style={styles.earningsValueRow}>
                <Text style={styles.earningsValue}>
                  {formatCurrency(earningsPreview)}
                </Text>
                <Text style={styles.earningsCalculated}>
                  {t("entryForm.calculated")}
                </Text>
              </View>
              <Text style={styles.earningsRate}>
                {t("entryForm.ratePreview", { rate: activeRate })}
              </Text>
            </View>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencySymbol}>₹</Text>
            </View>
          </View>

          <StepperField
            label={t("entryForm.milkQuantity")}
            title={t("entryForm.quantityTitle")}
            // badge={t("entryForm.yieldInput")}
            value={milkQuantity}
            icon="cup-water"
            color="blue"
            field="milk"
            step={getFieldStep("milk")}
            max={500}
            chips={milkSuggestions}
            onChange={handleMilkChange}
            onFocus={onInputFocus}
          />
          <StepperField
            label={t("entryForm.fatPercentage")}
            title={t("entryForm.fatTitle")}
            // badge={t("entryForm.optimalGrade")}
            value={fatPercentage}
            suffix="%"
            icon="water"
            color="amber"
            field="fat"
            step={getFieldStep("fat")}
            max={25}
            chips={fatSuggestions}
            onChange={handleFatChange}
            onFocus={onInputFocus}
          />
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: withAlpha("#0F172A", 0.6),
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADII.sheet,
    borderTopRightRadius: RADII.sheet,
    overflow: "hidden",
    ...SHADOWS.sheet,
  },
  handleArea: {
    width: "100%",
    paddingTop: 12,
    paddingBottom: 6,
    alignItems: "center",
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceDim,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.surfaceContainer,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetHeading: { flex: 1 },
  sheetTitle: {
    fontSize: TYPOGRAPHY.headingSmall,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  dateTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  sheetDate: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: "500",
    color: COLORS.muted,
  },
  saveButton: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.greenAccent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: "700",
  },
  formScroll: { flexShrink: 1 },
  formContent: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },
  completeNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADII.control,
    backgroundColor: withAlpha(COLORS.greenAccent, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(COLORS.greenAccent, 0.24),
  },
  completeNoticeText: {
    flex: 1,
    color: COLORS.greenAccent,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: "700",
  },
  switchGrid: { flexDirection: "row", alignItems: "stretch", gap: 12 },
  switchField: { flex: 1, gap: 6 },
  label: {
    color: COLORS.muted,
    fontSize: TYPOGRAPHY.micro,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  segmentedControl: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: COLORS.surfaceLow,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    borderRadius: RADII.sm,
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  selectedSegment: { backgroundColor: COLORS.greenAccent },
  segmentText: {
    color: COLORS.muted,
    fontSize: TYPOGRAPHY.micro,
    fontWeight: "600",
  },
  selectedSegmentText: { color: COLORS.white, fontWeight: "700" },
  earningsCard: {
    borderRadius: RADII.control,
    padding: 12,
    backgroundColor: COLORS.greenAccent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  earningsInfo: { zIndex: 1 },
  earningsLabel: {
    color: COLORS.brandDim,
    fontSize: TYPOGRAPHY.micro,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  earningsValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 2,
  },
  earningsValue: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.heading,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  earningsCalculated: {
    color: withAlpha(COLORS.brandDim, 0.8),
    fontSize: TYPOGRAPHY.caption,
  },
  earningsRate: {
    color: withAlpha(COLORS.white, 0.8),
    fontSize: TYPOGRAPHY.micro,
    fontWeight: "500",
    marginTop: 1,
  },
  currencyBadge: {
    width: 36,
    height: 36,
    borderRadius: RADII.control,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: withAlpha(COLORS.white, 0.15),
    borderWidth: 1,
    borderColor: withAlpha(COLORS.white, 0.2),
    zIndex: 1,
  },
  currencySymbol: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.bodyLarge,
    fontWeight: "800",
  },
  earningsGlow: {
    position: "absolute",
    right: -24,
    bottom: -24,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: withAlpha(COLORS.white, 0.05),
  },
  fieldSection: {
    borderRadius: RADII.card,
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    padding: 12,
    gap: 8,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  fieldHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  fieldIcon: {
    width: 24,
    height: 24,
    borderRadius: RADII.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldIconBlue: { backgroundColor: COLORS.blueFixed },
  fieldIconAmber: { backgroundColor: COLORS.amberFixed },
  fieldTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: "700",
    color: COLORS.text,
  },
  fieldBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: RADII.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  fieldBadgeBlue: { backgroundColor: withAlpha(COLORS.brandLight, 0.5) },
  fieldBadgeAmber: { backgroundColor: withAlpha(COLORS.amberFixed, 0.6) },
  fieldBadgeText: { fontSize: TYPOGRAPHY.micro, fontWeight: "700" },
  fieldBadgeTextBlue: { color: COLORS.brand },
  fieldBadgeTextAmber: { color: COLORS.amber },
  stepperCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    padding: 4,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonPrimary: { backgroundColor: COLORS.greenAccent },
  stepperValueWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  stepperValue: {
    minWidth: 44,
    padding: 0,
    color: COLORS.text,
    fontSize: TYPOGRAPHY.body,
    fontWeight: "800",
  },
  stepperSuffix: {
    color: COLORS.muted,
    fontSize: TYPOGRAPHY.micro,
    fontWeight: "700",
  },
  chipList: { gap: 6, paddingRight: 4 },
  chip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedChip: {
    backgroundColor: COLORS.greenAccent,
    borderColor: COLORS.greenAccent,
  },
  chipText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.micro,
    fontWeight: "600",
  },
  selectedChipText: { color: COLORS.white, fontWeight: "700" },
  pressedControl: { opacity: 0.78 },
  pressedSave: { backgroundColor: COLORS.brand },
});
