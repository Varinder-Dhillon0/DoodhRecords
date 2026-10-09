import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../constants";
import Text from "../ScaledText";

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  actionAccessibilityLabel?: string;
  onActionPress?: () => void;
};

export default function SectionHeader({
  title,
  actionLabel,
  actionAccessibilityLabel,
  onActionPress,
}: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text textVariant="sectionTitle" style={styles.title}>
        {title}
      </Text>
      {actionLabel && onActionPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionAccessibilityLabel ?? actionLabel}
          onPress={onActionPress}
          style={styles.action}
          hitSlop={8}
        >
          <Text textVariant="caption" style={styles.actionLabel}>
            {actionLabel}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={14}
            color={COLORS.brand}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { color: COLORS.text },
  action: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  actionLabel: {
    color: COLORS.brand,
    fontWeight: "700",
  },
});
