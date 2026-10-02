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
import { getTypographySize } from "../constants/typography";
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

export default function ScaledText(props: TextProps) {
  const style = useScaledTextStyle(props.style);
  return <NativeText {...props} style={style} />;
}

export function ScaledTextInput(props: TextInputProps) {
  const style = useScaledTextStyle(props.style);
  return <NativeTextInput {...props} style={style} />;
}
