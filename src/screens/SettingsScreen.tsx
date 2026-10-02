import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { APP_VERSION, COLORS, RADII, SHADOWS, withAlpha } from "../constants";
import { useDoodhContext } from "../context/DoodhContext";
import { getLocalDateString } from "../utils/dateUtils";
import MonthYearFilter from "../components/MonthYearFilter";
import { changeAppLanguage, SupportedLanguage } from "../i18n";
import Text, { ScaledTextInput as TextInput } from "../components/ScaledText";
import { TYPOGRAPHY } from "../constants/typography";
import AppHeader from "../components/AppHeader";
import AppPicker from "../components/AppPicker";
import Slider from "@react-native-community/slider";
import * as Sharing from "expo-sharing";
import { useFontScale } from "../context/FontScaleContext";
import useKeyboardAwareScroll from "../hooks/useKeyboardAwareScroll";
import {
  FONT_SCALE_RANGE,
  getNearestFontScaleOption,
} from "../constants/typography";
import { createDataExportFile } from "../utils/storageManager";
import { useSnackbar } from "../context/SnackbarContext";

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { showSnackbar } = useSnackbar();
  const { fontScale, setFontScale } = useFontScale();
  const { scrollViewRef, onInputFocus } = useKeyboardAwareScroll(200);
  const { pricingConfig, saveConfig } = useDoodhContext();

  const todayStr = getLocalDateString();
  const currentYear = todayStr.slice(0, 4);
  const currentMonth = todayStr.slice(5, 7);

  const [month, setMonth] = useState<string>(currentMonth);
  const [year, setYear] = useState<string>(currentYear);
  const [cowPrice, setCowPrice] = useState<string>("8");
  const [buffaloPrice, setBuffaloPrice] = useState<string>("9");
  const [isExporting, setIsExporting] = useState(false);

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
      showSnackbar(t("settings.saveSuccess", { period: `${year}-${monthPad}` }));
    } catch (err) {
      console.error("Error saving pricing:", err);
      showSnackbar(t("settings.saveError"));
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(t("common.error"), t("settings.exportUnavailable"));
        return;
      }
      const { uri } = await createDataExportFile();
      await Sharing.shareAsync(uri, {
        dialogTitle: t("settings.exportDialogTitle"),
        mimeType: "application/json",
        UTI: "public.json",
      });
    } catch (error) {
      console.error("Error exporting app data:", error);
      Alert.alert(t("common.error"), t("settings.exportError"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <AppHeader eyebrow={t("home.appTitle")} title={t("settings.title")} />

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.contentPad}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={styles.heroEyebrow}>{t("settings.heroEyebrow")}</Text>
            <Text style={styles.heroTitle}>{t("settings.heroTitle")}</Text>
            <Text style={styles.heroSubtitle}>{t("settings.heroSubtitle")}</Text>
          </View>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="tune" size={28} color={COLORS.brandLight} />
          </View>
          <View style={styles.heroGlow} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.cardIcon}>
                <MaterialCommunityIcons
                  name="translate"
                  size={18}
                  color={COLORS.brand}
                />
              </View>
              <Text style={styles.cardTitle}>{t("settings.language")}</Text>
            </View>
            <AppPicker
              minWidth={120}
              selectedValue={
                (i18n.language.startsWith("pa") ? "pa" : "en") as SupportedLanguage
              }
              onValueChange={(value: SupportedLanguage) => {
                void changeAppLanguage(value);
              }}
              options={[
                { label: t("settings.english"), value: "en" },
                { label: t("settings.punjabi"), value: "pa" },
              ]}
              accessibilityLabel={t("settings.language")}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.cardIcon}>
                <MaterialCommunityIcons
                  name="format-size"
                  size={18}
                  color={COLORS.brand}
                />
              </View>
              <Text style={styles.cardTitle}>{t("settings.fontSize")}</Text>
            </View>
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>
                {t(getNearestFontScaleOption(fontScale).labelKey)}
              </Text>
            </View>
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
            minimumTrackTintColor={COLORS.greenAccent}
            maximumTrackTintColor={COLORS.surfaceHigh}
            thumbTintColor={COLORS.greenAccent}
            style={styles.fontSizeSlider}
          />
          <View style={styles.sliderScale}>
            <Text style={styles.sliderScaleText}>{t("settings.fontSizeSmall")}</Text>
            <Text style={styles.sliderScaleText}>{t("settings.fontSizeDefault")}</Text>
            <Text style={styles.sliderScaleText}>{t("settings.fontSizeLarge")}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.cardIcon}>
                <MaterialCommunityIcons
                  name="currency-inr"
                  size={18}
                  color={COLORS.brand}
                />
              </View>
              <Text style={styles.cardTitle}>{t("settings.pricingConfig")}</Text>
            </View>
            <View style={styles.statusDot} />
          </View>

          <MonthYearFilter
            month={month}
            year={year}
            onMonthChange={setMonth}
            onYearChange={setYear}
          />

          <Text style={styles.helpText}>{t("settings.pricingHelp")}</Text>

          <View style={styles.rateRow}>
            <View style={styles.rateLeft}>
              <View style={styles.iconGreen}>
                <MaterialCommunityIcons name="cow" size={20} color={COLORS.brand} />
              </View>
              <View>
                <Text style={styles.rowTitle}>{t("settings.cowRate")}</Text>
                <Text style={styles.rowSubtitle}>{t("settings.rateDescription")}</Text>
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
                accessibilityLabel={t("settings.cowRate")}
              />
            </View>
          </View>

          <View style={styles.rateRow}>
            <View style={styles.rateLeft}>
              <View style={styles.iconGray}>
                <MaterialCommunityIcons name="cow" size={20} color={COLORS.muted} />
              </View>
              <View>
                <Text style={styles.rowTitle}>{t("settings.buffaloRate")}</Text>
                <Text style={styles.rowSubtitle}>{t("settings.rateDescription")}</Text>
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
                accessibilityLabel={t("settings.buffaloRate")}
              />
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handleSave}
            style={({ pressed }) => [styles.saveButton, pressed && styles.pressedControl]}
          >
            <MaterialCommunityIcons name="content-save" size={20} color={COLORS.white} />
            <Text style={styles.saveButtonText}>{t("settings.savePricing")}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.cardIcon}>
              <MaterialCommunityIcons name="database" size={18} color={COLORS.brand} />
            </View>
            <Text style={styles.cardTitle}>{t("settings.dataManagement")}</Text>
          </View>
          <Text style={styles.helpText}>{t("settings.exportDataDescription")}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={isExporting}
            onPress={handleExport}
            style={({ pressed }) => [
              styles.exportButton,
              pressed && styles.pressedControl,
              isExporting && styles.disabledControl,
            ]}
          >
            <View style={styles.exportLeft}>
              <MaterialCommunityIcons
                name="file-download-outline"
                size={20}
                color={COLORS.blue}
              />
              <Text style={styles.exportText}>
                {isExporting ? t("settings.exporting") : t("settings.exportData")}
              </Text>
            </View>
            <View style={styles.jsonBadge}>
              <Text style={styles.jsonBadgeText}>JSON</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={styles.statusDot} />
            <Text style={styles.footerText}>
              {t("settings.appVersion")} v{APP_VERSION}
            </Text>
          </View>
          <Text style={styles.footerBadge}>{t("settings.offlineReady")}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1 },
  contentPad: { paddingHorizontal: 16, paddingBottom: 100, gap: 16 },
  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: RADII.control,
    backgroundColor: COLORS.greenAccent,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...SHADOWS.control,
  },
  heroText: { flex: 1, zIndex: 1 },
  heroEyebrow: {
    fontSize: TYPOGRAPHY.micro,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: COLORS.brandLight,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.headingSmall,
    fontWeight: "800",
    letterSpacing: -0.2,
    color: COLORS.white,
    marginTop: 2,
  },
  heroSubtitle: {
    fontSize: TYPOGRAPHY.caption,
    color: withAlpha(COLORS.brandDim, 0.9),
    marginTop: 2,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: RADII.control,
    backgroundColor: withAlpha(COLORS.white, 0.12),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  heroGlow: {
    position: "absolute",
    right: -32,
    bottom: -36,
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: withAlpha(COLORS.brandLight, 0.1),
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.control,
    padding: 16,
    gap: 12,
    ...SHADOWS.card,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.micro,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: COLORS.brand,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.brandDim,
  },
  pillBadge: {
    backgroundColor: COLORS.surfaceLow,
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillBadgeText: { fontSize: TYPOGRAPHY.caption, fontWeight: "600", color: COLORS.text },
  fontSizeSlider: { width: "100%", height: 40 },
  sliderScale: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  sliderScaleText: { fontSize: TYPOGRAPHY.caption, color: COLORS.muted },
  helpText: { fontSize: TYPOGRAPHY.caption, color: COLORS.muted },
  rateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  rateLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  iconGreen: {
    width: 40,
    height: 40,
    borderRadius: RADII.control,
    backgroundColor: withAlpha(COLORS.brandLight, 0.5),
    justifyContent: "center",
    alignItems: "center",
  },
  iconGray: {
    width: 40,
    height: 40,
    borderRadius: RADII.control,
    backgroundColor: COLORS.surfaceLow,
    justifyContent: "center",
    alignItems: "center",
  },
  rowTitle: { fontSize: TYPOGRAPHY.bodySmall, fontWeight: "700", color: COLORS.text },
  rowSubtitle: {
    fontSize: TYPOGRAPHY.micro,
    color: COLORS.muted,
    fontWeight: "500",
    marginTop: 2,
  },
  priceBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    backgroundColor: COLORS.surfaceLow,
    paddingHorizontal: 10,
    height: 44,
    minWidth: 96,
  },
  currency: {
    color: COLORS.muted,
    fontWeight: "700",
    fontSize: TYPOGRAPHY.bodyLarge,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    textAlign: "right",
    fontSize: TYPOGRAPHY.bodyLarge,
    color: COLORS.text,
    fontWeight: "800",
    height: 44,
  },
  saveButton: {
    minHeight: 48,
    backgroundColor: COLORS.brand,
    borderRadius: RADII.control,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: TYPOGRAPHY.bodyLarge,
  },
  exportButton: {
    minHeight: 48,
    backgroundColor: COLORS.surfaceLow,
    borderRadius: RADII.control,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  exportLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  exportText: { color: COLORS.text, fontSize: TYPOGRAPHY.bodyLarge, fontWeight: "600" },
  jsonBadge: {
    alignItems: "center",
    justifyContent: "center",
    height: 22,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADII.sm,
    paddingHorizontal: 8,
  },
  jsonBadgeText: { fontSize: TYPOGRAPHY.micro, fontWeight: "700", color: COLORS.muted },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerText: { fontSize: TYPOGRAPHY.caption, color: COLORS.muted },
  footerBadge: {
    fontSize: TYPOGRAPHY.micro,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: COLORS.brand,
  },
  pressedControl: { opacity: 0.82 },
  disabledControl: { opacity: 0.6 },
});
