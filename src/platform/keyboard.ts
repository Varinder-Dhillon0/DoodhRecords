import { Platform } from "react-native";

export const getKeyboardBehavior = () =>
  Platform.OS === "ios" ? "padding" : "height";
