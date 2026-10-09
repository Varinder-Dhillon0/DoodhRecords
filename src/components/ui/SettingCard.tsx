import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, RADII, SPACING } from "../../constants";
import Text from "../ScaledText";
import Card from "./Card";

type SettingCardProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  title: string;
  trailing?: React.ReactNode;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function SettingCard({
  icon,
  title,
  trailing,
  children,
  style,
}: SettingCardProps) {
  return (
    <Card variant="compact" style={style}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <MaterialCommunityIcons name={icon} size={18} color={COLORS.brand} />
        </View>
        <Text textVariant="eyebrow" style={styles.title}>{title}</Text>
        {trailing}
      </View>
      {children ? <View style={styles.body}>{children}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, flex: 1 },
  icon: {
    width: 32,
    height: 32,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    letterSpacing: 0.8,
    color: COLORS.brand,
  },
  body: { marginTop: SPACING.md, gap: SPACING.md },
});
