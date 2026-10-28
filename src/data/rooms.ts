export const roomTypes = [
  "All",
  "Standard",
  "Superior",
  "Deluxe",
  "Suite",
  "Presidential",
] as const;

export type RoomType = (typeof roomTypes)[number];

export type Room = {
  id: string;
  legacyId?: string;
  name: string;
  type: Exclude<RoomType, "All">;
  price: number;
  size: number;
  view: string;
  rating: number;
  reviews: number;
  bed: string;
  description: string;
  image: string;
  availableRooms: number | null;
  inventoryError?: boolean;
  destination: string;
};

export const rooms: Room[] = [
  {
    id: "1",
    legacyId: "deluxe-king-room",
    name: "Deluxe King Room",
    type: "Deluxe",
    price: 289,
    size: 42,
    view: "City View",
    rating: 4.8,
    reviews: 142,
    bed: "1 King Bed",
    description:
      "A refined city retreat with warm textures, a quiet lounge corner, and a restful king bed.",
    image:
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80",
    availableRooms: null,
    destination: "Manila",
  },
  {
    id: "2",
    legacyId: "premier-ocean-suite",
    name: "Premier Ocean Suite",
    type: "Suite",
    price: 589,
    size: 86,
    view: "Ocean View",
    rating: 4.9,
    reviews: 96,
    bed: "1 King Bed + Sitting Area",
    description:
      "Expansive oceanfront comfort with a serene ensuite and elevated coastal living spaces.",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    availableRooms: null,
    destination: "Boracay",
  },
  {
    id: "3",
    legacyId: "executive-twin",
    name: "Executive Twin",
    type: "Superior",
    price: 219,
    size: 35,
    view: "Garden View",
    rating: 4.6,
    reviews: 118,
    bed: "2 Twin Beds",
    description:
      "Bright, grounded hospitality for work trips or relaxed city escapes with lush garden outlooks.",
    image:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80",
    availableRooms: null,
    destination: "Cebu",
  },
  {
    id: "4",
    legacyId: "presidential-suite",
    name: "Presidential Suite",
    type: "Presidential",
    price: 1250,
    size: 180,
    view: "Panoramic View",
    rating: 5.0,
    reviews: 44,
    bed: "1 King Bed + Grand Living Room",
    description:
      "The ultimate luxurious suite with panoramic skyline views, grand entertaining spaces, and bespoke service.",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    availableRooms: null,
    destination: "Manila",
  },
  {
    id: "5",
    legacyId: "classic-room",
    name: "Classic Room",
    type: "Standard",
    price: 159,
    size: 28,
    view: "Courtyard View",
    rating: 4.4,
    reviews: 203,
    bed: "1 Queen Bed",
    description:
      "A charming retreat with comforting finishes and a tranquil courtyard outlook for effortless rest.",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    availableRooms: null,
    destination: "Baguio",
  },
  {
    id: "6",
    legacyId: "junior-suite",
    name: "Junior Suite",
    type: "Suite",
    price: 429,
    size: 64,
    view: "City View",
    rating: 4.7,
    reviews: 131,
    bed: "1 King Bed + Lounge Chair",
    description:
      "An elevated suite balancing city energy and a serene lounge for longer, more luxurious stays.",
    image:
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80",
    availableRooms: null,
    destination: "Palawan",
  },
  {
    id: "7",
    legacyId: "cebu-horizon-deluxe",
    name: "Sunset Garden Villa",
    type: "Deluxe",
    price: 325,
    size: 48,
    view: "Sea View",
    rating: 4.7,
    reviews: 87,
    bed: "1 King Bed",
    description: "A bright island retreat with generous windows and a calm horizon view.",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
    availableRooms: null,
    destination: "Tagaytay",
  },
  {
    id: "8",
    legacyId: "makati-city-superior",
    name: "Island Family Residence",
    type: "Superior",
    price: 245,
    size: 38,
    view: "Skyline View",
    rating: 4.6,
    reviews: 104,
    bed: "1 Queen Bed",
    description: "A polished urban base close to Manila's best dining, shopping, and culture.",
    image: "https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=1200&q=80",
    availableRooms: null,
    destination: "Bohol",
  },
  {
    id: "9",
    legacyId: "palawan-garden-villa",
    name: "Coastal Escape Suite",
    type: "Suite",
    price: 720,
    size: 92,
    view: "Tropical Garden",
    rating: 4.9,
    reviews: 61,
    bed: "1 King Bed",
    description: "A secluded villa wrapped in tropical greenery with a private outdoor lounge.",
    image: "https://images.unsplash.com/photo-1601918774946-25832a4be0d6?auto=format&fit=crop&w=1200&q=80",
    availableRooms: null,
    destination: "Siargao",
  },
  {
    id: "10",
    legacyId: "davao-park-room",
    name: "Davao Executive Room",
    type: "Superior",
    price: 185,
    size: 30,
    view: "Park View",
    rating: 4.5,
    reviews: 76,
    bed: "1 Queen Bed",
    description: "A comfortable city room with warm details and a peaceful park outlook.",
    image: "https://images.unsplash.com/photo-1564078516393-cf04bd966897?auto=format&fit=crop&w=1200&q=80",
    availableRooms: null,
    destination: "Davao",
  },
  {
    id: "11",
    legacyId: "batangas-coastal-suite",
    name: "Batangas Cove Villa",
    type: "Presidential",
    price: 640,
    size: 78,
    view: "Coastal View",
    rating: 4.8,
    reviews: 53,
    bed: "1 King Bed + Sofa Bed",
    description: "A spacious coastal suite made for long afternoons and unhurried weekends.",
    image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
    availableRooms: null,
    destination: "Batangas",
  },
  {
    id: "12",
    legacyId: "bohol-loft-room",
    name: "Iloilo Heritage Room",
    type: "Standard",
    price: 275,
    size: 41,
    view: "Pool View",
    rating: 4.7,
    reviews: 68,
    bed: "1 King Bed",
    description: "A breezy loft with natural textures and easy access to the resort pool.",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    availableRooms: null,
    destination: "Iloilo",
  },
  {
    id: "13",
    legacyId: "siargao-surf-suite",
    name: "Cebu Ocean Loft",
    type: "Deluxe",
    price: 510,
    size: 70,
    view: "Garden View",
    rating: 4.8,
    reviews: 42,
    bed: "1 King Bed + Lounge",
    description: "Relaxed island style with a generous lounge for post-surf recovery.",
    image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80",
    availableRooms: null,
    destination: "Cebu",
  },
  {
    id: "14",
    legacyId: "iloilo-heritage-deluxe",
    name: "Manila Skyline Studio",
    type: "Standard",
    price: 295,
    size: 46,
    view: "Heritage District",
    rating: 4.6,
    reviews: 59,
    bed: "1 King Bed",
    description: "Modern comfort inspired by the graceful architecture of Iloilo's old quarter.",
    image: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1200&q=80",
    availableRooms: null,
    destination: "Manila",
  },
  {
    id: "15",
    legacyId: "tagaytay-lake-presidential",
    name: "Palawan Lagoon Villa",
    type: "Presidential",
    price: 1100,
    size: 160,
    view: "Lake View",
    rating: 4.9,
    reviews: 37,
    bed: "1 King Bed + Dining Room",
    description: "A grand retreat overlooking the lake with private entertaining spaces.",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    availableRooms: null,
    destination: "Palawan",
  },
  {
    id: "16",
    legacyId: "puerto-princesa-standard",
    name: "Boracay Family Suite",
    type: "Suite",
    price: 175,
    size: 29,
    view: "Courtyard View",
    rating: 4.4,
    reviews: 91,
    bed: "1 Double Bed",
    description: "A simple, welcoming room for discovering Palawan at your own pace.",
    image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80",
    availableRooms: null,
    destination: "Boracay",
  },
  {
    id: "17",
    legacyId: "baguio-pine-superior",
    name: "Baguio Pine Retreat",
    type: "Deluxe",
    price: 230,
    size: 36,
    view: "Pine View",
    rating: 4.7,
    reviews: 82,
    bed: "2 Twin Beds",
    description: "A cool-climate hideaway with pine views and softly layered interiors.",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
    availableRooms: null,
    destination: "Baguio",
  },
  {
    id: "18",
    legacyId: "boracay-sunset-deluxe",
    name: "Tagaytay Lake Suite",
    type: "Suite",
    price: 385,
    size: 44,
    view: "Sunset Beach View",
    rating: 4.8,
    reviews: 112,
    bed: "1 King Bed",
    description: "A sunlit beach retreat positioned for memorable island sunsets.",
    image: "https://images.unsplash.com/photo-1582610116397-edb318620f90?auto=format&fit=crop&w=1200&q=80",
    availableRooms: null,
    destination: "Tagaytay",
  },
  {
    id: "19",
    legacyId: "cebu-family-suite",
    name: "Davao Garden Villa",
    type: "Deluxe",
    price: 560,
    size: 82,
    view: "City and Sea View",
    rating: 4.7,
    reviews: 74,
    bed: "1 King Bed + 2 Twin Beds",
    description: "A flexible suite with room for family stays and a sweeping city-and-sea outlook.",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
    availableRooms: null,
    destination: "Davao",
  },
  {
    id: "20",
    legacyId: "manila-executive-suite",
    name: "Bohol Sunset Presidential",
    type: "Presidential",
    price: 675,
    size: 88,
    view: "Skyline View",
    rating: 4.8,
    reviews: 65,
    bed: "1 King Bed + Work Lounge",
    description: "A refined executive suite for productive days and restorative nights in Manila.",
    image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
    availableRooms: null,
    destination: "Bohol",
  },
];

export function getRoomById(roomId?: string | string[]) {
  const normalizedId = Array.isArray(roomId) ? roomId[0] : roomId;
  return rooms.find(
    (room) => room.id === normalizedId || room.legacyId === normalizedId,
  );
}

export function resolveRoomTypeId(roomId: string): string {
  return (
    rooms.find((room) => room.id === roomId || room.legacyId === roomId)?.id ??
    roomId
  );
}

export function applyRoomInventory(
  room: Room,
  inventory?: Record<string, { availableRooms?: number }> | null,
  inventoryError = false,
): Room {
  const normalize = (value: string) =>
    value.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
  const typeInventory = inventory?.[normalize(room.id)];
  return {
    ...room,
    availableRooms: inventoryError
      ? null
      : inventory === null || inventory === undefined
        ? null
        : Math.max(0, typeInventory?.availableRooms ?? 0),
    inventoryError,
  };
}

export const discoverRooms = [
  "1",
  "2",
  "3",
] as const;
