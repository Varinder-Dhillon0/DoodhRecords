import React from "react";
import { StyleSheet, View } from "react-native";
import { MONTH_OPTIONS, YEAR_OPTIONS } from "../constants";
import { useTranslation } from "react-i18next";
import AppPicker from "./AppPicker";

type MonthYearFilterProps = {
  month: string;
  year: string;
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
};

export default function MonthYearFilter({
  month,
  year,
  onMonthChange,
  onYearChange,
}: MonthYearFilterProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.filterRow}>
      <View style={styles.filterSlot}>
        <AppPicker
          selectedValue={month}
          onValueChange={onMonthChange}
          options={MONTH_OPTIONS.map((item) => ({
            label: t(`months.${item.value}`),
            value: item.value,
          }))}
        />
      </View>
      <View style={styles.filterSlot}>
        <AppPicker
          selectedValue={year}
          onValueChange={onYearChange}
          options={YEAR_OPTIONS.map((yearOption) => ({
            label: yearOption,
            value: yearOption,
          }))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  filterSlot: { flex: 1, maxWidth: 132 },
});
