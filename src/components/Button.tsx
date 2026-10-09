import React, { forwardRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { COLORS, INTERACTION, RADII, SHADOWS } from "../constants";

export type ButtonSize = "sm" | "md" | "lg";
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success"
  | "custom";

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
    const loadingColor =
      variant === "primary" || variant === "success" || variant === "danger"
        ? COLORS.white
        : COLORS.brand;
    const content = (
      <>
        {loading ? (
          <ActivityIndicator color={loadingColor} />
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
          isDisabled && styles.disabled,
          fullWidth && styles.fullWidth,
          state.pressed && styles.pressed,
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
    backgroundColor: COLORS.greenAccent,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    ...SHADOWS.control,
  },
  secondary: {
    backgroundColor: COLORS.brandLight,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  outline: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  ghost: {
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  danger: {
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  success: {
    backgroundColor: COLORS.brand,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  sm: { minHeight: 32, paddingHorizontal: 12, borderRadius: RADII.pill },
  md: { minHeight: 40, paddingHorizontal: 14, borderRadius: RADII.control },
  lg: { minHeight: 48, paddingHorizontal: 20, borderRadius: RADII.control },
  disabled: { opacity: INTERACTION.disabledOpacity },
  pressed: { opacity: INTERACTION.pressedOpacity },
  fullWidth: { width: "100%" },
});
