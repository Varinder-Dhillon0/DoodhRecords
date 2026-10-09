import React from "react";
import { Platform, StyleProp, ViewStyle } from "react-native";
import DateTimePicker, {
  DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";

type DateFieldProps = {
  value: Date;
  maximumDate?: Date;
  locale?: string;
  onChange: (event: DateTimePickerChangeEvent, date: Date) => void;
  onDismiss: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function DateField({
  value,
  maximumDate,
  locale,
  onChange,
  onDismiss,
  style,
}: DateFieldProps) {
  return (
    <DateTimePicker
      value={value}
      mode="date"
      maximumDate={maximumDate}
      display={Platform.OS === "ios" ? "spinner" : "default"}
      locale={locale}
      onValueChange={onChange}
      onDismiss={onDismiss}
      style={style}
    />
  );
}
