import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { COLORS, RADII } from "../../constants";
import type {
  MonthlyReport,
  MonthlyReportLabels,
} from "../../domain/monthlyReport";
import Button from "../Button";
import IconButton from "../ui/IconButton";
import MonthlyReportPreview from "./MonthlyReportPreview";

type MonthlyReportSheetProps = {
  visible: boolean;
  report: MonthlyReport | null;
  labels: MonthlyReportLabels | null;
  isGenerating: boolean;
  onClose: () => void;
  onDownload: () => void;
};

export default function MonthlyReportSheet({
  visible,
  report,
  labels,
  isGenerating,
  onClose,
  onDownload,
}: MonthlyReportSheetProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.heading}>
            <RNText style={styles.title}>
              {labels?.title ?? t("entries.monthlyReport.title")}
            </RNText>
            <RNText style={styles.subtitle}>
              {t("entries.monthlyReport.previewSubtitle")}
            </RNText>
          </View>
          <IconButton
            icon="close"
            accessibilityLabel={t("common.close")}
            onPress={onClose}
            size={36}
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {report && labels ? (
            <MonthlyReportPreview report={report} labels={labels} />
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            variant="outline"
            size="md"
            style={styles.closeButton}
            onPress={onClose}
          >
            <RNText style={styles.closeLabel}>
              {t("common.close")}
            </RNText>
          </Button>
          <Button
            variant="primary"
            size="md"
            style={styles.downloadButton}
            loading={isGenerating}
            disabled={isGenerating || !report}
            onPress={onDownload}
          >
            <RNText style={styles.downloadLabel}>
              {isGenerating
                ? t("entries.monthlyReport.generating")
                : t("entries.monthlyReport.downloadPdf")}
            </RNText>
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  heading: { flex: 1 },
  title: { color: COLORS.text, fontSize: 17, fontWeight: "800" },
  subtitle: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 16 },
  footer: { flexDirection: "row", gap: 12, padding: 16 },
  closeButton: { flex: 1, justifyContent: "center" },
  closeLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  downloadButton: { flex: 2, borderRadius: RADII.control, justifyContent: "center" },
  downloadLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
});
