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
};

export const rooms: Room[] = [
  {
    id: "deluxe-king-room",
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
  },
  {
    id: "premier-ocean-suite",
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
  },
  {
    id: "executive-twin",
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
  },
  {
    id: "presidential-suite",
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
  },
  {
    id: "classic-room",
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
  },
  {
    id: "junior-suite",
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
  },
];

export function getRoomById(roomId?: string | string[]) {
  const normalizedId = Array.isArray(roomId) ? roomId[0] : roomId;
  return rooms.find((room) => room.id === normalizedId);
}

export const discoverRooms = [
  "deluxe-king-room",
  "premier-ocean-suite",
  "executive-twin",
] as const;
