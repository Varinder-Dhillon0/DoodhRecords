import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { APP_VERSION, COLORS, RADII, SHADOWS, withAlpha } from "../constants";
import { useDoodhContext } from "../context/DoodhContext";
import { useCurrentMonthYear } from "../hooks/useEntries";
import {
  getDefaultAnimalPricing,
  getMonthKey,
} from "../domain/pricing";
import { validateAnimalPrice } from "../domain/validation";
import MonthYearFilter from "../components/MonthYearFilter";
import { changeAppLanguage, SupportedLanguage } from "../i18n";
import Text from "../components/ScaledText";
import { TYPOGRAPHY } from "../constants/typography";
import AppHeader from "../components/AppHeader";
import AppPicker from "../components/AppPicker";
import Button from "../components/Button";
import ExportCard from "../components/ui/ExportCard";
import PriceField from "../components/ui/PriceField";
import ScreenContainer from "../components/ui/ScreenContainer";
import SettingCard from "../components/ui/SettingCard";
import Slider from "@react-native-community/slider";
import { useFontScale } from "../context/FontScaleContext";
import useKeyboardAwareScroll from "../hooks/useKeyboardAwareScroll";
import {
  FONT_SCALE_RANGE,
  getNearestFontScaleOption,
} from "../constants/typography";
import { useDataExport } from "../hooks/useDataExport";
import { useSnackbar } from "../context/SnackbarContext";

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { showSnackbar } = useSnackbar();
  const { fontScale, setFontScale } = useFontScale();
  const { scrollViewRef, onInputFocus } = useKeyboardAwareScroll(200);
  const { pricingConfig, saveConfig } = useDoodhContext();
  const {
    month,
    year,
    setMonth,
    setYear,
  } = useCurrentMonthYear();
  const [cowPrice, setCowPrice] = useState<string>(() =>
    String(getDefaultAnimalPricing().Cow),
  );
  const [buffaloPrice, setBuffaloPrice] = useState<string>(() =>
    String(getDefaultAnimalPricing().Buffalo),
  );
  const { isExporting, exportData: handleExport } = useDataExport({
    dialogTitle: t("settings.exportDialogTitle"),
    onExported: (exported) => {
      if (!exported) {
        Alert.alert(t("common.error"), t("settings.exportUnavailable"));
      }
    },
    onError: (error) => {
      console.error("Error exporting app data:", error);
      Alert.alert(t("common.error"), t("settings.exportError"));
    },
  });

  useEffect(() => {
    const key = getMonthKey(year, month);
    const defaults = getDefaultAnimalPricing();
    const selected = pricingConfig?.[key] || defaults;
    setCowPrice(String(selected.Cow ?? defaults.Cow));
    setBuffaloPrice(String(selected.Buffalo ?? defaults.Buffalo));
  }, [month, year, pricingConfig]);

  const handleSave = async () => {
    const cowVal = Number(cowPrice);
    const bufVal = Number(buffaloPrice);

    if (!validateAnimalPrice(cowVal) || !validateAnimalPrice(bufVal)) {
      Alert.alert(
        t("settings.invalidInputTitle"),
        t("settings.invalidInputMessage"),
      );
      return;
    }

    try {
      const monthPad = month.padStart(2, "0");
      const cowResult = await saveConfig(year, monthPad, "Cow", cowVal);
      const buffaloResult = await saveConfig(year, monthPad, "Buffalo", bufVal);
      if (!cowResult.ok) {
        throw cowResult.error;
      }
      if (!buffaloResult.ok) {
        throw buffaloResult.error;
      }
      showSnackbar(t("settings.saveSuccess", { period: `${year}-${monthPad}` }));
    } catch (err) {
      console.error("Error saving pricing:", err);
      showSnackbar(t("settings.saveError"));
    }
  };

  return (
    <ScreenContainer
      keyboardAvoiding
      header={<AppHeader eyebrow={t("home.appTitle")} title={t("settings.title")} />}
      contentStyle={styles.contentPad}
      scrollViewRef={scrollViewRef}
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

        <SettingCard
          icon="translate"
          title={t("settings.language")}
          trailing={
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
          }
        />

        <SettingCard
          icon="format-size"
          title={t("settings.fontSize")}
          trailing={
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>
                {t(getNearestFontScaleOption(fontScale).labelKey)}
              </Text>
            </View>
          }
        >
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
        </SettingCard>

        <SettingCard
          icon="currency-inr"
          title={t("settings.pricingConfig")}
          trailing={<View style={styles.statusDot} />}
        >
          <MonthYearFilter
            month={month}
            year={year}
            onMonthChange={setMonth}
            onYearChange={setYear}
          />

          <Text style={styles.helpText}>{t("settings.pricingHelp")}</Text>

          <PriceField
            iconBackground={withAlpha(COLORS.brandLight, 0.5)}
            iconColor={COLORS.brand}
            title={t("settings.cowRate")}
            subtitle={t("settings.rateDescription")}
            value={cowPrice}
            accessibilityLabel={t("settings.cowRate")}
            onChange={setCowPrice}
            onFocus={onInputFocus}
          />
          <PriceField
            iconBackground={COLORS.surfaceLow}
            iconColor={COLORS.muted}
            title={t("settings.buffaloRate")}
            subtitle={t("settings.rateDescription")}
            value={buffaloPrice}
            accessibilityLabel={t("settings.buffaloRate")}
            onChange={setBuffaloPrice}
            onFocus={onInputFocus}
          />

          <Button
            variant="success"
            size="lg"
            fullWidth
            accessibilityLabel={t("settings.savePricing")}
            onPress={handleSave}
            icon={
              <MaterialCommunityIcons name="content-save" size={20} color={COLORS.white} />
            }
          >
            <Text style={styles.saveButtonText}>{t("settings.savePricing")}</Text>
          </Button>
        </SettingCard>

        <SettingCard
          icon="database"
          title={t("settings.dataManagement")}
        >
          <Text style={styles.helpText}>{t("settings.exportDataDescription")}</Text>
          <ExportCard
            label={t("settings.exportData")}
            busyLabel={t("settings.exporting")}
            busy={isExporting}
            onPress={handleExport}
          />
        </SettingCard>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={styles.statusDot} />
            <Text style={styles.footerText}>
              {t("settings.appVersion")} v{APP_VERSION}
            </Text>
          </View>
          <Text style={styles.footerBadge}>{t("settings.offlineReady")}</Text>
        </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  contentPad: {
    gap: 16,
  },
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
  saveButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: TYPOGRAPHY.bodyLarge,
  },
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
});
