/**
 * Release preparation: derives versionName from the release tag and bumps
 * the local Android versionCode, then refreshes version.json (the manifest
 * the in-app update gate reads).
 *
 * Usage: node scripts/prepare-release.mjs v1.0.4
 *
 * The release APK is always published under the fixed asset name
 * `doodhrecords.apk`, so the manifest URL never changes between releases.
 */
import fs from "node:fs";

const APK_ASSET_NAME = "doodhrecords.apk";
const MANIFEST_APK_URL =
  "https://github.com/Varinder-Dhillon0/DoodhRecords/releases/latest/download/doodhrecords.apk";

const tag = process.argv[2];
if (!tag || !/^v\d+\.\d+\.\d+$/.test(tag)) {
  console.error("Expected a tag argument like v1.0.4");
  process.exit(1);
}
const versionName = tag.slice(1);

const readJson = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
const writeJson = (path, value) =>
  fs.writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

const packageJson = readJson("package.json");
packageJson.version = versionName;
writeJson("package.json", packageJson);

const appJson = readJson("app.json");

const GRADLE_PATH = "android/app/build.gradle";
const gradle = fs.readFileSync(GRADLE_PATH, "utf8");
const gradleCode = Number(gradle.match(/versionCode\s+(\d+)/)?.[1] ?? 0);
const nextCode = Math.max(
  Number(appJson.expo?.android?.versionCode ?? 0),
  gradleCode,
) + 1;

appJson.expo.version = versionName;
appJson.expo.android = { ...(appJson.expo.android ?? {}), versionCode: nextCode };
writeJson("app.json", appJson);

const updatedGradle = gradle
  .replace(/versionCode\s+\d+/, `versionCode ${nextCode}`)
  .replace(/versionName\s+"[^"]*"/, `versionName "${versionName}"`);
if (updatedGradle === gradle) {
  console.error(`Unable to bump ${GRADLE_PATH}: versionCode/versionName not found`);
  process.exit(1);
}
fs.writeFileSync(GRADLE_PATH, updatedGradle);

const manifest = readJson("version.json");
manifest.android = {
  ...(manifest.android ?? {}),
  latestVersionCode: nextCode,
  minVersionCode: nextCode,
  versionName,
  apkUrl: MANIFEST_APK_URL,
  notes: manifest.android?.notes ?? { en: "", pa: "" },
};
writeJson("version.json", manifest);

console.log(
  `release ${versionName} (code ${nextCode}), apk asset: ${APK_ASSET_NAME}`,
);
