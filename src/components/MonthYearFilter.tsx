import React from "react";
import { StyleSheet, View } from "react-native";
import { MONTH_OPTIONS, YEAR_OPTIONS } from "../constants";
import { useTranslation } from "react-i18next";
import AppPicker from "./AppPicker";
import { Picker } from "@react-native-picker/picker";

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
  const { t } = useTranslation();

  return (
    <View style={styles.filterRow}>
      <AppPicker
        minWidth={filterBoxMinWidth}
        selectedValue={month}
        onValueChange={onMonthChange}
        dropdownIconColor="#334155"
      >
        {MONTH_OPTIONS.map((item) => (
          <Picker.Item
            key={item.value}
            label={t(`months.${item.value}`)}
            value={item.value}
          />
        ))}
      </AppPicker>
      <AppPicker
        minWidth={filterBoxMinWidth}
        selectedValue={year}
        onValueChange={onYearChange}
        dropdownIconColor="#334155"
      >
        {YEAR_OPTIONS.map((item) => (
          <Picker.Item key={item} label={item} value={item} />
        ))}
      </AppPicker>
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: "row", gap: 8 },
});
