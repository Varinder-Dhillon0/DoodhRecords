import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import pa from "./locales/pa.json";
import { getStoredLanguage, saveStoredLanguage } from "../utils/storageManager";

const resources = {
  en: { translation: en },
  pa: { translation: pa },
};

export type SupportedLanguage = keyof typeof resources;

const isSupportedLanguage = (language: string | null): language is SupportedLanguage =>
  language !== null && Object.prototype.hasOwnProperty.call(resources, language);

let initialization: Promise<void> | undefined;

export function initializeI18n(): Promise<void> {
  if (!initialization) {
    initialization = (async () => {
      const savedLanguage = await getStoredLanguage();
      const language = isSupportedLanguage(savedLanguage) ? savedLanguage : "en";

      await i18n.use(initReactI18next).init({
        resources,
        lng: language,
        fallbackLng: "en",
        supportedLngs: Object.keys(resources),
        interpolation: { escapeValue: false },
      });
    })();
  }
  return initialization;
}

export async function changeAppLanguage(language: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(language);
  await saveStoredLanguage(language);
}

export default i18n;
