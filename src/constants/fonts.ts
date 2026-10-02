import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useFonts } from "expo-font";
import { TextStyle } from "react-native";

/**
 * `useFonts` registers each map key as the font family name, so the families are
 * referenced by these literal names rather than by the imported asset modules.
 */
export const FONT_FAMILY = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
} as const;

export const loadAppFonts = () =>
  useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

const WEIGHT_TO_FAMILY: Record<string, string> = {
  normal: FONT_FAMILY.regular,
  "100": FONT_FAMILY.regular,
  "200": FONT_FAMILY.regular,
  "300": FONT_FAMILY.regular,
  "400": FONT_FAMILY.regular,
  "500": FONT_FAMILY.medium,
  "600": FONT_FAMILY.semibold,
  "700": FONT_FAMILY.bold,
  "800": FONT_FAMILY.extrabold,
  "900": FONT_FAMILY.extrabold,
};

export const resolveFontFamily = (
  style?: TextStyle | null | undefined,
): string => {
  if (!style) return FONT_FAMILY.regular;
  if (style.fontFamily) return style.fontFamily;
  const key = String(style.fontWeight ?? "normal");
  return WEIGHT_TO_FAMILY[key] ?? FONT_FAMILY.regular;
};
