/**
 * JSON import intake.
 *
 * Mirrors dataExport.ts: native modules are required lazily so the browser
 * bundle never evaluates them. Data can arrive from the OS file picker or
 * from pasting; both end up as plain text for the month-import validator.
 */
import { Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";

export type PickedJsonFile = {
  name: string;
  contents: string;
};

type LegacyFileSystem = {
  readAsStringAsync(fileUri: string): Promise<string>;
};

type WebFile = {
  text(): Promise<string>;
};

const readTextFromUri = async (
  uri: string,
  webFile?: WebFile | null,
): Promise<string> => {
  if (webFile && typeof webFile.text === "function") {
    return webFile.text();
  }

  if (Platform.OS !== "web") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const FileSystem = require("expo-file-system") as {
        readAsStringAsync?: LegacyFileSystem["readAsStringAsync"];
      };
      if (FileSystem.readAsStringAsync) {
        return FileSystem.readAsStringAsync(uri);
      }
    } catch {
      // Fall through to fetch below.
    }
  }

  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Unable to read picked file (status ${response.status}).`);
  }
  return response.text();
};

/**
 * Opens the OS picker for a JSON file and returns its text. Returns null
 * when the user dismisses the picker.
 */
export const pickJsonFile = async (): Promise<PickedJsonFile | null> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/json", "text/plain"],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  const webFile = (asset as { file?: WebFile }).file ?? null;
  const contents = await readTextFromUri(asset.uri, webFile);
  return { name: asset.name ?? "import.json", contents };
};
