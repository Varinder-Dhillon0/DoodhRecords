import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { COLORS, INTERACTION, RADII, SPACING } from "../../constants";
import Text from "../ScaledText";

type ChipProps = {
  label: string;
  selected?: boolean;
  accessibilityLabel?: string;
  onPress: () => void;
};

export default function Chip({
  label,
  selected = false,
  accessibilityLabel,
  onPress,
}: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <Text
        textVariant="micro"
        style={[styles.label, selected && styles.selectedLabel]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 28,
  },
  selected: {
    backgroundColor: COLORS.greenAccent,
    borderColor: COLORS.greenAccent,
  },
  pressed: { opacity: INTERACTION.pressedOpacity },
  label: {
    color: COLORS.text,
  },
  selectedLabel: { color: COLORS.white, fontWeight: "700" },
});
