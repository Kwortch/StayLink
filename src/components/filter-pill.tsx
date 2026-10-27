import { Pressable, StyleSheet, Text } from "react-native";

import {
  StayLinkColors,
  StayLinkRadius,
  StayLinkSpacing,
} from "@/constants/theme";

type FilterPillProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function FilterPill({
  label,
  selected = false,
  onPress,
}: FilterPillProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        selected ? styles.selected : styles.unselected,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          selected ? styles.selectedLabel : styles.unselectedLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: StayLinkSpacing.md,
    paddingVertical: StayLinkSpacing.sm,
    borderRadius: StayLinkRadius.lg,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  selected: {
    backgroundColor: StayLinkColors.gold,
    borderColor: StayLinkColors.gold,
  },
  unselected: {
    backgroundColor: StayLinkColors.card,
    borderColor: StayLinkColors.border,
  },
  pressed: {
    opacity: 0.9,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  selectedLabel: {
    color: StayLinkColors.background,
  },
  unselectedLabel: {
    color: StayLinkColors.mutedText,
  },
});
