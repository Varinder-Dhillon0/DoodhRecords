import React from "react";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, INTERACTION, RADII } from "../../constants";

type IconButtonProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  accessibilityLabel: string;
  onPress: () => void;
  size?: number;
  iconSize?: number;
  backgroundColor?: string;
  iconColor?: string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export default function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  size = 40,
  iconSize = 20,
  backgroundColor = COLORS.surfaceContainer,
  iconColor = COLORS.muted,
  borderRadius = RADII.pill,
  style,
}: IconButtonProps) {
  // Visual size stays compatible with the surrounding layout, while hitSlop
  // expands smaller controls to the shared minimum touch target.
  const hitSlop = Math.max(0, Math.ceil((44 - size) / 2));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor,
        },
        pressed && styles.pressed,
        style,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={iconSize} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: INTERACTION.pressedOpacity },
});
