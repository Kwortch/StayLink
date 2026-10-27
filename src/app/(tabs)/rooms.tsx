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
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { FilterPill } from "@/components/filter-pill";
import { RoomCard } from "@/components/room-card";
import { Screen } from "@/components/screen";
import {
  StayLinkColors,
  StayLinkRadius,
  StayLinkSpacing,
} from "@/constants/theme";
import { roomTypes, rooms, type RoomType } from "@/data/rooms";

type SortMode = "top-rated" | "price-asc" | "price-desc";

export default function RoomsScreen() {
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

  const [selectedType, setSelectedType] = useState<RoomType | "All">("All");
  const [sortMode, setSortMode] = useState<SortMode>("top-rated");
  const [showSortMenu, setShowSortMenu] = useState(false);

  if (!fontsLoaded) {
    return null;
  }

  const filteredRooms = useMemo(() => {
    const nextRooms =
      selectedType === "All"
        ? [...rooms]
        : rooms.filter((room) => room.type === selectedType);

    return [...nextRooms].sort((roomA, roomB) => {
      switch (sortMode) {
        case "price-asc":
          return roomA.price - roomB.price;
        case "price-desc":
          return roomB.price - roomA.price;
        case "top-rated":
        default:
          return roomB.rating - roomA.rating;
      }
    });
  }, [selectedType, sortMode]);

  return (
    <Screen contentStyle={styles.screenContent}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>StayLink</Text>
          <Text style={styles.title}>Rooms & Suites</Text>
          <Text style={styles.description}>
            Thoughtfully curated stays shaped for slow mornings, elevated
            design, and unforgettable coastal luxury.
          </Text>
        </View>

        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {roomTypes.map((label) => (
              <FilterPill
                key={label}
                label={label}
                selected={selectedType === label}
                onPress={() => setSelectedType(label)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.sortWrap}>
          <Text style={styles.sortLabel}>Sort</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowSortMenu((value) => !value)}
            style={({ pressed }) => [
              styles.sortButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.sortButtonText}>
              {sortMode === "top-rated"
                ? "Top Rated"
                : sortMode === "price-asc"
                  ? "Price Low → High"
                  : "Price High → Low"}
            </Text>
            <Text style={styles.sortArrow}>▾</Text>
          </Pressable>

          {showSortMenu && (
            <View style={styles.sortMenu}>
              {[
                { label: "Top Rated", value: "top-rated" },
                { label: "Price Low → High", value: "price-asc" },
                { label: "Price High → Low", value: "price-desc" },
              ].map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  onPress={() => {
                    setSortMode(option.value as SortMode);
                    setShowSortMenu(false);
                  }}
                  style={({ pressed }) => [
                    styles.sortOption,
                    pressed && styles.sortOptionPressed,
                    sortMode === option.value && styles.sortOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortMode === option.value && styles.sortOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.roomList}>
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              variant="rooms"
              onPress={() => router.push(`/room/${room.id}`)}
            />
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
  header: {
    gap: StayLinkSpacing.xs,
    marginBottom: StayLinkSpacing.md,
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
  filterSection: {
    marginBottom: StayLinkSpacing.md,
  },
  filterRow: {
    paddingRight: StayLinkSpacing.md,
    gap: StayLinkSpacing.sm,
  },
  sortWrap: {
    marginBottom: StayLinkSpacing.md,
    gap: StayLinkSpacing.sm,
  },
  sortLabel: {
    color: StayLinkColors.mutedText,
    fontFamily: "Outfit_500Medium",
    fontSize: 12,
    letterSpacing: 0.2,
  },
  sortButton: {
    backgroundColor: StayLinkColors.card,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    borderRadius: StayLinkRadius.md,
    paddingHorizontal: StayLinkSpacing.md,
    paddingVertical: StayLinkSpacing.sm,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sortButtonText: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 14,
  },
  sortArrow: {
    color: StayLinkColors.lightGold,
    fontSize: 16,
  },
  sortMenu: {
    backgroundColor: StayLinkColors.secondaryCard,
    borderRadius: StayLinkRadius.md,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    overflow: "hidden",
  },
  sortOption: {
    paddingHorizontal: StayLinkSpacing.md,
    paddingVertical: StayLinkSpacing.sm,
  },
  sortOptionPressed: {
    backgroundColor: "rgba(232, 184, 75, 0.08)",
  },
  sortOptionActive: {
    backgroundColor: "rgba(200, 146, 42, 0.12)",
  },
  sortOptionText: {
    color: StayLinkColors.primaryText,
    fontFamily: "Outfit_500Medium",
    fontSize: 14,
  },
  sortOptionTextActive: {
    color: StayLinkColors.lightGold,
  },
  pressed: {
    opacity: 0.9,
  },
  roomList: {
    gap: StayLinkSpacing.md,
    paddingBottom: StayLinkSpacing.xxl,
  },
});
