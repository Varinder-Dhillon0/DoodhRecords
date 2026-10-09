import React from "react";
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { COLORS } from "../../constants";

type LoadingIndicatorProps = {
  accessibilityLabel?: string;
  size?: number | "small" | "large";
  style?: StyleProp<ViewStyle>;
};

export default function LoadingIndicator({
  accessibilityLabel,
  size = "large",
  style,
}: LoadingIndicatorProps) {
  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
    >
      <ActivityIndicator size={size} color={COLORS.brand} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
});
