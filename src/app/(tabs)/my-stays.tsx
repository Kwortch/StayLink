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
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
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
import {
  awardCompletedBookingPoints,
  cancelReservation,
  firebaseAuth,
  lockCompletedReservation,
  subscribeToReservationsForCurrentUser,
  type FirebaseReservation,
} from "@/lib/firebase";

type ReservationCardState = {
  id: string;
  reservationId: string;
  roomId: string;
  roomName: string;
  roomImage: string;
  checkIn: string;
  checkInTime: string;
  checkOut: string;
  nights: number;
  total: number;
  status: string;
  guests: number;
  extras: string[];
};

function normalizeReservationDate(dateValue?: string): string {
  if (!dateValue) {
    return "Dates pending";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const date = new Date(`${dateValue}T00:00:00`);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  }

  return dateValue;
}

function formatReservationCard(
  reservation: FirebaseReservation,
): ReservationCardState | null {
  const roomId = reservation.roomId ?? reservation.id ?? "room";
  const roomName = reservation.roomName ?? "StayLink Reservation";
  const roomImage =
    reservation.roomImage ??
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80";

  const checkInRaw = reservation.checkIn ?? "";
  const checkOutRaw = reservation.checkOut ?? "";
  const total = Number(
    reservation.totalPrice ?? reservation.total ?? reservation.subtotal ?? 0,
  );
  const nights = Number(reservation.nights ?? 1);

  if (!checkInRaw || !checkOutRaw) {
    return null;
  }

  return {
    id: reservation.id,
    reservationId: reservation.reservationId ?? reservation.id,
    roomId,
    roomName,
    roomImage,
    checkIn: normalizeReservationDate(checkInRaw),
    checkInTime: reservation.checkInTime ?? "Time not set",
    checkOut: normalizeReservationDate(checkOutRaw),
    nights,
    total,
    status: reservation.status ?? "Confirmed",
    guests: Number(reservation.guests ?? 1),
    extras: reservation.extras ?? [],
  };
}

export default function MyStaysScreen() {
  const router = useRouter();
  const [reservations, setReservations] = useState<FirebaseReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkInDetails, setCheckInDetails] =
    useState<FirebaseReservation | null>(null);
  const [cancellationTarget, setCancellationTarget] =
    useState<FirebaseReservation | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [otherCancellationReason, setOtherCancellationReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelledSuccessfully, setCancelledSuccessfully] = useState(false);

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
    let isMounted = true;
    if (!firebaseAuth.currentUser)
      return () => {
        isMounted = false;
      };
    setLoading(true);
    const unsubscribe = subscribeToReservationsForCurrentUser((data) => {
      if (isMounted) {
        setReservations(data);
        setLoading(false);
        data
          .filter(
            (reservation) =>
              reservation.status !== "Completed" &&
              reservation.status !== "Cancelled",
          )
          .forEach((reservation) => {
            void lockCompletedReservation(reservation);
          });
        data
          .filter((reservation) => reservation.status === "Completed")
          .forEach((reservation) => {
            void awardCompletedBookingPoints(reservation);
          });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  const upcomingReservationFromFirebase = useMemo(() => {
    const normalized = reservations
      .filter(
        (reservation) =>
          reservation.status !== "Completed" &&
          reservation.status !== "Cancelled",
      )
      .map(formatReservationCard)
      .filter((item): item is ReservationCardState => Boolean(item));

    if (normalized.length === 0) {
      return null;
    }

    return normalized[0];
  }, [reservations]);

  const additionalUpcomingReservations = useMemo(() => {
    return reservations
      .filter(
        (reservation) =>
          reservation.status !== "Completed" &&
          reservation.status !== "Cancelled",
      )
      .map(formatReservationCard)
      .filter((item): item is ReservationCardState => Boolean(item))
      .slice(1);
  }, [reservations]);

  const openCheckInDetails = (reservationId: string) => {
    const reservation = reservations.find(
      (item) =>
        item.id === reservationId || item.reservationId === reservationId,
    );
    if (reservation) setCheckInDetails(reservation);
  };

  const handleCheckIn = () => {
    if (upcomingReservationFromFirebase) {
      openCheckInDetails(upcomingReservationFromFirebase.id);
    }
  };

  const openCancellation = (reservationId: string) => {
    const reservation = reservations.find(
      (item) =>
        item.id === reservationId || item.reservationId === reservationId,
    );
    if (!reservation) return;
    setCancellationTarget(reservation);
    setCancellationReason("");
    setOtherCancellationReason("");
    setCancelledSuccessfully(false);
  };

  const confirmCancellation = async () => {
    if (!cancellationTarget || !cancellationReason) return;
    const reason =
      cancellationReason === "Other"
        ? otherCancellationReason.trim() || "Other"
        : cancellationReason;
    setCancelling(true);
    try {
      await cancelReservation(cancellationTarget, reason);
      setCancelledSuccessfully(true);
    } catch (error) {
      Alert.alert(
        "StayLink",
        error instanceof Error
          ? error.message
          : "Unable to cancel this reservation.",
      );
    } finally {
      setCancelling(false);
    }
  };

  if (!fontsLoaded) return null;

  return (
    <Screen contentStyle={styles.screenContent}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>StayLink</Text>
          <Text style={styles.title}>My Stays</Text>
          <Text style={styles.description}>
            Your journeys, beautifully remembered.
          </Text>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Upcoming</Text>
        </View>

        {loading ? (
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>Loading reservations…</Text>
          </View>
        ) : null}

        {upcomingReservationFromFirebase ? (
          <View style={styles.upcomingCard}>
            <Image
              source={{ uri: upcomingReservationFromFirebase.roomImage }}
              style={styles.image}
            />

            <View style={styles.cardContent}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.roomName}>
                  {upcomingReservationFromFirebase.roomName}
                </Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>
                    {upcomingReservationFromFirebase.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.reservationId}>
                Reservation ID: {upcomingReservationFromFirebase.reservationId}
              </Text>

              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Check-in</Text>
                  <Text style={styles.metaValue}>
                    {upcomingReservationFromFirebase.checkIn}
                    {"\n"}
                    {upcomingReservationFromFirebase.checkInTime}
                  </Text>
                </View>

                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Check-out</Text>
                  <Text style={styles.metaValue}>
                    {upcomingReservationFromFirebase.checkOut}
                  </Text>
                </View>

                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Nights</Text>
                  <Text style={styles.metaValue}>
                    {upcomingReservationFromFirebase.nights}
                  </Text>
                </View>

                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    ${upcomingReservationFromFirebase.total}
                  </Text>
                </View>
              </View>

              <View style={styles.buttonRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    openCancellation(upcomingReservationFromFirebase.id)
                  }
                  style={({ pressed }) => [
                    styles.dangerButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.dangerButtonText}>Cancel</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={handleCheckIn}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>Check-in Details</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No upcoming stays</Text>
            <Text style={styles.emptyStateText}>
              Your saved reservations will appear here.
            </Text>
          </View>
        )}

        {additionalUpcomingReservations.map((reservation) => (
          <View key={reservation.reservationId} style={styles.upcomingCard}>
            <Image source={{ uri: reservation.roomImage }} style={styles.additionalImage} />
            <View style={styles.cardContent}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.roomName}>{reservation.roomName}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>
                    {reservation.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.reservationId}>
                Reservation ID: {reservation.reservationId}
              </Text>
              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Dates</Text>
                  <Text style={styles.metaValue}>
                    {reservation.checkIn} - {reservation.checkOut}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Nights / Guests</Text>
                  <Text style={styles.metaValue}>
                    {reservation.nights} / {reservation.guests}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Extras</Text>
                  <Text style={styles.metaValue}>
                    {reservation.extras.join(", ") || "None"}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Total</Text>
                  <Text style={styles.totalValue}>${reservation.total}</Text>
                </View>
              </View>
              <View style={styles.buttonRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openCancellation(reservation.id)}
                  style={({ pressed }) => [
                    styles.dangerButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.dangerButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openCheckInDetails(reservation.id)}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>Check-in Details</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Past Stays</Text>
        </View>

        <View style={styles.historyList}>
          {reservations
            .filter((reservation) => reservation.status === "Completed")
            .map((stay) => (
              <Pressable
                key={stay.id}
                accessibilityRole="button"
                onPress={() =>
                  stay.roomId && router.push(`/room/${stay.roomId}`)
                }
                style={({ pressed }) => [
                  styles.historyRow,
                  pressed && styles.rowPressed,
                ]}
              >
                <Image
                  source={{ uri: stay.roomImage }}
                  style={styles.historyImage}
                />

                <View style={styles.historyInfo}>
                  <Text style={styles.historyName}>
                    {stay.roomName ?? "StayLink Reservation"}
                  </Text>
                  <Text style={styles.historyDate}>
                    {normalizeReservationDate(stay.checkIn)}
                  </Text>
                </View>

                <View style={styles.historyMeta}>
                  <Text style={styles.historyStatus}>
                    {stay.status ?? "Completed"}
                  </Text>
                  <Text style={styles.historyPrice}>
                    ${stay.totalPrice ?? stay.total ?? 0}
                  </Text>
                </View>
              </Pressable>
            ))}
        </View>
      </ScrollView>
      <Modal
        visible={Boolean(cancellationTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setCancellationTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          {cancellationTarget ? (
            <View style={styles.detailsModal}>
              {cancelledSuccessfully ? (
                <>
                  <Text style={styles.detailsRoom}>
                    Reservation Cancelled
                  </Text>
                  <Text style={styles.detailsLine}>
                    Your reservation has been cancelled successfully.
                  </Text>
                  <Pressable
                    onPress={() => setCancellationTarget(null)}
                    style={styles.detailsCloseButton}
                  >
                    <Text style={styles.primaryButtonText}>Close</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.modalTitle}>Cancel reservation</Text>
                  <Text style={styles.detailsLine}>
                    Free cancellation until 48 hours before check-in.
                    Cancellations within 48 hours will incur a 1-night fee.
                  </Text>
                  <Text style={styles.detailsExtrasTitle}>
                    Why are you canceling?
                  </Text>
                  {[
                    "Change of plans",
                    "Booked by mistake",
                    "Found a better option",
                    "Other",
                  ].map((reason) => (
                    <Pressable
                      key={reason}
                      onPress={() => setCancellationReason(reason)}
                      style={[
                        styles.reasonOption,
                        cancellationReason === reason &&
                          styles.reasonOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.reasonText,
                          cancellationReason === reason &&
                            styles.reasonTextActive,
                        ]}
                      >
                        {reason}
                      </Text>
                    </Pressable>
                  ))}
                  {cancellationReason === "Other" ? (
                    <TextInput
                      value={otherCancellationReason}
                      onChangeText={setOtherCancellationReason}
                      placeholder="Tell us why"
                      placeholderTextColor={StayLinkColors.mutedText}
                      style={styles.reasonInput}
                    />
                  ) : null}
                  <View style={styles.modalActions}>
                    <Pressable
                      onPress={() => setCancellationTarget(null)}
                      style={styles.cancelButton}
                    >
                      <Text style={styles.cancelText}>Keep Reservation</Text>
                    </Pressable>
                    <Pressable
                      disabled={!cancellationReason || cancelling}
                      onPress={() => void confirmCancellation()}
                      style={[
                        styles.dangerButton,
                        (!cancellationReason || cancelling) &&
                          styles.disabledButton,
                      ]}
                    >
                      <Text style={styles.dangerButtonText}>
                        {cancelling ? "Cancelling..." : "Confirm Cancellation"}
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          ) : null}
        </View>
      </Modal>
      <Modal
        visible={Boolean(checkInDetails)}
        transparent
        animationType="fade"
        onRequestClose={() => setCheckInDetails(null)}
      >
        <View style={styles.modalBackdrop}>
          {checkInDetails ? (
            <View style={styles.detailsModal}>
              <Text style={styles.detailsHotel}>
                StayLink {checkInDetails.destination || "Manila"}
              </Text>
              <Text style={styles.detailsRoom}>
                {checkInDetails.roomName ?? "StayLink Reservation"} •{" "}
                {checkInDetails.location ?? "Panoramic View"}
              </Text>
              <View style={styles.detailsDivider} />
              <Text style={styles.detailsLine}>
                <Text style={styles.detailsLabel}>Lead Guest: </Text>
                {checkInDetails.leadGuest || "Not specified"}
              </Text>
              <Text style={styles.detailsLine}>
                <Text style={styles.detailsLabel}>Reservation ID: </Text>
                {checkInDetails.reservationId ?? checkInDetails.id}
              </Text>
              <Text style={styles.detailsLine}>
                <Text style={styles.detailsLabel}>Dates: </Text>
                {normalizeReservationDate(checkInDetails.checkIn)} –{" "}
                {normalizeReservationDate(checkInDetails.checkOut)} (
                {Math.max(1, Number(checkInDetails.nights ?? 1))} Night
                {Number(checkInDetails.nights ?? 1) === 1 ? "" : "s"})
              </Text>
              <Text style={styles.detailsLine}>
                <Text style={styles.detailsLabel}>Guests: </Text>
                {checkInDetails.guests ?? 1} Guest
                {(checkInDetails.guests ?? 1) === 1 ? "" : "s"}
              </Text>
              <Text style={styles.detailsLine}>
                <Text style={styles.detailsLabel}>Times: </Text>
                Check-in: {checkInDetails.checkInTime ?? "3:00 PM"} | Check-out:
                {" 12:00 PM"}
              </Text>
              <Text style={styles.detailsExtrasTitle}>Included Extras:</Text>
              {(checkInDetails.extras?.length
                ? checkInDetails.extras
                : ["None"]
              ).map((extra) => (
                <Text key={extra} style={styles.detailsExtra}>
                  •{" "}
                  {extra === "Breakfast"
                    ? "Daily Breakfast"
                    : extra === "Wellness spa"
                      ? "Wellness Spa Access"
                      : extra}
                </Text>
              ))}
              <Pressable
                onPress={() => setCheckInDetails(null)}
                style={styles.detailsCloseButton}
              >
                <Text style={styles.primaryButtonText}>Close</Text>
              </Pressable>
            </View>
          ) : null}
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
  infoBanner: {
    backgroundColor: "rgba(200, 146, 42, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(200,146,42,0.25)",
    borderRadius: StayLinkRadius.md,
    paddingHorizontal: StayLinkSpacing.md,
    paddingVertical: StayLinkSpacing.sm,
  },
  infoBannerText: {
    color: StayLinkColors.lightGold,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  detailsModal: {
    width: "92%",
    backgroundColor: StayLinkColors.card,
    borderRadius: StayLinkRadius.xl,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    padding: StayLinkSpacing.lg,
    gap: StayLinkSpacing.sm,
  },
  detailsHotel: {
    color: StayLinkColors.lightGold,
    fontFamily: "Outfit_700Bold",
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  detailsRoom: {
    color: StayLinkColors.primaryText,
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 23,
    lineHeight: 29,
  },
  detailsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: StayLinkColors.border,
    marginVertical: StayLinkSpacing.xs,
  },
  detailsLine: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    lineHeight: 21,
  },
  detailsLabel: {
    fontFamily: "Outfit_700Bold",
  },
  detailsExtrasTitle: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_700Bold",
    fontSize: 14,
    marginTop: StayLinkSpacing.xs,
  },
  detailsExtra: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    lineHeight: 21,
  },
  detailsCloseButton: {
    backgroundColor: StayLinkColors.gold,
    borderRadius: StayLinkRadius.md,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: StayLinkSpacing.sm,
  },
  modalTitle: {
    color: StayLinkColors.primaryText,
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 26,
    marginBottom: StayLinkSpacing.xs,
  },
  modalActions: {
    flexDirection: "row",
    gap: StayLinkSpacing.sm,
    marginTop: StayLinkSpacing.sm,
  },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: StayLinkRadius.md,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
  },
  cancelText: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_700Bold",
  },
  emptyState: {
    backgroundColor: StayLinkColors.card,
    borderRadius: StayLinkRadius.xl,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    padding: StayLinkSpacing.lg,
    gap: StayLinkSpacing.xs,
  },
  emptyStateTitle: {
    color: StayLinkColors.primaryText,
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 22,
  },
  emptyStateText: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
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
  description: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 340,
  },
  sectionHeaderRow: {
    marginTop: StayLinkSpacing.xs,
  },
  sectionTitle: {
    color: StayLinkColors.primaryText,
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 27,
    lineHeight: 34,
  },
  upcomingCard: {
    backgroundColor: StayLinkColors.card,
    borderRadius: StayLinkRadius.xl,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 170,
    backgroundColor: StayLinkColors.secondaryCard,
  },
  additionalImage: {
    width: "100%",
    height: 120,
    backgroundColor: StayLinkColors.secondaryCard,
  },
  cardContent: {
    padding: StayLinkSpacing.md,
    gap: StayLinkSpacing.sm,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: StayLinkSpacing.sm,
  },
  roomName: {
    color: StayLinkColors.primaryText,
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 24,
    lineHeight: 30,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: "rgba(200, 146, 42, 0.12)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(200,146,42,0.25)",
    paddingHorizontal: StayLinkSpacing.sm,
    paddingVertical: StayLinkSpacing.xxs,
  },
  statusBadgeText: {
    color: StayLinkColors.lightGold,
    fontFamily: "Outfit_700Bold",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  reservationId: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_500Medium",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaItem: {
    width: "47%",
    backgroundColor: StayLinkColors.secondaryCard,
    borderRadius: StayLinkRadius.md,
    padding: 10,
    gap: 2,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
  },
  metaLabel: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_500Medium",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  metaValue: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 14,
  },
  totalValue: {
    color: StayLinkColors.gold,
    fontFamily: "Outfit_700Bold",
    fontSize: 18,
  },
  liveStatusText: {
    color: StayLinkColors.lightGold,
    fontFamily: "Outfit_500Medium",
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  buttonRow: {
    flexDirection: "row",
    gap: StayLinkSpacing.sm,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: StayLinkColors.secondaryCard,
    borderRadius: StayLinkRadius.md,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    flex: 1.2,
    backgroundColor: StayLinkColors.gold,
    borderRadius: StayLinkRadius.md,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_700Bold",
    fontSize: 14,
  },
  dangerButton: {
    flex: 1,
    backgroundColor: "rgba(184, 70, 70, 0.18)",
    borderRadius: StayLinkRadius.md,
    borderWidth: 1,
    borderColor: "rgba(244, 166, 166, 0.45)",
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: StayLinkSpacing.sm,
  },
  dangerButtonText: {
    color: "#F4A6A6",
    fontFamily: "Outfit_700Bold",
    fontSize: 13,
    textAlign: "center",
  },
  disabledButton: {
    opacity: 0.45,
  },
  reasonOption: {
    minHeight: 42,
    paddingHorizontal: StayLinkSpacing.md,
    justifyContent: "center",
    borderRadius: StayLinkRadius.md,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    backgroundColor: StayLinkColors.secondaryCard,
  },
  reasonOptionActive: {
    backgroundColor: "rgba(200, 146, 42, 0.12)",
    borderColor: "rgba(200, 146, 42, 0.45)",
  },
  reasonText: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_500Medium",
    fontSize: 14,
  },
  reasonTextActive: {
    color: StayLinkColors.lightGold,
    fontFamily: "Outfit_700Bold",
  },
  reasonInput: {
    minHeight: 46,
    paddingHorizontal: StayLinkSpacing.md,
    borderRadius: StayLinkRadius.md,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    backgroundColor: StayLinkColors.secondaryCard,
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_400Regular",
  },
  primaryButtonText: {
    color: StayLinkColors.background,
    fontFamily: "Outfit_700Bold",
    fontSize: 14,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  historyList: {
    gap: StayLinkSpacing.sm,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: StayLinkSpacing.sm,
    backgroundColor: StayLinkColors.card,
    borderRadius: StayLinkRadius.md,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    padding: StayLinkSpacing.sm,
  },
  rowPressed: {
    opacity: 0.96,
  },
  historyImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: StayLinkColors.secondaryCard,
  },
  historyInfo: {
    flex: 1,
    gap: 2,
  },
  historyName: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_700Bold",
    fontSize: 15,
  },
  historyDate: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
  },
  historyMeta: {
    alignItems: "flex-end",
    gap: 2,
  },
  historyStatus: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_500Medium",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  historyPrice: {
    color: StayLinkColors.gold,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 12,
  },
});
