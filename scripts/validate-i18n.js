const fs = require("node:fs");
const path = require("node:path");

const localeDirectory = path.join(__dirname, "..", "src", "i18n", "locales");
const english = JSON.parse(
  fs.readFileSync(path.join(localeDirectory, "en.json"), "utf8"),
);
const localeFiles = fs.readdirSync(localeDirectory).filter((file) => file.endsWith(".json"));

function flattenKeys(value, prefix = "") {
  return Object.entries(value).flatMap(([key, child]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === "object" && !Array.isArray(child)
      ? flattenKeys(child, fullKey)
      : [fullKey];
  });
}

const englishKeys = flattenKeys(english);
const englishKeySet = new Set(englishKeys);
const englishKeyCount = englishKeys.length;
let hasErrors = false;

function interpolationNames(value) {
  return [...value.matchAll(/{{\s*([^{}]+?)\s*}}/g)]
    .map((match) => match[1])
    .sort();
}

for (const file of localeFiles) {
  const locale = file.slice(0, -5);
  const translations = JSON.parse(
    fs.readFileSync(path.join(localeDirectory, file), "utf8"),
  );
  const localeKeys = flattenKeys(translations);
  const localeKeySet = new Set(localeKeys);
  const missing = englishKeys.filter((key) => !localeKeySet.has(key));
  const extra = localeKeys.filter((key) => !englishKeySet.has(key));
  const interpolationErrors = englishKeys.filter(
    (key) =>
      localeKeySet.has(key) &&
      JSON.stringify(interpolationNames(translationsAtKey(translations, key))) !==
        JSON.stringify(interpolationNames(translationsAtKey(english, key))),
  );

  console.log(`${locale} keys: ${localeKeys.length}`);
  console.log(`Missing ${locale} keys: ${missing.length}`);
  if (locale === "pa") {
    console.log(`English keys: ${englishKeyCount}`);
    console.log(`Punjabi keys: ${localeKeys.length}`);
    console.log(`Missing Punjabi keys: ${missing.length}`);
  }
  if (missing.length) console.error(`Missing in ${locale}: ${missing.join(", ")}`);
  if (extra.length) console.error(`Unexpected in ${locale}: ${extra.join(", ")}`);
  if (interpolationErrors.length) {
    console.error(
      `Interpolation mismatch in ${locale}: ${interpolationErrors.join(", ")}`,
    );
  }
  hasErrors ||= Boolean(missing.length || extra.length || interpolationErrors.length);
}

function translationsAtKey(source, key) {
  return key.split(".").reduce((value, part) => value[part], source);
}

if (hasErrors) process.exitCode = 1;
