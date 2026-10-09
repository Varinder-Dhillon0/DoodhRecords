import type { OperationResult } from "../types";
import { preferenceRepository, runRepository } from "../data/repositories";

export const loadLanguagePreference = (): Promise<OperationResult<string | null>> =>
  runRepository(() => preferenceRepository.loadLanguage());

export const saveLanguagePreference = (
  language: string,
): Promise<OperationResult<void>> =>
  runRepository(() => preferenceRepository.saveLanguage(language));

export const loadFontScalePreference = (): Promise<OperationResult<number | null>> =>
  runRepository(() => preferenceRepository.loadFontScale());

export const saveFontScalePreference = (
  scale: number,
): Promise<OperationResult<void>> =>
  runRepository(() => preferenceRepository.saveFontScale(scale));
