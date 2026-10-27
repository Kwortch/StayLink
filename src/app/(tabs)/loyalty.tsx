import {
  Outfit_400Regular,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import { useFonts } from "expo-font";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { StayLinkColors, StayLinkRadius, StayLinkSpacing } from "@/constants/theme";
import { auth } from "@/firebase/config";
import {
  getDefaultProfile,
  getMembershipForPoints,
  getNextMembership,
  loyaltyVouchers,
  membershipLevels,
  redeemLoyaltyVoucher,
  subscribeToUserProfile,
  type FirebaseUserProfile,
} from "@/lib/firebase";

export default function LoyaltyScreen() {
  const [profile, setProfile] = useState<FirebaseUserProfile>(() =>
    getDefaultProfile(auth.currentUser!),
  );
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    const unsubscribe = subscribeToUserProfile((value) => {
      if (!value) return;
      setProfile((current) => ({
        ...current,
        ...value,
        vouchers: value.vouchers ?? [],
      }));
    });
    return () => unsubscribe?.();
  }, []);

  const membership = getMembershipForPoints(profile.loyaltyPoints);
  const nextMembership = getNextMembership(profile.loyaltyPoints);
  const progress = nextMembership
    ? Math.min(
        100,
        ((profile.loyaltyPoints - membership.minimum) /
          (nextMembership.minimum - membership.minimum)) *
          100,
      )
    : 100;
  const redeemedIds = useMemo(
    () => new Set((profile.vouchers ?? []).map((voucher) => voucher.id)),
    [profile.vouchers],
  );
  const currentTierIndex = membershipLevels.findIndex(
    (level) => level.name === membership.name,
  );

  if (!fontsLoaded) return null;

  const redeem = async (voucherId: string) => {
    setRedeeming(voucherId);
    try {
      await redeemLoyaltyVoucher(voucherId);
      Alert.alert("Voucher redeemed", "Your voucher is now saved to your account.");
    } catch (error) {
      Alert.alert(
        "Unable to redeem voucher",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <Screen contentStyle={styles.screenContent}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.kicker}>StayLink Rewards</Text>
        <Text style={styles.title}>Loyalty</Text>
        <Text style={styles.subtitle}>
          Earn points from completed stays and unlock more ways to enjoy StayLink.
        </Text>

        <View style={styles.pointsCard}>
          <Text style={styles.cardLabel}>Current tier</Text>
          <Text style={styles.tierName}>{membership.name}</Text>
          <Text style={styles.pointsValue}>
            {profile.loyaltyPoints.toLocaleString()} points
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {nextMembership
              ? `${(
                  nextMembership.minimum - profile.loyaltyPoints
                ).toLocaleString()} points to ${nextMembership.name}`
              : "You have reached the highest tier"}
          </Text>
          <Text style={styles.earnRate}>
            Earn {membership.pointsPer100} point
            {membership.pointsPer100 === 1 ? "" : "s"} per ₱100 spent
          </Text>
          <Text style={styles.lockNote}>
            Points are added only after a stay is completed and locked. Locked
            stays cannot be cancelled.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Membership benefits</Text>
        <View style={styles.tierList}>
          {membershipLevels.map((level) => (
            <View
              key={level.name}
              style={[
                styles.tierCard,
                level.name === membership.name && styles.activeTierCard,
              ]}
            >
              <View style={styles.tierHeader}>
                <Text style={styles.tierTitle}>{level.name}</Text>
                <Text style={styles.tierMinimum}>
                  {level.minimum.toLocaleString()}+ pts
                </Text>
              </View>
              <Text style={styles.tierRate}>
                {level.pointsPer100} point
                {level.pointsPer100 === 1 ? "" : "s"} per ₱100 spent ·{" "}
                {level.discount}% discount
              </Text>
              {level.perks.map((perk) => (
                <Text key={perk} style={styles.perk}>
                  • {perk}
                </Text>
              ))}
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Redeem vouchers</Text>
        <Text style={styles.sectionSubtitle}>
          Use your points for vouchers available at your membership tier.
        </Text>
        <View style={styles.voucherList}>
          {loyaltyVouchers.map((voucher) => {
            const requiredTierIndex = membershipLevels.findIndex(
              (level) => level.name === voucher.minimumTier,
            );
            const hasTier = currentTierIndex >= requiredTierIndex;
            const hasPoints = profile.loyaltyPoints >= voucher.cost;
            const alreadyRedeemed = redeemedIds.has(voucher.id);
            const disabled =
              alreadyRedeemed || !hasTier || !hasPoints || redeeming !== null;

            return (
              <View key={voucher.id} style={styles.voucherCard}>
                <View style={styles.voucherCopy}>
                  <Text style={styles.voucherName}>{voucher.name}</Text>
                  <Text style={styles.voucherDescription}>
                    {voucher.description}
                  </Text>
                  <Text style={styles.voucherRequirement}>
                    {voucher.cost.toLocaleString()} points · {voucher.minimumTier}+
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  disabled={disabled}
                  onPress={() => redeem(voucher.id)}
                  style={({ pressed }) => [
                    styles.redeemButton,
                    disabled && styles.disabledButton,
                    pressed && !disabled && styles.pressed,
                  ]}
                >
                  <Text style={styles.redeemText}>
                    {alreadyRedeemed
                      ? "Redeemed"
                      : redeeming === voucher.id
                        ? "Saving..."
                        : "Redeem"}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {(profile.vouchers ?? []).length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>My vouchers</Text>
            <View style={styles.voucherList}>
              {(profile.vouchers ?? []).map((voucher) => (
                <View key={voucher.id} style={styles.savedVoucher}>
                  <Text style={styles.voucherName}>{voucher.name}</Text>
                  <Text style={styles.voucherDescription}>
                    {voucher.description}
                  </Text>
                  <Text style={styles.savedDate}>
                    Redeemed {new Date(voucher.redeemedAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  contentContainer: {
    padding: StayLinkSpacing.lg,
    paddingBottom: StayLinkSpacing.xxl,
    gap: StayLinkSpacing.sm,
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
    fontSize: 34,
  },
  subtitle: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: StayLinkSpacing.md,
  },
  pointsCard: {
    backgroundColor: StayLinkColors.card,
    borderColor: StayLinkColors.border,
    borderRadius: StayLinkRadius.lg,
    borderWidth: 1,
    padding: StayLinkSpacing.lg,
    gap: StayLinkSpacing.sm,
  },
  cardLabel: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 13,
  },
  tierName: {
    color: StayLinkColors.lightGold,
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 27,
  },
  pointsValue: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_700Bold",
    fontSize: 21,
  },
  progressTrack: {
    backgroundColor: StayLinkColors.secondaryCard,
    borderRadius: 5,
    height: 8,
    overflow: "hidden",
    marginTop: StayLinkSpacing.xs,
  },
  progressFill: {
    backgroundColor: StayLinkColors.lightGold,
    borderRadius: 5,
    height: "100%",
  },
  progressText: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
  },
  earnRate: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 14,
  },
  lockNote: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  sectionTitle: {
    color: StayLinkColors.primaryText,
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 22,
    marginTop: StayLinkSpacing.lg,
  },
  sectionSubtitle: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  tierList: {
    gap: StayLinkSpacing.sm,
  },
  tierCard: {
    backgroundColor: StayLinkColors.card,
    borderColor: StayLinkColors.border,
    borderRadius: StayLinkRadius.md,
    borderWidth: 1,
    padding: StayLinkSpacing.md,
    gap: 5,
  },
  activeTierCard: {
    borderColor: StayLinkColors.lightGold,
  },
  tierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: StayLinkSpacing.sm,
  },
  tierTitle: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_700Bold",
    fontSize: 16,
  },
  tierMinimum: {
    color: StayLinkColors.lightGold,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 12,
  },
  tierRate: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 12,
  },
  perk: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
  },
  voucherList: {
    gap: StayLinkSpacing.sm,
  },
  voucherCard: {
    alignItems: "center",
    backgroundColor: StayLinkColors.card,
    borderColor: StayLinkColors.border,
    borderRadius: StayLinkRadius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: StayLinkSpacing.md,
    padding: StayLinkSpacing.md,
  },
  voucherCopy: {
    flex: 1,
    gap: 4,
  },
  voucherName: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_700Bold",
    fontSize: 15,
  },
  voucherDescription: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  voucherRequirement: {
    color: StayLinkColors.lightGold,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 11,
  },
  redeemButton: {
    backgroundColor: StayLinkColors.lightGold,
    borderRadius: StayLinkRadius.md,
    paddingHorizontal: StayLinkSpacing.sm,
    paddingVertical: StayLinkSpacing.xs,
  },
  disabledButton: {
    backgroundColor: StayLinkColors.secondaryCard,
  },
  redeemText: {
    color: StayLinkColors.background,
    fontFamily: "Outfit_700Bold",
    fontSize: 12,
  },
  savedVoucher: {
    backgroundColor: StayLinkColors.secondaryCard,
    borderColor: StayLinkColors.border,
    borderRadius: StayLinkRadius.md,
    borderWidth: 1,
    padding: StayLinkSpacing.md,
    gap: 4,
  },
  savedDate: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_400Regular",
    fontSize: 11,
  },
  pressed: {
    opacity: 0.85,
  },
});
