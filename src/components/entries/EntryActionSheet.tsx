import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import { COLORS, RADII, SHADOWS, withAlpha } from "../../constants";
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
  const { height } = useWindowDimensions();
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!entry) return;
    setIsClosing(false);
    backdropAnim.setValue(0);
    sheetAnim.setValue(0);

    // Same staged entrance as the add/edit entry sheet: backdrop fades
    // first, then the sheet slides up slightly after.
    Animated.timing(backdropAnim, {
      toValue: 1,
      duration: 190,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 340,
      delay: 110,
      easing: Easing.bezier(0.22, 1, 0.32, 1),
      useNativeDriver: true,
    }).start();
  }, [backdropAnim, entry, sheetAnim]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    Animated.parallel([
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  return (
    <Modal
      transparent
      visible={!!entry}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            {
              opacity: sheetAnim,
              transform: [
                {
                  translateY: sheetAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, 0],
                  }),
                },
                {
                  scale: sheetAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.96, 1],
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
                onPress={handleClose}
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: withAlpha("#0F172A", 0.6),
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADII.sheet,
    borderTopRightRadius: RADII.sheet,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    overflow: "hidden",
    ...SHADOWS.sheet,
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
