import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, RADII, SHADOWS, withAlpha } from "../constants";
import { TYPOGRAPHY } from "../constants/typography";
import { useAuth } from "../context/AuthContext";
import { useSnackbar } from "../context/SnackbarContext";
import { describeSignInError, mapSignInError } from "../services/authService";
import Text from "../components/ScaledText";
import Button from "../components/Button";

export default function LoginScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { signIn, skip, isSigningIn } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [skipping, setSkipping] = useState(false);

  const handleSignIn = async () => {
    const result = await signIn();
    if (!result.ok) {
      const key = mapSignInError(result.error);
      // "cancelled" is a deliberate user action — stay silent.
      if (key !== "auth.cancelled") {
        showSnackbar(`${t(key)} [${describeSignInError(result.error)}]`);
      }
    }
  };

  const handleSkip = async () => {
    setSkipping(true);
    try {
      await skip();
    } finally {
      setSkipping(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 24, 32),
            paddingBottom: Math.max(insets.bottom + 20, 28),
          },
        ]}
      >
        <View style={styles.hero}>
          <View style={styles.heroIconTile}>
            <MaterialCommunityIcons name="cup-water" size={40} color={COLORS.white} />
          </View>
          <Text style={styles.eyebrow}>{t("home.brandEyebrow")}</Text>
          <Text style={styles.title}>{t("auth.welcomeBack")}</Text>
          <Text style={styles.subtitle}>{t("auth.subtitle")}</Text>
          <View style={styles.heroGlow} />
        </View>

        <View style={styles.card}>
          <View style={styles.benefitRow}>
            <MaterialCommunityIcons
              name="google-drive"
              size={20}
              color={COLORS.brand}
            />
            <Text style={styles.benefitText}>{t("auth.benefitSheets")}</Text>
          </View>
          <View style={styles.benefitRow}>
            <MaterialCommunityIcons
              name="cloud-upload-outline"
              size={20}
              color={COLORS.brand}
            />
            <Text style={styles.benefitText}>{t("auth.benefitBackup")}</Text>
          </View>
          <View style={styles.benefitRow}>
            <MaterialCommunityIcons
              name="wifi-off"
              size={20}
              color={COLORS.brand}
            />
            <Text style={styles.benefitText}>{t("auth.benefitOffline")}</Text>
          </View>
        </View>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isSigningIn}
          disabled={isSigningIn || skipping}
          accessibilityLabel={t("auth.signInWithGoogle")}
          onPress={handleSignIn}
          icon={
            <MaterialCommunityIcons name="google" size={20} color={COLORS.white} />
          }
        >
          <Text textVariant="button" style={styles.primaryText}>
            {t("auth.signInWithGoogle")}
          </Text>
        </Button>

        <Button
          variant="ghost"
          size="md"
          fullWidth
          loading={skipping}
          disabled={isSigningIn || skipping}
          accessibilityLabel={t("auth.skipForNow")}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>{t("auth.skipForNow")}</Text>
        </Button>
        <Text style={styles.skipHint}>{t("auth.skipHint")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    borderRadius: RADII.card,
    backgroundColor: COLORS.brand,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    ...SHADOWS.control,
  },
  heroIconTile: {
    width: 64,
    height: 64,
    borderRadius: RADII.card,
    backgroundColor: withAlpha(COLORS.greenAccent, 0.6),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  eyebrow: {
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
  card: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: RADII.control,
    padding: 14,
    gap: 10,
    ...SHADOWS.card,
  },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  benefitText: { flex: 1, fontSize: TYPOGRAPHY.bodySmall, color: COLORS.text },
  primaryText: { color: COLORS.white },
  skipText: { color: COLORS.brand, fontWeight: "700" },
  skipHint: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: -8,
  },
});
