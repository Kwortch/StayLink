import { SymbolView } from "expo-symbols";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import {
  StayLinkColors,
  StayLinkRadius,
  StayLinkSpacing,
} from "@/constants/theme";
import type { Room } from "@/data/rooms";

type RoomCardProps = {
  room: Room;
  variant?: "discover" | "rooms";
  onPress?: () => void;
};

export function RoomCard({ room, variant = "rooms", onPress }: RoomCardProps) {
  const compact = variant === "discover";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact ? styles.discoverCard : styles.roomsCard,
        pressed && styles.pressed,
      ]}
    >
      <Image
        source={{ uri: room.image }}
        style={[
          styles.image,
          compact ? styles.discoverImage : styles.roomsImage,
        ]}
      />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{room.type}</Text>
          </View>

          <View style={styles.ratingRow}>
            <SymbolView
              name="star.fill"
              tintColor={StayLinkColors.lightGold}
              size={13}
            />
            <Text style={styles.ratingText}>{room.rating.toFixed(1)}</Text>
            <Text style={styles.reviewText}>({room.reviews})</Text>
          </View>
        </View>

        <Text style={styles.title}>{room.name}</Text>
        <Text style={styles.meta}>
          {room.destination} · {room.size}m² · {room.view}
        </Text>
        <Text style={styles.bed}>{room.bed}</Text>
        <Text style={styles.availability}>
          {room.inventoryError
            ? "Availability unavailable"
            : room.availableRooms === null
              ? "Checking availability..."
              : room.availableRooms > 0
                ? `${room.availableRooms} rooms available`
                : "Currently unavailable"}
        </Text>

        {!compact && <Text style={styles.description}>{room.description}</Text>}

        <View style={styles.footerRow}>
          <Text style={styles.price}>${room.price}</Text>
          <Text style={styles.priceSuffix}> / night</Text>
          <Text style={styles.cta}>View Room →</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: StayLinkColors.card,
    borderRadius: StayLinkRadius.xl,
    borderWidth: 1,
    borderColor: StayLinkColors.border,
    overflow: "hidden",
  },
  discoverCard: {
    width: "100%",
    marginBottom: StayLinkSpacing.sm,
  },
  roomsCard: {
    width: "100%",
  },
  pressed: {
    opacity: 0.96,
  },
  image: {
    width: "100%",
    backgroundColor: StayLinkColors.secondaryCard,
  },
  discoverImage: {
    height: 170,
  },
  roomsImage: {
    height: 220,
  },
  content: {
    padding: StayLinkSpacing.md,
    gap: StayLinkSpacing.xs,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: StayLinkSpacing.sm,
  },
  typeBadge: {
    backgroundColor: "rgba(200, 146, 42, 0.12)",
    borderRadius: 999,
    paddingHorizontal: StayLinkSpacing.sm,
    paddingVertical: StayLinkSpacing.xxs,
    borderWidth: 1,
    borderColor: "rgba(200, 146, 42, 0.25)",
  },
  typeBadgeText: {
    color: StayLinkColors.lightGold,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    color: StayLinkColors.primaryText,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  reviewText: {
    color: StayLinkColors.mutedText,
    fontSize: 11,
    lineHeight: 16,
  },
  title: {
    color: StayLinkColors.primaryText,
    fontSize: 22,
    lineHeight: 28,
    fontFamily: "PlayfairDisplay_700Bold",
  },
  meta: {
    color: StayLinkColors.mutedText,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  bed: {
    color: StayLinkColors.primaryText,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  availability: {
    color: StayLinkColors.lightGold,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  description: {
    color: StayLinkColors.mutedText,
    fontSize: 13,
    lineHeight: 20,
    marginTop: StayLinkSpacing.xxs,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: StayLinkSpacing.xs,
    marginTop: StayLinkSpacing.xs,
  },
  price: {
    color: StayLinkColors.gold,
    fontSize: 22,
    lineHeight: 30,
    fontFamily: "Outfit_700Bold",
  },
  priceSuffix: {
    color: StayLinkColors.mutedText,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
    flex: 1,
  },
  cta: {
    color: StayLinkColors.background,
    backgroundColor: StayLinkColors.gold,
    borderRadius: StayLinkRadius.md,
    paddingHorizontal: StayLinkSpacing.sm,
    paddingVertical: StayLinkSpacing.xs,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    overflow: "hidden",
  },
});
