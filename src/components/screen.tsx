import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StayLinkColors, StayLinkSpacing } from "@/constants/theme";

type ScreenProps = {
  children: ReactNode;
  contentStyle?: ViewStyle;
  style?: ViewStyle;
};

export function Screen({ children, contentStyle, style }: ScreenProps) {
  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: StayLinkColors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: StayLinkSpacing.lg,
    paddingVertical: StayLinkSpacing.lg,
  },
});
