import "@/global.css";

import { Platform } from "react-native";

export const StayLinkColors = {
  background: "#0B0B09",
  card: "#171612",
  secondaryCard: "#1E1C16",
  gold: "#C8922A",
  lightGold: "#E8B84B",
  primaryText: "#EDE8DC",
  mutedText: "#9B9488",
  border: "rgba(232, 184, 75, 0.14)",
} as const;

export const StayLinkSpacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const StayLinkRadius = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 28,
} as const;

export const Colors = {
  light: {
    text: StayLinkColors.primaryText,
    background: StayLinkColors.background,
    backgroundElement: StayLinkColors.card,
    backgroundSelected: StayLinkColors.secondaryCard,
    textSecondary: StayLinkColors.mutedText,
  },
  dark: {
    text: StayLinkColors.primaryText,
    background: StayLinkColors.background,
    backgroundElement: StayLinkColors.card,
    backgroundSelected: StayLinkColors.secondaryCard,
    textSecondary: StayLinkColors.mutedText,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: StayLinkSpacing.xxs,
  one: StayLinkSpacing.xs,
  two: StayLinkSpacing.sm,
  three: StayLinkSpacing.md,
  four: StayLinkSpacing.lg,
  five: StayLinkSpacing.xl,
  six: StayLinkSpacing.xxl,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
