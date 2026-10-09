import React from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { COLORS, LAYOUT, SPACING } from "../../constants";
import { getKeyboardBehavior } from "../../platform/keyboard";

type ScreenContainerProps = {
  header?: React.ReactNode;
  fixedContent?: React.ReactNode;
  children: React.ReactNode;
  overlay?: React.ReactNode;
  keyboardAvoiding?: boolean;
  scrollViewRef?: React.RefObject<ScrollView | null>;
  scrollStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  bottomClearance?: number;
};

export default function ScreenContainer({
  header,
  fixedContent,
  children,
  overlay,
  keyboardAvoiding = false,
  scrollViewRef,
  scrollStyle,
  contentStyle,
  bottomClearance = LAYOUT.listBottomClearance,
}: ScreenContainerProps) {
  const content = (
    <>
      {header}
      {fixedContent}
      <ScrollView
        ref={scrollViewRef}
        style={[styles.scroll, scrollStyle]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomClearance },
          contentStyle,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {overlay}
    </>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={getKeyboardBehavior()}>
        {content}
      </KeyboardAvoidingView>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: SPACING.lg,
  },
});
