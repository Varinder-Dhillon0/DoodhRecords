const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.join(__dirname, "..");
const root = path.join(projectRoot, "src");
const skippedDirectories = new Set([
  "node_modules",
  ".git",
  ".expo",
  ".idea",
  ".vscode",
  "android",
  "ios",
  "dist",
  "assets",
]);

const readSourceFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (skippedDirectories.has(entry.name)) return [];
      return readSourceFiles(fullPath);
    }
    return fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")
      ? [{ path: fullPath, text: fs.readFileSync(fullPath, "utf8") }]
      : [];
  });

const files = [
  {
    path: path.join(projectRoot, "App.tsx"),
    text: fs.readFileSync(path.join(projectRoot, "App.tsx"), "utf8"),
  },
  ...readSourceFiles(root),
];
const relative = (file) => path.relative(path.join(__dirname, ".."), file).replace(/\\/g, "/");
const failures = [];
const fail = (message) => failures.push(message);

files.forEach(({ path: file, text }) => {
  const name = relative(file);

  if (text.includes('from "expo-file-system"') || text.includes("from 'expo-file-system'")) {
    fail(`${name} statically imports expo-file-system; use lazy platform loading`);
  }
  if (text.includes('from "expo-sharing"') || text.includes("from 'expo-sharing'")) {
    fail(`${name} statically imports expo-sharing; use lazy platform loading`);
  }
  if (name !== "src/data/repositories.ts" && /from ["']\.\.?\/.*storageManager["']/.test(text)) {
    fail(`${name} bypasses the repository boundary with a direct storageManager import`);
  }
  const isPresentation =
    name === "App.tsx" ||
    name.startsWith("src/screens/") ||
    name.startsWith("src/components/") ||
    name.startsWith("src/hooks/");
  if (
    isPresentation &&
    /from ["'].*\/(storageManager|repositories)["']/.test(text)
  ) {
    fail(`${name} bypasses services with direct storage/repository access`);
  }
  const isAppState =
    name === "App.tsx" ||
    name.startsWith("src/context/") ||
    name.startsWith("src/i18n/");
  if (
    isAppState &&
    /from ["'].*\/(storageManager|repositories)["']/.test(text)
  ) {
    fail(`${name} bypasses services with direct storage/repository access`);
  }
  if (
    name.startsWith("src/services/") &&
    /from ["'].*storageManager["']/.test(text)
  ) {
    fail(`${name} bypasses repositories with direct storageManager access`);
  }
  if (/(^|[^\w])(useDoodhData|ensureMonthlyFile|PRICING_FILE)([^\w]|$)/.test(text) && !name.endsWith("src/data/repositories.ts")) {
    fail(`${name} references removed storage compatibility API`);
  }

  const allowsCanonicalDefaults =
    name === "src/domain/pricing.ts" || name === "src/data/defaultData.ts";
  if (!allowsCanonicalDefaults && /(Cow:\s*8|Buffalo:\s*9)/.test(text)) {
    fail(`${name} contains a duplicated animal-price literal; use domain/pricing`);
  }
});

// Shared domain behavior must actually be shared.
const requiredImports = [
  ["src/screens/EntriesScreen.tsx", "../hooks/useEntries"],
  ["src/screens/ReportsScreen.tsx", "../hooks/useEntries"],
  ["src/screens/SettingsScreen.tsx", "../hooks/useEntries"],
  ["src/screens/ReportsScreen.tsx", "../hooks/useDataExport"],
  ["src/screens/SettingsScreen.tsx", "../hooks/useDataExport"],
  ["src/screens/HomeScreen.tsx", "../components/ui/MetricCard"],
  ["src/screens/ReportsScreen.tsx", "../components/ui/MetricCard"],
  ["src/screens/HomeScreen.tsx", "../components/ui/DateField"],
  ["src/screens/EntryFormScreen.tsx", "../components/ui/DateField"],
  ["src/context/DoodhContext.tsx", "../services/recordService"],
  ["src/context/DoodhContext.tsx", "../services/pricingService"],
  ["src/context/FontScaleContext.tsx", "../services/preferenceService"],
  ["src/i18n/index.ts", "../services/preferenceService"],
  ["App.tsx", "./src/services/preferenceService"],
  ["src/hooks/useDataExport.ts", "../services/exportService"],
  ["App.tsx", "./src/navigation/tabs"],
];
requiredImports.forEach(([file, imported]) => {
  const match = files.find((candidate) => relative(candidate.path) === file);
  if (!match) {
    fail(`missing expected file ${file}`);
  } else if (!match.text.includes(imported)) {
    fail(`${file} does not use shared module ${imported}`);
  }
});

if (!fs.existsSync(path.join(__dirname, "..", "src", "hooks", "useDoodhData.ts"))) {
  // Expected: the unused compatibility hook was removed.
} else {
  fail("src/hooks/useDoodhData.ts still exists");
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `architecture violation: ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`${files.length} source files passed architecture checks`);
}
