import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { COLORS, RADII, SHADOWS, SPACING } from "../../constants";

type CardVariant = "default" | "compact" | "muted" | "plain";

type CardProps = {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

const variantStyles = StyleSheet.create({
  default: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    ...SHADOWS.card,
  },
  compact: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    ...SHADOWS.card,
  },
  muted: {
    backgroundColor: COLORS.surfaceLow,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
  },
  plain: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    overflow: "hidden",
    ...SHADOWS.card,
  },
});

export default function Card({
  children,
  variant = "default",
  padding = SPACING.lg,
  radius,
  style,
}: CardProps) {
  return (
    <View
      style={[
        variantStyles[variant],
        { padding },
        radius === undefined ? null : { borderRadius: radius },
        style,
      ]}
    >
      {children}
    </View>
  );
}
