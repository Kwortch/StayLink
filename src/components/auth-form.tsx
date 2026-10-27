import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  StayLinkColors,
  StayLinkRadius,
  StayLinkSpacing,
} from "@/constants/theme";

type AuthFormProps = {
  mode: "login" | "register";
  onSubmit: (values: {
    fullName: string;
    email: string;
    password: string;
  }) => Promise<void>;
};

export function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegistering = mode === "register";

  const handleSubmit = async () => {
    setErrorMessage("");
    const trimmedEmail = email.trim();

    if (isRegistering && !fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!trimmedEmail || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }
    if (isRegistering && password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        fullName: fullName.trim(),
        email: trimmedEmail,
        password,
      });
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error ? error.code : "";
      const messages: Record<string, string> = {
        "auth/email-already-in-use":
          "An account already exists for this email.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/invalid-credential": "Email or password is incorrect.",
        "auth/user-not-found": "Email or password is incorrect.",
        "auth/wrong-password": "Email or password is incorrect.",
        "auth/network-request-failed": "Network error. Please try again.",
      };
      setErrorMessage(
        messages[String(code)] ?? "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandMark}>
          <Text style={styles.brand}>STAYLINK</Text>
          <Text style={styles.tagline}>Luxury stays in the Philippines</Text>
        </View>

        <View style={styles.headingBlock}>
          <Text style={styles.kicker}>
            {isRegistering ? "Begin your journey" : "Welcome back"}
          </Text>
          <Text style={styles.title}>
            {isRegistering ? "Create your account" : "Sign in to StayLink"}
          </Text>
          <Text style={styles.subtitle}>
            {isRegistering
              ? "Save your favorite stays and manage every journey in one place."
              : "Your next extraordinary stay is waiting for you."}
          </Text>
        </View>

        <View style={styles.formCard}>
          {isRegistering ? (
            <Field
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Alex Morgan"
            />
          ) : null}
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
          />
          {isRegistering ? (
            <Field
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              secureTextEntry
            />
          ) : null}

          {errorMessage ? (
            <Text style={styles.error}>{errorMessage}</Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submitButton,
              (pressed || isSubmitting) && styles.pressed,
            ]}
          >
            <Text style={styles.submitText}>
              {isSubmitting
                ? "Please wait..."
                : isRegistering
                  ? "Create Account"
                  : "Sign In"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>
            {isRegistering ? "Already have an account?" : "New to StayLink?"}
          </Text>
          <Pressable
            onPress={() =>
              router.replace(isRegistering ? "/login" : "/register")
            }
          >
            <Text style={styles.switchAction}>
              {isRegistering ? "Sign in" : "Create an account"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FieldProps = React.ComponentProps<typeof TextInput> & { label: string };

function Field({ label, ...props }: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={StayLinkColors.mutedText}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: StayLinkSpacing.lg,
    paddingVertical: StayLinkSpacing.xl,
  },
  brandMark: { alignItems: "center", marginBottom: StayLinkSpacing.xl },
  brand: {
    color: StayLinkColors.lightGold,
    fontFamily: "Outfit_700Bold",
    fontSize: 18,
    letterSpacing: 4,
  },
  tagline: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    marginTop: 6,
  },
  headingBlock: { gap: StayLinkSpacing.xs, marginBottom: StayLinkSpacing.lg },
  kicker: {
    color: StayLinkColors.lightGold,
    fontFamily: "Outfit_700Bold",
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  title: {
    color: StayLinkColors.primaryText,
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 34,
    lineHeight: 41,
  },
  subtitle: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    lineHeight: 21,
  },
  formCard: {
    backgroundColor: StayLinkColors.card,
    borderColor: StayLinkColors.border,
    borderRadius: StayLinkRadius.xl,
    borderWidth: 1,
    gap: StayLinkSpacing.md,
    padding: StayLinkSpacing.lg,
  },
  fieldGroup: { gap: StayLinkSpacing.xs },
  label: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 13,
  },
  input: {
    backgroundColor: StayLinkColors.secondaryCard,
    borderColor: StayLinkColors.border,
    borderRadius: StayLinkRadius.md,
    borderWidth: 1,
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_400Regular",
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: StayLinkSpacing.md,
  },
  error: {
    color: "#F4A6A6",
    fontFamily: "Outfit_500Medium",
    fontSize: 13,
    lineHeight: 19,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: StayLinkColors.gold,
    borderRadius: StayLinkRadius.md,
    justifyContent: "center",
    minHeight: 52,
    marginTop: StayLinkSpacing.xs,
  },
  submitText: {
    color: StayLinkColors.background,
    fontFamily: "Outfit_700Bold",
    fontSize: 15,
  },
  pressed: { opacity: 0.75 },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: StayLinkSpacing.xs,
    justifyContent: "center",
    marginTop: StayLinkSpacing.lg,
    flexWrap: "wrap",
  },
  switchText: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
  },
  switchAction: {
    color: StayLinkColors.lightGold,
    fontFamily: "Outfit_700Bold",
    fontSize: 13,
  },
});
