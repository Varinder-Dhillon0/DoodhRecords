import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, INTERACTION, RADII, SPACING } from "../../constants";
import { TYPOGRAPHY } from "../../constants/typography";
import Text from "../ScaledText";

type ExportCardProps = {
  label: string;
  busyLabel: string;
  busy: boolean;
  accessibilityLabel?: string;
  onPress: () => void;
};

export default function ExportCard({
  label,
  busyLabel,
  busy,
  accessibilityLabel,
  onPress,
}: ExportCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: busy, busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        busy && styles.disabled,
      ]}
    >
      <View style={styles.left}>
        <MaterialCommunityIcons
          name="file-download-outline"
          size={20}
          color={COLORS.blue}
        />
        <Text style={styles.label}>{busy ? busyLabel : label}</Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeLabel}>JSON</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    backgroundColor: COLORS.surfaceLow,
    borderRadius: RADII.control,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
  },
  pressed: { opacity: INTERACTION.pressedOpacity },
  disabled: { opacity: 0.6 },
  left: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  label: { color: COLORS.text, fontSize: TYPOGRAPHY.bodyLarge, fontWeight: "600" },
  badge: {
    alignItems: "center",
    justifyContent: "center",
    height: 22,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.sm,
  },
  badgeLabel: { fontSize: TYPOGRAPHY.micro, fontWeight: "700", color: COLORS.muted },
});
