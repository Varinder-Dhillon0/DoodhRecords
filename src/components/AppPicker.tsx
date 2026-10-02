import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Text from "./ScaledText";
import { useFontScale } from "../context/FontScaleContext";
import { COLORS, RADII, SHADOWS, withAlpha } from "../constants";

export type AppPickerOption<T extends string | number> = {
  label: string;
  value: T;
};

type AppPickerProps<T extends string | number> = {
  options: AppPickerOption<T>[];
  selectedValue: T;
  onValueChange: (value: T, index: number) => void;
  variant?: "filter" | "field";
  minWidth?: number;
  accessibilityLabel?: string;
  disabled?: boolean;
};

type PopupPosition = {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
};

type PickerOptionRowProps = {
  label: string;
  selected: boolean;
  index: number;
  visible: boolean;
  onPress: () => void;
  onSelectedLayout?: (y: number) => void;
};

function PickerOptionRow({
  label,
  selected,
  index,
  visible,
  onPress,
  onSelectedLayout,
}: PickerOptionRowProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      progress.setValue(0);
      return;
    }
    Animated.timing(progress, {
      toValue: 1,
      duration: 120,
      delay: index * 18,
      useNativeDriver: true,
    }).start();
  }, [index, progress, visible]);

  return (
    <Animated.View
      onLayout={(event) => onSelectedLayout?.(event.nativeEvent.layout.y)}
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [5, 0],
            }),
          },
        ],
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onPress}
        style={({ pressed }) => [
          styles.option,
          selected && styles.selectedOption,
          pressed && styles.pressedOption,
        ]}
      >
        <Text
          style={[styles.optionText, selected && styles.selectedOptionText]}
        >
          {label}
        </Text>
        {selected && (
          <MaterialCommunityIcons
            name="check"
            size={18}
            color={COLORS.brand}
          />
        )}
      </Pressable>
    </Animated.View>
  );
}

/** Shared, animated selector for filters, settings, and form fields. */
export default function AppPicker<T extends string | number>({
  options,
  selectedValue,
  onValueChange,
  variant = "filter",
  minWidth,
  accessibilityLabel,
  disabled = false,
}: AppPickerProps<T>) {
  const { typography } = useFontScale();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const anchorRef = useRef<View>(null);
  const optionsScrollRef = useRef<ScrollView>(null);
  const popupProgress = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<PopupPosition | null>(null);

  const selectedIndex = options.findIndex(
    (option) => option.value === selectedValue,
  );
  const selectedOption = options[selectedIndex];

  useEffect(() => {
    if (visible) {
      Animated.spring(popupProgress, {
        toValue: 1,
        damping: 20,
        stiffness: 220,
        mass: 0.7,
        useNativeDriver: true,
      }).start();
    }
  }, [popupProgress, visible]);

  const openPicker = () => {
    if (disabled || options.length === 0) return;
    anchorRef.current?.measureInWindow((left, top, width, height) => {
      const windowHeight = Dimensions.get("window").height;
      const estimatedHeight = Math.min(options.length * 48, 288);
      const belowTop = top + height + 6;
      const roomBelow = windowHeight - insets.bottom - belowTop;
      const opensAbove = roomBelow < estimatedHeight && top > insets.top + 80;
      const popupTop = opensAbove
        ? Math.max(insets.top + 4, top - estimatedHeight - 6)
        : belowTop;
      const maxHeight = opensAbove
        ? Math.min(estimatedHeight, top - insets.top - 10)
        : Math.min(estimatedHeight, roomBelow - 8);

      setPosition({ left, top: popupTop, width, maxHeight });
      popupProgress.setValue(0);
      setVisible(true);
    });
  };

  const closePicker = () => {
    Animated.timing(popupProgress, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setVisible(false);
    });
  };

  const selectOption = (value: T, index: number) => {
    closePicker();
    onValueChange(value, index);
  };

  const containerStyle: ViewStyle =
    variant === "filter"
      ? { ...styles.filter, ...(minWidth === undefined ? {} : { minWidth }) }
      : styles.field;

  return (
    <>
      <View
        ref={anchorRef}
        collapsable={false}
        style={[styles.container, containerStyle, disabled && styles.disabled]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ expanded: visible, disabled }}
          disabled={disabled}
          onPress={openPicker}
          style={styles.trigger}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.valueText,
              variant === "field" && styles.fieldValueText,
              { fontSize: typography.bodyLarge },
            ]}
          >
            {selectedOption?.label ?? ""}
          </Text>
          <MaterialCommunityIcons
            name="chevron-down"
            size={20}
            color={variant === "field" ? COLORS.text : COLORS.muted}
          />
        </Pressable>
      </View>

      <Modal
        transparent
        visible={visible}
        animationType="none"
        onRequestClose={closePicker}
        statusBarTranslucent
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
            onPress={closePicker}
            style={styles.backdrop}
          />
          {position && (
            <Animated.View
              style={[
                styles.popup,
                {
                  left: position.left,
                  top: position.top,
                  width: position.width,
                  maxHeight: Math.max(position.maxHeight, 48),
                  opacity: popupProgress,
                  transform: [
                    {
                      translateY: popupProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-6, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <ScrollView
                ref={optionsScrollRef}
                bounces={false}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={options.length > 5}
              >
                {options.map((option, index) => (
                  <PickerOptionRow
                    key={String(option.value)}
                    label={option.label}
                    selected={index === selectedIndex}
                    index={index}
                    visible={visible}
                    onSelectedLayout={
                      index === selectedIndex
                        ? (y) => optionsScrollRef.current?.scrollTo({ y, animated: false })
                        : undefined
                    }
                    onPress={() => selectOption(option.value, index)}
                  />
                ))}
              </ScrollView>
            </Animated.View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: RADII.pill,
  },
  filter: {
    minWidth: 110,
    height: 38,
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  field: {
    height: 50,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
  },
  trigger: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  valueText: { flex: 1, color: COLORS.muted, paddingRight: 4 },
  fieldValueText: { color: COLORS.text },
  disabled: { opacity: 0.5 },
  modalRoot: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: withAlpha("#0F172A", 0.16),
  },
  popup: {
    position: "absolute",
    backgroundColor: COLORS.surface,
    borderRadius: RADII.control,
    paddingVertical: 4,
    paddingHorizontal: 4,
    ...SHADOWS.card,
    elevation: 8,
  },
  option: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: RADII.control,
    gap: 8,
  },
  selectedOption: { backgroundColor: withAlpha(COLORS.brandLight, 0.55) },
  pressedOption: { opacity: 0.72 },
  optionText: { flex: 1, color: COLORS.muted },
  selectedOptionText: { color: COLORS.brand, fontWeight: "700" },
});
