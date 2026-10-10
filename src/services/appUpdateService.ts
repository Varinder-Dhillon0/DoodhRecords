import { Platform } from "react-native";

/**
 * Self-hosted APK delivery: download with progress, then hand the file to
 * the Android package installer. Native modules are required lazily so
 * the web bundle never evaluates them.
 */

export type ApkDownloadProgress = {
  written: number;
  expected: number;
  /** 0..1, or null when the server did not report a size. */
  fraction: number | null;
};

type DownloadResumable = {
  downloadAsync(): Promise<{ uri: string } | null>;
};

type LegacyFileSystem = {
  cacheDirectory?: string | null;
  getContentUriAsync(fileUri: string): Promise<string>;
  createDownloadResumable(
    url: string,
    fileUri: string,
    options: Record<string, unknown>,
    callback?: (progress: {
      totalBytesWritten: number;
      totalBytesExpectedToWrite: number;
    }) => void,
  ): DownloadResumable;
};

type IntentLauncherModule = {
  startActivityAsync(
    action: string,
    params: Record<string, unknown>,
  ): Promise<unknown>;
};

const loadLegacyFileSystem = (): LegacyFileSystem =>
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("expo-file-system/legacy") as LegacyFileSystem;

export const downloadApk = async (
  apkUrl: string,
  onProgress?: (progress: ApkDownloadProgress) => void,
): Promise<string> => {
  if (Platform.OS !== "android") {
    throw new Error("APK download is only supported on Android.");
  }
  const legacy = loadLegacyFileSystem();
  const destination = `${legacy.cacheDirectory ?? ""}doodhrecords-update.apk`;
  const task = legacy.createDownloadResumable(
    apkUrl,
    destination,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      onProgress?.({
        written: totalBytesWritten,
        expected: totalBytesExpectedToWrite,
        fraction:
          totalBytesExpectedToWrite > 0
            ? totalBytesWritten / totalBytesExpectedToWrite
            : null,
      });
    },
  );
  const result = await task.downloadAsync();
  if (!result?.uri) {
    throw new Error("APK download did not produce a file.");
  }
  return result.uri;
};

export const launchApkInstaller = async (fileUri: string): Promise<void> => {
  if (Platform.OS !== "android") {
    throw new Error("APK install is only supported on Android.");
  }
  const legacy = loadLegacyFileSystem();
  const contentUri = await legacy.getContentUriAsync(fileUri);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const IntentLauncher =
    require("expo-intent-launcher") as IntentLauncherModule;
  await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
    data: contentUri,
    flags: 1,
    type: "application/vnd.android.package-archive",
  });
};

/**
 * Opens the system "Install unknown apps" screen for this app, so the
 * user can grant the one-time install permission and then tap Install.
 */
export const openUnknownSourcesSettings = async (): Promise<void> => {
  if (Platform.OS !== "android") return;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const IntentLauncher =
    require("expo-intent-launcher") as IntentLauncherModule;
  let packageName = "com.doodhrecords.app";
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Application = require("expo-application") as {
      applicationId?: string | null;
    };
    if (Application.applicationId) packageName = Application.applicationId;
  } catch {
    // Fall through with the manifest package name.
  }
  await IntentLauncher.startActivityAsync(
    "android.settings.MANAGE_UNKNOWN_APP_SOURCES",
    { data: `package:${packageName}` },
  );
};
