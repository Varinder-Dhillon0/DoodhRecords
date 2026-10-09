import type { Animal, MilkEntry, PricingConfig } from "../types";

export const EXPORT_FORMAT = "doodh-records-export";
export const EXPORT_FORMAT_VERSION = 1;

export type ExportPayloadInput = {
  milkEntries: MilkEntry[];
  pricingConfigurations: PricingConfig;
  animalTypes: Animal[];
  preferences: {
    language: string | null;
    fontScale: number | null;
  };
  appVersion: string;
  exportedAt: string;
};

export type ExportPayload = {
  format: typeof EXPORT_FORMAT;
  formatVersion: typeof EXPORT_FORMAT_VERSION;
  exportedAt: string;
  appVersion: string;
  data: {
    milkEntries: MilkEntry[];
    pricingConfigurations: PricingConfig;
    animalTypes: Animal[];
    preferences: {
      language: string | null;
      fontScale: number | null;
    };
  };
};

export const createExportPayload = ({
  milkEntries,
  pricingConfigurations,
  animalTypes,
  preferences,
  appVersion,
  exportedAt,
}: ExportPayloadInput): ExportPayload => ({
  format: EXPORT_FORMAT,
  formatVersion: EXPORT_FORMAT_VERSION,
  exportedAt,
  appVersion,
  data: {
    milkEntries,
    pricingConfigurations,
    animalTypes,
    preferences,
  },
});

export const serializeExportPayload = (payload: ExportPayload): string =>
  JSON.stringify(payload, null, 2);

export const createExportFileName = (exportedAt: string): string =>
  `doodh_records_export_${exportedAt.replace(/[:.]/g, "-")}.json`;
