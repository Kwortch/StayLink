import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";

import { StayLinkColors, StayLinkSpacing } from "@/constants/theme";

function tabIcon(
  name: ComponentProps<typeof Ionicons>["name"],
  color: ColorValue,
) {
  const iconColor = typeof color === "number" ? undefined : color;
  return <Ionicons name={name} color={iconColor ?? undefined} size={21} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: StayLinkColors.lightGold,
        tabBarInactiveTintColor: StayLinkColors.mutedText,
        tabBarStyle: {
          backgroundColor: StayLinkColors.card,
          borderTopColor: StayLinkColors.border,
          borderTopWidth: 1,
          height: 64,
          paddingTop: StayLinkSpacing.xxs,
          paddingBottom: 0,
        },
        tabBarItemStyle: {
          paddingTop: 0,
          paddingBottom: StayLinkSpacing.sm,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: 0,
        },
        tabBarHideOnKeyboard: true,
        sceneStyle: {
          backgroundColor: StayLinkColors.background,
        },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => tabIcon("compass-outline", color),
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: "Rooms",
          tabBarIcon: ({ color }) => tabIcon("bed-outline", color),
        }}
      />
      <Tabs.Screen
        name="my-stays"
        options={{
          title: "My Stays",
          tabBarIcon: ({ color }) => tabIcon("calendar-outline", color),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => tabIcon("person-outline", color),
        }}
      />
    </Tabs>
  );
}
