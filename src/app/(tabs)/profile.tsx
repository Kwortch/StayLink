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
import { LinearGradient } from "expo-linear-gradient";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Screen } from "@/components/screen";
import {
  StayLinkColors,
  StayLinkRadius,
  StayLinkSpacing,
} from "@/constants/theme";
import { auth } from "@/firebase/config";
import {
  defaultPreferences,
  getDefaultProfile,
  getMembershipForPoints,
  membershipLevels,
  saveUserProfile,
  subscribeToReservationsForCurrentUser,
  subscribeToUserProfile,
  type FirebaseReservation,
  type FirebaseUserProfile,
} from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<FirebaseUserProfile>(() =>
    getDefaultProfile(auth.currentUser!),
  );
  const [reservations, setReservations] = useState<FirebaseReservation[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftPreferences, setDraftPreferences] = useState(defaultPreferences);
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    const unsubscribeProfile = subscribeToUserProfile((value) => {
      if (value) {
        setProfile({
          ...getDefaultProfile(auth.currentUser!),
          ...value,
          membership:
            value.membershipStatus ??
            (value.membership === "None" ? "Non-Member" : value.membership) ??
            "Non-Member",
          preferences: { ...defaultPreferences, ...value.preferences },
        });
      }
    });
    const unsubscribeReservations =
      subscribeToReservationsForCurrentUser(setReservations);
    return () => {
      unsubscribeProfile?.();
      unsubscribeReservations?.();
    };
  }, []);

  if (!fontsLoaded) return null;

  const destinations = new Set(
    reservations.map(
      (reservation) =>
        reservation.hotelName ?? reservation.location ?? reservation.roomName,
    ),
  );
  const stays = reservations.length;
  const nights = reservations.reduce(
    (sum, reservation) => sum + Number(reservation.nights ?? 0),
    0,
  );
  const openEditor = () => {
    setDraftName(profile.fullName);
    setDraftPhone(profile.phone ?? "");
    setDraftPreferences({ ...defaultPreferences, ...profile.preferences });
    setIsEditing(true);
  };
  const updatePreference = (
    key: keyof typeof defaultPreferences,
    value: string,
  ) => setDraftPreferences((current) => ({ ...current, [key]: value }));

  const membership =
    membershipLevels.find(
      (level) =>
        level.name === (profile.membershipStatus ?? profile.membership),
    ) ?? getMembershipForPoints(profile.loyaltyPoints);
  const nextMembership =
    membership.name === "Diamond"
      ? null
      : membershipLevels.find((level) => level.minimum > profile.loyaltyPoints);
  const pointsToNext = nextMembership
    ? nextMembership.minimum - profile.loyaltyPoints
    : 0;
  const progress = nextMembership
    ? ((profile.loyaltyPoints - membership.minimum) /
        (nextMembership.minimum - membership.minimum)) *
      100
    : 100;

  return (
    <Screen contentStyle={styles.screenContent}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>StayLink</Text>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.initialAvatar}>
            <Text style={styles.initialText}>
              {profile.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>{profile.fullName}</Text>
            <Text style={styles.email}>{profile.email}</Text>
            <Text style={styles.email}>
              {profile.phone || "No phone number"}
            </Text>
            <View style={styles.memberBadge}>
              <Text style={styles.memberBadgeText}>
                {profile.membershipStatus ?? profile.membership}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.pointsHeader}>
            <Text style={styles.cardTitle}>Loyalty Points</Text>
            <Text style={styles.pointsValue}>
              {profile.loyaltyPoints.toLocaleString()} points
            </Text>
          </View>

          <Text style={styles.progressText}>
            {profile.loyaltyPoints.toLocaleString()} /{" "}
            {nextMembership?.minimum ?? profile.loyaltyPoints}
          </Text>

          <View style={styles.progressTrack}>
            <LinearGradient
              colors={["#C8922A", "#E8B84B"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>

          <Text style={styles.goalText}>
            {nextMembership
              ? `Next level: ${nextMembership.name}`
              : "Highest membership level reached"}
          </Text>
          <Text style={styles.remainingText}>
            {nextMembership
              ? `${pointsToNext} points to go`
              : "Diamond membership"}
          </Text>
          <Text style={styles.discountText}>
            Current discount: {membership.discount}%
          </Text>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stays}</Text>
            <Text style={styles.statLabel}>Stays</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statValue}>{nights}</Text>
            <Text style={styles.statLabel}>Nights</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statValue}>{destinations.size}</Text>
            <Text style={styles.statLabel}>Destinations</Text>
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.preferenceList}>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Preferred Room</Text>
              <Text style={styles.preferenceValue}>
                {profile.preferences.preferredRoom}
              </Text>
            </View>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Bed Preference</Text>
              <Text style={styles.preferenceValue}>
                {profile.preferences.bedPreference}
              </Text>
            </View>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Smoking</Text>
              <Text style={styles.preferenceValue}>
                {profile.preferences.smoking}
              </Text>
            </View>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Notifications</Text>
              <Text style={styles.preferenceValue}>
                {profile.preferences.notifications}
              </Text>
            </View>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Language</Text>
              <Text style={styles.preferenceValue}>
                {profile.preferences.language}
              </Text>
            </View>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Currency</Text>
              <Text style={styles.preferenceValue}>
                {profile.preferences.currency}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => openEditor()}
          style={({ pressed }) => [
            styles.editButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => signOut(auth)}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
      <Modal
        visible={isEditing}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.editModal}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Full name"
              placeholderTextColor={StayLinkColors.mutedText}
              style={styles.editInput}
            />
            <TextInput
              value={draftPhone}
              onChangeText={setDraftPhone}
              placeholder="Phone number"
              placeholderTextColor={StayLinkColors.mutedText}
              style={styles.editInput}
              keyboardType="phone-pad"
            />
            {(
              Object.keys(defaultPreferences) as Array<
                keyof typeof defaultPreferences
              >
            ).map((key) => (
              <TextInput
                key={key}
                value={draftPreferences[key]}
                onChangeText={(value) => updatePreference(key, value)}
                placeholder={key}
                placeholderTextColor={StayLinkColors.mutedText}
                style={styles.editInput}
              />
            ))}
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setIsEditing(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  await saveUserProfile({
                    fullName: draftName.trim() || "Guest",
                    phone: draftPhone.trim(),
                    preferences: draftPreferences,
                  });
                  setIsEditing(false);
                }}
                style={styles.saveButton}
              >
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: StayLinkSpacing.lg,
    paddingTop: StayLinkSpacing.md,
    paddingBottom: StayLinkSpacing.xxl,
    gap: StayLinkSpacing.lg,
  },
  header: {
    gap: StayLinkSpacing.xs,
  },
  kicker: {
    color: StayLinkColors.lightGold,
    fontFamily: "Outfit_700Bold",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    color: StayLinkColors.primaryText,
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 42,
    lineHeight: 48,
  },
  profileCard: {
    backgroundColor: StayLinkColors.card,
    borderRadius: StayLinkRadius.xl,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    padding: StayLinkSpacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: StayLinkSpacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: StayLinkColors.secondaryCard,
  },
  initialAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: StayLinkColors.secondaryCard,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
  },
  initialText: {
    color: StayLinkColors.lightGold,
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 30,
  },
  profileInfo: {
    flex: 1,
    gap: 6,
  },
  name: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_700Bold",
    fontSize: 22,
  },
  email: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
  },
  memberBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(200,146,42,0.12)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(200,146,42,0.25)",
    paddingHorizontal: StayLinkSpacing.sm,
    paddingVertical: 6,
  },
  memberBadgeText: {
    color: StayLinkColors.lightGold,
    fontFamily: "Outfit_700Bold",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: StayLinkColors.card,
    borderRadius: StayLinkRadius.xl,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    padding: StayLinkSpacing.lg,
    gap: StayLinkSpacing.sm,
  },
  pointsHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: StayLinkSpacing.sm,
  },
  cardTitle: {
    color: StayLinkColors.primaryText,
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 24,
  },
  pointsValue: {
    color: StayLinkColors.gold,
    fontFamily: "Outfit_700Bold",
    fontSize: 13,
  },
  progressText: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_500Medium",
    fontSize: 12,
  },
  progressTrack: {
    height: 12,
    backgroundColor: StayLinkColors.secondaryCard,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(200,146,42,0.18)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "linear-gradient(90deg, #C8922A 0%, #E8B84B 100%)",
  },
  goalText: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 13,
  },
  remainingText: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
  },
  discountText: {
    color: StayLinkColors.lightGold,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 13,
  },
  statRow: {
    flexDirection: "row",
    gap: StayLinkSpacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: StayLinkColors.card,
    borderRadius: StayLinkRadius.lg,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    paddingVertical: StayLinkSpacing.md,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    color: StayLinkColors.primaryText,
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 28,
  },
  statLabel: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_500Medium",
    fontSize: 12,
    letterSpacing: 0.8,
  },
  sectionWrap: {
    backgroundColor: StayLinkColors.card,
    borderRadius: StayLinkRadius.xl,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    padding: StayLinkSpacing.lg,
    gap: StayLinkSpacing.md,
  },
  sectionTitle: {
    color: StayLinkColors.primaryText,
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 27,
  },
  preferenceList: {
    gap: StayLinkSpacing.sm,
  },
  preferenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: StayLinkSpacing.sm,
    paddingVertical: StayLinkSpacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: StayLinkColors.border,
  },
  preferenceLabel: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_500Medium",
    fontSize: 13,
  },
  preferenceValue: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 13,
    textAlign: "right",
  },
  editButton: {
    backgroundColor: StayLinkColors.gold,
    borderRadius: StayLinkRadius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  editButtonText: {
    color: StayLinkColors.background,
    fontFamily: "Outfit_700Bold",
    fontSize: 15,
  },
  logoutButton: {
    alignItems: "center",
    borderColor: "rgba(244, 166, 166, 0.35)",
    borderRadius: StayLinkRadius.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  logoutButtonText: {
    color: "#F4A6A6",
    fontFamily: "Outfit_700Bold",
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  editModal: {
    backgroundColor: StayLinkColors.card,
    borderTopLeftRadius: StayLinkRadius.xl,
    borderTopRightRadius: StayLinkRadius.xl,
    padding: StayLinkSpacing.lg,
    gap: StayLinkSpacing.sm,
  },
  modalTitle: {
    color: StayLinkColors.primaryText,
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 26,
    marginBottom: StayLinkSpacing.xs,
  },
  editInput: {
    backgroundColor: StayLinkColors.secondaryCard,
    borderColor: StayLinkColors.border,
    borderRadius: StayLinkRadius.md,
    borderWidth: 1,
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_400Regular",
    minHeight: 44,
    paddingHorizontal: StayLinkSpacing.md,
  },
  modalActions: {
    flexDirection: "row",
    gap: StayLinkSpacing.sm,
    marginTop: StayLinkSpacing.sm,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: StayLinkRadius.md,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
  },
  cancelText: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_700Bold",
  },
  saveButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: StayLinkRadius.md,
    backgroundColor: StayLinkColors.gold,
  },
  saveText: {
    color: StayLinkColors.background,
    fontFamily: "Outfit_700Bold",
  },
});
