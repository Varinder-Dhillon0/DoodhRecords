import React, { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import DateTimePicker, { DateTimePickerChangeEvent } from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useDoodhContext } from "../context/DoodhContext";
import { formatDisplayDate, getLocalDateString, getYearAndMonth, parseLocalDate } from "../utils/dateUtils";
import { calculateEarnings } from "../utils/calculations";
import { formatCurrency } from "../utils/formatters";
import { Animal, MilkEntry, RootStackParamList, Shift } from "../types";
import Text, { ScaledTextInput as TextInput } from "../components/ScaledText";
import { TYPOGRAPHY } from "../constants/typography";
import useKeyboardAwareScroll from "../hooks/useKeyboardAwareScroll";
import { useSnackbar } from "../context/SnackbarContext";

type NavigationProp = StackNavigationProp<RootStackParamList, "EntryForm">;
type EntryRoute = RouteProp<RootStackParamList, "EntryForm">;

type StepperFieldProps = {
  label: string;
  title: string;
  subtitle: string;
  value: string;
  suffix?: string;
  icon: "glass-mug-variant" | "water";
  color: "blue" | "amber";
  step: number;
  chips: number[];
  onChange: (value: string) => void;
  onFocus: (event: any) => void;
};

const decimal = (value: number) => value.toFixed(1);

function StepperField({
  label, title, subtitle, value, suffix, icon, color, step, chips, onChange, onFocus,
}: StepperFieldProps) {
  const numericValue = Number(value || 0);
  const changeBy = (amount: number) => {
    const next = Math.max(0, Math.round((numericValue + amount) * 10) / 10);
    onChange(decimal(next));
  };

  return (
    <View style={styles.fieldSection}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepperCard}>
        <View style={styles.stepperInfo}>
          <View style={[styles.metricIcon, color === "blue" ? styles.metricIconBlue : styles.metricIconAmber]}>
            <MaterialCommunityIcons name={icon} size={20} color={color === "blue" ? "#1D4ED8" : "#B45309"} />
          </View>
          <View>
            <Text style={styles.metricTitle}>{title}</Text>
            <Text style={styles.metricSubtitle}>{subtitle}</Text>
          </View>
        </View>
        <View style={styles.stepperControls}>
          <Pressable accessibilityRole="button" accessibilityLabel={label + " decrease"} onPress={() => changeBy(-step)} style={({ pressed }) => [styles.stepperButton, pressed && styles.pressedControl]}>
            <MaterialCommunityIcons name="minus" size={19} color="#334155" />
          </Pressable>
          <View style={styles.stepperValueWrap}>
            <TextInput value={value} onFocus={onFocus} onChangeText={onChange} keyboardType="decimal-pad" selectTextOnFocus style={styles.stepperValue} textAlign="center" accessibilityLabel={label} />
            {suffix ? <Text style={styles.stepperSuffix}>{suffix}</Text> : null}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={label + " increase"} onPress={() => changeBy(step)} style={({ pressed }) => [styles.stepperButton, pressed && styles.pressedControl]}>
            <MaterialCommunityIcons name="plus" size={19} color="#334155" />
          </Pressable>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipList}>
        {chips.map((chip) => {
          const selected = Math.abs(numericValue - chip) < 0.05;
          return (
            <Pressable key={chip} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => onChange(decimal(chip))} style={({ pressed }) => [styles.chip, selected && styles.selectedChip, pressed && styles.pressedControl]}>
              <Text style={[styles.chipText, selected && styles.selectedChipText]}>
                {suffix ? chip.toFixed(1) + suffix : chip + " kg"}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function EntryFormScreen() {
  const { t, i18n } = useTranslation();
  const { showSnackbar } = useSnackbar();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EntryRoute>();
  const insets = useSafeAreaInsets();
  const { scrollViewRef, onInputFocus } = useKeyboardAwareScroll(220);
  const { pricingConfig, addEntry, updateEntry, deleteEntry } = useDoodhContext();

  const entryToEdit = route.params?.entry || null;
  const isEditing = Boolean(entryToEdit && entryToEdit.id !== undefined);
  const [date, setDate] = useState(entryToEdit?.date || getLocalDateString());
  const [animal, setAnimal] = useState<Animal>(entryToEdit?.animal || "Buffalo");
  const [shift, setShift] = useState<Shift>(entryToEdit?.shift || "Morning");
  const [milkQuantity, setMilkQuantity] = useState(entryToEdit?.milk_quantity !== undefined ? String(entryToEdit.milk_quantity) : "15.0");
  const [fatPercentage, setFatPercentage] = useState(entryToEdit?.fat_percentage !== undefined ? String(entryToEdit.fat_percentage) : "6.5");
  const [notes, setNotes] = useState(entryToEdit?.notes || "");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const priceInfo = useMemo(() => {
    const { year, month } = getYearAndMonth(date);
    const animalConfig = pricingConfig[year + "-" + month];
    return { cowPrice: Number(animalConfig?.Cow ?? 8), buffaloPrice: Number(animalConfig?.Buffalo ?? 9) };
  }, [date, pricingConfig]);

  const activeRate = animal === "Cow" ? priceInfo.cowPrice : priceInfo.buffaloPrice;
  const earningsPreview = useMemo(
    () => calculateEarnings(Number(milkQuantity || 0), Number(fatPercentage || 0), activeRate),
    [activeRate, fatPercentage, milkQuantity],
  );

  const handleDateChange = (_: DateTimePickerChangeEvent, selectedDate: Date) => {
    setShowDatePicker(false);
    setDate(getLocalDateString(selectedDate));
  };

  const handleSave = async () => {
    const qty = Number(milkQuantity);
    const fat = Number(fatPercentage);
    if (isNaN(qty) || qty <= 0 || qty > 500) {
      Alert.alert(t("entryForm.invalidMilkTitle"), t("entryForm.invalidMilkMessage"));
      return;
    }
    if (isNaN(fat) || fat <= 0 || fat > 25) {
      Alert.alert(t("entryForm.invalidFatTitle"), t("entryForm.invalidFatMessage"));
      return;
    }

    const normalizedData = { date, animal, shift, milk_quantity: qty, fat_percentage: fat, notes: notes.trim() };
    try {
      if (isEditing && entryToEdit?.id !== undefined) {
        const entryToSave: MilkEntry = { ...normalizedData, id: entryToEdit.id, price: entryToEdit.price };
        await updateEntry(entryToSave, entryToEdit.date);
      } else {
        await addEntry(normalizedData);
      }
      showSnackbar(t(isEditing ? "entryForm.updateSuccess" : "entryForm.addSuccess"));
      navigation.goBack();
    } catch (error) {
      console.error("Error saving entry:", error);
      showSnackbar(t("entryForm.saveFailedMessage"));
    }
  };

  const handleDelete = () => {
    if (!isEditing || entryToEdit?.id === undefined) return;
    Alert.alert(t("entries.deleteConfirmTitle"), t("entries.deleteConfirmMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteEntry(entryToEdit.id, entryToEdit.date);
            showSnackbar(t("entries.deleteSuccess"));
            navigation.goBack();
          } catch {
            showSnackbar(t("entryForm.deleteFailedMessage"));
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
      <View style={[styles.brandHeader, { paddingTop: Math.max(insets.top + 12, 44) }]}>
        <View>
          <Text style={styles.brandTitle}>Doodh Records</Text>
          <Text style={styles.brandSubtitle}>Dairy Management</Text>
        </View>
        <View style={styles.cowBadge}>
          <MaterialCommunityIcons name="cow" size={27} color="#FFFFFF" />
        </View>
      </View>
      <View style={styles.sheet}>
        <View style={styles.dragHandle} />
        <View style={styles.sheetHeader}>
          <View style={styles.sheetHeading}>
            <Text style={styles.sheetTitle}>{isEditing ? "Adjust Log Details" : "Add Log Details"}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t("entryForm.collectionDate")} onPress={() => setShowDatePicker(true)} style={styles.dateTrigger}>
              <Text style={styles.sheetDate}>{formatDisplayDate(date, i18n.language)}</Text>
              <MaterialCommunityIcons name="calendar-outline" size={14} color="#2563EB" />
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={isEditing ? t("entryForm.update") : t("entryForm.save")} onPress={handleSave} style={({ pressed }) => [styles.saveButton, pressed && styles.pressedSave]}>
            <Text style={styles.saveButtonText}>{t("common.save")}</Text>
            <MaterialCommunityIcons name="check-circle-outline" size={17} color="#FFFFFF" />
          </Pressable>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={parseLocalDate(date)}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            locale={i18n.language.startsWith("pa") ? "pa-IN" : undefined}
            onValueChange={handleDateChange}
            onDismiss={() => setShowDatePicker(false)}
          />
        )}
        <ScrollView ref={scrollViewRef} contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.switchGrid}>
            <View style={styles.switchField}>
              <Text style={styles.label}>{t("entryForm.shift")}</Text>
              <View style={styles.segmentedControl}>
                {(["Morning", "Evening"] as Shift[]).map((option) => {
                  const selected = shift === option;
                  return (
                    <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setShift(option)} style={({ pressed }) => [styles.segment, selected && styles.selectedSegment, pressed && styles.pressedControl]}>
                      <MaterialCommunityIcons name={option === "Morning" ? "weather-sunny" : "weather-night"} size={15} color={selected ? "#FFFFFF" : "#64748B"} />
                      <Text style={[styles.segmentText, selected && styles.selectedSegmentText]}>{t("shifts." + option.toLowerCase())}</Text>
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
                    <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setAnimal(option)} style={({ pressed }) => [styles.segment, selected && styles.selectedSegment, pressed && styles.pressedControl]}>
                      <MaterialCommunityIcons name="cow" size={15} color={selected ? "#FFFFFF" : "#64748B"} />
                      <Text style={[styles.segmentText, selected && styles.selectedSegmentText]}>{t("animals." + option.toLowerCase())}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
          <View style={styles.earningsCard}>
            <View>
              <Text style={styles.earningsLabel}>{t("entryForm.estimatedEarnings")}</Text>
              <Text style={styles.earningsValue}>{formatCurrency(earningsPreview)}</Text>
              <Text style={styles.earningsRate}>{t("entryForm.ratePreview", { rate: activeRate })}</Text>
            </View>
            <View style={styles.currencyBadge}><Text style={styles.currencySymbol}>Rs</Text></View>
          </View>
          <StepperField label={t("entryForm.milkQuantity")} title="Quantity" subtitle="in KG / Litres" value={milkQuantity} icon="glass-mug-variant" color="blue" step={0.5} chips={[5, 10, 12, 15, 20]} onChange={setMilkQuantity} onFocus={onInputFocus} />
          <StepperField label={t("entryForm.fatPercentage")} title="Fat Level" subtitle="Percentage %" value={fatPercentage} suffix="%" icon="water" color="amber" step={0.1} chips={[4, 5, 6, 6.5, 7, 8]} onChange={setFatPercentage} onFocus={onInputFocus} />
          <View style={styles.notesSection}>
            <Text style={styles.label}>{t("entryForm.notes")}</Text>
            <TextInput value={notes} onFocus={onInputFocus} onChangeText={setNotes} multiline numberOfLines={3} placeholder={t("entryForm.notesPlaceholder")} placeholderTextColor="#94A3B8" style={styles.notesInput} textAlignVertical="top" />
          </View>
          {isEditing ? (
            <Pressable accessibilityRole="button" onPress={handleDelete} style={({ pressed }) => [styles.deleteButton, pressed && styles.pressedControl]}>
              <MaterialCommunityIcons name="trash-can-outline" size={16} color="#DC2626" />
              <Text style={styles.deleteText}>{t("entryForm.delete")}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#1B5E30" },
  brandHeader: { backgroundColor: "#1B5E30", paddingHorizontal: 24, paddingBottom: 32, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandTitle: { color: "#FFFFFF", fontSize: TYPOGRAPHY.brandTitle, fontWeight: "800" },
  brandSubtitle: { color: "#BBF7D0", fontSize: TYPOGRAPHY.caption, fontWeight: "600", marginTop: 1 },
  cowBadge: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  sheet: { flex: 1, marginTop: -16, backgroundColor: "#FFFFFF", borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: "hidden" },
  dragHandle: { width: 48, height: 6, borderRadius: 3, backgroundColor: "#E2E8F0", alignSelf: "center", marginTop: 12, marginBottom: 12 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 14 },
  sheetHeading: { flex: 1, paddingRight: 12 },
  sheetTitle: { fontSize: TYPOGRAPHY.bodyLarge, fontWeight: "800", color: "#0F172A" },
  dateTrigger: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  sheetDate: { fontSize: TYPOGRAPHY.micro, fontWeight: "700", color: "#2563EB" },
  saveButton: { height: 40, paddingHorizontal: 15, borderRadius: 12, backgroundColor: "#1B5E30", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, shadowColor: "#14532D", shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  saveButtonText: { color: "#FFFFFF", fontSize: TYPOGRAPHY.bodySmall, fontWeight: "800" },
  formContent: { paddingHorizontal: 24, paddingTop: 4 },
  switchGrid: { flexDirection: "row", gap: 12, marginBottom: 16 },
  switchField: { flex: 1 },
  label: { color: "#94A3B8", fontSize: TYPOGRAPHY.micro, fontWeight: "800", textTransform: "uppercase", marginBottom: 7 },
  segmentedControl: { height: 44, flexDirection: "row", backgroundColor: "#F1F5F9", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", padding: 2 },
  segment: { flex: 1, borderRadius: 9, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3 },
  selectedSegment: { backgroundColor: "#2563EB", shadowColor: "#1D4ED8", shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  segmentText: { color: "#64748B", fontSize: TYPOGRAPHY.micro, fontWeight: "800" },
  selectedSegmentText: { color: "#FFFFFF" },
  earningsCard: { minHeight: 112, borderRadius: 16, padding: 16, backgroundColor: "#047857", flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16, shadowColor: "#064E3B", shadowOpacity: 0.18, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  earningsLabel: { color: "#D1FAE5", fontSize: TYPOGRAPHY.micro, fontWeight: "800", textTransform: "uppercase" },
  earningsValue: { color: "#FFFFFF", fontSize: TYPOGRAPHY.screenTitle, fontWeight: "900", marginTop: 2 },
  earningsRate: { color: "#A7F3D0", fontSize: TYPOGRAPHY.micro, fontWeight: "600", marginTop: 2 },
  currencyBadge: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  currencySymbol: { color: "#FFFFFF", fontSize: TYPOGRAPHY.headingSmall, fontWeight: "900" },
  fieldSection: { marginBottom: 16 },
  stepperCard: { minHeight: 76, borderRadius: 16, padding: 13, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepperInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingRight: 6 },
  metricIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  metricIconBlue: { backgroundColor: "#DBEAFE" },
  metricIconAmber: { backgroundColor: "#FEF3C7" },
  metricTitle: { color: "#1E293B", fontSize: TYPOGRAPHY.bodySmall, fontWeight: "800" },
  metricSubtitle: { color: "#94A3B8", fontSize: TYPOGRAPHY.micro, fontWeight: "600", marginTop: 1 },
  stepperControls: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepperButton: { width: 36, height: 36, borderRadius: 11, backgroundColor: "#E2E8F0", alignItems: "center", justifyContent: "center" },
  stepperValueWrap: { minWidth: 48, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  stepperValue: { minWidth: 42, height: 38, padding: 0, color: "#0F172A", fontSize: TYPOGRAPHY.headingSmall, fontWeight: "900" },
  stepperSuffix: { color: "#0F172A", fontSize: TYPOGRAPHY.bodySmall, fontWeight: "800", marginLeft: -2 },
  chipList: { paddingTop: 8, paddingRight: 4, gap: 6 },
  chip: { minHeight: 28, justifyContent: "center", paddingHorizontal: 11, borderRadius: 14, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#FFFFFF" },
  selectedChip: { backgroundColor: "#1B5E30", borderColor: "#1B5E30" },
  chipText: { color: "#475569", fontSize: TYPOGRAPHY.micro, fontWeight: "700" },
  selectedChipText: { color: "#FFFFFF", fontWeight: "800" },
  notesSection: { marginBottom: 14 },
  notesInput: { minHeight: 82, padding: 12, color: "#0F172A", fontSize: TYPOGRAPHY.bodySmall, fontWeight: "500", backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 14 },
  deleteButton: { minHeight: 42, marginTop: 2, borderRadius: 12, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  deleteText: { color: "#DC2626", fontSize: TYPOGRAPHY.caption, fontWeight: "800" },
  pressedControl: { opacity: 0.78, transform: [{ scale: 0.96 }] },
  pressedSave: { backgroundColor: "#134522", transform: [{ scale: 0.98 }] },
});
