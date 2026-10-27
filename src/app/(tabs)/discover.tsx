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
import { SymbolView } from "expo-symbols";
import { useEffect, useMemo, useState } from "react";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { RoomCard } from "@/components/room-card";
import { Screen } from "@/components/screen";
import {
  StayLinkColors,
  StayLinkRadius,
  StayLinkSpacing,
} from "@/constants/theme";
import { discoverRooms, rooms, type Room } from "@/data/rooms";
import { auth } from "@/firebase/config";
import { subscribeToHotels, type FirebaseHotel } from "@/lib/firebase";

type PickerField = "checkIn" | "checkOut";

const heroImageUrl =
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80";

const promiseItems = [
  {
    icon: "person.crop.circle.badge.checkmark",
    title: "Concierge",
    subtitle: "Personalized service",
  },
  {
    icon: "fork.knife.circle",
    title: "Fine Dining",
    subtitle: "Exceptional cuisine",
  },
  {
    icon: "sparkles",
    title: "Wellness Spa",
    subtitle: "Restore and relax",
  },
  {
    icon: "car.fill",
    title: "Valet",
    subtitle: "Effortless arrival",
  },
];

const destinations = [
  "Manila",
  "Cebu",
  "Boracay",
  "Palawan",
  "Davao",
  "Baguio",
  "Batangas",
  "Tagaytay",
  "Bohol",
  "Siargao",
];

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function DiscoverScreen() {
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

  const [checkIn, setCheckIn] = useState(() => new Date());
  const [checkOut, setCheckOut] = useState(() => addDays(new Date(), 1));
  const [guests, setGuests] = useState(2);
  const [destinationInput, setDestinationInput] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");
  const [hotels, setHotels] = useState<FirebaseHotel[]>([]);

  useEffect(() => subscribeToHotels(setHotels), []);

  if (!fontsLoaded) {
    return null;
  }

  const localFeaturedRooms = discoverRooms
    .map((id) => rooms.find((room) => room.id === id))
    .filter((room): room is NonNullable<typeof room> => Boolean(room));
  const firebaseRooms = useMemo<Room[]>(() => {
    return hotels.flatMap((hotel) => {
      const hotelRooms: Array<Record<string, unknown>> = hotel.rooms
        ? Object.entries(hotel.rooms).map(([roomId, value]) => ({
            ...value,
            id: roomId,
          }))
        : [hotel as unknown as Record<string, unknown>];

      return hotelRooms.map((value) => ({
        id: String(value.id ?? hotel.roomId ?? hotel.id),
        name: String(value.roomName ?? value.name ?? hotel.name ?? "Hotel room"),
        type: (value.roomType ?? "Standard") as Room["type"],
        price: Number(value.price ?? hotel.price ?? 0),
        size: Number(value.size ?? hotel.size ?? 0),
        view: String(value.view ?? hotel.view ?? hotel.destination ?? ""),
        rating: Number(value.rating ?? hotel.rating ?? 0),
        reviews: Number(value.reviews ?? hotel.reviews ?? 0),
        bed: String(value.bed ?? hotel.bed ?? "Not specified"),
        description: String(value.description ?? hotel.description ?? ""),
        image: String(value.image ?? hotel.image ?? ""),
      }));
    });
  }, [hotels]);
  const filteredFirebaseRooms = firebaseRooms.filter((room) => {
    const hotel = hotels.find((item) =>
      item.rooms ? Object.keys(item.rooms).includes(room.id) : item.id === room.id,
    );
    return !selectedDestination || hotel?.destination?.toLowerCase() === selectedDestination.toLowerCase();
  });
  const featuredRooms = selectedDestination
    ? filteredFirebaseRooms
    : hotels.length
      ? filteredFirebaseRooms
      : localFeaturedRooms;
  const filteredDestinations = destinations.filter((destination) =>
    destination.toLowerCase().includes(destinationInput.toLowerCase()),
  );

  const openDatePicker = (field: PickerField) => {
    const currentValue = field === "checkIn" ? checkIn : checkOut;

    DateTimePickerAndroid.open({
      value: currentValue,
      mode: "date",
      display: "calendar",
      onChange: (_event, selectedDate: Date | undefined) => {
        if (!selectedDate) {
          return;
        }

        if (field === "checkIn") {
          const nextCheckIn = selectedDate;
          setCheckIn(nextCheckIn);
          if (checkOut <= nextCheckIn) {
            setCheckOut(addDays(nextCheckIn, 1));
          }
          return;
        }

        setCheckOut(selectedDate);
      },
    });
  };

  const handleSearch = () => {
    console.log("[StayLink Search]", {
      destination: selectedDestination || "All destinations",
      checkIn: formatDate(checkIn),
      checkOut: formatDate(checkOut),
      guests,
    });
  };

  return (
    <Screen contentStyle={styles.screenContent}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <View style={styles.logoBlock}>
            <Text style={styles.logo}>STAYLINK</Text>
            <Text style={styles.logoTag}>Luxury stays in the Philippines</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go to Profile"
            onPress={() => router.push("/profile")}
            style={({ pressed }) => [
              styles.avatarButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.avatarInitial}>
              {(auth.currentUser?.displayName ?? auth.currentUser?.email ?? "G")
                .charAt(0)
                .toUpperCase()}
            </Text>
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <ImageBackground
            source={{ uri: heroImageUrl }}
            style={styles.heroImage}
            imageStyle={styles.heroImageStyle}
          >
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <Text style={styles.heroLabel}>WELCOME TO</Text>
              <Text style={styles.heroTitle}>StayLink</Text>
              <Text style={styles.heroSubtitle}>
                Manila · Cebu · Boracay · Palawan · Davao
              </Text>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.searchCard}>
          <View style={styles.searchField}>
            <Text style={styles.fieldLabel}>Destination</Text>
            <TextInput
              value={destinationInput}
              onChangeText={(value) => {
                setDestinationInput(value);
                if (!value || value !== selectedDestination) {
                  setSelectedDestination("");
                }
              }}
              placeholder={selectedDestination || "Search destinations"}
              placeholderTextColor={StayLinkColors.mutedText}
              style={styles.destinationInput}
              autoCapitalize="words"
            />
            {destinationInput.length > 0 && !selectedDestination ? (
              <View style={styles.destinationMenu}>
                {filteredDestinations.map((destination) => (
                  <Pressable
                    key={destination}
                    onPress={() => {
                      setSelectedDestination(destination);
                      setDestinationInput(destination);
                    }}
                    style={styles.destinationOption}
                  >
                    <Text style={styles.destinationOptionText}>{destination}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.dateRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => openDatePicker("checkIn")}
              style={({ pressed }) => [
                styles.dateField,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.fieldLabel}>Check-in</Text>
              <Text style={styles.fieldValue}>{formatDate(checkIn)}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => openDatePicker("checkOut")}
              style={({ pressed }) => [
                styles.dateField,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.fieldLabel}>Check-out</Text>
              <Text style={styles.fieldValue}>{formatDate(checkOut)}</Text>
            </Pressable>
          </View>

          <View style={styles.guestRow}>
            <View style={styles.guestCopy}>
              <Text style={styles.fieldLabel}>Guests</Text>
              <Text style={styles.helperText}>Select the number of guests</Text>
            </View>

            <View style={styles.guestControl}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Decrease guests"
                accessibilityHint="Decrease the number of guests"
                accessibilityState={{ disabled: guests <= 1 }}
                disabled={guests <= 1}
                onPress={() => setGuests((value) => Math.max(1, value - 1))}
                style={({ pressed }) => [
                  styles.guestButton,
                  guests <= 1 && styles.guestButtonDisabled,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.guestButtonText}>−</Text>
              </Pressable>

              <Text style={styles.guestCount}>{guests}</Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Increase guests"
                accessibilityHint="Increase the number of guests"
                accessibilityState={{ disabled: guests >= 8 }}
                disabled={guests >= 8}
                onPress={() => setGuests((value) => Math.min(8, value + 1))}
                style={({ pressed }) => [
                  styles.guestButton,
                  guests >= 8 && styles.guestButtonDisabled,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.guestButtonText}>+</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handleSearch}
            style={({ pressed }) => [
              styles.searchButton,
              pressed && styles.searchPressed,
            ]}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </Pressable>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>120+</Text>
            <Text style={styles.statLabel}>Rooms</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4.9★</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>18 yrs</Text>
            <Text style={styles.statLabel}>Excellence</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Room Experiences</Text>
          <Text style={styles.sectionSubtitle}>
            Designed for your perfect stay.
          </Text>
        </View>

        <View style={styles.roomList}>
          {featuredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              variant="discover"
              onPress={() =>
                router.push(
                  `/room/${room.id}?destination=${encodeURIComponent(
                    selectedDestination,
                  )}`,
                )
              }
            />
          ))}
        </View>

        {hotels.length > 0 && selectedDestination && featuredRooms.length === 0 ? (
          <Text style={styles.emptyResults}>No hotels found in this destination.</Text>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>The StayLink Promise</Text>
        </View>

        <View style={styles.promiseGrid}>
          {promiseItems.map((item) => (
            <View key={item.title} style={styles.promiseItem}>
              <View style={styles.promiseIconWrap}>
                <SymbolView
                  name={item.icon as never}
                  tintColor={StayLinkColors.lightGold}
                  size={18}
                />
              </View>
              <Text style={styles.promiseTitle}>{item.title}</Text>
              <Text style={styles.promiseSubtitle}>{item.subtitle}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: StayLinkSpacing.lg,
    paddingTop: StayLinkSpacing.md,
    paddingBottom: StayLinkSpacing.xxl,
    gap: StayLinkSpacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: StayLinkSpacing.md,
  },
  logoBlock: {
    flex: 1,
    gap: 2,
  },
  logo: {
    color: StayLinkColors.gold,
    fontFamily: "Outfit_700Bold",
    fontSize: 18,
    letterSpacing: 4,
  },
  logoTag: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
  },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: StayLinkColors.border,
  },
  avatarInitial: {
    color: StayLinkColors.lightGold,
    fontFamily: "Outfit_700Bold",
    fontSize: 19,
    textAlign: "center",
    paddingTop: 12,
  },
  heroCard: {
    borderRadius: StayLinkRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: StayLinkColors.border,
  },
  heroImage: {
    minHeight: 340,
    justifyContent: "flex-end",
  },
  heroImageStyle: {
    borderRadius: StayLinkRadius.xl,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(11, 11, 9, 0.58)",
  },
  heroContent: {
    padding: StayLinkSpacing.lg,
    gap: StayLinkSpacing.sm,
  },
  heroLabel: {
    color: StayLinkColors.lightGold,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 12,
    letterSpacing: 3,
  },
  heroTitle: {
    color: StayLinkColors.primaryText,
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 56,
    lineHeight: 60,
  },
  heroSubtitle: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 260,
  },
  searchCard: {
    marginTop: -28,
    backgroundColor: StayLinkColors.card,
    borderRadius: StayLinkRadius.xl,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    padding: StayLinkSpacing.lg,
    gap: StayLinkSpacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    zIndex: 2,
  },
  searchField: {
    gap: StayLinkSpacing.xs,
  },
  destinationInput: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 15,
    minHeight: 42,
    paddingVertical: 0,
  },
  destinationMenu: {
    backgroundColor: StayLinkColors.secondaryCard,
    borderColor: StayLinkColors.border,
    borderRadius: StayLinkRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  destinationOption: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: StayLinkSpacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: StayLinkColors.border,
  },
  destinationOptionText: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_500Medium",
    fontSize: 14,
  },
  emptyResults: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_500Medium",
    fontSize: 14,
    paddingVertical: StayLinkSpacing.md,
  },
  dateRow: {
    flexDirection: "row",
    gap: StayLinkSpacing.sm,
  },
  dateField: {
    flex: 1,
    backgroundColor: StayLinkColors.secondaryCard,
    borderRadius: StayLinkRadius.md,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    paddingHorizontal: StayLinkSpacing.md,
    paddingVertical: StayLinkSpacing.sm,
    gap: 4,
    minHeight: 72,
    justifyContent: "center",
  },
  fieldLabel: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_500Medium",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  fieldValue: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 15,
    lineHeight: 20,
  },
  guestRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: StayLinkSpacing.sm,
  },
  guestCopy: {
    flex: 1,
    gap: 2,
  },
  helperText: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    lineHeight: 16,
  },
  guestControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: StayLinkSpacing.sm,
  },
  guestButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: StayLinkColors.secondaryCard,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
  },
  guestButtonDisabled: {
    opacity: 0.4,
  },
  guestButtonText: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_500Medium",
    fontSize: 24,
    lineHeight: 26,
  },
  guestCount: {
    minWidth: 24,
    textAlign: "center",
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_700Bold",
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: StayLinkColors.gold,
    borderRadius: StayLinkRadius.md,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  searchPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  searchButtonText: {
    color: "#0B0B09",
    fontFamily: "Outfit_700Bold",
    fontSize: 15,
    letterSpacing: 0.6,
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: StayLinkRadius.lg,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    backgroundColor: StayLinkColors.card,
    paddingVertical: StayLinkSpacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: StayLinkColors.border,
    marginVertical: StayLinkSpacing.xxs,
  },
  statValue: {
    color: StayLinkColors.primaryText,
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 21,
  },
  statLabel: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_500Medium",
    fontSize: 12,
    letterSpacing: 0.8,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: StayLinkColors.primaryText,
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 26,
  },
  sectionSubtitle: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  roomList: {
    gap: StayLinkSpacing.md,
  },
  roomCard: {
    backgroundColor: StayLinkColors.card,
    borderRadius: StayLinkRadius.lg,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    overflow: "hidden",
  },
  roomImage: {
    height: 180,
  },
  roomImageStyle: {
    borderTopLeftRadius: StayLinkRadius.lg,
    borderTopRightRadius: StayLinkRadius.lg,
  },
  roomOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(11, 11, 9, 0.24)",
  },
  roomBody: {
    padding: StayLinkSpacing.md,
    gap: 6,
  },
  roomTitle: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_700Bold",
    fontSize: 18,
  },
  roomMeta: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
  },
  roomPrice: {
    color: StayLinkColors.lightGold,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 14,
    marginTop: 2,
  },
  promiseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: StayLinkSpacing.sm,
  },
  promiseItem: {
    width: "48%",
    backgroundColor: StayLinkColors.card,
    borderRadius: StayLinkRadius.lg,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    padding: StayLinkSpacing.md,
    gap: 6,
  },
  promiseIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: StayLinkColors.secondaryCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    marginBottom: 2,
  },
  promiseTitle: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_700Bold",
    fontSize: 15,
  },
  promiseSubtitle: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.88,
  },
});
