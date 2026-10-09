/**
 * Binary update gate: compares the installed Android versionCode against
 * the self-hosted version manifest. Fail-open by design — no network or
 * a bad manifest means the user keeps using the app (offline-first).
 */

export const UPDATE_MANIFEST_URL =
  "https://raw.githubusercontent.com/Varinder-Dhillon0/DoodhRecords/main/version.json";

export type UpdateManifestAndroid = {
  latestVersionCode: number;
  minVersionCode: number;
  versionName: string;
  apkUrl: string;
  notes?: { en?: string; pa?: string };
};

export type UpdateCheckResult =
  | { status: "ok" }
  | {
      status: "update-required";
      manifest: UpdateManifestAndroid;
      installedCode: number;
    };

type ApplicationModule = {
  nativeBuildVersion?: string | number | null;
};

const fetchManifest = async (): Promise<UpdateManifestAndroid | null> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(UPDATE_MANIFEST_URL, {
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const manifest = (await response.json())?.android;
    if (
      !manifest ||
      !Number.isFinite(Number(manifest.minVersionCode)) ||
      typeof manifest.apkUrl !== "string" ||
      !manifest.apkUrl
    ) {
      return null;
    }
    return manifest as UpdateManifestAndroid;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

export const checkForBinaryUpdate = async (): Promise<UpdateCheckResult> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Application = require("expo-application") as ApplicationModule;
    const installedCode = Number(Application.nativeBuildVersion ?? 0);
    const manifest = await fetchManifest();
    if (!manifest) return { status: "ok" };
    if (installedCode < Number(manifest.minVersionCode)) {
      return { status: "update-required", manifest, installedCode };
    }
    return { status: "ok" };
  } catch {
    return { status: "ok" };
  }
};
