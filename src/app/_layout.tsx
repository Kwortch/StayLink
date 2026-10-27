import { Redirect, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { StayLinkColors } from "@/constants/theme";
import { subscribeToAuthState } from "@/lib/firebase";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthGate />
    </SafeAreaProvider>
  );
}

function AuthGate() {
  const segments = useSegments();
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    return subscribeToAuthState((user) => {
      setIsSignedIn(Boolean(user));
      setIsLoading(false);
    });
  }, []);

  const currentRoute = segments[0];
  const isPublicRoute = currentRoute === "login" || currentRoute === "register";

  if (isLoading) {
    return null;
  }

  if (!isSignedIn && !isPublicRoute) {
    return <Redirect href="/login" />;
  }

  if (isSignedIn && isPublicRoute) {
    return <Redirect href="/discover" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: StayLinkColors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="room/[id]" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
