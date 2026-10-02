import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../types";
import Text from "../components/ScaledText";
import Button from "../components/Button";
import { COLORS, RADII, SHADOWS, withAlpha } from "../constants";
import { TYPOGRAPHY } from "../constants/typography";

type WelcomeNavigation = StackNavigationProp<RootStackParamList, "Welcome">;

const FEATURES = [
  {
    icon: "clipboard-text-outline",
    title: "welcome.recordTitle",
    description: "welcome.recordDescription",
    color: COLORS.brandLight,
    iconColor: COLORS.brand,
  },
  {
    icon: "chart-box-outline",
    title: "welcome.reportsTitle",
    description: "welcome.reportsDescription",
    color: COLORS.blueFixed,
    iconColor: COLORS.blue,
  },
  {
    icon: "calendar-month-outline",
    title: "welcome.simpleTitle",
    description: "welcome.simpleDescription",
    color: COLORS.amberFixed,
    iconColor: COLORS.amber,
  },
] as const;

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<WelcomeNavigation>();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 8, 16),
            paddingBottom: Math.max(insets.bottom + 20, 28),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroIconTile}>
            <MaterialCommunityIcons name="cup-water" size={40} color={COLORS.white} />
          </View>
          <Text style={styles.heroEyebrow}>{t("home.brandEyebrow")}</Text>
          <Text style={styles.title}>{t("welcome.title")}</Text>
          <Text style={styles.subtitle}>{t("welcome.subtitle")}</Text>
          <View style={styles.heroGlow} />
        </View>

        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                <MaterialCommunityIcons
                  name={feature.icon}
                  size={22}
                  color={feature.iconColor}
                />
              </View>
              <View style={styles.featureCopy}>
                <Text style={styles.featureTitle}>{t(feature.title)}</Text>
                <Text style={styles.featureDescription}>
                  {t(feature.description)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => navigation.replace("MainTabs")}
          style={styles.continueButton}
        >
          <Text style={styles.continueText}>{t("welcome.continue")}</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.white} />
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    borderRadius: RADII.card,
    backgroundColor: COLORS.brand,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    ...SHADOWS.control,
  },
  heroIconTile: {
    width: 72,
    height: 72,
    borderRadius: RADII.card,
    backgroundColor: withAlpha(COLORS.greenAccent, 0.6),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroEyebrow: {
    fontSize: TYPOGRAPHY.micro,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: withAlpha(COLORS.brandLight, 0.9),
  },
  title: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.headlineXl,
    fontWeight: "800",
    letterSpacing: -0.6,
    textAlign: "center",
    marginTop: 4,
  },
  subtitle: {
    color: withAlpha(COLORS.inversePrimary, 0.85),
    fontSize: TYPOGRAPHY.bodySmall,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 6,
    maxWidth: 300,
  },
  heroGlow: {
    position: "absolute",
    right: -48,
    bottom: -56,
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: withAlpha(COLORS.brandLight, 0.08),
  },
  features: { width: "100%", gap: 12, marginTop: 20, marginBottom: 20 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.control,
    padding: 14,
    ...SHADOWS.card,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: RADII.control,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCopy: { flex: 1 },
  featureTitle: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: "700",
  },
  featureDescription: {
    color: COLORS.muted,
    fontSize: TYPOGRAPHY.caption,
    marginTop: 2,
  },
  continueButton: { marginTop: "auto", gap: 8 },
  continueText: { color: COLORS.white, fontSize: TYPOGRAPHY.body, fontWeight: "700" },
});
