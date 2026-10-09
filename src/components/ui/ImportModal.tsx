import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { COLORS, RADII, withAlpha } from "../../constants";
import { TYPOGRAPHY } from "../../constants/typography";
import { getYearAndMonth } from "../../utils/dateUtils";
import { getMonthKey } from "../../domain/pricing";
import {
  buildMonthImportSample,
  parseMonthImportPayload,
  type MonthImportIssue,
  type MonthImportPayload,
} from "../../domain/monthImport";
import { pickJsonFile } from "../../utils/dataImport";
import { formatCurrency } from "../../utils/formatters";
import Text, { ScaledTextInput as TextInput } from "../ScaledText";
import Button from "../Button";
import IconButton from "./IconButton";
import MonthYearFilter from "../MonthYearFilter";

type ImportModalProps = {
  visible: boolean;
  busy: boolean;
  onClose: () => void;
  onImport: (rawText: string, monthKey: string) => void;
};

type ValidationState =
  | { status: "idle" }
  | { status: "invalid"; issues: MonthImportIssue[] }
  | { status: "valid"; payload: MonthImportPayload; snapshot: string };

const MAX_SHOWN_ISSUES = 5;

/**
 * Month-scoped JSON import: pick a .json file or paste it, load the sample
 * shape, validate with row-level errors, preview, then confirm the import.
 */
export default function ImportModal({ visible, busy, onClose, onImport }: ImportModalProps) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const dialogAnim = useRef(new Animated.Value(0)).current;

  const current = useMemo(() => getYearAndMonth(), []);
  const [month, setMonth] = useState(current.month);
  const [year, setYear] = useState(current.year);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationState>({ status: "idle" });

  const monthKey = getMonthKey(year, month);

  useEffect(() => {
    if (!visible) return;
    backdropAnim.setValue(0);
    dialogAnim.setValue(0);
    Animated.timing(backdropAnim, {
      toValue: 1,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    Animated.timing(dialogAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.bezier(0.05, 0.7, 0.1, 1),
      useNativeDriver: true,
    }).start();
  }, [visible, backdropAnim, dialogAnim]);

  useEffect(() => {
    if (visible) {
      const now = getYearAndMonth();
      setMonth(now.month);
      setYear(now.year);
      setText("");
      setFileName(null);
      setPickError(null);
      setValidation({ status: "idle" });
    }
  }, [visible]);

  const snapshot = `${monthKey}\n${text}`;
  const canImport =
    !busy &&
    validation.status === "valid" &&
    validation.snapshot === snapshot;

  const handleTextChange = (next: string) => {
    setText(next);
    setValidation({ status: "idle" });
  };

  const handleMonthChange = (next: string) => {
    setMonth(next);
    setValidation({ status: "idle" });
  };

  const handleYearChange = (next: string) => {
    setYear(next);
    setValidation({ status: "idle" });
  };

  const handlePickFile = async () => {
    if (picking || busy) return;
    setPicking(true);
    setPickError(null);
    try {
      const picked = await pickJsonFile();
      if (!picked) return;
      setText(picked.contents);
      setFileName(picked.name);
      setValidation({ status: "idle" });
    } catch (error) {
      console.error("Error reading import file:", error);
      setPickError(t("settings.import.importFileError"));
    } finally {
      setPicking(false);
    }
  };

  const handleLoadSample = () => {
    setText(buildMonthImportSample(monthKey));
    setFileName(null);
    setValidation({ status: "idle" });
  };

  const handleValidate = () => {
    const parsed = parseMonthImportPayload(text, monthKey);
    if (!parsed.ok) {
      setValidation({ status: "invalid", issues: parsed.issues });
      return;
    }
    setValidation({ status: "valid", payload: parsed.value, snapshot });
  };

  const handleImport = () => {
    if (!canImport) {
      handleValidate();
      return;
    }
    onImport(text, monthKey);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={busy ? undefined : onClose}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
            style={StyleSheet.absoluteFill}
            onPress={busy ? undefined : onClose}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.dialog,
            {
              opacity: dialogAnim,
              transform: [
                {
                  scale: dialogAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.card, { maxHeight: height * 0.88 }]}>
            <View style={styles.header}>
              <View style={styles.heading}>
                <Text style={styles.title}>{t("settings.import.dialogTitle")}</Text>
                <Text style={styles.subtitle}>{t("settings.import.dialogSubtitle")}</Text>
              </View>
              <IconButton
                icon="close"
                accessibilityLabel={t("common.close")}
                onPress={onClose}
                size={32}
                iconSize={20}
              />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <MonthYearFilter
                month={month}
                year={year}
                onMonthChange={handleMonthChange}
                onYearChange={handleYearChange}
              />

              <Text style={styles.fieldLabel}>{t("settings.import.pasteLabel")}</Text>
              <TextInput
                value={text}
                onChangeText={handleTextChange}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                placeholder={t("settings.import.pastePlaceholder")}
                placeholderTextColor={COLORS.muted}
                style={styles.textBox}
              />
              {fileName ? (
                <Text style={styles.fileName} numberOfLines={1}>
                  {fileName}
                </Text>
              ) : null}
              {pickError ? (
                <Text style={styles.pickError}>{pickError}</Text>
              ) : null}

              <View style={styles.row}>
                <Button
                  variant="outline"
                  size="sm"
                  style={styles.rowButton}
                  disabled={picking || busy}
                  accessibilityLabel={t("settings.import.pickFile")}
                  onPress={handlePickFile}
                  icon={
                    picking ? (
                      <ActivityIndicator size="small" color={COLORS.brand} />
                    ) : (
                      <MaterialCommunityIcons
                        name="file-upload-outline"
                        size={16}
                        color={COLORS.text}
                      />
                    )
                  }
                >
                  <Text style={styles.rowButtonLabel}>
                    {t("settings.import.pickFile")}
                  </Text>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  style={styles.rowButton}
                  disabled={busy}
                  accessibilityLabel={t("settings.import.loadSample")}
                  onPress={handleLoadSample}
                  icon={
                    <MaterialCommunityIcons
                      name="clipboard-text-outline"
                      size={16}
                      color={COLORS.text}
                    />
                  }
                >
                  <Text style={styles.rowButtonLabel}>
                    {t("settings.import.loadSample")}
                  </Text>
                </Button>
              </View>

              {validation.status === "invalid" ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorTitle}>
                    {t("settings.import.errorsTitle", {
                      count: validation.issues.length,
                    })}
                  </Text>
                  {validation.issues.slice(0, MAX_SHOWN_ISSUES).map((issue, index) => (
                    <Text key={`${issue.key}-${index}`} style={styles.errorLine}>
                      {`• ${t(issue.key, issue.params as Record<string, string>)}`}
                    </Text>
                  ))}
                  {validation.issues.length > MAX_SHOWN_ISSUES ? (
                    <Text style={styles.errorLine}>
                      {t("settings.import.moreErrors", {
                        remaining: validation.issues.length - MAX_SHOWN_ISSUES,
                      })}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {validation.status === "valid" &&
              validation.snapshot === snapshot ? (
                <View style={styles.previewCard}>
                  <Text style={styles.previewTitle}>
                    {t("settings.import.previewEntries", {
                      count: validation.payload.entries.length,
                    })}
                  </Text>
                  {validation.payload.rates ? (
                    <Text style={styles.previewLine}>
                      {t("settings.import.previewRates", {
                        cow: formatCurrency(validation.payload.rates.Cow),
                        buffalo: formatCurrency(validation.payload.rates.Buffalo),
                      })}
                    </Text>
                  ) : (
                    <Text style={styles.previewLine}>
                      {t("settings.import.previewInheritedRates")}
                    </Text>
                  )}
                  <Text style={styles.previewLine}>
                    {t("settings.import.previewNote")}
                  </Text>
                </View>
              ) : null}

              <Button
                variant="primary"
                size="md"
                fullWidth
                style={styles.validateButton}
                disabled={busy}
                accessibilityLabel={t("settings.import.validate")}
                onPress={handleValidate}
              >
                <Text style={styles.validateLabel}>
                  {t("settings.import.validate")}
                </Text>
              </Button>

              {validation.status === "valid" &&
              validation.snapshot === snapshot ? (
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  style={styles.importButton}
                  disabled={!canImport}
                  loading={busy}
                  accessibilityLabel={t("settings.import.importAction")}
                  onPress={handleImport}
                  icon={
                    <MaterialCommunityIcons
                      name="file-download-outline"
                      size={18}
                      color={COLORS.white}
                    />
                  }
                >
                  <Text style={styles.importLabel}>
                    {t("settings.import.importAction", {
                      count: validation.payload.entries.length,
                    })}
                  </Text>
                </Button>
              ) : null}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  backdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: withAlpha("#0F172A", 0.5),
  },
  dialog: { width: "100%", maxWidth: 420, alignSelf: "center" },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  heading: { flex: 1 },
  title: { color: COLORS.text, fontSize: 17, fontWeight: "800" },
  subtitle: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  fieldLabel: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6,
  },
  textBox: {
    minHeight: 140,
    maxHeight: 220,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    backgroundColor: COLORS.surfaceLow,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.text,
  },
  fileName: {
    color: COLORS.brand,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: "700",
    marginTop: 6,
  },
  pickError: {
    color: COLORS.red,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: "700",
    marginTop: 6,
  },
  row: { flexDirection: "row", gap: 10, marginTop: 10 },
  rowButton: { flex: 1 },
  rowButtonLabel: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: "700",
  },
  errorCard: {
    borderRadius: RADII.control,
    backgroundColor: withAlpha(COLORS.red, 0.06),
    borderWidth: 1,
    borderColor: withAlpha(COLORS.red, 0.3),
    padding: 12,
    marginTop: 10,
    gap: 4,
  },
  errorTitle: {
    color: COLORS.red,
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: "800",
  },
  errorLine: { color: COLORS.red, fontSize: TYPOGRAPHY.caption },
  previewCard: {
    borderRadius: RADII.control,
    backgroundColor: withAlpha(COLORS.greenAccent, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(COLORS.greenAccent, 0.3),
    padding: 12,
    marginTop: 10,
    gap: 4,
  },
  previewTitle: {
    color: COLORS.brand,
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: "800",
  },
  previewLine: { color: COLORS.muted, fontSize: TYPOGRAPHY.caption },
  validateButton: { marginTop: 12 },
  validateLabel: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.body,
    fontWeight: "700",
  },
  importButton: { marginTop: 10 },
  importLabel: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.body,
    fontWeight: "700",
  },
});
