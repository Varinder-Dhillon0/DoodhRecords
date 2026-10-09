import React from "react";
import { Image, StyleSheet, View } from "react-native";import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS, RADII } from "../constants";
import { TYPOGRAPHY } from "../constants/typography";
import Text from "./ScaledText";

type AppHeaderProps = {
  title: string;
  eyebrow?: string;
};

export default function AppHeader({ title, eyebrow }: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + 12 }]}
      accessibilityRole="header"
    >
      <View style={styles.left}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          accessibilityIgnoresInvertColors
        />
        <View style={styles.titles}>
          {eyebrow ? (
            <Text style={styles.eyebrow} numberOfLines={1}>
              {eyebrow}
            </Text>
          ) : null}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.surfaceHigh,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  logo: {
    width: 40,
    height: 40,
    borderRadius: RADII.control,
  },
  titles: { flex: 1, gap: 4 },
  eyebrow: {
    fontSize: TYPOGRAPHY.ultraMicro,
    fontWeight: "700",
    color: COLORS.brand,
    letterSpacing: 0.6,
    lineHeight: TYPOGRAPHY.ultraMicro,
    textTransform: "uppercase",
  },
  title: {
    fontSize: TYPOGRAPHY.headingSmall,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.2,
    lineHeight: TYPOGRAPHY.headingSmall + 7,
  },
});
