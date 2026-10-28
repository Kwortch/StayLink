import { onAuthStateChanged, updateProfile, type User } from "firebase/auth";
import {
  collection,
  deleteField,
  doc,
  getDocs,
  onSnapshot,
  runTransaction as runFirestoreTransaction,
} from "firebase/firestore";
import {
  equalTo,
  get,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  runTransaction as runDatabaseTransaction,
  set,
  update,
  type Unsubscribe,
} from "firebase/database";

import { resolveRoomTypeId } from "@/data/rooms";
import { auth, database } from "@/firebase/config";
import { firestore } from "@/firebase/firestore";

export const firebaseAuth = auth;
export const firebaseDb = database;
export const isFirebaseConfigured = true;

export function getFirebaseErrorDetails(error: unknown): string {
  if (error instanceof Error) {
    const code =
      "code" in error && typeof error.code === "string" ? error.code : "";
    return [code, error.message].filter(Boolean).join(": ");
  }
  if (typeof error === "string") return error;
  return "Unknown Firebase error";
}

export type FirebaseReservation = {
  id: string;
  userId?: string;
  roomId?: string;
  physicalRoomId?: string;
  checkInProcessingAt?: string;
  location?: string;
  destination?: string;
  roomName?: string;
  roomImage?: string;
  reservationId?: string;
  checkIn?: string;
  checkInTime?: string;
  contactNumber?: string;
  leadGuest?: string;
  checkOut?: string;
  total?: number;
  hotelId?: string;
  hotelName?: string;
  guests?: number;
  extras?: string[];
  roomPrice?: number;
  extrasPrice?: number;
  totalPrice?: number;
  subtotal?: number;
  taxes?: number;
  status?: string;
  nights?: number;
  createdAt?: string;
  confirmedAt?: string;
  checkedInAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  updatedAt?: string;
  availableRooms?: number;
  loyaltyPointsAwarded?: boolean;
  loyaltyPointsEarned?: number;
  loyaltyLockedAt?: string;
};

export type FirebaseHotel = {
  id: string;
  name?: string;
  destination?: string;
  rooms?: Record<string, Record<string, unknown>>;
  roomId?: string;
  roomName?: string;
  roomType?: string;
  price?: number;
  size?: number;
  view?: string;
  rating?: number;
  reviews?: number;
  bed?: string;
  description?: string;
  image?: string;
  availableRooms?: number;
};

export type RoomInventory = {
  roomTypeId: string;
  totalRooms: number;
  occupiedRooms: number;
  cleaningRooms: number;
  availableRooms: number;
};

type PhysicalRoom = {
  roomTypeId?: unknown;
  roomNumber?: string;
  status?: "Available" | "Occupied" | "Cleaning" | string;
  reservationId?: string;
  guestId?: string;
};

export type UserPreferences = {
  preferredRoom: string;
  bedPreference: string;
  smoking: string;
  notifications: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  language: string;
  currency: string;
};

export type FirebaseUserProfile = {
  fullName: string;
  email: string;
  address?: string;
  phone?: string;
  createdAt: string;
  loyaltyPoints: number;
  membership: string;
  membershipStatus?: string;
  vouchers?: UserVoucher[];
  preferences: UserPreferences;
};

export type UserVoucher = {
  id: string;
  name: string;
  description: string;
  redeemedAt: string;
};

export type LoyaltyVoucher = {
  id: string;
  name: string;
  description: string;
  cost: number;
  minimumTier: string;
};

export const defaultPreferences: UserPreferences = {
  preferredRoom: "No preference",
  bedPreference: "No preference",
  smoking: "No preference",
  notifications: "None",
  emailNotifications: false,
  smsNotifications: false,
  pushNotifications: false,
  language: "English",
  currency: "PHP",
};

export const membershipLevels = [
  {
    name: "Bronze",
    minimum: 0,
    discount: 0,
    pointsPer100: 1,
    perks: ["Member-only rates", "Access to food vouchers"],
  },
  {
    name: "Silver",
    minimum: 5_000,
    discount: 5,
    pointsPer100: 1.5,
    perks: ["5% discount", "Free late checkout at 1 PM", "Welcome drink voucher"],
  },
  {
    name: "Gold",
    minimum: 15_000,
    discount: 10,
    pointsPer100: 2,
    perks: ["10% discount", "Free breakfast", "Priority room upgrade unlocks"],
  },
  {
    name: "Platinum / Diamond",
    minimum: 30_000,
    discount: 15,
    pointsPer100: 3,
    perks: [
      "15% discount",
      "Free airport transfer voucher",
      "Guaranteed suite upgrade unlocks",
    ],
  },
] as const;

export const loyaltyVouchers: LoyaltyVoucher[] = [
  {
    id: "food-voucher",
    name: "Food Voucher",
    description: "Use toward dining at the StayLink restaurant.",
    cost: 500,
    minimumTier: "Bronze",
  },
  {
    id: "welcome-drink",
    name: "Welcome Drink",
    description: "One complimentary welcome drink on arrival.",
    cost: 800,
    minimumTier: "Silver",
  },
  {
    id: "breakfast-voucher",
    name: "Breakfast Voucher",
    description: "Enjoy breakfast for one guest during your stay.",
    cost: 1_500,
    minimumTier: "Gold",
  },
  {
    id: "airport-transfer",
    name: "Airport Transfer",
    description: "Redeem one complimentary airport transfer.",
    cost: 3_000,
    minimumTier: "Platinum / Diamond",
  },
];

export function getMembershipForPoints(points: number) {
  return (
    [...membershipLevels].reverse().find((level) => points >= level.minimum) ??
    membershipLevels[0]
  );
}

export function getNextMembership(points: number) {
  return membershipLevels.find((level) => level.minimum > points) ?? null;
}

export function getDefaultProfile(user: User): FirebaseUserProfile {
  return {
    fullName: user.displayName ?? "Guest",
    email: user.email ?? "",
    createdAt: new Date().toISOString(),
    loyaltyPoints: 0,
    membership: "Bronze",
    vouchers: [],
    preferences: { ...defaultPreferences },
  };
}

export function subscribeToUserProfile(
  callback: (profile: FirebaseUserProfile | null) => void,
): Unsubscribe | undefined {
  const user = firebaseAuth.currentUser;
  if (!user) return undefined;

  return onValue(ref(database, `users/${user.uid}`), (snapshot) => {
    callback(
      snapshot.exists() ? (snapshot.val() as FirebaseUserProfile) : null,
    );
  });
}

export async function saveUserProfile(profile: Partial<FirebaseUserProfile>) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("You must be signed in to update your profile.");

  await update(ref(database, `users/${user.uid}`), profile);
  if (profile.fullName && profile.fullName !== user.displayName) {
    await updateProfile(user, { displayName: profile.fullName });
  }
}

export async function createReservation(
  reservation: Omit<FirebaseReservation, "id">,
) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("You must be signed in to create a reservation.");
  const roomTypeId = resolveRoomTypeId(reservation.roomId ?? "");
  if (!(await hasAvailablePhysicalRoom(roomTypeId))) {
    throw new Error("No rooms of this type are currently available.");
  }

  const reservationRef = push(ref(database, "bookings"));
  const reservationId = reservation.reservationId ?? reservationRef.key;
  const confirmedAt = new Date().toISOString();
  await set(reservationRef, {
    ...reservation,
    roomId: roomTypeId,
    userId: user.uid,
    reservationId,
    createdAt: confirmedAt,
    confirmedAt,
  });
  return reservationId;
}

export async function awardCompletedBookingPoints(
  booking: FirebaseReservation,
) {
  const user = firebaseAuth.currentUser;
  if (!user || booking.userId !== user.uid || booking.status !== "Completed") {
    return;
  }

  const bookingRef = ref(database, `bookings/${booking.id}`);
  const claim = await runDatabaseTransaction(bookingRef, (current) => {
    if (!current || current.loyaltyPointsAwarded === true) return;
    return { ...current, loyaltyPointsAwarded: true };
  });

  if (!claim.committed) return;

  const membership = getMembershipForPoints(
    Number((await get(ref(database, `users/${user.uid}`))).val()?.loyaltyPoints ?? 0),
  );
  const totalSpent = Number(
    booking.totalPrice ?? booking.total ?? booking.subtotal ?? 0,
  );
  const earnedPoints = Math.floor(
    (totalSpent / 100) * membership.pointsPer100,
  );
  const profileRef = ref(database, `users/${user.uid}`);
  await runDatabaseTransaction(profileRef, (current) => {
    const profile = current ?? {};
    const loyaltyPoints = Number(profile.loyaltyPoints ?? 0) + earnedPoints;
    const membership = getMembershipForPoints(loyaltyPoints).name;
    return {
      ...profile,
      loyaltyPoints,
      membership,
      membershipStatus: membership,
    };
  });

  await update(bookingRef, {
    loyaltyPointsEarned: earnedPoints,
    loyaltyLockedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function lockCompletedReservation(
  reservation: FirebaseReservation,
) {
  const user = firebaseAuth.currentUser;
  if (!user || reservation.userId !== user.uid || !reservation.checkOut) return;

  const checkout = new Date(`${reservation.checkOut}T12:00:00`);
  if (Number.isNaN(checkout.getTime()) || checkout > new Date()) return;

  if (reservation.status === "Checked In" && reservation.physicalRoomId) {
    const physicalRoomRef = doc(
      firestore,
      "rooms",
      reservation.physicalRoomId,
    );
    const roomCheckout = await runFirestoreTransaction(
      firestore,
      async (transaction) => {
        const physicalRoom = await transaction.get(physicalRoomRef);
        const room = physicalRoom.data() as PhysicalRoom | undefined;
        if (
          !room ||
          room.reservationId !== reservation.reservationId ||
          (room.status !== "Occupied" && room.status !== "Cleaning")
        ) {
          return false;
        }
        if (room.status === "Occupied") {
          transaction.update(physicalRoomRef, {
            status: "Cleaning",
            checkedOutAt: checkout.toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
        return true;
      },
    );
    if (!roomCheckout) {
      throw new Error("The assigned room could not be moved to cleaning.");
    }
  }

  const bookingRef = ref(database, `bookings/${reservation.id}`);
  const claim = await runDatabaseTransaction(bookingRef, (current) => {
    if (
      !current ||
      current.userId !== user.uid ||
      (current.status !== "Confirmed" && current.status !== "Checked In")
    ) {
      return;
    }

    return {
      ...current,
      status: "Completed",
      completedAt: checkout.toISOString(),
      loyaltyLockedAt: checkout.toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  if (claim.committed) {
    await awardCompletedBookingPoints({
      ...reservation,
      status: "Completed",
    });
  }
}

export async function checkInReservation(reservation: FirebaseReservation) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("You must be signed in to check in.");

  const bookingRef = ref(database, `bookings/${reservation.id}`);
  const now = new Date();
  const checkInDate = reservation.checkIn
    ? new Date(`${reservation.checkIn}T00:00:00`)
    : null;
  const checkOutDate = reservation.checkOut
    ? new Date(`${reservation.checkOut}T12:00:00`)
    : null;
  const checkInTime = reservation.checkInTime?.match(
    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
  );
  if (checkInDate) {
    if (checkInTime) {
      let hours = Number(checkInTime[1]) % 12;
      if (checkInTime[3].toUpperCase() === "PM") hours += 12;
      checkInDate.setHours(hours, Number(checkInTime[2]), 0, 0);
    } else {
      checkInDate.setHours(15, 0, 0, 0);
    }
  }

  if (
    !checkInDate ||
    !checkOutDate ||
    Number.isNaN(checkInDate.getTime()) ||
    Number.isNaN(checkOutDate.getTime()) ||
    now < checkInDate ||
    now >= checkOutDate
  ) {
    throw new Error("Check-in is available during your reservation dates.");
  }

  const claim = await runDatabaseTransaction(bookingRef, (current) => {
    if (
      !current ||
      current.userId !== user.uid ||
      current.status !== "Confirmed"
    ) {
      return;
    }

    return {
      ...current,
      status: "Check-in Processing",
      checkInProcessingAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  });

  if (!claim.committed) {
    throw new Error("This reservation cannot be checked in.");
  }

  const roomTypeId = normalizeRoomTypeId(
    resolveRoomTypeId(reservation.roomId ?? ""),
  );
  let assignedRoomId: string | null = null;
  try {
    const physicalRooms = await getDocs(collection(firestore, "rooms"));
    const candidates = physicalRooms.docs.filter((physicalRoom) => {
      const room = physicalRoom.data() as PhysicalRoom;
      return (
        isPhysicalRoomDocumentId(physicalRoom.id, room.roomTypeId) &&
        normalizeRoomTypeId(room.roomTypeId) === roomTypeId &&
        room.status === "Available"
      );
    });

    for (const candidate of candidates) {
      const physicalRoomRef = doc(firestore, "rooms", candidate.id);
      const assigned = await runFirestoreTransaction(
        firestore,
        async (transaction) => {
          const snapshot = await transaction.get(physicalRoomRef);
          const physicalRoom = snapshot.data() as PhysicalRoom | undefined;
          if (
            !physicalRoom ||
            normalizeRoomTypeId(physicalRoom.roomTypeId) !== roomTypeId ||
            physicalRoom.status !== "Available"
          ) {
            return false;
          }

          transaction.update(physicalRoomRef, {
            status: "Occupied",
            reservationId: reservation.reservationId ?? reservation.id,
            guestId: user.uid,
            checkedInAt: now.toISOString(),
            updatedAt: now.toISOString(),
          });
          return true;
        },
      );

      if (assigned) {
        assignedRoomId = candidate.id;
        break;
      }
    }
    if (!assignedRoomId) {
      throw new Error("No physical rooms of this type are currently available.");
    }

    await update(bookingRef, {
      status: "Checked In",
      physicalRoomId: assignedRoomId,
      checkedInAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  } catch (error) {
    if (assignedRoomId) {
      const physicalRoomRef = doc(firestore, "rooms", assignedRoomId);
      await runFirestoreTransaction(firestore, async (transaction) => {
        const snapshot = await transaction.get(physicalRoomRef);
        const room = snapshot.data() as PhysicalRoom | undefined;
        if (
          room?.status === "Occupied" &&
          room.reservationId === (reservation.reservationId ?? reservation.id)
        ) {
          transaction.update(physicalRoomRef, {
            status: "Available",
            reservationId: deleteField(),
            guestId: deleteField(),
            checkedInAt: deleteField(),
            updatedAt: new Date().toISOString(),
          });
        }
      });
    }
    await runDatabaseTransaction(bookingRef, (current) => {
      if (
        !current ||
        current.userId !== user.uid ||
        current.status !== "Check-in Processing"
      ) {
        return;
      }
      return {
        ...current,
        status: "Confirmed",
        checkInProcessingAt: null,
        updatedAt: new Date().toISOString(),
      };
    });
    throw error;
  }
}

export async function redeemLoyaltyVoucher(voucherId: string) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("You must be signed in to redeem a voucher.");

  const voucher = loyaltyVouchers.find((item) => item.id === voucherId);
  if (!voucher) throw new Error("That voucher is no longer available.");

  const profileRef = ref(database, `users/${user.uid}`);
  const result = await runDatabaseTransaction(profileRef, (current) => {
    if (!current) return;

    const points = Number(current.loyaltyPoints ?? 0);
    const membership = getMembershipForPoints(points);
    const tierIndex = membershipLevels.findIndex(
      (level) => level.name === membership.name,
    );
    const minimumTierIndex = membershipLevels.findIndex(
      (level) => level.name === voucher.minimumTier,
    );
    const vouchers = Array.isArray(current.vouchers)
      ? current.vouchers
      : Object.values(current.vouchers ?? {});

    if (
      points < voucher.cost ||
      tierIndex < minimumTierIndex ||
      vouchers.some((item: UserVoucher) => item.id === voucher.id)
    ) {
      return;
    }

    return {
      ...current,
      loyaltyPoints: points - voucher.cost,
      vouchers: [
        ...vouchers,
        {
          id: voucher.id,
          name: voucher.name,
          description: voucher.description,
          redeemedAt: new Date().toISOString(),
        },
      ],
    };
  });

  if (!result.committed) {
    throw new Error(
      "You need enough points and the required membership tier to redeem this voucher.",
    );
  }
}

export async function updateReservation(
  reservationId: string,
  changes: Partial<Omit<FirebaseReservation, "id" | "userId">>,
) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("You must be signed in to update a reservation.");

  const bookingRef = ref(database, `bookings/${reservationId}`);
  const snapshot = await get(bookingRef);
  if (!snapshot.exists() || snapshot.val()?.userId !== user.uid) {
    throw new Error("Reservation not found.");
  }

  await update(bookingRef, { ...changes, updatedAt: new Date().toISOString() });
}

export async function cancelReservation(
  reservation: FirebaseReservation,
  reason: string,
) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("You must be signed in to cancel a reservation.");

  const bookingRef = ref(database, `bookings/${reservation.id}`);
  const snapshot = await get(bookingRef);
  const current = snapshot.val();
  if (!snapshot.exists() || current?.userId !== user.uid) {
    throw new Error("Reservation not found.");
  }
  if (current.status === "Cancelled") return;
  if (current.status === "Completed" || current.status === "Checked In") {
    throw new Error("Checked-in or completed reservations cannot be cancelled.");
  }

  const cancelledAt = new Date().toISOString();
  const cancellation = await runDatabaseTransaction(bookingRef, (booking) => {
    if (
      !booking ||
      booking.userId !== user.uid ||
      (booking.status !== "Confirmed" && booking.status !== "Pending")
    ) {
      return;
    }

    return {
      ...booking,
      status: "Cancelled",
      cancellationReason: reason,
      cancelledAt,
      updatedAt: cancelledAt,
    };
  });
  if (!cancellation.committed) {
    throw new Error("This reservation can no longer be cancelled.");
  }

}

export function subscribeToRoomInventory(
  callback: (inventory: Record<string, RoomInventory>) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    collection(firestore, "rooms"),
    (snapshot) => {
      try {
        const inventory: Record<string, RoomInventory> = {};

        for (const physicalRoomSnapshot of snapshot.docs) {
          const physicalRoom = physicalRoomSnapshot.data() as PhysicalRoom;
          if (
            !isPhysicalRoomDocumentId(
              physicalRoomSnapshot.id,
              physicalRoom.roomTypeId,
            )
          ) {
            continue;
          }
          const normalizedRoomTypeId = normalizeRoomTypeId(
            physicalRoom.roomTypeId,
          );
          if (!normalizedRoomTypeId) continue;
          const roomTypeId =
            typeof physicalRoom.roomTypeId === "string"
              ? physicalRoom.roomTypeId.trim()
              : normalizedRoomTypeId;
          const typeInventory = (inventory[normalizedRoomTypeId] ??= {
            roomTypeId,
            totalRooms: 0,
            occupiedRooms: 0,
            cleaningRooms: 0,
            availableRooms: 0,
          });
          typeInventory.totalRooms += 1;
          if (physicalRoom.status === "Available") {
            typeInventory.availableRooms += 1;
          } else if (physicalRoom.status === "Occupied") {
            typeInventory.occupiedRooms += 1;
          } else if (physicalRoom.status === "Cleaning") {
            typeInventory.cleaningRooms += 1;
          }
        }

        callback(inventory);
      } catch (error) {
        onError?.(error);
      }
    },
    (error) => {
      onError?.(error);
    },
  );
}

function normalizeRoomTypeId(value: unknown): string {
  let roomTypeId: string;
  if (typeof value === "string" || typeof value === "number") {
    roomTypeId = String(value);
  } else if (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string"
  ) {
    roomTypeId = value.id;
  } else {
    return "";
  }
  return roomTypeId.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

function isPhysicalRoomDocumentId(
  documentId: string,
  roomTypeId: unknown,
): boolean {
  const rawRoomTypeId =
    typeof roomTypeId === "string" || typeof roomTypeId === "number"
      ? String(roomTypeId).trim()
      : typeof roomTypeId === "object" &&
          roomTypeId !== null &&
          "id" in roomTypeId &&
          typeof roomTypeId.id === "string"
        ? roomTypeId.id.trim()
        : "";
  const prefix = `physical-${rawRoomTypeId}-`;
  return Boolean(rawRoomTypeId) && documentId.startsWith(prefix) &&
    documentId.length > prefix.length;
}

async function hasAvailablePhysicalRoom(roomTypeId: string) {
  const normalizedTypeId = normalizeRoomTypeId(roomTypeId);
  if (!normalizedTypeId) return false;

  const physicalRooms = await getDocs(collection(firestore, "rooms"));
  return physicalRooms.docs.some((physicalRoom) => {
    const room = physicalRoom.data() as PhysicalRoom;
    return (
      isPhysicalRoomDocumentId(physicalRoom.id, room.roomTypeId) &&
      normalizeRoomTypeId(room.roomTypeId) === normalizedTypeId &&
      room.status === "Available"
    );
  });
}

export function subscribeToReservationsForCurrentUser(
  callback: (reservations: FirebaseReservation[]) => void,
): Unsubscribe | undefined {
  const user = firebaseAuth.currentUser;
  if (!user) return undefined;

  const reservationsQuery = query(
    ref(database, "bookings"),
    orderByChild("userId"),
    equalTo(user.uid),
  );

  return onValue(reservationsQuery, (snapshot) => {
    const reservations = snapshot.val() ?? {};
    callback(
      Object.entries(reservations).map(([id, reservation]) => ({
        id,
        ...(reservation as Omit<FirebaseReservation, "id">),
      })),
    );
  });
}

export function subscribeToHotels(
  callback: (hotels: FirebaseHotel[]) => void,
): Unsubscribe {
  return onValue(ref(database, "hotels"), (snapshot) => {
    const hotels = snapshot.val() ?? {};
    callback(
      Object.entries(hotels).map(([id, hotel]) => ({
        id,
        ...(hotel as Omit<FirebaseHotel, "id">),
      })),
    );
  });
}

export function getFirebaseStatus() {
  return {
    configured: isFirebaseConfigured,
    signedIn: Boolean(firebaseAuth.currentUser),
    userId: firebaseAuth.currentUser?.uid ?? null,
  };
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(firebaseAuth, callback);
}

export async function fetchReservationsForCurrentUser(): Promise<
  FirebaseReservation[] | null
> {
  if (!firebaseAuth.currentUser) {
    return null;
  }

  try {
    const reservationsQuery = query(
      ref(database, "bookings"),
      orderByChild("userId"),
      equalTo(firebaseAuth.currentUser.uid),
    );

    const snapshot = await get(reservationsQuery);
    const reservations = snapshot.val() ?? {};

    return Object.entries(reservations).map(([id, reservation]) => ({
      id,
      ...(reservation as Omit<FirebaseReservation, "id">),
    }));
  } catch (error) {
    console.warn(
      "Unable to fetch guest reservations from Realtime Database",
      error,
    );
    return null;
  }
}
