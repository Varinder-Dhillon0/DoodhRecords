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
        options={MONTH_OPTIONS.map((item) => ({
          label: t(`months.${item.value}`),
          value: item.value,
        }))}
      />
      <AppPicker
        minWidth={filterBoxMinWidth}
        selectedValue={year}
        onValueChange={onYearChange}
        options={YEAR_OPTIONS.map((yearOption) => ({
          label: yearOption,
          value: yearOption,
        }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: "row", gap: 8 },
});
