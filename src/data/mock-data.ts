export type ReservationStatus = "Confirmed" | "Completed";

export const profileData = {
  name: "Alex Morgan",
  email: "alex.morgan@example.com",
  avatar:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
  loyaltyPoints: 12450,
  loyaltyGoal: 15000,
  loyaltyGoalLabel: "Platinum",
  stays: 9,
  nights: 22,
  destinations: 3,
  preferences: {
    preferredRoom: "Ocean View",
    bedPreference: "King Bed",
    smoking: "Non-Smoking",
    notifications: "Enabled",
    language: "English",
    currency: "USD",
  },
};

export const upcomingReservation = {
  reservationId: "STY-2026-0815",
  roomId: "premier-ocean-suite",
  roomName: "Premier Ocean Suite",
  roomImage:
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  checkIn: "August 15, 2026",
  checkOut: "August 19, 2026",
  nights: 4,
  total: 2356,
  status: "Confirmed" as ReservationStatus,
};

export const pastStays = [
  {
    roomId: "deluxe-king-room",
    roomName: "Deluxe King Room",
    roomImage:
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80",
    date: "July 2026",
    price: 289,
    status: "Completed" as ReservationStatus,
  },
  {
    roomId: "junior-suite",
    roomName: "Junior Suite",
    roomImage:
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=900&q=80",
    date: "May 2026",
    price: 429,
    status: "Completed" as ReservationStatus,
  },
];
