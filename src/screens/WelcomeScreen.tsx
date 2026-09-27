import React from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../types";
import Text from "../components/ScaledText";
import Button from "../components/Button";
import { COLORS } from "../constants";
import { TYPOGRAPHY } from "../constants/typography";

type WelcomeNavigation = StackNavigationProp<RootStackParamList, "Welcome">;

const FEATURES = [
  {
    icon: "chart-box",
    title: "welcome.recordTitle",
    description: "welcome.recordDescription",
    color: "#D7F1D8",
    iconColor: "#238044",
  },
  {
    icon: "chart-line",
    title: "welcome.reportsTitle",
    description: "welcome.reportsDescription",
    color: "#D9EFFB",
    iconColor: "#1689C5",
  },
  {
    icon: "calendar-month",
    title: "welcome.simpleTitle",
    description: "welcome.simpleDescription",
    color: "#FFE9A3",
    iconColor: "#B77908",
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
          { paddingTop: Math.max(insets.top + 8, 16), paddingBottom: Math.max(insets.bottom + 20, 28) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require("../../assets/nullstate.png")}
          style={styles.heroImage}
          resizeMode="contain"
          accessibilityLabel={t("welcome.illustration")}
        />

        <View style={styles.intro}>
          <Text style={styles.title}>{t("welcome.title")}</Text>
          <Text style={styles.subtitle}>{t("welcome.subtitle")}</Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                <MaterialCommunityIcons
                  name={feature.icon}
                  size={25}
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
          <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FCFAF2" },
  content: {
    flexGrow: 1,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  heroImage: { width: "100%", height: 260 },
  intro: { alignItems: "center", marginTop: 4, marginBottom: 22 },
  title: {
    color: COLORS.brandDark,
    fontSize: TYPOGRAPHY.brandTitle,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: "#475569",
    fontSize: TYPOGRAPHY.bodyLarge,
    lineHeight: 25,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 300,
  },
  features: { width: "100%", gap: 16, marginBottom: 22 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCopy: { flex: 1 },
  featureTitle: {
    color: "#17212F",
    fontSize: TYPOGRAPHY.body,
    fontWeight: "800",
  },
  featureDescription: {
    color: "#64748B",
    fontSize: TYPOGRAPHY.label,
    marginTop: 3,
  },
  continueButton: { marginTop: "auto", gap: 8 },
  continueText: { color: "#fff", fontSize: TYPOGRAPHY.body, fontWeight: "700" },
});
