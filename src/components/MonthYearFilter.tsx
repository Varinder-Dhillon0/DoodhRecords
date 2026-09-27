import React from "react";
import { StyleSheet, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { MONTH_OPTIONS, YEAR_OPTIONS } from "../constants";

type MonthYearFilterProps = {
  month: string;
  year: string;
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
  filterBoxMinWidth?: number;
};

export default function MonthYearFilter({
  month,
  year,
  onMonthChange,
  onYearChange,
  filterBoxMinWidth = 110,
}: MonthYearFilterProps) {
  return (
    <View style={styles.filterRow}>
      <View style={[styles.filterBox, { minWidth: filterBoxMinWidth }]}>
        <Picker
          selectedValue={month}
          onValueChange={onMonthChange}
          style={styles.picker}
          dropdownIconColor="#334155"
        >
          {MONTH_OPTIONS.map((item) => (
            <Picker.Item
              key={item.value}
              label={item.label}
              value={item.value}
            />
          ))}
        </Picker>
      </View>
      <View style={[styles.filterBox, { minWidth: filterBoxMinWidth }]}>
        <Picker
          selectedValue={year}
          onValueChange={onYearChange}
          style={styles.picker}
          dropdownIconColor="#334155"
        >
          {YEAR_OPTIONS.map((item) => (
            <Picker.Item key={item} label={item} value={item} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: "row", gap: 8 },
  filterBox: {
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    justifyContent: "center",
    height: 38,
    overflow: "hidden",
  },
  picker: { color: "#334155", marginHorizontal: -6 },
});
