import { onAuthStateChanged, updateProfile, type User } from "firebase/auth";
import {
  equalTo,
  get,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  runTransaction,
  set,
  update,
  type Unsubscribe,
} from "firebase/database";

import { auth, database } from "@/firebase/config";

export const firebaseAuth = auth;
export const firebaseDb = database;
export const isFirebaseConfigured = true;

export type FirebaseReservation = {
  id: string;
  userId?: string;
  roomId?: string;
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
  roomId: string;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  updatedAt?: string;
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

  const inventoryRef = ref(database, `roomInventory/${reservation.roomId}`);
  const inventoryClaim = await runTransaction(inventoryRef, (current) => {
    const totalRooms = Number(
      current?.totalRooms ?? reservation.availableRooms ?? 0,
    );
    const occupiedRooms = Number(
      current?.occupiedRooms ?? Math.max(0, totalRooms - Number(reservation.availableRooms ?? 0)),
    );
    const availableRooms = Math.max(
      0,
      Number(current?.availableRooms ?? totalRooms - occupiedRooms),
    );

    if (availableRooms <= 0) return;

    return {
      roomId: reservation.roomId,
      totalRooms,
      occupiedRooms: occupiedRooms + 1,
      availableRooms: availableRooms - 1,
      updatedAt: new Date().toISOString(),
    };
  });

  if (!inventoryClaim.committed) {
    throw new Error("This room is no longer available.");
  }

  const reservationRef = push(ref(database, "bookings"));
  const reservationId = reservation.reservationId ?? reservationRef.key;
  const confirmedAt = new Date().toISOString();
  try {
    await set(reservationRef, {
      ...reservation,
      userId: user.uid,
      reservationId,
      createdAt: confirmedAt,
      confirmedAt,
    });
    return reservationId;
  } catch (error) {
    await runTransaction(inventoryRef, (current) => ({
      ...(current ?? {}),
      roomId: reservation.roomId,
      totalRooms: Number(current?.totalRooms ?? reservation.availableRooms ?? 0),
      occupiedRooms: Math.max(0, Number(current?.occupiedRooms ?? 1) - 1),
      availableRooms: Number(current?.availableRooms ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    }));
    throw error;
  }
}

export async function awardCompletedBookingPoints(
  booking: FirebaseReservation,
) {
  const user = firebaseAuth.currentUser;
  if (!user || booking.userId !== user.uid || booking.status !== "Completed") {
    return;
  }

  const bookingRef = ref(database, `bookings/${booking.id}`);
  const claim = await runTransaction(bookingRef, (current) => {
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
  await runTransaction(profileRef, (current) => {
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

  const bookingRef = ref(database, `bookings/${reservation.id}`);
  const claim = await runTransaction(bookingRef, (current) => {
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
    if (reservation.roomId) {
      const inventoryRef = ref(
        database,
        `roomInventory/${reservation.roomId}`,
      );
      await runTransaction(inventoryRef, (inventory) => {
        if (!inventory) return;
        const totalRooms = Number(
          inventory.totalRooms ?? reservation.availableRooms ?? 0,
        );
        const occupiedRooms = Math.max(
          0,
          Number(inventory.occupiedRooms ?? 1) - 1,
        );
        return {
          ...inventory,
          roomId: reservation.roomId,
          totalRooms,
          occupiedRooms,
          availableRooms: Math.max(0, totalRooms - occupiedRooms),
          updatedAt: new Date().toISOString(),
        };
      });
    }
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

  const result = await runTransaction(bookingRef, (current) => {
    if (
      !current ||
      current.userId !== user.uid ||
      current.status !== "Confirmed"
    ) {
      return;
    }

    return {
      ...current,
      status: "Checked In",
      checkedInAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  });

  if (!result.committed) {
    throw new Error("This reservation cannot be checked in.");
  }
}

export async function redeemLoyaltyVoucher(voucherId: string) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("You must be signed in to redeem a voucher.");

  const voucher = loyaltyVouchers.find((item) => item.id === voucherId);
  if (!voucher) throw new Error("That voucher is no longer available.");

  const profileRef = ref(database, `users/${user.uid}`);
  const result = await runTransaction(profileRef, (current) => {
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
  const cancellation = await runTransaction(bookingRef, (booking) => {
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

  const inventoryRef = ref(database, `roomInventory/${reservation.roomId}`);
  await runTransaction(inventoryRef, (inventory) => ({
    ...(inventory ?? {}),
    roomId: reservation.roomId,
    totalRooms: Number(inventory?.totalRooms ?? reservation.availableRooms ?? 0),
    occupiedRooms: Math.max(0, Number(inventory?.occupiedRooms ?? 1) - 1),
    availableRooms: Number(inventory?.availableRooms ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  }));
}

export function subscribeToRoomInventory(
  roomIds: string[],
  callback: (inventory: Record<string, RoomInventory>) => void,
): Unsubscribe {
  const inventory: Record<string, RoomInventory> = {};
  const unsubscribers = roomIds.map((roomId) =>
    onValue(ref(database, `roomInventory/${roomId}`), (snapshot) => {
      const value = snapshot.val();
      if (value) {
        inventory[roomId] = {
          roomId,
          totalRooms: Number(value.totalRooms ?? value.availableRooms ?? 0),
          occupiedRooms: Number(value.occupiedRooms ?? 0),
          availableRooms: Number(
            value.availableRooms ??
              Number(value.totalRooms ?? 0) - Number(value.occupiedRooms ?? 0),
          ),
          updatedAt: value.updatedAt,
        };
      }
      callback({ ...inventory });
    }),
  );

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

export async function initializeRoomInventory(
  roomId: string,
  initialAvailableRooms: number,
) {
  const inventoryRef = ref(database, `roomInventory/${roomId}`);
  await runTransaction(inventoryRef, (current) => {
    if (current) return;
    return {
      roomId,
      totalRooms: initialAvailableRooms,
      occupiedRooms: 0,
      availableRooms: initialAvailableRooms,
      updatedAt: new Date().toISOString(),
    };
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
