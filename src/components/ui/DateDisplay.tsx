import React from "react";
import { useTranslation } from "react-i18next";
import { formatDisplayDate } from "../../utils/dateUtils";
import Text from "../ScaledText";

type DateDisplayProps = {
  date?: string;
} & Omit<React.ComponentProps<typeof Text>, "children">;

export default function DateDisplay({ date, ...rest }: DateDisplayProps) {
  const { i18n } = useTranslation();
  return <Text {...rest}>{formatDisplayDate(date, i18n.language)}</Text>;
}
