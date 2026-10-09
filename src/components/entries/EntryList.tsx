import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { COLORS, RADII, SHADOWS } from "../../constants";
import type { MilkEntry } from "../../types";
import EntryRow from "../EntryRow";

type EntryListProps = {
  entries: MilkEntry[];
  empty: React.ReactNode;
  onSelect: (entry: MilkEntry) => void;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function EntryList({
  entries,
  empty,
  onSelect,
  elevated = true,
  style,
}: EntryListProps) {
  if (entries.length === 0) {
    return <>{empty}</>;
  }

  return (
    <View style={[styles.list, elevated && styles.elevated, style]}>
      {entries.map((entry, index) => (
        <EntryRow
          key={`${entry.id}-${entry.date}-${index}`}
          entry={entry}
          showDivider={index < entries.length - 1}
          onPress={onSelect}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    overflow: "hidden",
  },
  elevated: { ...SHADOWS.card },
});
