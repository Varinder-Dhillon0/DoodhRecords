import React, { useEffect, useMemo, useRef, useState } from "react";
import {
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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useDoodhContext } from "../context/DoodhContext";
import {
  getLocalDateString,
  getYearAndMonth,
} from "../utils/dateUtils";
import { resolveAnimalPricing } from "../domain/pricing";
import { validateEntryInput } from "../domain/validation";
import { calculateEarnings } from "../utils/calculations";
import {
  formatFieldValue,
  getFieldStep,
  getFieldSuggestions,
  getNextCombination,
  isDayComplete,
} from "../utils/smartEntry";
import { formatCurrency } from "../utils/formatters";
import type { Animal, RootStackParamList, Shift } from "../types";
import Text from "../components/ScaledText";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import DateDisplay from "../components/ui/DateDisplay";
import LocalizedDatePicker from "../components/ui/LocalizedDatePicker";
import IconButton from "../components/ui/IconButton";
import SegmentedControl from "../components/ui/SegmentedControl";
import StepperInput from "../components/ui/StepperInput";
import { COLORS, INTERACTION, RADII, SHADOWS, withAlpha } from "../constants";
import { TYPOGRAPHY } from "../constants/typography";
import useKeyboardAwareScroll from "../hooks/useKeyboardAwareScroll";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import { useSnackbar } from "../context/SnackbarContext";

type NavigationProp = StackNavigationProp<RootStackParamList, "EntryForm">;
type EntryRoute = RouteProp<RootStackParamList, "EntryForm">;

export default function EntryFormScreen() {
  const { t } = useTranslation();
  const { showSnackbar } = useSnackbar();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EntryRoute>();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { scrollViewRef, onInputFocus } = useKeyboardAwareScroll(220);
  const { dialog: confirmDialog, showConfirm } = useConfirmDialog();

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
    const animalConfig = resolveAnimalPricing(pricingConfig, year, month);
    return {
      cowPrice: animalConfig.Cow,
      buffaloPrice: animalConfig.Buffalo,
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

  const handleDateChange = (nextDate: string) => {
    setShowDatePicker(false);

    // Backstop for dates beyond the allowed range, in case one slips through.
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
    const validationError = validateEntryInput(qty, fat);
    if (validationError) {
      showConfirm({
        title: t(validationError.titleKey),
        message: t(validationError.messageKey),
        tone: "danger",
        icon: "alert-circle-outline",
        confirmLabel: t("common.ok"),
      });
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
      const result =
        isEditing && entryToEdit?.id !== undefined
          ? await updateEntry(
              {
                ...normalizedData,
                id: entryToEdit.id,
                price: entryToEdit.price,
              },
              entryToEdit.date,
            )
          : await addEntry(normalizedData);
      if (!result.ok) {
        throw result.error;
      }
      showSnackbar(
        t(isEditing ? "entryForm.updateSuccess" : "entryForm.addSuccess"),
      );
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
          <IconButton
            icon="close"
            accessibilityLabel={t("common.close")}
            onPress={handleClose}
            size={32}
            iconSize={20}
          />
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
                size={12}
                color={COLORS.brand}
              />
              <DateDisplay
                date={date}
                style={styles.sheetDate}
                numberOfLines={1}
              />
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
              size={15}
              color={COLORS.white}
            />
            <Text style={styles.saveButtonText}>
              {t("common.save")}
            </Text>
          </Pressable>
        </View>

        <LocalizedDatePicker
          visible={showDatePicker}
          value={date}
          maximumDate={getLocalDateString()}
          onSelect={handleDateChange}
          onClose={() => setShowDatePicker(false)}
        />

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
            <SegmentedControl
              label={t("entryForm.shift")}
              value={shift}
              onChange={setShift}
              options={[
                {
                  value: "Morning",
                  label: t("shifts.morning"),
                  icon: "weather-sunny",
                },
                {
                  value: "Evening",
                  label: t("shifts.evening"),
                  icon: "weather-night",
                },
              ]}
            />
            <SegmentedControl
              label={t("entryForm.animal")}
              value={animal}
              onChange={setAnimal}
              options={[
                {
                  value: "Buffalo",
                  label: t("animals.buffalo"),
                  icon: "cow",
                },
                {
                  value: "Cow",
                  label: t("animals.cow"),
                  icon: "cow",
                },
              ]}
            />
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

          <StepperInput
            label={t("entryForm.milkQuantity")}
            title={t("entryForm.quantityTitle")}
            value={milkQuantity}
            icon="cup-water"
            tone="blue"
            field="milk"
            step={getFieldStep("milk")}
            max={500}
            chips={milkSuggestions}
            onChange={handleMilkChange}
            onFocus={onInputFocus}
          />
          <StepperInput
            label={t("entryForm.fatPercentage")}
            title={t("entryForm.fatTitle")}
            value={fatPercentage}
            suffix="%"
            icon="water"
            tone="amber"
            field="fat"
            step={getFieldStep("fat")}
            max={25}
            chips={fatSuggestions}
            onChange={handleFatChange}
            onFocus={onInputFocus}
          />
        </ScrollView>
      </Animated.View>

      <ConfirmDialog {...confirmDialog} />
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
    justifyContent: "flex-start",
    gap: 5,
    marginTop: 2,
    minHeight: 20,
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
  pressedControl: { opacity: INTERACTION.pressedOpacity },
  pressedSave: { backgroundColor: COLORS.brand },
});
