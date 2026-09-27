import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ANIMALS, COLORS, SHIFTS } from "../constants";
import { useDoodhContext } from "../context/DoodhContext";
import {
  getLocalDateString,
  getYearAndMonth,
  parseLocalDate,
} from "../utils/dateUtils";
import { calculateEarnings } from "../utils/calculations";
import { formatCurrency } from "../utils/formatters";
import { Animal, MilkEntry, RootStackParamList, Shift } from "../types";

type EntryFormScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "EntryForm"
>;
type EntryFormScreenRouteProp = RouteProp<RootStackParamList, "EntryForm">;

export default function EntryFormScreen() {
  const navigation = useNavigation<EntryFormScreenNavigationProp>();
  const route = useRoute<EntryFormScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { pricingConfig, addEntry, updateEntry, deleteEntry } =
    useDoodhContext();

  const entryToEdit = route.params?.entry || null;
  const isEditing = Boolean(entryToEdit && entryToEdit.id !== undefined);

  const [date, setDate] = useState<string>(
    entryToEdit?.date || getLocalDateString(),
  );
  const [animal, setAnimal] = useState<Animal>(entryToEdit?.animal || "Cow");
  const [shift, setShift] = useState<Shift>(entryToEdit?.shift || "Morning");
  const [milkQuantity, setMilkQuantity] = useState<string>(
    entryToEdit?.milk_quantity !== undefined
      ? String(entryToEdit.milk_quantity)
      : "",
  );
  const [fatPercentage, setFatPercentage] = useState<string>(
    entryToEdit?.fat_percentage !== undefined
      ? String(entryToEdit.fat_percentage)
      : "",
  );
  const [notes, setNotes] = useState<string>(entryToEdit?.notes || "");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [earningsPreview, setEarningsPreview] = useState<number>(0);

  const priceInfo = useMemo(() => {
    const { year, month } = getYearAndMonth(date);
    const monthKey = `${year}-${month}`;
    const animalConfig = pricingConfig[monthKey];
    return {
      cowPrice: Number(animalConfig?.Cow ?? 8),
      buffaloPrice: Number(animalConfig?.Buffalo ?? 9),
    };
  }, [date, pricingConfig]);

  useEffect(() => {
    const qty = Number(milkQuantity || 0);
    const fat = Number(fatPercentage || 0);
    const rate = animal === "Cow" ? priceInfo.cowPrice : priceInfo.buffaloPrice;
    setEarningsPreview(calculateEarnings(qty, fat, rate));
  }, [milkQuantity, fatPercentage, animal, pricingConfig]);

  const handleDateChange = (_: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(getLocalDateString(selectedDate));
    }
  };

  const handleSave = async () => {
    const qty = Number(milkQuantity);
    const fat = Number(fatPercentage);

    if (isNaN(qty) || qty <= 0 || qty > 500) {
      Alert.alert(
        "Invalid Milk Quantity",
        "Please enter a valid milk quantity in kg (e.g., 15.5).",
      );
      return;
    }

    if (isNaN(fat) || fat <= 0 || fat > 25) {
      Alert.alert(
        "Invalid Fat Percentage",
        "Please enter a valid fat percentage (e.g., 4.5).",
      );
      return;
    }

    const normalizedData = {
      date,
      animal,
      shift,
      milk_quantity: qty,
      fat_percentage: fat,
      notes: notes.trim(),
    };

    try {
      if (isEditing && entryToEdit && entryToEdit.id !== undefined) {
        const entryToSave: MilkEntry = {
          ...normalizedData,
          id: entryToEdit.id,
          price: entryToEdit.price,
        };
        await updateEntry(entryToSave, entryToEdit.date);
      } else {
        await addEntry(normalizedData);
      }
      navigation.goBack();
    } catch (error) {
      console.error("Error saving entry:", error);
      Alert.alert("Save Failed", "Unable to save entry. Please try again.");
    }
  };

  const handleDelete = () => {
    if (!isEditing || !entryToEdit || entryToEdit.id === undefined) return;
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this milk entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteEntry(entryToEdit.id, entryToEdit.date);
              navigation.goBack();
            } catch (error) {
              Alert.alert("Delete Failed", "Unable to delete entry.");
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      style={styles.flex}
    >
      <View
        style={[styles.header, { paddingTop: Math.max(insets.top + 12, 44) }]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.backButton}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={COLORS.text}
          />
        </Pressable>
        <Text style={styles.title}>
          {isEditing ? "Edit Entry" : "Add Entry"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Collection Date</Text>
          <Pressable
            style={styles.inputBox}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.inputText}>{date}</Text>
            <MaterialCommunityIcons
              name="calendar"
              size={20}
              color={COLORS.brand}
            />
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={parseLocalDate(date)}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
            />
          )}
        </View>

        <View style={styles.twoColumn}>
          <View style={styles.fieldGroupFlex}>
            <Text style={styles.label}>Shift</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={shift}
                onValueChange={(val: Shift) => setShift(val)}
                style={styles.picker}
                dropdownIconColor="#334155"
              >
                {SHIFTS.map((item) => (
                  <Picker.Item key={item} label={item} value={item} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.fieldGroupFlex}>
            <Text style={styles.label}>Animal</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={animal}
                onValueChange={(val: Animal) => setAnimal(val)}
                style={styles.picker}
                dropdownIconColor="#334155"
              >
                {ANIMALS.map((item) => (
                  <Picker.Item key={item} label={item} value={item} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Milk Quantity (kg)</Text>
          <View style={styles.inputBoxRow}>
            <View style={styles.iconWrapBlue}>
              <MaterialCommunityIcons
                name="glass-mug-variant"
                size={20}
                color="#2563EB"
              />
            </View>
            <TextInput
              value={milkQuantity}
              onChangeText={setMilkQuantity}
              keyboardType="decimal-pad"
              placeholder="e.g. 20.5"
              placeholderTextColor="#94A3B8"
              style={styles.inputField}
            />
            <Text style={styles.suffix}>kg</Text>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Fat Percentage (%)</Text>
          <View style={styles.inputBoxRow}>
            <View style={styles.iconWrapAmber}>
              <MaterialCommunityIcons name="water" size={20} color="#D97706" />
            </View>
            <TextInput
              value={fatPercentage}
              onChangeText={setFatPercentage}
              keyboardType="decimal-pad"
              placeholder="e.g. 4.5"
              placeholderTextColor="#94A3B8"
              style={styles.inputField}
            />
            <Text style={styles.suffix}>%</Text>
          </View>
        </View>

        <View style={styles.previewBox}>
          <View>
            <Text style={styles.previewLabel}>Estimated Earnings</Text>
            <Text style={styles.previewSubtext}>
              Rate: ₹
              {animal === "Cow" ? priceInfo.cowPrice : priceInfo.buffaloPrice} /
              fat
            </Text>
          </View>
          <Text style={styles.previewValue}>
            {formatCurrency(earningsPreview)}
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            value={notes}
            multiline
            numberOfLines={3}
            onChangeText={setNotes}
            placeholder="e.g. Morning batch notes, feed details"
            placeholderTextColor="#94A3B8"
            style={styles.notesInput}
          />
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom + 12, 16) },
        ]}
      >
        {isEditing && (
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.deleteButton,
              styles.footerButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={20}
              color="#DC2626"
            />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </Pressable>
        )}
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.primaryButton,
            styles.footerButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>
            {isEditing ? "Update Entry" : "Save Entry"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    marginLeft: 6,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldGroupFlex: {
    flex: 1,
    marginBottom: 18,
  },
  label: {
    marginBottom: 8,
    marginLeft: 2,
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
  },
  inputBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 14,
    height: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputBoxRow: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 12,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
  },
  pickerWrap: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    height: 50,
    justifyContent: "center",
    overflow: "hidden",
  },
  picker: {
    color: "#0F172A",
    marginHorizontal: -6,
  },
  inputText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  inputField: {
    flex: 1,
    height: 50,
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    paddingHorizontal: 10,
  },
  suffix: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "700",
  },
  iconWrapBlue: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapAmber: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFFBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  previewBox: {
    backgroundColor: "#E9F7EC",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  previewSubtext: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 2,
  },
  previewValue: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.brand,
  },
  notesInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    minHeight: 90,
    padding: 14,
    textAlignVertical: "top",
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "500",
  },
  twoColumn: {
    flexDirection: "row",
    gap: 12,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    padding: 16,
    flexDirection: "row",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -3 },
    elevation: 4,
  },
  footerButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  primaryButton: {
    backgroundColor: COLORS.brand,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
    maxWidth: 120,
  },
  deleteButtonText: {
    color: "#DC2626",
    fontWeight: "800",
    fontSize: 16,
  },
});
