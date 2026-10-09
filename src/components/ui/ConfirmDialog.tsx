import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, RADII, withAlpha } from "../../constants";
import { TYPOGRAPHY } from "../../constants/typography";
import Text from "../ScaledText";
import Button from "../Button";

export type ConfirmTone = "info" | "danger";

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  tone?: ConfirmTone;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * App-styled replacement for native Alert dialogs: a centered pop-over card
 * with exactly the same entrance as the localized date picker (backdrop
 * fade plus a 0.9-to-1 scale pop), a tone icon tile, and primary/outline
 * (or destructive) actions.
 */
export default function ConfirmDialog({
  visible,
  title,
  message,
  tone = "info",
  icon,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const dialogAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    backdropAnim.setValue(0);
    dialogAnim.setValue(0);
    Animated.timing(backdropAnim, {
      toValue: 1,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    Animated.timing(dialogAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.bezier(0.05, 0.7, 0.1, 1),
      useNativeDriver: true,
    }).start();
  }, [visible, backdropAnim, dialogAnim]);

  const danger = tone === "danger";
  const resolvedIcon = icon ?? (danger ? "trash-can-outline" : "information-outline");

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onCancel}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={cancelLabel ?? confirmLabel}
            style={StyleSheet.absoluteFill}
            onPress={onCancel}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.dialog,
            {
              opacity: dialogAnim,
              transform: [
                {
                  scale: dialogAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={styles.card}
          >
            <View style={styles.body}>
              <View
                style={[
                  styles.iconTile,
                  {
                    backgroundColor: danger
                      ? COLORS.redContainer
                      : withAlpha(COLORS.brandLight, 0.5),
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={resolvedIcon}
                  size={24}
                  color={danger ? COLORS.red : COLORS.brand}
                />
              </View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
            </View>
            <View style={styles.actions}>
              {cancelLabel ? (
                <Button
                  variant="outline"
                  size="sm"
                  style={styles.actionButton}
                  accessibilityLabel={cancelLabel}
                  onPress={onCancel}
                >
                  <Text style={styles.cancelLabel}>{cancelLabel}</Text>
                </Button>
              ) : null}
              <Button
                variant={destructive ? "danger" : "primary"}
                size="sm"
                style={styles.actionButton}
                accessibilityLabel={confirmLabel}
                onPress={onConfirm}
              >
                <Text style={styles.confirmLabel}>{confirmLabel}</Text>
              </Button>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  backdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: withAlpha("#0F172A", 0.5),
  },
  dialog: { width: "100%", maxWidth: 420, alignSelf: "center" },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 24,
  },
  body: { alignItems: "center", gap: 8 },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: RADII.control,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: TYPOGRAPHY.headingSmall,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },
  message: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.muted,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  actionButton: { flex: 1 },
  cancelLabel: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.body,
    fontWeight: "700",
  },
  confirmLabel: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.body,
    fontWeight: "700",
  },
});
