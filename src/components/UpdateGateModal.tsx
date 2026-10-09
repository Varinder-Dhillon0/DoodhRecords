import React, { useState } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text as RNText,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { COLORS, RADII, SHADOWS } from "../constants";
import { TYPOGRAPHY } from "../constants/typography";
import type { UpdateManifestAndroid } from "../services/versionCheckService";
import { downloadApk, launchApkInstaller } from "../services/appUpdateService";
import Button from "./Button";

type UpdateGateModalProps = {
  manifest: UpdateManifestAndroid;
};

type GatePhase =
  | { name: "ready" }
  | { name: "downloading"; fraction: number | null }
  | { name: "downloaded"; fileUri: string }
  | { name: "failed" };

/**
 * Blocking forced-update gate for self-hosted APK distribution. No
 * dismiss path: the user downloads the APK and installs it to proceed.
 */
export default function UpdateGateModal({ manifest }: UpdateGateModalProps) {
  const { t, i18n } = useTranslation();
  const [phase, setPhase] = useState<GatePhase>({ name: "ready" });

  const language = i18n.language.startsWith("pa") ? "pa" : "en";
  const notes =
    manifest.notes?.[language] ??
    manifest.notes?.en ??
    manifest.notes?.pa ??
    "";

  const startDownload = async () => {
    setPhase({ name: "downloading", fraction: null });
    try {
      const fileUri = await downloadApk(manifest.apkUrl, (progress) => {
        setPhase({ name: "downloading", fraction: progress.fraction });
      });
      setPhase({ name: "downloaded", fileUri });
      await launchApkInstaller(fileUri);
    } catch (error) {
      console.error("Error downloading update:", error);
      setPhase({ name: "failed" });
    }
  };

  const retryInstall = async () => {
    if (phase.name !== "downloaded") return;
    try {
      await launchApkInstaller(phase.fileUri);
    } catch (error) {
      console.error("Error launching installer:", error);
    }
  };

  const percent =
    phase.name === "downloading" && phase.fraction !== null
      ? `${Math.round(phase.fraction * 100)}%`
      : "…";

  return (
    <Modal visible animationType="fade" onRequestClose={() => undefined}>
      <View style={styles.root}>
        <View style={styles.card}>
          <Image
            source={require("../../assets/CuteCow.png")}
            style={styles.mascot}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <RNText style={styles.title}>{t("update.title")}</RNText>
          <RNText style={styles.message}>
            {t("update.message", { version: manifest.versionName })}
          </RNText>
          {notes ? <RNText style={styles.notes}>{notes}</RNText> : null}

          {phase.name === "downloading" ? (
            <View style={styles.progressWrap}>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    phase.fraction !== null
                      ? { width: `${Math.round(phase.fraction * 100)}%` }
                      : { width: "100%", opacity: 0.5 },
                  ]}
                />
              </View>
              <RNText style={styles.progressLabel}>
                {t("update.downloading", { percent })}
              </RNText>
            </View>
          ) : null}

          {phase.name === "failed" ? (
            <RNText style={styles.error}>{t("update.failed")}</RNText>
          ) : null}

          {phase.name === "downloaded" ? (
            <>
              <RNText style={styles.installHelp}>
                {t("update.installHelp")}
              </RNText>
              <Button variant="primary" size="lg" fullWidth onPress={retryInstall}>
                <RNText style={styles.primaryLabel}>{t("update.install")}</RNText>
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={phase.name === "downloading"}
              disabled={phase.name === "downloading"}
              onPress={startDownload}
            >
              <RNText style={styles.primaryLabel}>
                {phase.name === "failed"
                  ? t("update.retry")
                  : t("update.download")}
              </RNText>
            </Button>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    padding: 24,
    alignItems: "center",
    ...SHADOWS.card,
  },
  mascot: { width: 120, height: 120, marginBottom: 12 },
  title: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.heading,
    fontWeight: "800",
    textAlign: "center",
  },
  message: {
    color: COLORS.muted,
    fontSize: TYPOGRAPHY.body,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  notes: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.caption,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  progressWrap: { width: "100%", marginTop: 16, gap: 8 },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.surfaceContainer,
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: COLORS.brand },
  progressLabel: {
    color: COLORS.muted,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: "700",
    textAlign: "center",
  },
  error: {
    color: COLORS.red,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 12,
  },
  installHelp: {
    color: COLORS.muted,
    fontSize: TYPOGRAPHY.caption,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 12,
    lineHeight: 18,
  },
  primaryLabel: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.bodyLarge,
    fontWeight: "700",
  },
});
