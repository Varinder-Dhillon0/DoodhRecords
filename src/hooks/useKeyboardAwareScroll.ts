import { useCallback, useRef } from "react";
import {
  FocusEvent,
  ScrollView,
} from "react-native";

/** Scrolls the focused native input clear of the keyboard and any fixed footer. */
export default function useKeyboardAwareScroll(extraOffset: number) {
  const scrollViewRef = useRef<ScrollView>(null);

  const onInputFocus = useCallback(
    (event: FocusEvent) => {
      scrollViewRef.current?.scrollResponderScrollNativeHandleToKeyboard(
        event.nativeEvent.target,
        extraOffset,
        true,
      );
    },
    [extraOffset],
  );

  return { scrollViewRef, onInputFocus };
}
