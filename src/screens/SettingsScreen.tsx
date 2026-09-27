import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APP_VERSION, COLORS } from "../constants";
import { useDoodhContext } from "../context/DoodhContext";
import { getLocalDateString } from "../utils/dateUtils";
import MonthYearFilter from "../components/MonthYearFilter";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { pricingConfig, saveConfig } = useDoodhContext();

  const todayStr = getLocalDateString();
  const currentYear = todayStr.slice(0, 4);
  const currentMonth = todayStr.slice(5, 7);

  const [month, setMonth] = useState<string>(currentMonth);
  const [year, setYear] = useState<string>(currentYear);
  const [cowPrice, setCowPrice] = useState<string>("8");
  const [buffaloPrice, setBuffaloPrice] = useState<string>("9");

  useEffect(() => {
    const key = `${year}-${month.padStart(2, "0")}`;
    const selected = pricingConfig?.[key] || { Cow: 8, Buffalo: 9 };
    setCowPrice(String(selected.Cow ?? 8));
    setBuffaloPrice(String(selected.Buffalo ?? 9));
  }, [month, year, pricingConfig]);

  const handleSave = async () => {
    const cowVal = Number(cowPrice);
    const bufVal = Number(buffaloPrice);

    if (isNaN(cowVal) || cowVal <= 0 || isNaN(bufVal) || bufVal <= 0) {
      Alert.alert("Invalid Input", "Please enter valid positive price values.");
      return;
    }

    try {
      const monthPad = month.padStart(2, "0");
      await saveConfig(year, monthPad, "Cow", cowVal);
      await saveConfig(year, monthPad, "Buffalo", bufVal);
      Alert.alert(
        "Success",
        `Pricing configuration for ${year}-${monthPad} saved successfully!`,
      );
    } catch (err) {
      console.error("Error saving pricing:", err);
      Alert.alert("Error", "Unable to save pricing configuration.");
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[styles.header, { paddingTop: Math.max(insets.top + 12, 44) }]}
      >
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentPad}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons
              name="currency-inr"
              size={16}
              color={COLORS.brand}
            />
            <Text style={styles.sectionTitle}>Animal Pricing Config</Text>
          </View>
          <MonthYearFilter
            month={month}
            year={year}
            onMonthChange={setMonth}
            onYearChange={setYear}
            filterBoxMinWidth={100}
          />
        </View>

        <Text style={styles.helpText}>
          Configure per-1% fat rate (₹) for each animal type for the selected
          month.
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.leftCell}>
              <View style={styles.iconGreen}>
                <MaterialCommunityIcons
                  name="cow"
                  size={20}
                  color={COLORS.brand}
                />
              </View>
              <View>
                <Text style={styles.rowTitle}>Cow Rate</Text>
                <Text style={styles.rowSubtitle}>Per 1% fat / kg milk</Text>
              </View>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.currency}>₹</Text>
              <TextInput
                value={cowPrice}
                keyboardType="decimal-pad"
                onChangeText={setCowPrice}
                style={styles.priceInput}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.leftCell}>
              <View style={styles.iconGray}>
                <MaterialCommunityIcons name="cow" size={20} color="#334155" />
              </View>
              <View>
                <Text style={styles.rowTitle}>Buffalo Rate</Text>
                <Text style={styles.rowSubtitle}>Per 1% fat / kg milk</Text>
              </View>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.currency}>₹</Text>
              <TextInput
                value={buffaloPrice}
                keyboardType="decimal-pad"
                onChangeText={setBuffaloPrice}
                style={styles.priceInput}
              />
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <MaterialCommunityIcons name="content-save" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Save Pricing</Text>
        </Pressable>

        <View style={styles.infoBox}>
          <View style={styles.infoLeft}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color="#64748B"
            />
            <Text style={styles.infoLabel}>App Version</Text>
          </View>
          <Text style={styles.infoValue}>v{APP_VERSION}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  content: { flex: 1 },
  contentPad: { padding: 18, paddingBottom: 100 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.brand,
    textTransform: "uppercase",
  },
  helpText: { fontSize: 12, color: "#64748B", marginBottom: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 18,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  leftCell: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconGreen: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.brandLight,
    justifyContent: "center",
    alignItems: "center",
  },
  iconGray: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  rowTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  rowSubtitle: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
    marginTop: 2,
  },
  priceBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    height: 42,
    minWidth: 95,
  },
  currency: {
    color: "#64748B",
    fontWeight: "700",
    fontSize: 16,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    textAlign: "right",
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "800",
    height: 42,
  },
  saveButton: {
    backgroundColor: COLORS.brand,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    marginBottom: 18,
    shadowColor: COLORS.brand,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  saveButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  infoBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoLabel: { fontSize: 13, color: "#64748B", fontWeight: "700" },
  infoValue: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
});
