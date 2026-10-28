import { onAuthStateChanged, updateProfile, type User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query as firestoreQuery,
  runTransaction as runFirestoreTransaction,
  serverTimestamp,
  updateDoc,
  where,
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

import { getRoomById, resolveRoomTypeId } from "@/data/rooms";
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
  guestUid?: string;
  roomId?: string | number;
  roomTypeId?: string | number;
  roomTypeName?: string;
  roomType?: string;
  assignedRoomId?: string;
  assignedRoomNumber?: string;
  physicalRoomId?: string;
  checkInProcessingAt?: string;
  location?: string;
  destination?: string;
  roomName?: string;
  roomImage?: string;
  reservationId?: string;
  checkIn?: string;
  checkin?: string;
  checkInTime?: string;
  checkinTime?: string;
  checkoutTime?: string;
  contactNumber?: string;
  leadGuest?: string;
  guestName?: string;
  guestEmail?: string;
  checkOut?: string;
  checkout?: string;
  total?: number;
  hotelId?: string;
  hotelName?: string;
  guests?: number;
  extras?: string[] | { breakfast?: boolean; spa?: boolean };
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
  guestCheckInRequestedAt?: string;
  createdAtMs?: number;
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
  bookings?: PhysicalRoomBooking[];
};

type PhysicalRoomBooking = {
  reservationId?: string;
  checkin?: string;
  checkout?: string;
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
  const resolvedRoomTypeId = Number(
    resolveRoomTypeId(String(reservation.roomId ?? "")),
  );
  const room = getRoomById(String(resolvedRoomTypeId));
  if (
    !Number.isInteger(resolvedRoomTypeId) ||
    resolvedRoomTypeId < 1 ||
    resolvedRoomTypeId > 20 ||
    !room
  ) {
    throw new Error("The selected room type is not available in the catalog.");
  }
  const checkin = reservation.checkIn ?? reservation.checkin;
  const checkout = reservation.checkOut ?? reservation.checkout;
  if (!checkin || !checkout) {
    throw new Error("Check-in and check-out dates are required.");
  }
  const requestedStart = new Date(`${checkin}T00:00:00`).getTime();
  const requestedEnd = new Date(`${checkout}T00:00:00`).getTime();
  if (
    !Number.isFinite(requestedStart) ||
    !Number.isFinite(requestedEnd) ||
    requestedEnd <= requestedStart
  ) {
    throw new Error("Check-out must be after check-in.");
  }

  const physicalRoomQuery = firestoreQuery(
    collection(firestore, "rooms"),
    where("roomTypeId", "==", resolvedRoomTypeId),
  );
  const matchingRooms = await getDocs(physicalRoomQuery);
  const physicalRoomRefs = matchingRooms.docs
    .filter((snapshot) =>
      isPhysicalRoomDocumentId(snapshot.id, resolvedRoomTypeId),
    )
    .map((snapshot) => snapshot.ref);
  if (physicalRoomRefs.length === 0) {
    throw new Error("Room inventory is not initialized. Please contact hotel staff.");
  }

  const reservationRef = doc(collection(firestore, "reservations"));
  const reference = `SL-${Math.floor(100000 + Math.random() * 899999)}`;
  const guestName =
    reservation.leadGuest?.trim() || user.displayName || "StayLink Guest";
  const extras = {
    breakfast:
      Array.isArray(reservation.extras) &&
      reservation.extras.some((item) => item.toLowerCase().includes("breakfast")),
    spa:
      Array.isArray(reservation.extras) &&
      reservation.extras.some((item) => item.toLowerCase().includes("spa")),
  };
  const extrasPrice = Number(reservation.extrasPrice ?? 0);
  const roomPrice = Number(reservation.roomPrice ?? 0);
  const total = Number(reservation.total ?? reservation.totalPrice ?? 0);
  const subtotal = Number(reservation.subtotal ?? roomPrice + extrasPrice);
  const taxes = Number(reservation.taxes ?? Math.max(0, total - subtotal));
  const checkinTime = toTwentyFourHourTime(reservation.checkInTime);

  await runFirestoreTransaction(firestore, async (transaction) => {
    const physicalRoomSnapshots = await Promise.all(
      physicalRoomRefs.map((roomRef) => transaction.get(roomRef)),
    );
    const availableRooms = physicalRoomSnapshots.filter((snapshot) => {
      if (!snapshot.exists()) return false;
      const physicalRoom = snapshot.data() as PhysicalRoom;
      if ((physicalRoom.status || "Available") !== "Available") return false;
      return !(physicalRoom.bookings ?? []).some((booking) => {
        const bookingStart = new Date(`${booking.checkin}T00:00:00`).getTime();
        const bookingEnd = new Date(`${booking.checkout}T00:00:00`).getTime();
        return (
          Number.isFinite(bookingStart) &&
          Number.isFinite(bookingEnd) &&
          requestedStart < bookingEnd &&
          requestedEnd > bookingStart
        );
      });
    });
    const assignedRoom = availableRooms[0];
    if (!assignedRoom) {
      throw new Error("No physical room is available for these dates.");
    }

    const physicalRoom = assignedRoom.data() as PhysicalRoom;
    transaction.update(assignedRoom.ref, {
      bookings: [
        ...(physicalRoom.bookings ?? []),
        {
          reservationId: reservationRef.id,
          checkin,
          checkout,
        },
      ],
      updatedAt: serverTimestamp(),
    });
    transaction.set(reservationRef, {
      reference,
      reservationId: reservationRef.id,
      roomId: resolvedRoomTypeId,
      roomTypeId: resolvedRoomTypeId,
      roomTypeName: room.name,
      roomType: room.type,
      assignedRoomId: assignedRoom.id,
      assignedRoomNumber: physicalRoom.roomNumber ?? "",
      roomName: reservation.roomName ?? room.name,
      roomImage: reservation.roomImage ?? room.image,
      destination: reservation.destination ?? room.destination,
      location: reservation.location ?? room.view,
      guestUid: user.uid,
      userId: user.uid,
      guestName,
      leadGuest: guestName,
      guestEmail: user.email ?? "",
      contactNumber: reservation.contactNumber ?? "",
      checkin,
      checkIn: checkin,
      checkout,
      checkOut: checkout,
      checkinTime,
      nights: Number(reservation.nights ?? 1),
      guests: Number(reservation.guests ?? 1),
      extras,
      roomPrice,
      extrasPrice,
      subtotal,
      taxes,
      totalPrice: total,
      total,
      status: "pending",
      createdAtMs: Date.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      loyaltyPointsAwarded: false,
    });
  });
  return reservationRef.id;
}

export async function awardCompletedBookingPoints(
  reservation: FirebaseReservation,
) {
  const user = firebaseAuth.currentUser;
  if (
    !user ||
    (reservation.guestUid ?? reservation.userId) !== user.uid ||
    reservation.status !== "Completed"
  ) {
    return;
  }

  const reservationRef = doc(firestore, "reservations", reservation.id);
  const profileRef = doc(firestore, "users", user.uid);
  const result = await runFirestoreTransaction(firestore, async (transaction) => {
    const [reservationSnapshot, profileSnapshot] = await Promise.all([
      transaction.get(reservationRef),
      transaction.get(profileRef),
    ]);
    const currentReservation = reservationSnapshot.data();
    const currentProfile = profileSnapshot.data() ?? {};
    if (
      !reservationSnapshot.exists() ||
      !currentReservation ||
      (currentReservation.guestUid ?? currentReservation.userId) !== user.uid ||
      normalizeReservationStatus(currentReservation.status) !== "checked-out"
    ) {
      return null;
    }

    let points = Number(currentProfile.loyaltyPoints ?? 0);
    if (!currentReservation.loyaltyPointsAwarded) {
      const membership = getMembershipForPoints(points);
      const totalSpent = Number(
        currentReservation.totalPrice ??
          currentReservation.total ??
          currentReservation.subtotal ??
          0,
      );
      const earned = Math.floor(
        (Math.max(0, totalSpent) / 100) * membership.pointsPer100,
      );
      points += earned;
      const nextMembership = getMembershipForPoints(points);
      const now = serverTimestamp();
      transaction.update(reservationRef, {
        loyaltyPointsAwarded: true,
        loyaltyPointsEarned: earned,
        loyaltyLockedAt: now,
        updatedAt: now,
      });
      transaction.set(
        profileRef,
        {
          loyaltyPoints: points,
          membership: nextMembership.name,
          updatedAt: now,
        },
        { merge: true },
      );
    }

    const membership = getMembershipForPoints(points).name;
    return { points, membership };
  });

  if (result) {
    await update(ref(database, `users/${user.uid}`), {
      loyaltyPoints: result.points,
      membership: result.membership,
      membershipStatus: result.membership,
    });
  }
}

export async function checkInReservation(reservation: FirebaseReservation) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("You must be signed in to check in.");
  const now = new Date();
  const checkin = reservation.checkIn ?? reservation.checkin;
  const checkout = reservation.checkOut ?? reservation.checkout;
  const checkInDate = checkin ? new Date(`${checkin}T00:00:00`) : null;
  const checkOutDate = checkout ? new Date(`${checkout}T12:00:00`) : null;
  const checkInTime = reservation.checkInTime?.match(
    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
  );
  if (checkInDate && checkInTime) {
    let hours = Number(checkInTime[1]) % 12;
    if (checkInTime[3].toUpperCase() === "PM") hours += 12;
    checkInDate.setHours(hours, Number(checkInTime[2]), 0, 0);
  } else if (checkInDate) {
    const time24 = reservation.checkInTime?.match(/^(\d{1,2}):(\d{2})$/);
    if (time24) {
      checkInDate.setHours(Number(time24[1]), Number(time24[2]), 0, 0);
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

  const reservationRef = doc(firestore, "reservations", reservation.id);
  await runFirestoreTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(reservationRef);
    const current = snapshot.data() as FirebaseReservation | undefined;
    if (
      !snapshot.exists() ||
      !current ||
      (current.guestUid ?? current.userId) !== user.uid ||
      normalizeReservationStatus(current.status) !== "confirmed"
    ) {
      throw new Error("Only a confirmed reservation can request check-in.");
    }

    transaction.update(reservationRef, {
      guestCheckInRequestedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
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

  const reservationRef = doc(firestore, "reservations", reservationId);
  const snapshot = await getDoc(reservationRef);
  const current = snapshot.data();
  if (!snapshot.exists() || (current?.guestUid ?? current?.userId) !== user.uid) {
    throw new Error("Reservation not found.");
  }

  await updateDoc(reservationRef, {
    ...changes,
    updatedAt: serverTimestamp(),
  });
}

export async function cancelReservation(
  reservation: FirebaseReservation,
  reason: string,
) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("You must be signed in to cancel a reservation.");

  const reservationRef = doc(firestore, "reservations", reservation.id);
  await runFirestoreTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(reservationRef);
    const current = snapshot.data() as FirebaseReservation | undefined;
    if (
      !snapshot.exists() ||
      !current ||
      (current.guestUid ?? current.userId) !== user.uid
    ) {
      throw new Error("Reservation not found.");
    }
    const status = normalizeReservationStatus(current.status);
    if (status === "cancelled") return;
    if (status !== "pending" && status !== "confirmed") {
      throw new Error("This reservation can no longer be cancelled.");
    }

    const assignedRoomRef = current.assignedRoomId
      ? doc(firestore, "rooms", current.assignedRoomId)
      : null;
    const assignedRoomSnapshot = assignedRoomRef
      ? await transaction.get(assignedRoomRef)
      : null;
    const assignedRoom = assignedRoomSnapshot?.data() as
      | PhysicalRoom
      | undefined;
    const updatedAt = serverTimestamp();
    transaction.update(reservationRef, {
      status: "cancelled",
      cancellationReason: reason,
      cancelledAt: updatedAt,
      updatedAt,
    });
    if (assignedRoomRef && assignedRoomSnapshot?.exists() && assignedRoom) {
      transaction.update(assignedRoomRef, {
        bookings: (assignedRoom.bookings ?? []).filter(
          (booking) => booking.reservationId !== reservationRef.id,
        ),
        updatedAt,
      });
    }
  });
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

export function subscribeToReservationsForCurrentUser(
  callback: (reservations: FirebaseReservation[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe | undefined {
  const user = firebaseAuth.currentUser;
  if (!user) return undefined;

  const reservationsQuery = firestoreQuery(
    collection(firestore, "reservations"),
    where("guestUid", "==", user.uid),
  );

  return onSnapshot(
    reservationsQuery,
    (snapshot) => {
      callback(
        snapshot.docs
          .map((reservation) =>
            normalizeFirestoreReservation(reservation.id, reservation.data()),
          )
          .sort((left, right) => (right.createdAtMs ?? 0) - (left.createdAtMs ?? 0)),
      );
    },
    (error) => onError?.(error),
  );
}

function normalizeFirestoreReservation(
  id: string,
  data: Record<string, unknown>,
): FirebaseReservation {
  const createdAt = dateValueToString(data.createdAt);
  const updatedAt = dateValueToString(data.updatedAt);
  const checkIn = dateValueToString(data.checkin ?? data.checkIn);
  const checkOut = dateValueToString(data.checkout ?? data.checkOut);
  const status = normalizeReservationStatus(data.status);
  const extras = data.extras;
  const normalizedExtras = Array.isArray(extras)
    ? extras.filter((item): item is string => typeof item === "string")
    : extras && typeof extras === "object"
      ? [
          ...((extras as { breakfast?: boolean }).breakfast
            ? ["Breakfast"]
            : []),
          ...((extras as { spa?: boolean }).spa ? ["Wellness spa"] : []),
        ]
      : [];
  const createdAtMs =
    typeof data.createdAtMs === "number"
      ? data.createdAtMs
      : createdAt
        ? new Date(createdAt).getTime()
        : undefined;

  return {
    ...(data as Omit<FirebaseReservation, "id">),
    id,
    reservationId: id,
    guestUid: stringValue(data.guestUid ?? data.userId),
    userId: stringValue(data.userId ?? data.guestUid),
    roomId: (data.roomTypeId ?? data.roomId) as string | number | undefined,
    roomTypeId: data.roomTypeId as string | number | undefined,
    roomTypeName: stringValue(data.roomTypeName),
    roomName: stringValue(data.roomName),
    guestName: stringValue(data.guestName ?? data.leadGuest),
    leadGuest: stringValue(data.leadGuest ?? data.guestName),
    guestEmail: stringValue(data.guestEmail),
    checkIn,
    checkin: checkIn,
    checkOut,
    checkout: checkOut,
    checkInTime: toTwelveHourTime(data.checkinTime ?? data.checkInTime),
    status: mobileReservationStatus(status),
    extras: normalizedExtras,
    createdAt,
    updatedAt,
    confirmedAt: dateValueToString(data.confirmedAt),
    checkedInAt: dateValueToString(data.checkedInAt),
    completedAt: dateValueToString(data.checkedOutAt ?? data.completedAt),
    cancelledAt: dateValueToString(data.cancelledAt),
    guestCheckInRequestedAt: dateValueToString(data.guestCheckInRequestedAt),
    createdAtMs,
  };
}

function dateValueToString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    const date = value.toDate();
    return date instanceof Date ? date.toISOString() : undefined;
  }
  return undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function normalizeReservationStatus(value: unknown): string {
  return typeof value === "string"
    ? value.trim().toLocaleLowerCase().replace(/[\s_]+/g, "-")
    : "";
}

function mobileReservationStatus(status: string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "rejected":
      return "Rejected";
    case "checked-in":
      return "Checked In";
    case "checked-out":
    case "completed":
      return "Completed";
    case "cancelled":
    case "canceled":
      return "Cancelled";
    default:
      return status;
  }
}

function toTwentyFourHourTime(value?: string): string {
  if (!value) return "15:00";
  const normalized = value.trim();
  const twelveHour = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!twelveHour) return normalized;
  let hours = Number(twelveHour[1]) % 12;
  if (twelveHour[3].toUpperCase() === "PM") hours += 12;
  return `${String(hours).padStart(2, "0")}:${twelveHour[2]}`;
}

function toTwelveHourTime(value: unknown): string {
  if (typeof value !== "string") return "Time not set";
  const normalized = value.trim();
  const twentyFourHour = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!twentyFourHour) return normalized;
  const hours = Number(twentyFourHour[1]);
  const period = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${twentyFourHour[2]} ${period}`;
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
  const user = firebaseAuth.currentUser;
  if (!user) return null;

  const reservationsQuery = firestoreQuery(
    collection(firestore, "reservations"),
    where("guestUid", "==", user.uid),
  );
  const snapshot = await getDocs(reservationsQuery);
  return snapshot.docs
    .map((reservation) =>
      normalizeFirestoreReservation(reservation.id, reservation.data()),
    )
    .sort((left, right) => (right.createdAtMs ?? 0) - (left.createdAtMs ?? 0));
}
