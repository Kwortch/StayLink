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
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
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
  firebaseAuth,
  subscribeToReservationsForCurrentUser,
  updateReservation,
  type FirebaseReservation,
} from "@/lib/firebase";

type ReservationCardState = {
  reservationId: string;
  roomId: string;
  roomName: string;
  roomImage: string;
  checkIn: string;
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
    reservationId: reservation.reservationId ?? reservation.id,
    roomId,
    roomName,
    roomImage,
    checkIn: normalizeReservationDate(checkInRaw),
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
  const [editing, setEditing] = useState<FirebaseReservation | null>(null);
  const [editCheckIn, setEditCheckIn] = useState(new Date());
  const [editCheckOut, setEditCheckOut] = useState(new Date());
  const [editGuests, setEditGuests] = useState(1);
  const [editExtras, setEditExtras] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

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
      .filter((reservation) => reservation.status !== "Completed")
      .map(formatReservationCard)
      .filter((item): item is ReservationCardState => Boolean(item));

    if (normalized.length === 0) {
      return null;
    }

    return normalized[0];
  }, [reservations]);

  const additionalUpcomingReservations = useMemo(() => {
    return reservations
      .filter((reservation) => reservation.status !== "Completed")
      .map(formatReservationCard)
      .filter((item): item is ReservationCardState => Boolean(item))
      .slice(1);
  }, [reservations]);

  const handleModify = () => {
    const reservation = reservations.find(
      (item) =>
        item.id === upcomingReservationFromFirebase?.reservationId ||
        item.reservationId === upcomingReservationFromFirebase?.reservationId,
    );
    if (!reservation) return;
    setEditing(reservation);
    setEditCheckIn(new Date(`${reservation.checkIn}T00:00:00`));
    setEditCheckOut(new Date(`${reservation.checkOut}T00:00:00`));
    setEditGuests(reservation.guests ?? 1);
    setEditExtras(reservation.extras ?? []);
  };

  const handleCheckIn = () => {
    if (!upcomingReservationFromFirebase) return;
    const reservation = reservations.find(
      (item) =>
        item.id === upcomingReservationFromFirebase.reservationId ||
        item.reservationId === upcomingReservationFromFirebase.reservationId,
    );
    Alert.alert(
      "Check-in details",
      `${upcomingReservationFromFirebase.roomName}\n${upcomingReservationFromFirebase.checkIn} - ${upcomingReservationFromFirebase.checkOut}\n${upcomingReservationFromFirebase.nights} night(s) · ${reservation?.guests ?? 1} guest(s)\nExtras: ${reservation?.extras?.join(", ") || "None"}`,
    );
  };

  if (!fontsLoaded) return null;

  const editNights = Math.max(
    1,
    Math.ceil((editCheckOut.getTime() - editCheckIn.getTime()) / 86400000),
  );
  const editRoomPrice =
    (Number(editing?.roomPrice ?? editing?.total ?? 0) /
      Math.max(1, Number(editing?.nights ?? 1))) *
    editNights;
  const editExtrasPrice = editExtras.reduce(
    (sum, extra) => sum + (extra === "Breakfast" ? 25 : 80),
    0,
  );
  const openEditDatePicker = (field: "checkIn" | "checkOut") => {
    const value = field === "checkIn" ? editCheckIn : editCheckOut;
    DateTimePickerAndroid.open({
      value,
      mode: "date",
      display: "calendar",
      onChange: (_event, date) => {
        if (!date) return;
        if (field === "checkIn") setEditCheckIn(date);
        else if (date > editCheckIn) setEditCheckOut(date);
      },
    });
  };

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
                  onPress={handleModify}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>Modify</Text>
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
        visible={Boolean(editing)}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.editModal}>
            <Text style={styles.modalTitle}>Modify reservation</Text>
            <Pressable
              style={styles.editRow}
              onPress={() => openEditDatePicker("checkIn")}
            >
              <Text style={styles.editLabel}>Check-in</Text>
              <Text style={styles.editValue}>{editCheckIn.toDateString()}</Text>
            </Pressable>
            <Pressable
              style={styles.editRow}
              onPress={() => openEditDatePicker("checkOut")}
            >
              <Text style={styles.editLabel}>Check-out</Text>
              <Text style={styles.editValue}>
                {editCheckOut.toDateString()}
              </Text>
            </Pressable>
            <View style={styles.editRow}>
              <Text style={styles.editLabel}>Nights</Text>
              <Text style={styles.editValue}>{editNights}</Text>
            </View>
            <View style={styles.editRow}>
              <Text style={styles.editLabel}>Guests</Text>
              <View style={styles.stepper}>
                <Pressable
                  disabled={editGuests <= 1}
                  onPress={() => setEditGuests(Math.max(1, editGuests - 1))}
                >
                  <Text style={styles.stepperText}>-</Text>
                </Pressable>
                <Text style={styles.editValue}>{editGuests}</Text>
                <Pressable
                  disabled={editGuests >= 8}
                  onPress={() => setEditGuests(Math.min(8, editGuests + 1))}
                >
                  <Text style={styles.stepperText}>+</Text>
                </Pressable>
              </View>
            </View>
            <Pressable
              style={styles.editRow}
              onPress={() =>
                setEditExtras(
                  editExtras.includes("Breakfast")
                    ? editExtras.filter((item) => item !== "Breakfast")
                    : [...editExtras, "Breakfast"],
                )
              }
            >
              <Text style={styles.editLabel}>Breakfast (+$25)</Text>
              <Text style={styles.editValue}>
                {editExtras.includes("Breakfast") ? "Selected" : "Add"}
              </Text>
            </Pressable>
            <Pressable
              style={styles.editRow}
              onPress={() =>
                setEditExtras(
                  editExtras.includes("Wellness spa")
                    ? editExtras.filter((item) => item !== "Wellness spa")
                    : [...editExtras, "Wellness spa"],
                )
              }
            >
              <Text style={styles.editLabel}>Wellness spa (+$80)</Text>
              <Text style={styles.editValue}>
                {editExtras.includes("Wellness spa") ? "Selected" : "Add"}
              </Text>
            </Pressable>
            <View style={styles.editRow}>
              <Text style={styles.editLabel}>Total</Text>
              <Text style={styles.totalValue}>
                ${editRoomPrice + editExtrasPrice}
              </Text>
            </View>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setEditing(null)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={savingEdit}
                onPress={async () => {
                  if (!editing) return;
                  setSavingEdit(true);
                  try {
                    await updateReservation(editing.id, {
                      checkIn: editCheckIn.toISOString().slice(0, 10),
                      checkOut: editCheckOut.toISOString().slice(0, 10),
                      nights: editNights,
                      guests: editGuests,
                      extras: editExtras,
                      roomPrice: editRoomPrice,
                      extrasPrice: editExtrasPrice,
                      totalPrice: editRoomPrice + editExtrasPrice,
                      total: editRoomPrice + editExtrasPrice,
                    });
                    setEditing(null);
                  } catch {
                    Alert.alert(
                      "StayLink",
                      "Unable to update this reservation.",
                    );
                  } finally {
                    setSavingEdit(false);
                  }
                }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>
                  {savingEdit ? "Saving..." : "Save changes"}
                </Text>
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
  editRow: {
    minHeight: 46,
    paddingHorizontal: StayLinkSpacing.md,
    borderRadius: StayLinkRadius.md,
    backgroundColor: StayLinkColors.secondaryCard,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: StayLinkSpacing.sm,
  },
  editLabel: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_500Medium",
    fontSize: 13,
    flex: 1,
  },
  editValue: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 14,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: StayLinkSpacing.md,
  },
  stepperText: {
    color: StayLinkColors.lightGold,
    fontFamily: "Outfit_700Bold",
    fontSize: 22,
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
    height: 210,
    backgroundColor: StayLinkColors.secondaryCard,
  },
  cardContent: {
    padding: StayLinkSpacing.lg,
    gap: StayLinkSpacing.md,
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
    gap: StayLinkSpacing.sm,
  },
  metaItem: {
    width: "48%",
    backgroundColor: StayLinkColors.secondaryCard,
    borderRadius: StayLinkRadius.md,
    padding: StayLinkSpacing.sm,
    gap: 4,
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
