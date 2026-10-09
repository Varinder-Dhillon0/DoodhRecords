import { Platform } from "react-native";

/**
 * Monthly PDF report delivery.
 *
 * Native modules are required lazily so the web bundle never evaluates
 * them, following the pattern in utils/dataExport.ts.
 *
 * The PDF bytes are staged into the app cache under their real file name
 * before sharing: the temp URI returned by expo-print is not readable by
 * the OS share sheet ("Not allowed to read file under given URL").
 */

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
  const generated = await Print.printToFileAsync({
    html: options.html,
    base64: true,
  });
  if (!generated.base64) {
    throw new Error("Print output did not include PDF data.");
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { File, Paths } = require("expo-file-system") as NativeFileSystem;
  const file = new File(Paths.cache ?? ".", options.fileName);
  file.write(generated.base64, { encoding: "base64" });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Sharing = require("expo-sharing") as SharingModule;
  if (!(await Sharing.isAvailableAsync())) return false;

  await Sharing.shareAsync(file.uri, {
    dialogTitle: options.dialogTitle,
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
  });

  return true;
};
