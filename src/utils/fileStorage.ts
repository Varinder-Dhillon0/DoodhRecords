/**
 * Platform-aware storage for the small text files this app keeps (CSV entries,
 * pricing, language, font scale).
 *
 * Native keeps using expo-file-system with the exact semantics the app already
 * relied on. It is loaded through a lazy `require` on purpose: expo-file-system
 * throws on web (`this.validatePath is not a function`), and a static import
 * evaluates the module before anything can guard it. Web persists the same
 * files under namespaced localStorage keys instead.
 */
import { Platform } from "react-native";

export type StoredFile = {
  readonly uri: string;
  readonly name: string;
  readonly exists: boolean;
  text(): Promise<string>;
  write(contents: string): void;
};

export type StoredDirectory = {
  readonly exists: boolean;
  create(): void;
  list(): StoredFile[];
  file(name: string): StoredFile;
};

type NativeFileSystem = {
  Directory: new (...args: any[]) => any;
  File: new (...args: any[]) => any;
  Paths: { document?: string; cache?: string };
};

let nativeFileSystem: NativeFileSystem | null = null;

const getNativeFileSystem = (): NativeFileSystem => {
  if (!nativeFileSystem) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    nativeFileSystem = require("expo-file-system") as NativeFileSystem;
  }
  return nativeFileSystem;
};

const createNativeDirectory = (): StoredDirectory => {
  const { Directory, File, Paths } = getNativeFileSystem();
  const root = new Directory(Paths.document ?? Paths.cache, "doodh_records");

  const wrap = (nativeFile: any): StoredFile => ({
    uri: nativeFile.uri,
    name: nativeFile.name,
    get exists() {
      return nativeFile.exists;
    },
    text: () => nativeFile.text() as Promise<string>,
    write: (contents: string) => {
      if (!root.exists) root.create();
      nativeFile.write(contents);
    },
  });

  return {
    get exists() {
      return root.exists;
    },
    create: () => {
      if (!root.exists) root.create();
    },
    list: () => {
      if (!root.exists) return [];
      return (root.list() as any[])
        .filter((item) => item instanceof File)
        .map(wrap);
    },
    file: (name: string) => wrap(new File(root, name)),
  };
};

const WEB_NAMESPACE = "doodh_records";
const WEB_KEY_PREFIX = `${WEB_NAMESPACE}::`;

type WebStorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

type WebGlobals = {
  localStorage?: WebStorageLike;
};

const getWebGlobals = (): WebGlobals => globalThis as unknown as WebGlobals;

/**
 * Probed once: if localStorage is absent or unusable (SSR, privacy mode) we
 * fall back to an in-memory map rather than throwing inside storage helpers.
 */
const webStorage = ((): WebStorageLike | null => {
  try {
    const storage = getWebGlobals().localStorage;
    if (!storage) return null;
    const probe = `${WEB_KEY_PREFIX}__probe__`;
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
})();

const memoryStorage = new Map<string, string>();

const readValue = (key: string): string | null =>
  webStorage ? webStorage.getItem(key) : (memoryStorage.get(key) ?? null);

const writeValue = (key: string, value: string): void => {
  if (webStorage) {
    webStorage.setItem(key, value);
    return;
  }
  memoryStorage.set(key, value);
};

const listValueKeys = (): string[] => {
  const keys = webStorage
    ? Object.keys(webStorage).filter((key) => key.startsWith(WEB_KEY_PREFIX))
    : [...memoryStorage.keys()].filter((key) =>
        key.startsWith(WEB_KEY_PREFIX),
      );
  return keys;
};

const createWebDirectory = (): StoredDirectory => {
  const keyFor = (name: string) => `${WEB_KEY_PREFIX}${name}`;

  const file = (name: string): StoredFile => ({
    uri: `local-storage://${keyFor(name)}`,
    name,
    get exists() {
      return readValue(keyFor(name)) !== null;
    },
    text: async () => readValue(keyFor(name)) ?? "",
    write: (contents: string) => writeValue(keyFor(name), contents),
  });

  return {
    get exists() {
      return listValueKeys().length > 0;
    },
    create() {
      // localStorage has no directories; existence is derived from its keys.
    },
    list: () =>
      listValueKeys()
        .map((key) => key.slice(WEB_KEY_PREFIX.length))
        .map(file),
    file,
  };
};

export const getStorageDirectory = (): StoredDirectory =>
  Platform.OS === "web" ? createWebDirectory() : createNativeDirectory();
