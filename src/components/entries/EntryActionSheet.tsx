import React, { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { COLORS, RADII, withAlpha } from "../../constants";
import { TYPOGRAPHY } from "../../constants/typography";
import type { MilkEntry } from "../../types";
import { formatCurrency, formatNumber } from "../../utils/formatters";
import Text from "../ScaledText";
import ActionItem from "../ui/ActionItem";
import DateDisplay from "../ui/DateDisplay";
import IconButton from "../ui/IconButton";

type EntryActionSheetProps = {
  entry: MilkEntry | null;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export default function EntryActionSheet({
  entry,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
}: EntryActionSheetProps) {
  const { t } = useTranslation();
  const sheetProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!entry) return;
    sheetProgress.setValue(0);
    Animated.timing(sheetProgress, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [entry, sheetProgress]);

  return (
    <Modal
      transparent
      visible={!!entry}
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [
                {
                  translateY: sheetProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [72, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.indicator} />
            <View style={styles.header}>
              <View style={styles.heading}>
                <Text style={styles.title}>
                  {entry &&
                    t("entries.entryTitle", {
                      shift: t(`shifts.${entry.shift.toLowerCase()}`),
                      animal: t(`animals.${entry.animal.toLowerCase()}`),
                    })}
                </Text>
                <Text style={styles.stats}>
                  <DateDisplay date={entry?.date} /> •{" "}
                  {formatNumber(entry?.milk_quantity, 1)}kg •{" "}
                  {entry
                    ? formatCurrency(
                        (entry.fat_percentage ?? 0) *
                          (entry.milk_quantity ?? 0) *
                          (entry.price ?? 0),
                      )
                    : formatCurrency(0)}
                </Text>
              </View>
              <IconButton
                icon="close"
                accessibilityLabel={t("common.close")}
                onPress={onClose}
                size={32}
                iconSize={20}
              />
            </View>

            <View style={styles.actions}>
              <ActionItem
                icon="pencil"
                iconBackground={withAlpha(COLORS.brandLight, 0.5)}
                iconColor={COLORS.brand}
                label={t("entries.edit")}
                onPress={onEdit}
              />
              <ActionItem
                icon="content-copy"
                iconBackground={COLORS.blueFixed}
                iconColor={COLORS.blue}
                label={t("entries.duplicate")}
                onPress={onDuplicate}
              />
              <ActionItem
                icon="trash-can-outline"
                iconBackground={COLORS.redContainer}
                iconColor={COLORS.red}
                label={t("entries.delete")}
                tone="danger"
                onPress={onDelete}
              />
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: withAlpha("#0F172A", 0.5),
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADII.sheet,
    borderTopRightRadius: RADII.sheet,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  indicator: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceDim,
    alignSelf: "center",
    marginBottom: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  heading: { flex: 1 },
  title: {
    fontSize: TYPOGRAPHY.heading,
    fontWeight: "800",
    color: COLORS.text,
  },
  stats: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.muted,
    marginTop: 4,
  },
  actions: { gap: 12 },
});
