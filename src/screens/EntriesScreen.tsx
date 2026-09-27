import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants";
import { useDoodhContext } from "../context/DoodhContext";
import { getLocalDateString } from "../utils/dateUtils";
import { calculateEntryEarnings } from "../utils/calculations";
import { formatCurrency, formatNumber } from "../utils/formatters";
import { MilkEntry, RootStackParamList } from "../types";
import MonthYearFilter from "../components/MonthYearFilter";
import { useTranslation } from "react-i18next";

type EntriesScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function EntriesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<EntriesScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { entries, pricingConfig, deleteEntry } = useDoodhContext();

  const todayStr = getLocalDateString();
  const currentYear = todayStr.slice(0, 4);
  const currentMonth = todayStr.slice(5, 7);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [sheetEntry, setSheetEntry] = useState<MilkEntry | null>(null);

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
            } catch (err) {
              Alert.alert(t("common.error"), t("entries.deleteFailed"));
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View
        style={[styles.header, { paddingTop: Math.max(insets.top + 12, 44) }]}
      >
        <Text style={styles.title}>{t("entries.title")}</Text>
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
        <View style={styles.tableHeader}>
          <Text style={styles.headerCellLeft}>{t("entries.dateShift")}</Text>
          <Text style={styles.headerCellCenter}>{t("entries.milkFat")}</Text>
          <Text style={styles.headerCellRight}>{t("entries.earnings")}</Text>
          <View style={{ width: 24 }} />
        </View>

        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry: MilkEntry, index: number) => (
            <Pressable
              key={`${entry.id}-${entry.date}-${index}`}
              onPress={() => openEntrySheet(entry)}
              style={({ pressed }) => [
                styles.row,
                pressed && styles.rowPressed,
              ]}
            >
              <View style={styles.rowDateBlock}>
                <Text style={styles.dateText}>{entry.date}</Text>
                <Text
                  style={[
                    styles.shiftText,
                    entry.animal === "Cow"
                      ? styles.cowText
                      : styles.buffaloText,
                  ]}
                >
                  {t("entries.shiftAnimal", {
                    shift: t(`shifts.${entry.shift.toLowerCase()}`),
                    animal: t(`animals.${entry.animal.toLowerCase()}`),
                  })}
                </Text>
              </View>

              <View style={styles.rowCenter}>
                <Text style={styles.milkText}>
                  {formatNumber(entry.milk_quantity, 1)}{" "}
                  <Text style={styles.unit}>{t("common.kg")}</Text>
                </Text>
                <Text style={styles.fatText}>
                  {t("entries.fatValue", {
                    value: formatNumber(entry.fat_percentage, 1),
                  })}
                </Text>
              </View>

              <View style={styles.rowRight}>
                <Text style={styles.earningsText}>
                  {formatCurrency(
                    entry.fat_percentage * entry.milk_quantity * entry.price,
                  )}
                </Text>
              </View>

              <Pressable
                onPress={() => openEntrySheet(entry)}
                hitSlop={8}
                style={styles.moreButton}
              >
                <MaterialCommunityIcons
                  name="dots-vertical"
                  size={20}
                  color="#64748B"
                />
              </Pressable>
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={42}
              color="#CBD5E1"
            />
            <Text style={styles.emptyTitle}>{t("entries.emptyTitle")}</Text>
            <Text style={styles.emptySubtitle}>
              {t("entries.emptySubtitle")}
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        transparent
        visible={!!sheetEntry}
        animationType="slide"
        onRequestClose={closeEntrySheet}
      >
        <Pressable style={styles.sheetBackdrop} onPress={closeEntrySheet}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetIndicator} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>
                  {sheetEntry &&
                    t("entries.entryTitle", {
                      shift: t(`shifts.${sheetEntry.shift.toLowerCase()}`),
                      animal: t(`animals.${sheetEntry.animal.toLowerCase()}`),
                    })}
                </Text>
                <Text style={styles.sheetStats}>
                  {sheetEntry?.date} •{" "}
                  {formatNumber(sheetEntry?.milk_quantity, 1)}kg •{" "}
                  {formatCurrency(
                    (sheetEntry?.fat_percentage ?? 0) *
                      (sheetEntry?.milk_quantity ?? 0) *
                      (sheetEntry?.price ?? 0),
                  )}
                </Text>
              </View>
              <Pressable onPress={closeEntrySheet} style={styles.closeButton}>
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color="#64748B"
                />
              </Pressable>
            </View>

            <View style={styles.sheetActions}>
              <Pressable onPress={handleEdit} style={styles.actionButton}>
                <View
                  style={[styles.actionIcon, { backgroundColor: "#E9F7EC" }]}
                >
                  <MaterialCommunityIcons
                    name="pencil"
                    size={18}
                    color={COLORS.brand}
                  />
                </View>
                <Text style={styles.actionText}>{t("entries.edit")}</Text>
              </Pressable>

              <Pressable onPress={handleDuplicate} style={styles.actionButton}>
                <View
                  style={[styles.actionIcon, { backgroundColor: "#EFF6FF" }]}
                >
                  <MaterialCommunityIcons
                    name="content-copy"
                    size={18}
                    color="#2563EB"
                  />
                </View>
                <Text style={styles.actionText}>{t("entries.duplicate")}</Text>
              </Pressable>

              <Pressable
                onPress={handleDelete}
                style={[styles.actionButton, styles.deleteActionButton]}
              >
                <View
                  style={[styles.actionIcon, { backgroundColor: "#FEE2E2" }]}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={18}
                    color="#DC2626"
                  />
                </View>
                <Text style={styles.deleteText}>{t("entries.delete")}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  list: { flex: 1 },
  listContent: { padding: 14, paddingBottom: 100 },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  headerCellLeft: {
    flex: 4,
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
  },
  headerCellCenter: {
    flex: 3,
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    textAlign: "center",
  },
  headerCellRight: {
    flex: 3,
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    textAlign: "right",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 8,
  },
  rowPressed: { backgroundColor: "#F8FAFC" },
  rowDateBlock: { flex: 4 },
  dateText: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  shiftText: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  cowText: { color: COLORS.brand },
  buffaloText: { color: "#475569" },
  rowCenter: { flex: 3, alignItems: "center" },
  milkText: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  unit: { fontSize: 11, color: "#64748B", fontWeight: "500" },
  fatText: { fontSize: 11, fontWeight: "700", color: "#D97706", marginTop: 2 },
  rowRight: { flex: 3, alignItems: "flex-end" },
  earningsText: { fontSize: 15, fontWeight: "800", color: COLORS.brand },
  moreButton: { width: 24, alignItems: "center", justifyContent: "center" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
    marginTop: 6,
  },
  emptySubtitle: { fontSize: 12, color: "#94A3B8", textAlign: "center" },
  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15,23,42,0.4)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  sheetIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  sheetStats: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    fontWeight: "500",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetActions: { gap: 10 },
  actionButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  deleteActionButton: { borderColor: "#FECACA" },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  deleteText: { fontSize: 15, fontWeight: "700", color: "#DC2626" },
});
