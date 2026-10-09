import React, { useMemo } from "react";
import {
  StyleProp,
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  TextInputProps,
  TextProps,
  TextStyle,
} from "react-native";
import { useFontScale } from "../context/FontScaleContext";
import { getTypographySize, TEXT_VARIANTS, TextVariantName } from "../constants/typography";
import { resolveFontFamily } from "../constants/fonts";

function useScaledTextStyle(style: StyleProp<TextStyle>): StyleProp<TextStyle> {
  const { typography } = useFontScale();
  return useMemo(() => {
    const flat = StyleSheet.flatten(style);
    if (!flat) return style;

    const fontFamily = resolveFontFamily(flat);
    const baseFontSize = flat.fontSize;
    const fontSize =
      typeof baseFontSize === "number"
        ? getTypographySize(baseFontSize, typography)
        : undefined;

    // The static Plus Jakarta Sans families already carry their weight, so the
    // weight is neutralised to stop the platform from synthesising extra bolding.
    if (fontSize === undefined) {
      return [style, { fontFamily, fontWeight: "normal" }];
    }

    return [style, { fontFamily, fontWeight: "normal", fontSize }];
  }, [style, typography]);
}

type ScaledTextProps = TextProps & { textVariant?: TextVariantName };
type ScaledTextInputProps = TextInputProps & { textVariant?: TextVariantName };

const withVariant = (
  style: StyleProp<TextStyle>,
  textVariant?: TextVariantName,
): StyleProp<TextStyle> => {
  if (!textVariant) return style;
  const variantStyle = TEXT_VARIANTS[textVariant];
  return style ? [variantStyle, style] : variantStyle;
};

export default function ScaledText({ textVariant, style, ...rest }: ScaledTextProps) {
  const scaledStyle = useScaledTextStyle(withVariant(style, textVariant));
  return <NativeText {...rest} style={scaledStyle} />;
}

export function ScaledTextInput({ textVariant, style, ...rest }: ScaledTextInputProps) {
  const scaledStyle = useScaledTextStyle(withVariant(style, textVariant));
  return <NativeTextInput {...rest} style={scaledStyle} />;
}
