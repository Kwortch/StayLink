import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, set } from "firebase/database";
import { StyleSheet } from "react-native";

import { AuthForm } from "@/components/auth-form";
import { Screen } from "@/components/screen";
import { auth, database } from "@/firebase/config";
import { defaultPreferences } from "@/lib/firebase";

export default function RegisterScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <Screen contentStyle={styles.content}>
      <AuthForm
        mode="register"
        onSubmit={async ({
          fullName,
          email,
          password,
          address,
          phone,
        }) => {
          const credential = await createUserWithEmailAndPassword(
            auth,
            email,
            password,
          );
          await updateProfile(credential.user, { displayName: fullName });
          await set(ref(database, `users/${credential.user.uid}`), {
            fullName,
            email: credential.user.email,
            address,
            phone,
            createdAt: new Date().toISOString(),
            loyaltyPoints: 0,
            membership: "Non-Member",
            membershipStatus: "Non-Member",
            preferences: defaultPreferences,
          });
          router.replace("/discover");
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0, paddingVertical: 0 },
});
