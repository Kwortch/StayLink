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
import { signInWithEmailAndPassword } from "firebase/auth";
import { StyleSheet } from "react-native";

import { AuthForm } from "@/components/auth-form";
import { Screen } from "@/components/screen";
import { auth } from "@/firebase/config";

export default function LoginScreen() {
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
        mode="login"
        onSubmit={async ({ email, password }) => {
          await signInWithEmailAndPassword(auth, email, password);
          router.replace("/discover");
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0, paddingVertical: 0 },
});
