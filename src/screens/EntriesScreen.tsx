import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { COLORS, RADII, withAlpha } from "../constants";
import { useDoodhContext } from "../context/DoodhContext";
import { formatDisplayDate, getLocalDateString } from "../utils/dateUtils";
import { calculateEntryEarnings } from "../utils/calculations";
import { formatCurrency, formatNumber } from "../utils/formatters";
import { MilkEntry, RootStackParamList } from "../types";
import MonthYearFilter from "../components/MonthYearFilter";
import { useTranslation } from "react-i18next";
import Text from "../components/ScaledText";
import { TYPOGRAPHY } from "../constants/typography";
import AppHeader from "../components/AppHeader";
import EntryRow from "../components/EntryRow";
import { useSnackbar } from "../context/SnackbarContext";

type EntriesScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function EntriesScreen() {
  const { t, i18n } = useTranslation();
  const { showSnackbar } = useSnackbar();
  const navigation = useNavigation<EntriesScreenNavigationProp>();
  const { entries, pricingConfig, deleteEntry } = useDoodhContext();

  const todayStr = getLocalDateString();
  const currentYear = todayStr.slice(0, 4);
  const currentMonth = todayStr.slice(5, 7);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [sheetEntry, setSheetEntry] = useState<MilkEntry | null>(null);
  const sheetProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!sheetEntry) return;
    sheetProgress.setValue(0);
    Animated.timing(sheetProgress, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [sheetEntry, sheetProgress]);

  const pricedEntries = useMemo(
    () =>
      entries.map((entry) => ({
        ...entry,
        earnings: calculateEntryEarnings(entry, pricingConfig),
      })),
    [entries, pricingConfig],
  );

  const filteredEntries = useMemo(() => {
    const monthPad = selectedMonth.padStart(2, "0");
    const prefix = `${selectedYear}-${monthPad}`;
    return [...pricedEntries]
      .filter((entry) => entry.date && entry.date.startsWith(prefix))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [pricedEntries, selectedMonth, selectedYear]);

  const openEntrySheet = (entry: MilkEntry) => setSheetEntry(entry);
  const closeEntrySheet = () => setSheetEntry(null);

  const handleEdit = () => {
    if (!sheetEntry) return;
    const entry = sheetEntry;
    closeEntrySheet();
    navigation.navigate("EntryForm", { entry });
  };

  const handleDuplicate = () => {
    if (!sheetEntry) return;
    const entry = sheetEntry;
    closeEntrySheet();
    const duplicateData: Partial<MilkEntry> = {
      ...entry,
      id: undefined,
      date: getLocalDateString(),
    };
    navigation.navigate("EntryForm", { entry: duplicateData as MilkEntry });
  };

  const handleDelete = () => {
    if (!sheetEntry) return;
    const entry = sheetEntry;
    Alert.alert(
      t("entries.deleteConfirmTitle"),
      t("entries.deleteConfirmMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            closeEntrySheet();
            try {
              await deleteEntry(entry.id, entry.date);
              showSnackbar(t("entries.deleteSuccess"));
            } catch (err) {
              showSnackbar(t("entries.deleteFailed"));
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader eyebrow={t("home.appTitle")} title={t("entries.title")} />

      <View style={styles.filterBar}>
        <MonthYearFilter
          month={selectedMonth}
          year={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredEntries.length > 0 ? (
          <View style={styles.listCard}>
            {filteredEntries.map((entry: MilkEntry, index: number) => (
              <EntryRow
                key={`${entry.id}-${entry.date}-${index}`}
                entry={entry}
                showDivider={index < filteredEntries.length - 1}
                onPress={openEntrySheet}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={32}
                color={COLORS.muted}
              />
            </View>
            <Text style={styles.emptyTitle}>{t("entries.emptyTitle")}</Text>
            <Text style={styles.emptySubtitle}>{t("entries.emptySubtitle")}</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        transparent
        visible={!!sheetEntry}
        animationType="none"
        onRequestClose={closeEntrySheet}
      >
        <Pressable style={styles.sheetBackdrop} onPress={closeEntrySheet}>
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
              <View style={styles.sheetIndicator} />
              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeading}>
                  <Text style={styles.sheetTitle}>
                    {sheetEntry &&
                      t("entries.entryTitle", {
                        shift: t(`shifts.${sheetEntry.shift.toLowerCase()}`),
                        animal: t(`animals.${sheetEntry.animal.toLowerCase()}`),
                      })}
                  </Text>
                  <Text style={styles.sheetStats}>
                    {formatDisplayDate(sheetEntry?.date, i18n.language)} •{" "}
                    {formatNumber(sheetEntry?.milk_quantity, 1)}kg •{" "}
                    {formatCurrency(
                      (sheetEntry?.fat_percentage ?? 0) *
                        (sheetEntry?.milk_quantity ?? 0) *
                        (sheetEntry?.price ?? 0),
                    )}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("common.close")}
                  onPress={closeEntrySheet}
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed && styles.pressedControl,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={20}
                    color={COLORS.muted}
                  />
                </Pressable>
              </View>

              <View style={styles.sheetActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleEdit}
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.pressedControl,
                  ]}
                >
                  <View
                    style={[styles.actionIcon, { backgroundColor: withAlpha(COLORS.brandLight, 0.5) }]}
                  >
                    <MaterialCommunityIcons
                      name="pencil"
                      size={18}
                      color={COLORS.brand}
                    />
                  </View>
                  <Text style={styles.actionText}>{t("entries.edit")}</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={handleDuplicate}
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.pressedControl,
                  ]}
                >
                  <View
                    style={[styles.actionIcon, { backgroundColor: COLORS.blueFixed }]}
                  >
                    <MaterialCommunityIcons
                      name="content-copy"
                      size={18}
                      color={COLORS.blue}
                    />
                  </View>
                  <Text style={styles.actionText}>{t("entries.duplicate")}</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={handleDelete}
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.pressedControl,
                  ]}
                >
                  <View
                    style={[styles.actionIcon, { backgroundColor: COLORS.redContainer }]}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={18}
                      color={COLORS.red}
                    />
                  </View>
                  <Text style={styles.deleteText}>{t("entries.delete")}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filterBar: { paddingHorizontal: 16, paddingBottom: 12 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  listCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    overflow: "hidden",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 8,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.bodyLarge,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.muted,
    textAlign: "center",
  },
  sheetBackdrop: {
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
  sheetIndicator: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceDim,
    alignSelf: "center",
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  sheetHeading: { flex: 1 },
  sheetTitle: {
    fontSize: TYPOGRAPHY.heading,
    fontWeight: "800",
    color: COLORS.text,
  },
  sheetStats: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.muted,
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetActions: { gap: 12 },
  actionButton: {
    minHeight: 56,
    backgroundColor: COLORS.surfaceLow,
    borderRadius: RADII.control,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: RADII.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: "700",
    color: COLORS.text,
  },
  deleteText: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: "700",
    color: COLORS.red,
  },
  pressedControl: { opacity: 0.78 },
});
