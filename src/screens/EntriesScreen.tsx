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
import { Picker } from "@react-native-picker/picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MONTH_OPTIONS, YEAR_OPTIONS, COLORS } from "../constants";
import { useDoodhContext } from "../context/DoodhContext";
import { getLocalDateString } from "../utils/dateUtils";
import { formatCurrency, formatNumber } from "../utils/formatters";
import { MilkEntry, RootStackParamList } from "../types";

type EntriesScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function EntriesScreen() {
  const navigation = useNavigation<EntriesScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { entries, deleteEntry } = useDoodhContext();

  const todayStr = getLocalDateString();
  const currentYear = todayStr.slice(0, 4);
  const currentMonth = todayStr.slice(5, 7);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [sheetEntry, setSheetEntry] = useState<MilkEntry | null>(null);

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    const monthPad = selectedMonth.padStart(2, "0");
    const prefix = `${selectedYear}-${monthPad}`;
    return [...entries]
      .filter((entry) => entry.date && entry.date.startsWith(prefix))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, selectedMonth, selectedYear]);

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
      "Delete Entry",
      "Are you sure you want to delete this milk entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            closeEntrySheet();
            try {
              await deleteEntry(entry.id, entry.date);
            } catch (err) {
              Alert.alert("Error", "Unable to delete entry.");
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
        <Text style={styles.title}>All Entries</Text>
        <View style={styles.filterRow}>
          <View style={styles.filterBox}>
            <Picker
              selectedValue={selectedMonth}
              onValueChange={setSelectedMonth}
              style={styles.picker}
              dropdownIconColor="#334155"
            >
              {MONTH_OPTIONS.map((month) => (
                <Picker.Item
                  key={month.value}
                  label={month.label}
                  value={month.value}
                />
              ))}
            </Picker>
          </View>
          <View style={styles.filterBox}>
            <Picker
              selectedValue={selectedYear}
              onValueChange={setSelectedYear}
              style={styles.picker}
              dropdownIconColor="#334155"
            >
              {YEAR_OPTIONS.map((year) => (
                <Picker.Item key={year} label={year} value={year} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tableHeader}>
          <Text style={styles.headerCellLeft}>Date / Shift</Text>
          <Text style={styles.headerCellCenter}>Milk / Fat</Text>
          <Text style={styles.headerCellRight}>Earnings</Text>
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
                  {entry.shift} • {entry.animal}
                </Text>
              </View>

              <View style={styles.rowCenter}>
                <Text style={styles.milkText}>
                  {formatNumber(entry.milk_quantity, 1)}{" "}
                  <Text style={styles.unit}>kg</Text>
                </Text>
                <Text style={styles.fatText}>
                  {formatNumber(entry.fat_percentage, 1)}% Fat
                </Text>
              </View>

              <View style={styles.rowRight}>
                <Text style={styles.earningsText}>
                  {formatCurrency(entry.earnings)}
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
            <Text style={styles.emptyTitle}>No Entries Found</Text>
            <Text style={styles.emptySubtitle}>
              No records available for the selected month.
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
                  {sheetEntry?.shift} ({sheetEntry?.animal})
                </Text>
                <Text style={styles.sheetStats}>
                  {sheetEntry?.date} •{" "}
                  {formatNumber(sheetEntry?.milk_quantity, 1)}kg •{" "}
                  {formatCurrency(sheetEntry?.earnings)}
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
                <Text style={styles.actionText}>Edit Entry</Text>
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
                <Text style={styles.actionText}>Duplicate Entry</Text>
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
                <Text style={styles.deleteText}>Delete Entry</Text>
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
  filterRow: { flexDirection: "row", gap: 8 },
  filterBox: {
    minWidth: 110,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    justifyContent: "center",
    height: 38,
    overflow: "hidden",
  },
  picker: { color: "#334155", marginHorizontal: -6 },
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
