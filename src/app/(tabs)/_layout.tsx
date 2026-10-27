import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import type { ColorValue } from "react-native";

import { StayLinkColors, StayLinkSpacing } from "@/constants/theme";

function tabIcon(name: string, color: ColorValue) {
  return <SymbolView name={name as never} tintColor={color} size={20} />;
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
          height: 72,
          paddingTop: StayLinkSpacing.xxs,
          paddingBottom: StayLinkSpacing.xs,
        },
        tabBarItemStyle: {
          paddingTop: StayLinkSpacing.xxs,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: StayLinkSpacing.xxs,
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
          tabBarIcon: ({ color }) => tabIcon("safari.fill", color),
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: "Rooms",
          tabBarIcon: ({ color }) => tabIcon("bed.double.fill", color),
        }}
      />
      <Tabs.Screen
        name="my-stays"
        options={{
          title: "My Stays",
          tabBarIcon: ({ color }) => tabIcon("calendar.badge.clock", color),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => tabIcon("person.crop.circle", color),
        }}
      />
    </Tabs>
  );
}
