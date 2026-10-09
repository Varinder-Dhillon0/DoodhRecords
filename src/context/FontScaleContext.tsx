import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  createTypography,
  FONT_SCALE_RANGE,
  getNearestFontScaleOption,
  RuntimeTypography,
} from "../constants/typography";
import { saveFontScalePreference } from "../services/preferenceService";

type FontScaleContextValue = {
  fontScale: number;
  typography: RuntimeTypography;
  setFontScale: (value: number) => void;
};

const FontScaleContext = createContext<FontScaleContextValue | null>(null);

export function FontScaleProvider({
  initialScale = FONT_SCALE_RANGE.default,
  children,
}: {
  initialScale?: number;
  children: React.ReactNode;
}) {
  const [fontScale, setFontScaleState] = useState(
    () => getNearestFontScaleOption(initialScale).multiplier,
  );

  const setFontScale = useCallback((value: number) => {
    const nextScale = getNearestFontScaleOption(value).multiplier;
    setFontScaleState(nextScale);
    void saveFontScalePreference(nextScale);
  }, []);

  const typography = useMemo(() => createTypography(fontScale), [fontScale]);
  const contextValue = useMemo(
    () => ({ fontScale, typography, setFontScale }),
    [fontScale, typography, setFontScale],
  );

  return (
    <FontScaleContext.Provider value={contextValue}>
      {children}
    </FontScaleContext.Provider>
  );
}

export function useFontScale(): FontScaleContextValue {
  const context = useContext(FontScaleContext);
  if (!context) {
    throw new Error("useFontScale must be used within a FontScaleProvider");
  }
  return context;
}
