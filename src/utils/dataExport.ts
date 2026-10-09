/**
 * JSON backup export.
 *
 * Kept out of storageManager because delivery is platform specific: native
 * writes a temp file and hands it to the OS share sheet, while web downloads
 * the payload through a Blob. Both native modules are required lazily so the
 * browser bundle never evaluates them.
 */
import { Platform } from "react-native";
import { ANIMALS, APP_VERSION } from "../constants";
import {
  entryRepository,
  preferenceRepository,
  pricingRepository,
} from "../data/repositories";
import {
  createExportFileName,
  createExportPayload,
  serializeExportPayload,
} from "../domain/exportPayload";

const buildFileName = (exportedAt: string): string =>
  createExportFileName(exportedAt);

const buildContents = async (exportedAt: string): Promise<string> => {
  const [milkEntries, pricingConfigurations, language, fontScale] =
    await Promise.all([
      entryRepository.listAll(),
      pricingRepository.load(),
      preferenceRepository.loadLanguage(),
      preferenceRepository.loadFontScale(),
    ]);

  return serializeExportPayload(
    createExportPayload({
      milkEntries,
      pricingConfigurations,
      animalTypes: ANIMALS,
      preferences: { language, fontScale },
      appVersion: APP_VERSION,
      exportedAt,
    }),
  );
};

type DownloadGlobals = {
  Blob?: new (parts: unknown[], options?: { type?: string }) => unknown;
  URL?: {
    createObjectURL(blob: unknown): string;
    revokeObjectURL(url: string): void;
  };
  document?: {
    createElement(tag: string): {
      href: string;
      download: string;
      click(): void;
      style?: { display: string };
    };
    body?: {
      appendChild(node: unknown): void;
      removeChild(node: unknown): void;
    };
  };
};

const downloadInBrowser = (contents: string, fileName: string): void => {
  const globals = globalThis as unknown as DownloadGlobals;

  if (!globals.Blob || !globals.URL || !globals.document?.body) {
    throw new Error("Browser download is unavailable in this environment.");
  }

  const blob = new globals.Blob([contents], { type: "application/json" });
  const objectUrl = globals.URL.createObjectURL(blob);
  const anchor = globals.document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.style = { display: "none" };
  globals.document.body.appendChild(anchor);
  anchor.click();
  globals.document.body.removeChild(anchor);
  globals.URL.revokeObjectURL(objectUrl);
};

type NativeFileSystem = {
  File: new (...args: any[]) => { write(contents: string): void; uri: string };
  Paths: { cache?: string };
};

type SharingModule = {
  isAvailableAsync(): Promise<boolean>;
  shareAsync(
    uri: string,
    options?: {
      dialogTitle?: string;
      mimeType?: string;
      UTI?: string;
    },
  ): Promise<{ action: string }>;
};

/**
 * Exports a JSON backup. Returns false when the native share sheet is
 * unavailable; on web it always downloads and returns true.
 */
export const exportDataFile = async (
  options: { dialogTitle?: string } = {},
): Promise<boolean> => {
  const exportedAt = new Date().toISOString();
  const contents = await buildContents(exportedAt);
  const fileName = buildFileName(exportedAt);

  if (Platform.OS === "web") {
    downloadInBrowser(contents, fileName);
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Sharing = require("expo-sharing") as SharingModule;
  if (!(await Sharing.isAvailableAsync())) return false;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { File, Paths } = require("expo-file-system") as NativeFileSystem;
  const file = new File(Paths.cache ?? ".", fileName);
  file.write(contents);

  await Sharing.shareAsync(file.uri, {
    dialogTitle: options.dialogTitle,
    mimeType: "application/json",
    UTI: "public.json",
  });

  return true;
};
