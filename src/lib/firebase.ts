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
  updatedAt?: string;
  availableRooms?: number;
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
  preferences: UserPreferences;
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
  { name: "Non-Member", minimum: 0, discount: 0 },
  { name: "Bronze", minimum: 100, discount: 2 },
  { name: "Silver", minimum: 200, discount: 4 },
  { name: "Gold", minimum: 400, discount: 6 },
  { name: "Platinum", minimum: 800, discount: 8 },
  { name: "Diamond", minimum: 1600, discount: 10 },
] as const;

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
    membership: "Non-Member",
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
    const availableRooms =
      typeof current?.availableRooms === "number"
        ? current.availableRooms
        : Number(reservation.availableRooms ?? 0);

    if (availableRooms <= 0) return;

    return {
      availableRooms: availableRooms - 1,
      updatedAt: new Date().toISOString(),
    };
  });

  if (!inventoryClaim.committed) {
    throw new Error("This room is no longer available.");
  }

  const reservationRef = push(ref(database, "bookings"));
  const reservationId = reservation.reservationId ?? reservationRef.key;
  try {
    await set(reservationRef, {
      ...reservation,
      userId: user.uid,
      reservationId,
      createdAt: new Date().toISOString(),
    });
    return reservationId;
  } catch (error) {
    await runTransaction(inventoryRef, (current) => ({
      ...(current ?? {}),
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

  const earnedPoints = Number(booking.nights ?? 0) * 10;
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
  if (current.status === "Completed") {
    throw new Error("Completed reservations cannot be cancelled.");
  }

  await update(bookingRef, {
    status: "Cancelled",
    cancellationReason: reason,
    cancelledAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const inventoryRef = ref(database, `roomInventory/${reservation.roomId}`);
  await runTransaction(inventoryRef, (inventory) => ({
    ...(inventory ?? {}),
    availableRooms: Number(inventory?.availableRooms ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  }));
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
