import React, { forwardRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { COLORS } from "../constants";

export type ButtonSize = "sm" | "md" | "lg";
export type ButtonVariant = "primary" | "secondary" | "outline" | "custom";

type ButtonProps = Omit<PressableProps, "style"> & {
  size?: ButtonSize;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  style?:
    | StyleProp<ViewStyle>
    | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
};

const Button = forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  function Button(
    {
      size = "md",
      variant = "custom",
      fullWidth = false,
      loading = false,
      disabled = false,
      icon,
      iconPosition = "left",
      style,
      children,
      accessibilityState,
      ...pressableProps
    },
    ref,
  ) {
    const isDisabled = disabled || loading;
    const content = (
      <>
        {loading ? (
          <ActivityIndicator
            color={variant === "primary" ? "#fff" : COLORS.brand}
          />
        ) : iconPosition === "left" ? (
          icon
        ) : null}
        {children}
        {!loading && iconPosition === "right" ? icon : null}
      </>
    );

    return (
      <Pressable
        {...pressableProps}
        ref={ref}
        disabled={isDisabled}
        accessibilityState={
          loading
            ? { ...accessibilityState, disabled: true, busy: true }
            : accessibilityState
        }
        style={(state) => [
          variant !== "custom" && styles[variant],
          variant !== "custom" && styles[size],
          isDisabled && variant !== "custom" && styles.disabled,
          fullWidth && styles.fullWidth,
          typeof style === "function" ? style(state) : style,
        ]}
      >
        {content}
      </Pressable>
    );
  },
);

export default Button;

const styles = StyleSheet.create({
  primary: {
    backgroundColor: COLORS.brand,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondary: {
    backgroundColor: COLORS.brandLight,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  outline: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  sm: { minHeight: 24, paddingHorizontal: 10, borderRadius: 8 },
  md: { minHeight: 36, paddingHorizontal: 12, borderRadius: 10 },
  lg: { minHeight: 44, paddingHorizontal: 16, borderRadius: 12 },
  disabled: { opacity: 0.5 },
  fullWidth: { width: "100%" },
});
