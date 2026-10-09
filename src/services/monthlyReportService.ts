import { Platform } from "react-native";

/**
 * Monthly PDF report delivery.
 *
 * Native modules are required lazily so the web bundle never evaluates
 * them, following the pattern in utils/dataExport.ts.
 */

type PrintModule = {
  printAsync(options: { html: string }): Promise<void>;
  printToFileAsync(options: { html: string }): Promise<{ uri: string }>;
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

export const shareMonthlyReportPdf = async (options: {
  html: string;
  fileName: string;
  dialogTitle?: string;
}): Promise<boolean> => {
  if (Platform.OS === "web") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Print = require("expo-print") as PrintModule;
    await Print.printAsync({ html: options.html });
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Print = require("expo-print") as PrintModule;
  const generated = await Print.printToFileAsync({ html: options.html });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Sharing = require("expo-sharing") as SharingModule;
  if (!(await Sharing.isAvailableAsync())) return false;

  await Sharing.shareAsync(generated.uri, {
    dialogTitle: options.dialogTitle,
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
  });

  return true;
};
