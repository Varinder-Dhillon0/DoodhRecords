import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useFontScale } from "../context/FontScaleContext";

type AppPickerProps<T extends string | number> = Omit<
  React.ComponentProps<typeof Picker>,
  "selectedValue" | "onValueChange"
> & {
  selectedValue: T;
  onValueChange: (value: T, index: number) => void;
  variant?: "filter" | "field";
  minWidth?: number;
};

/** Shared native select styling for filters and form fields. */
export default function AppPicker<T extends string | number>({
  variant = "filter",
  minWidth,
  style,
  dropdownIconColor,
  onValueChange,
  selectedValue,
  ...pickerProps
}: AppPickerProps<T>) {
  const { fontScale, typography } = useFontScale();
  const containerStyle: ViewStyle =
    variant === "filter"
      ? { ...styles.filter, ...(minWidth === undefined ? {} : { minWidth }) }
      : styles.field;

  return (
    <View style={[styles.container, containerStyle]}>
      <Picker
        {...pickerProps}
        selectedValue={selectedValue}
        onValueChange={(value, index) => onValueChange(value as T, index)}
        style={[
          styles.picker,
          variant === "field" && styles.fieldPicker,
          fontScale === 1 ? undefined : { fontSize: typography.bodyLarge },
          style,
        ]}
        dropdownIconColor={dropdownIconColor ?? "#334155"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 10,
  },
  filter: {
    minWidth: 110,
    height: 44,
    backgroundColor: "#F1F5F9",
  },
  field: {
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  picker: {
    color: "#334155",
    marginHorizontal: -6,
  },
  fieldPicker: {
    color: "#0F172A",
  },
});
