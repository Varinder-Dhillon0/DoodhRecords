import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants";
import { TYPOGRAPHY } from "../constants/typography";
import { useFontScale } from "./FontScaleContext";

type SnackbarMessage = { id: number; text: string };
type SnackbarContextValue = { showSnackbar: (text: string) => void };

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<SnackbarMessage | null>(null);
  const insets = useSafeAreaInsets();
  const { typography } = useFontScale();
  const animation = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const showSnackbar = useCallback((text: string) => {
    nextId.current += 1;
    setMessage({ id: nextId.current, text });
  }, []);

  useEffect(() => {
    if (!message) return;
    if (timer.current) clearTimeout(timer.current);
    animation.setValue(0);
    Animated.spring(animation, {
      toValue: 1,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    }).start();
    timer.current = setTimeout(() => {
      Animated.timing(animation, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMessage(null);
      });
    }, 2800);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [animation, message]);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {message && (
        <Animated.View
          key={message.id}
          pointerEvents="none"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[
            styles.snackbar,
            {
              bottom: Math.max(insets.bottom, 16) + 72,
              opacity: animation,
              transform: [
                {
                  translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [24, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.messageContainer}>
            <Text
              style={[styles.text, { fontSize: typography.body }]}
              accessibilityRole="text"
            >
              {message.text}
            </Text>
          </View>
        </Animated.View>
      )}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) throw new Error("useSnackbar must be used within SnackbarProvider");
  return context;
}

const styles = StyleSheet.create({
  snackbar: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 10000,
    elevation: 12,
  },
  messageContainer: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#1F2937",
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
});
