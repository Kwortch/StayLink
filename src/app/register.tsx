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
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { ref, set } from "firebase/database";
import { StyleSheet } from "react-native";

import { AuthForm } from "@/components/auth-form";
import { Screen } from "@/components/screen";
import { auth, database } from "@/firebase/config";
import { firestore } from "@/firebase/firestore";
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
          const userProfile = {
            uid: credential.user.uid,
            fullName,
            email: credential.user.email,
            displayName: fullName,
            address,
            phone,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            loyaltyPoints: 0,
            membership: "Bronze",
            membershipStatus: "Bronze",
            vouchers: [],
            preferences: defaultPreferences,
          };

          await Promise.all([
            set(ref(database, `users/${credential.user.uid}`), userProfile),
            setDoc(doc(firestore, "users", credential.user.uid), {
              ...userProfile,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }),
          ]);
          router.replace("/discover");
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0, paddingVertical: 0 },
});
