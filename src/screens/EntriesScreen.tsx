import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Text as RNText,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDoodhContext } from "../context/DoodhContext";
import { getLocalDateString } from "../utils/dateUtils";
import {
  useCurrentMonthYear,
  useEntriesForMonth,
  usePricedEntries,
} from "../hooks/useEntries";
import { useMonthlyReport } from "../hooks/useMonthlyReport";
import {
  buildMonthlyMilkReport,
  createMonthlyReportFileName,
  MonthlyReportLabels,
} from "../domain/monthlyReport";
import { buildMonthlyReportHtml } from "../utils/monthlyReportHtml";
import { MilkEntry, RootStackParamList } from "../types";
import MonthYearFilter from "../components/MonthYearFilter";
import { useTranslation } from "react-i18next";
import AppHeader from "../components/AppHeader";
import EntryActionSheet from "../components/entries/EntryActionSheet";
import EntryList from "../components/entries/EntryList";
import MonthlyReportSheet from "../components/reports/MonthlyReportSheet";
import Button from "../components/Button";
import IconButton from "../components/ui/IconButton";
import ScreenContainer from "../components/ui/ScreenContainer";
import EmptyState from "../components/ui/EmptyState";
import { useSnackbar } from "../context/SnackbarContext";
import { COLORS, RADII } from "../constants";

type EntriesScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function EntriesScreen() {
  const { t, i18n } = useTranslation();
  const { showSnackbar } = useSnackbar();
  const navigation = useNavigation<EntriesScreenNavigationProp>();
  const { entries, pricingConfig, deleteEntry } = useDoodhContext();
  const {
    month: selectedMonth,
    year: selectedYear,
    setMonth: setSelectedMonth,
    setYear: setSelectedYear,
  } = useCurrentMonthYear();
  const [sheetEntry, setSheetEntry] = useState<MilkEntry | null>(null);
  const [reportVisible, setReportVisible] = useState(false);

  const pricedEntries = usePricedEntries(entries, pricingConfig);
  const filteredEntries = useEntriesForMonth(pricedEntries, selectedYear, selectedMonth, {
    sort: "date-descending",
  });

  const monthlyReport = useMemo(
    () =>
      buildMonthlyMilkReport(
        filteredEntries,
        pricingConfig,
        selectedYear,
        selectedMonth,
        i18n.language,
      ),
    [filteredEntries, pricingConfig, selectedYear, selectedMonth, i18n.language],
  );

  const reportLabels: MonthlyReportLabels = useMemo(
    () => ({
      title: `${t("entries.monthlyReport.title")} - ${t(`months.${selectedMonth}`)} ${selectedYear}`,
      day: t("entries.monthlyReport.day"),
      night: t("entries.monthlyReport.night"),
      total: t("entries.monthlyReport.total"),
      buffalo: t("animals.buffalo"),
      cow: t("animals.cow"),
      dailyTotal: t("entries.monthlyReport.dailyTotal"),
      monthlyTotal: t("entries.monthlyReport.monthlyTotal"),
      ratesTitle: t("entries.monthlyReport.ratesTitle"),
      perFat: t("entries.monthlyReport.perFat"),
    }),
    [t, selectedMonth, selectedYear, monthlyReport.rates],
  );

  const { isGenerating, shareReport } = useMonthlyReport({
    dialogTitle: reportLabels.title,
    onShared: (shared) => {
      if (!shared) {
        Alert.alert(t("common.error"), t("entries.monthlyReport.shareUnavailable"));
        return;
      }
      showSnackbar(t("entries.monthlyReport.shareSuccess"));
    },
    onError: (error) => {
      console.error("Error generating monthly report:", error);
      Alert.alert(t("common.error"), t("entries.monthlyReport.shareError"));
    },
  });

  const hasReportData = monthlyReport.days.length > 0;

  const monthlyReportHtml = useMemo(
    () => (hasReportData ? buildMonthlyReportHtml(monthlyReport, reportLabels) : ""),
    [monthlyReport, reportLabels, hasReportData],
  );

  const handleDownloadReport = async () => {
    if (!hasReportData) {
      showSnackbar(t("entries.monthlyReport.emptyReport"));
      return;
    }
    await shareReport(
      monthlyReportHtml,
      createMonthlyReportFileName(monthlyReport),
    );
  };

  const handleViewReport = () => {
    if (!hasReportData) {
      showSnackbar(t("entries.monthlyReport.emptyReport"));
      return;
    }
    setReportVisible(true);
  };

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
            const result = await deleteEntry(entry.id, entry.date);
            if (result.ok) {
              showSnackbar(t("entries.deleteSuccess"));
            } else {
              console.error("Error deleting entry:", result.error);
              showSnackbar(t("entries.deleteFailed"));
            }
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer
      header={<AppHeader eyebrow={t("home.appTitle")} title={t("entries.title")} />}
      fixedContent={
        <View style={styles.filterBar}>
          <MonthYearFilter
            month={selectedMonth}
            year={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />
          <View style={styles.reportRow}>
            <Button
              variant="outline"
              size="md"
              style={styles.viewReportButton}
              disabled={!hasReportData || isGenerating}
              accessibilityLabel={t("entries.monthlyReport.viewReport")}
              onPress={handleViewReport}
              icon={
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={18}
                  color={COLORS.text}
                />
              }
            >
              <RNText style={styles.viewReportLabel}>
                {isGenerating
                  ? t("entries.monthlyReport.generating")
                  : t("entries.monthlyReport.viewReport")}
              </RNText>
            </Button>
            <IconButton
              icon="download"
              accessibilityLabel={t("entries.monthlyReport.downloadLabel")}
              onPress={handleDownloadReport}
              size={44}
              iconSize={22}
              backgroundColor={COLORS.text}
              iconColor={COLORS.white}
              borderRadius={RADII.control}
            />
          </View>
        </View>
      }
    >
      <EntryList
        entries={filteredEntries}
        empty={
          <EmptyState
            icon="clipboard-text-outline"
            title={t("entries.emptyTitle")}
            message={t("entries.emptySubtitle")}
            gap={8}
          />
        }
        onSelect={openEntrySheet}
        elevated={false}
      />

      <EntryActionSheet
        entry={sheetEntry}
        onClose={closeEntrySheet}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />

      <MonthlyReportSheet
        visible={reportVisible}
        report={monthlyReport}
        labels={hasReportData ? reportLabels : null}
        isGenerating={isGenerating}
        onClose={() => setReportVisible(false)}
        onDownload={handleDownloadReport}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filterBar: { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  reportRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  viewReportButton: { flex: 1, minHeight: 44, justifyContent: "center" },
  viewReportLabel: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
});
