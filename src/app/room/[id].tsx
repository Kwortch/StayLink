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
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
import { applyRoomInventory, getRoomById } from "@/data/rooms";
import { auth } from "@/firebase/config";
import {
  createReservation,
  getDefaultProfile,
  initializeRoomInventory,
  subscribeToRoomInventory,
  getMembershipForPoints,
  subscribeToUserProfile,
  type FirebaseUserProfile,
} from "@/lib/firebase";

export default function RoomDetailScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    destination?: string | string[];
  }>();
  const roomFromCatalog = getRoomById(params.id);
  const destination = Array.isArray(params.destination)
    ? params.destination[0]
    : params.destination;
  const [isBooking, setIsBooking] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [checkIn, setCheckIn] = useState(() => new Date());
  const [checkOut, setCheckOut] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  });
  const [checkInTime, setCheckInTime] = useState(() => {
    const date = new Date();
    date.setHours(15, 0, 0, 0);
    return date;
  });
  const [contactNumber, setContactNumber] = useState("");
  const [leadGuest, setLeadGuest] = useState("");
  const [guests, setGuests] = useState(2);
  const [breakfast, setBreakfast] = useState(false);
  const [spa, setSpa] = useState(false);
  const [profile, setProfile] = useState<FirebaseUserProfile>(() =>
    getDefaultProfile(auth.currentUser!),
  );
  const [room, setRoom] = useState(roomFromCatalog);
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(
    () =>
      subscribeToUserProfile(
        (value) => {
          if (!value) return;
          setProfile((current) => ({ ...current, ...value }));
          if (value.phone) setContactNumber((current) => current || value.phone!);
        },
      ),
    [],
  );

  useEffect(() => {
    if (!roomFromCatalog) return;
    void initializeRoomInventory(
      roomFromCatalog.id,
      roomFromCatalog.availableRooms,
    );
    return subscribeToRoomInventory([roomFromCatalog.id], (inventory) => {
      setRoom(applyRoomInventory(roomFromCatalog, inventory[roomFromCatalog.id]));
    });
  }, [roomFromCatalog]);

  if (!fontsLoaded) return null;

  if (!room) {
    return (
      <Screen>
        <View style={styles.emptyState}>
          <Text style={styles.kicker}>StayLink</Text>
          <Text style={styles.title}>Room not found</Text>
          <Text style={styles.description}>No room was selected.</Text>
        </View>
      </Screen>
    );
  }

  const nights = Math.max(
    1,
    Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000),
  );
  const extras = [
    ...(breakfast ? ["Breakfast"] : []),
    ...(spa ? ["Wellness spa"] : []),
  ];
  const extrasPrice = (breakfast ? 25 : 0) + (spa ? 80 : 0);
  const roomPrice = room.price * nights;
  const membership = getMembershipForPoints(profile.loyaltyPoints);
  const discount =
    Math.round((roomPrice + extrasPrice) * membership.discount) / 100;
  const totalPrice = roomPrice + extrasPrice - discount;
  const formatDate = (date: Date) => date.toISOString().slice(0, 10);
  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  const openDatePicker = (field: "checkIn" | "checkOut") => {
    const value = field === "checkIn" ? checkIn : checkOut;
    DateTimePickerAndroid.open({
      value,
      minimumDate:
        field === "checkIn"
          ? new Date()
          : new Date(checkIn.getTime() + 86400000),
      mode: "date",
      display: "calendar",
      onChange: (_event, selectedDate) => {
        if (!selectedDate) return;
        if (field === "checkIn") {
          setCheckIn(selectedDate);
          if (selectedDate >= checkOut) {
            const next = new Date(selectedDate);
            next.setDate(next.getDate() + 1);
            setCheckOut(next);
          }
        } else if (selectedDate > checkIn) {
          setCheckOut(selectedDate);
        }
      },
    });
  };
  const openTimePicker = () => {
    DateTimePickerAndroid.open({
      value: checkInTime,
      mode: "time",
      display: "clock",
      onChange: (_event, selectedTime) => {
        if (selectedTime) setCheckInTime(selectedTime);
      },
    });
  };

  return (
    <Screen contentStyle={styles.screenContent}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.card}>
          <Image source={{ uri: room.image }} style={styles.image} />

          <View style={styles.content}>
            <Text style={styles.kicker}>StayLink</Text>
            <Text style={styles.type}>{room.type}</Text>
            <Text style={styles.title}>{room.name}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.meta}>{room.size}m²</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.meta}>{room.view}</Text>
            </View>

            <View style={styles.ratingRow}>
              <Text style={styles.rating}>★ {room.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({room.reviews} reviews)</Text>
            </View>

            <Text style={styles.description}>{room.description}</Text>

            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Bed</Text>
              <Text style={styles.infoValue}>{room.bed}</Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Price</Text>
              <Text style={styles.infoValue}>${room.price} / night</Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Selected room ID</Text>
              <Text style={styles.infoValue}>{room.id}</Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Availability</Text>
              <Text style={styles.infoValue}>
                {room.availableRooms > 0
                  ? `${room.availableRooms} rooms available`
                  : "Currently unavailable"}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={isBooking}
              onPress={() => setShowBooking(true)}
              style={({ pressed }) => [
                styles.cta,
                pressed && styles.ctaPressed,
              ]}
            >
              <Text style={styles.ctaText}>Reserve this room</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <Modal
        visible={showBooking}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBooking(false)}
      >
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.bookingModal}>
            <Text style={styles.modalTitle}>Review your stay</Text>
            <Text style={styles.summaryHotel}>StayLink Hotel</Text>
            <Text style={styles.summaryRoom}>{room.name}</Text>
            <Pressable
              style={styles.optionRow}
              onPress={() => openDatePicker("checkIn")}
            >
              <Text style={styles.optionLabel}>Check-in</Text>
              <Text style={styles.optionValue}>{checkIn.toDateString()}</Text>
            </Pressable>
            <Pressable
              style={styles.optionRow}
              onPress={() => openDatePicker("checkOut")}
            >
              <Text style={styles.optionLabel}>Check-out</Text>
              <Text style={styles.optionValue}>{checkOut.toDateString()}</Text>
            </Pressable>
            <Pressable style={styles.optionRow} onPress={openTimePicker}>
              <Text style={styles.optionLabel}>Check-in time</Text>
              <Text style={styles.optionValue}>{formatTime(checkInTime)}</Text>
            </Pressable>
            <View style={styles.contactField}>
              <Text style={styles.optionLabel}>Contact number</Text>
              <TextInput
                accessibilityLabel="Contact number for calls"
                value={contactNumber}
                onChangeText={setContactNumber}
                placeholder="09XXXXXXXXX"
                placeholderTextColor={StayLinkColors.mutedText}
                keyboardType="phone-pad"
                style={styles.contactInput}
              />
            </View>
            <View style={styles.contactField}>
              <Text style={styles.optionLabel}>Lead guest</Text>
              <TextInput
                accessibilityLabel="Lead guest name"
                value={leadGuest}
                onChangeText={setLeadGuest}
                placeholder="Name of guest to accommodate"
                placeholderTextColor={StayLinkColors.mutedText}
                autoCapitalize="words"
                style={styles.contactInput}
              />
            </View>
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Guests</Text>
              <View style={styles.stepper}>
                <Pressable
                  disabled={guests <= 1}
                  onPress={() => setGuests(Math.max(1, guests - 1))}
                >
                  <Text style={styles.stepperText}>−</Text>
                </Pressable>
                <Text style={styles.optionValue}>{guests}</Text>
                <Pressable
                  disabled={guests >= 8}
                  onPress={() => setGuests(Math.min(8, guests + 1))}
                >
                  <Text style={styles.stepperText}>+</Text>
                </Pressable>
              </View>
            </View>
            <Pressable
              style={styles.optionRow}
              onPress={() => setBreakfast(!breakfast)}
            >
              <Text style={styles.optionLabel}>Breakfast (+$25)</Text>
              <Text style={styles.optionValue}>
                {breakfast ? "Selected" : "Add"}
              </Text>
            </Pressable>
            <Pressable style={styles.optionRow} onPress={() => setSpa(!spa)}>
              <Text style={styles.optionLabel}>Wellness spa (+$80)</Text>
              <Text style={styles.optionValue}>{spa ? "Selected" : "Add"}</Text>
            </Pressable>
            <View style={styles.totalRow}>
              <Text style={styles.optionLabel}>Room price</Text>
              <Text style={styles.optionValue}>${roomPrice}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.optionLabel}>Extras</Text>
              <Text style={styles.optionValue}>${extrasPrice}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.optionLabel}>
                {membership.name} Discount ({membership.discount}%)
              </Text>
              <Text style={styles.discountValue}>-${discount}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalPrice}>${totalPrice}</Text>
            </View>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowBooking(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Back</Text>
              </Pressable>
              <Pressable
                disabled={isBooking}
                onPress={async () => {
                  setIsBooking(true);
                  try {
                    await createReservation({
                      hotelId: "staylink-hotel",
                      hotelName: "StayLink Hotel",
                      destination: destination || "",
                      roomId: room.id,
                      roomName: room.name,
                      roomImage: room.image,
                      location: room.view,
                      checkIn: formatDate(checkIn),
                      checkInTime: formatTime(checkInTime),
                      contactNumber: contactNumber.trim(),
                      leadGuest: leadGuest.trim(),
                      checkOut: formatDate(checkOut),
                      nights,
                      availableRooms: room.availableRooms,
                      guests,
                      extras,
                      roomPrice,
                      extrasPrice,
                      totalPrice,
                      total: totalPrice,
                      status: "Confirmed",
                    });
                    setShowBooking(false);
                    Alert.alert("StayLink", "Your reservation was saved.");
                  } catch (error) {
                    Alert.alert(
                      "StayLink",
                      "Unable to save your reservation. Please try again.",
                    );
                  } finally {
                    setIsBooking(false);
                  }
                }}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>
                  {isBooking ? "Saving..." : "Confirm booking"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
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
  emptyState: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: StayLinkSpacing.lg,
    gap: StayLinkSpacing.sm,
  },
  card: {
    backgroundColor: StayLinkColors.card,
    borderRadius: StayLinkRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: StayLinkColors.border,
  },
  image: {
    width: "100%",
    height: 260,
    backgroundColor: StayLinkColors.secondaryCard,
  },
  content: {
    padding: StayLinkSpacing.lg,
    gap: StayLinkSpacing.sm,
  },
  kicker: {
    color: StayLinkColors.lightGold,
    fontFamily: "Outfit_700Bold",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  type: {
    color: StayLinkColors.lightGold,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: StayLinkColors.primaryText,
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 34,
    lineHeight: 40,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: StayLinkSpacing.xs,
  },
  meta: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_500Medium",
    fontSize: 14,
  },
  metaDot: {
    color: StayLinkColors.mutedText,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: StayLinkSpacing.xs,
  },
  rating: {
    color: StayLinkColors.lightGold,
    fontFamily: "Outfit_700Bold",
    fontSize: 16,
  },
  reviewCount: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
  },
  description: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_400Regular",
    fontSize: 15,
    lineHeight: 24,
  },
  infoBlock: {
    backgroundColor: StayLinkColors.secondaryCard,
    borderRadius: StayLinkRadius.md,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    paddingHorizontal: StayLinkSpacing.md,
    paddingVertical: StayLinkSpacing.sm,
    gap: 4,
  },
  infoLabel: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_500Medium",
    fontSize: 12,
  },
  infoValue: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 16,
  },
  cta: {
    backgroundColor: StayLinkColors.gold,
    borderRadius: StayLinkRadius.md,
    paddingVertical: StayLinkSpacing.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: StayLinkSpacing.sm,
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaText: {
    color: StayLinkColors.background,
    fontFamily: "Outfit_700Bold",
    fontSize: 15,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  bookingModal: {
    backgroundColor: StayLinkColors.card,
    borderTopLeftRadius: StayLinkRadius.xl,
    borderTopRightRadius: StayLinkRadius.xl,
    padding: StayLinkSpacing.lg,
    gap: StayLinkSpacing.sm,
  },
  modalTitle: {
    color: StayLinkColors.primaryText,
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 27,
  },
  summaryHotel: {
    color: StayLinkColors.lightGold,
    fontFamily: "Outfit_700Bold",
    fontSize: 13,
  },
  summaryRoom: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 18,
    marginBottom: StayLinkSpacing.xs,
  },
  optionRow: {
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
  optionLabel: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_500Medium",
    fontSize: 13,
    flex: 1,
  },
  optionValue: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 14,
  },
  contactField: {
    backgroundColor: StayLinkColors.secondaryCard,
    borderRadius: StayLinkRadius.md,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    paddingHorizontal: StayLinkSpacing.md,
    paddingVertical: StayLinkSpacing.sm,
    gap: 4,
  },
  contactInput: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 14,
    minHeight: 28,
    padding: 0,
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
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: StayLinkSpacing.xs,
  },
  totalLabel: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_700Bold",
    fontSize: 16,
  },
  totalPrice: {
    color: StayLinkColors.lightGold,
    fontFamily: "Outfit_700Bold",
    fontSize: 20,
  },
  discountValue: {
    color: "#9FD6A7",
    fontFamily: "Outfit_600SemiBold",
    fontSize: 14,
  },
  modalActions: {
    flexDirection: "row",
    gap: StayLinkSpacing.sm,
    marginTop: StayLinkSpacing.sm,
  },
  cancelButton: {
    flex: 1,
    minHeight: 50,
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
});
