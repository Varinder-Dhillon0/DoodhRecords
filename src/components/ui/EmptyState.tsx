import React from "react";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, RADII } from "../../constants";
import Text from "../ScaledText";

type EmptyStateProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  title?: string;
  message: string;
  gap?: number;
};

export default function EmptyState({
  icon,
  title,
  message,
  gap = 12,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, { gap }]}>
      <View style={styles.icon}>
        <MaterialCommunityIcons name={icon} size={32} color={COLORS.muted} />
      </View>
      {title ? <Text textVariant="sectionTitle" style={styles.title}>{title}</Text> : null}
      <Text textVariant="caption" style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: COLORS.text,
  },
  message: {
    textAlign: "center",
    color: COLORS.muted,
  },
});
