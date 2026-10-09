import { Platform } from "react-native";
import { preferenceRepository } from "../data/repositories";

/**
 * Monthly PDF report delivery: the file is saved onto the user's device,
 * never handed to the share sheet.
 *
 * - Android: written through the Storage Access Framework into a folder
 *   the user picks once (defaults to Downloads); the grant is remembered.
 * - iOS: written into the app Documents folder, visible in the Files app
 *   (requires UIFileSharingEnabled + LSSupportsOpeningDocumentsInPlace).
 * - Web: opens the browser print dialog (Save as PDF lands in Downloads).
 *
 * Native modules are required lazily so the web bundle never evaluates
 * them, following the pattern in utils/dataExport.ts.
 */

export type MonthlyReportSaveResult =
  | { status: "saved"; location: "downloads" | "files" }
  | { status: "cancelled" };

type PrintModule = {
  printAsync(options: { html: string }): Promise<void>;
  printToFileAsync(options: {
    html: string;
    base64?: boolean;
  }): Promise<{ uri: string; numberOfPages: number; base64?: string }>;
};

type NativeFileSystem = {
  File: new (...args: any[]) => {
    write(contents: string, options?: { encoding?: string }): void;
    uri: string;
  };
  Paths: { cache?: string; document?: string };
};

type LegacyFileSystem = {
  StorageAccessFramework: {
    getUriForDirectoryInRoot(folderName: string): string;
    requestDirectoryPermissionsAsync(
      initialFileUrl?: string | null,
    ): Promise<{ granted: boolean; directoryUri: string }>;
    createFileAsync(
      parentUri: string,
      fileName: string,
      mimeType: string,
    ): Promise<string>;
    readDirectoryAsync(dirUri: string): Promise<string[]>;
  };
  writeAsStringAsync(
    fileUri: string,
    contents: string,
    options?: { encoding?: string },
  ): Promise<void>;
  deleteAsync(fileUri: string): Promise<void>;
};

const loadLegacyFileSystem = (): LegacyFileSystem =>
  // The Storage Access Framework only exists in the legacy entry point;
  // the package root ships the new File/Paths API without it.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("expo-file-system/legacy") as LegacyFileSystem;

const printToBase64 = async (html: string): Promise<string> => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Print = require("expo-print") as PrintModule;
  const generated = await Print.printToFileAsync({ html, base64: true });
  if (!generated.base64) {
    throw new Error("Print output did not include PDF data.");
  }
  return generated.base64;
};

const resolveAndroidDirectory = async (
  saf: LegacyFileSystem["StorageAccessFramework"],
): Promise<string | null> => {
  const saved = await preferenceRepository.loadReportDirectory();
  if (saved) {
    try {
      await saf.readDirectoryAsync(saved);
      return saved;
    } catch {
      // Previous grant was revoked; fall through and ask again.
    }
  }

  const permission = await saf.requestDirectoryPermissionsAsync(
    saf.getUriForDirectoryInRoot("Download"),
  );
  if (!permission.granted) return null;
  await preferenceRepository.saveReportDirectory(permission.directoryUri);
  return permission.directoryUri;
};

const findClashingFile = (children: string[], fileName: string): string | null => {
  for (const child of children) {
    let decoded = child;
    try {
      decoded = decodeURIComponent(child);
    } catch {
      // Keep the raw value if it is not percent-encoded.
    }
    if (decoded === fileName || decoded.endsWith(`/${fileName}`)) {
      return child;
    }
  }
  return null;
};

const saveToAndroidDownloads = async (
  fileName: string,
  base64: string,
): Promise<MonthlyReportSaveResult> => {
  const legacy = loadLegacyFileSystem();
  const saf = legacy.StorageAccessFramework;

  const directoryUri = await resolveAndroidDirectory(saf);
  if (!directoryUri) return { status: "cancelled" };

  try {
    const children = await saf.readDirectoryAsync(directoryUri).catch(() => []);
    const clash = findClashingFile(children, fileName);
    if (clash) {
      await legacy.deleteAsync(clash).catch(() => undefined);
    }
    const fileUri = await saf.createFileAsync(
      directoryUri,
      fileName,
      "application/pdf",
    );
    await legacy.writeAsStringAsync(fileUri, base64, { encoding: "base64" });
  } catch (error) {
    // The grant may have gone stale between the check and the write; ask
    // once more before giving up.
    const permission = await saf.requestDirectoryPermissionsAsync(
      saf.getUriForDirectoryInRoot("Download"),
    );
    if (!permission.granted) return { status: "cancelled" };
    await preferenceRepository.saveReportDirectory(permission.directoryUri);
    const fileUri = await saf.createFileAsync(
      permission.directoryUri,
      fileName,
      "application/pdf",
    );
    await legacy.writeAsStringAsync(fileUri, base64, { encoding: "base64" });
  }

  return { status: "saved", location: "downloads" };
};

const saveToIosFiles = async (
  fileName: string,
  base64: string,
): Promise<MonthlyReportSaveResult> => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { File, Paths } = require("expo-file-system") as NativeFileSystem;
  const file = new File(Paths.document ?? ".", fileName);
  file.write(base64, { encoding: "base64" });
  return { status: "saved", location: "files" };
};

export const saveMonthlyReportPdf = async (options: {
  html: string;
  fileName: string;
}): Promise<MonthlyReportSaveResult> => {
  if (Platform.OS === "web") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Print = require("expo-print") as PrintModule;
    await Print.printAsync({ html: options.html });
    return { status: "saved", location: "downloads" };
  }

  const base64 = await printToBase64(options.html);

  if (Platform.OS === "android") {
    return saveToAndroidDownloads(options.fileName, base64);
  }

  return saveToIosFiles(options.fileName, base64);
};
