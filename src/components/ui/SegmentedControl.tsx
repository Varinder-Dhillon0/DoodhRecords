import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  COLORS,
  INTERACTION,
  RADII,
  SPACING,
} from "../../constants";
import Text from "../ScaledText";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  accessibilityLabel?: string;
};

type SegmentedControlProps<T extends string> = {
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export default function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.field}>
      <Text textVariant="eyebrow" style={styles.label}>
        {label}
      </Text>
      <View style={styles.control}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityLabel={option.accessibilityLabel ?? option.label}
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.segment,
                selected && styles.selected,
                pressed && styles.pressed,
              ]}
            >
              <MaterialCommunityIcons
                name={option.icon}
                size={14}
                color={selected ? COLORS.white : COLORS.muted}
              />
              <Text
                textVariant="micro"
                style={[styles.segmentLabel, selected && styles.selectedLabel]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, gap: 6 },
  label: { color: COLORS.muted },
  control: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: COLORS.surfaceLow,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    padding: SPACING.xs,
    gap: SPACING.xs,
  },
  segment: {
    flex: 1,
    borderRadius: RADII.sm,
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
  },
  selected: { backgroundColor: COLORS.greenAccent },
  pressed: { opacity: INTERACTION.pressedOpacity },
  segmentLabel: {
    color: COLORS.muted,
  },
  selectedLabel: { color: COLORS.white, fontWeight: "700" },
});
