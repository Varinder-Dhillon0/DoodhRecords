import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { APP_VERSION, COLORS } from "../constants";
import { useDoodhContext } from "../context/DoodhContext";
import { getLocalDateString } from "../utils/dateUtils";
import MonthYearFilter from "../components/MonthYearFilter";
import { useTranslation } from "react-i18next";
import { changeAppLanguage, SupportedLanguage } from "../i18n";
import Text from "../components/ScaledText";
import { ScaledTextInput as TextInput } from "../components/ScaledText";
import { TYPOGRAPHY } from "../constants/typography";
import AppPicker from "../components/AppPicker";
import Slider from "@react-native-community/slider";
import { useFontScale } from "../context/FontScaleContext";
import useKeyboardAwareScroll from "../hooks/useKeyboardAwareScroll";
import {
  FONT_SCALE_RANGE,
  getNearestFontScaleOption,
} from "../constants/typography";

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { fontScale, setFontScale } = useFontScale();
  const insets = useSafeAreaInsets();
  const { scrollViewRef, onInputFocus } = useKeyboardAwareScroll(200);
  const { pricingConfig, saveConfig } = useDoodhContext();

  const todayStr = getLocalDateString();
  const currentYear = todayStr.slice(0, 4);
  const currentMonth = todayStr.slice(5, 7);

  const [month, setMonth] = useState<string>(currentMonth);
  const [year, setYear] = useState<string>(currentYear);
  const [cowPrice, setCowPrice] = useState<string>("8");
  const [buffaloPrice, setBuffaloPrice] = useState<string>("9");

  useEffect(() => {
    const key = `${year}-${month.padStart(2, "0")}`;
    const selected = pricingConfig?.[key] || { Cow: 8, Buffalo: 9 };
    setCowPrice(String(selected.Cow ?? 8));
    setBuffaloPrice(String(selected.Buffalo ?? 9));
  }, [month, year, pricingConfig]);

  const handleSave = async () => {
    const cowVal = Number(cowPrice);
    const bufVal = Number(buffaloPrice);

    if (isNaN(cowVal) || cowVal <= 0 || isNaN(bufVal) || bufVal <= 0) {
      Alert.alert(
        t("settings.invalidInputTitle"),
        t("settings.invalidInputMessage"),
      );
      return;
    }

    try {
      const monthPad = month.padStart(2, "0");
      await saveConfig(year, monthPad, "Cow", cowVal);
      await saveConfig(year, monthPad, "Buffalo", bufVal);
      Alert.alert(
        t("common.success"),
        t("settings.saveSuccess", { period: `${year}-${monthPad}` }),
      );
    } catch (err) {
      console.error("Error saving pricing:", err);
      Alert.alert(t("common.error"), t("settings.saveError"));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[styles.header, { paddingTop: Math.max(insets.top + 12, 44) }]}
      >
        <Text style={styles.title}>{t("settings.title")}</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.contentPad}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("settings.language")}</Text>
          <AppPicker
            minWidth={100}
            selectedValue={
              (i18n.language.startsWith("pa")
                ? "pa"
                : "en") as SupportedLanguage
            }
            onValueChange={(value: SupportedLanguage) => {
              void changeAppLanguage(value);
            }}
            dropdownIconColor="#334155"
          >
            <Picker.Item label={t("settings.english")} value="en" />
            <Picker.Item label={t("settings.punjabi")} value="pa" />
          </AppPicker>
        </View>

        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("settings.fontSize")}</Text>
            <Text style={styles.infoValue}>
              {t(getNearestFontScaleOption(fontScale).labelKey)}
            </Text>
          </View>
          <Slider
            accessibilityLabel={t("settings.fontSize")}
            accessibilityRole="adjustable"
            accessibilityValue={{
              min: FONT_SCALE_RANGE.min,
              max: FONT_SCALE_RANGE.max,
              now: fontScale,
              text: t(getNearestFontScaleOption(fontScale).labelKey),
            }}
            minimumValue={FONT_SCALE_RANGE.min}
            maximumValue={FONT_SCALE_RANGE.max}
            step={FONT_SCALE_RANGE.step}
            value={fontScale}
            onValueChange={setFontScale}
            minimumTrackTintColor={COLORS.brand}
            maximumTrackTintColor={COLORS.border}
            thumbTintColor={COLORS.brand}
            style={styles.fontSizeSlider}
          />
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons
              name="currency-inr"
              size={16}
              color={COLORS.brand}
            />
            <Text style={styles.sectionTitle}>
              {t("settings.pricingConfig")}
            </Text>
          </View>
          <MonthYearFilter
            month={month}
            year={year}
            onMonthChange={setMonth}
            onYearChange={setYear}
            filterBoxMinWidth={100}
          />
        </View>

        <Text style={styles.helpText}>{t("settings.pricingHelp")}</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.leftCell}>
              <View style={styles.iconGreen}>
                <MaterialCommunityIcons
                  name="cow"
                  size={20}
                  color={COLORS.brand}
                />
              </View>
              <View>
                <Text style={styles.rowTitle}>{t("settings.cowRate")}</Text>
                <Text style={styles.rowSubtitle}>
                  {t("settings.rateDescription")}
                </Text>
              </View>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.currency}>₹</Text>
              <TextInput
                value={cowPrice}
                onFocus={onInputFocus}
                keyboardType="decimal-pad"
                onChangeText={setCowPrice}
                style={styles.priceInput}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.leftCell}>
              <View style={styles.iconGray}>
                <MaterialCommunityIcons name="cow" size={20} color="#334155" />
              </View>
              <View>
                <Text style={styles.rowTitle}>{t("settings.buffaloRate")}</Text>
                <Text style={styles.rowSubtitle}>
                  {t("settings.rateDescription")}
                </Text>
              </View>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.currency}>₹</Text>
              <TextInput
                value={buffaloPrice}
                onFocus={onInputFocus}
                keyboardType="decimal-pad"
                onChangeText={setBuffaloPrice}
                style={styles.priceInput}
              />
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <MaterialCommunityIcons name="content-save" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>{t("settings.savePricing")}</Text>
        </Pressable>

        <View style={styles.infoBox}>
          <View style={styles.infoLeft}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color="#64748B"
            />
            <Text style={styles.infoLabel}>{t("settings.appVersion")}</Text>
          </View>
          <Text style={styles.infoValue}>v{APP_VERSION}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: {
    fontSize: TYPOGRAPHY.screenTitle,
    fontWeight: "800",
    color: "#0F172A",
  },
  content: { flex: 1 },
  contentPad: { padding: 18, paddingBottom: 100 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  fontSizeSlider: { width: "100%", height: 40 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: {
    fontSize: TYPOGRAPHY.label,
    fontWeight: "800",
    color: COLORS.brand,
    textTransform: "uppercase",
  },
  helpText: {
    fontSize: TYPOGRAPHY.caption,
    color: "#64748B",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 18,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  leftCell: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconGreen: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.brandLight,
    justifyContent: "center",
    alignItems: "center",
  },
  iconGray: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  rowTitle: { fontSize: TYPOGRAPHY.body, fontWeight: "700", color: "#0F172A" },
  rowSubtitle: {
    fontSize: TYPOGRAPHY.micro,
    color: "#64748B",
    fontWeight: "500",
    marginTop: 2,
  },
  priceBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    height: 42,
    minWidth: 95,
  },
  currency: {
    color: "#64748B",
    fontWeight: "700",
    fontSize: TYPOGRAPHY.bodyLarge,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    textAlign: "right",
    fontSize: TYPOGRAPHY.bodyLarge,
    color: "#0F172A",
    fontWeight: "800",
    height: 42,
  },
  saveButton: {
    backgroundColor: COLORS.brand,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    marginBottom: 18,
    shadowColor: COLORS.brand,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  saveButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: TYPOGRAPHY.bodyLarge,
  },
  infoBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoLabel: {
    fontSize: TYPOGRAPHY.label,
    color: "#64748B",
    fontWeight: "700",
  },
  infoValue: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: "800",
    color: "#0F172A",
  },
});
