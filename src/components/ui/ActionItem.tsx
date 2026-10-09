import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, INTERACTION, RADII, SPACING } from "../../constants";
import { TYPOGRAPHY } from "../../constants/typography";
import Text from "../ScaledText";

type ActionItemProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  iconBackground: string;
  iconColor: string;
  label: string;
  tone?: "default" | "danger";
  onPress: () => void;
};

export default function ActionItem({
  icon,
  iconBackground,
  iconColor,
  label,
  tone = "default",
  onPress,
}: ActionItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.icon, { backgroundColor: iconBackground }]}>
        <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[styles.label, tone === "danger" && styles.danger]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    backgroundColor: COLORS.surfaceLow,
    borderRadius: RADII.control,
    paddingHorizontal: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  pressed: { opacity: INTERACTION.pressedOpacity },
  icon: {
    width: 36,
    height: 36,
    borderRadius: RADII.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: "700",
    color: COLORS.text,
  },
  danger: { color: COLORS.red },
});
