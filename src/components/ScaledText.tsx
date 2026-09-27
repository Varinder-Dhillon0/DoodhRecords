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

function useScaledTextStyle(style: StyleProp<TextStyle>): StyleProp<TextStyle> {
  const { typography } = useFontScale();
  return useMemo(() => {
    const baseFontSize = StyleSheet.flatten(style)?.fontSize;
    if (typeof baseFontSize !== "number") return style;

    return [style, { fontSize: getTypographySize(baseFontSize, typography) }];
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
