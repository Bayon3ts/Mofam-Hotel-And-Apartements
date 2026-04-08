// ─── Room Data Store ─────────────────────────────────────────────────────────
// Centralized data source for room inventory.
// Uses localStorage for persistence across sessions.
// Both Booking page and Admin panel read/write from this store.

export interface RoomInventory {
  id: string;
  name: string;
  price: number;
  tag: string;
  badge?: string;
  description: string;
  amenities: string[];
  maxGuests: number;
  totalRooms: number;
  bookedRooms: number;
}

// ─── Default Room Seed Data ──────────────────────────────────────────────────
const DEFAULT_ROOMS: RoomInventory[] = [
  {
    id: "standard",
    name: "Standard",
    price: 35000,
    tag: "Affordable comfort",
    description: "A well-appointed room with all the essentials for a pleasant stay. Perfect for solo travellers and couples.",
    amenities: ["WiFi", "TV", "AC"],
    maxGuests: 2,
    totalRooms: 15,
    bookedRooms: 12,
  },
  {
    id: "business",
    name: "Business",
    price: 45000,
    tag: "Best Value",
    badge: "Best Value",
    description: "Designed for the modern professional. Comes with a dedicated work desk and express services.",
    amenities: ["WiFi", "TV", "AC", "Coffee"],
    maxGuests: 2,
    totalRooms: 12,
    bookedRooms: 10,
  },
  {
    id: "executive",
    name: "Executive",
    price: 70000,
    tag: "Business & comfort",
    badge: "Popular",
    description: "Elevated comfort meets productivity. Spacious layout with premium furnishings.",
    amenities: ["WiFi", "TV", "AC", "Coffee", "Parking"],
    maxGuests: 3,
    totalRooms: 10,
    bookedRooms: 7,
  },
  {
    id: "royal",
    name: "Royal",
    price: 85000,
    tag: "Premium stay",
    description: "Regal aesthetics with modern amenities. Enjoy a superior level of comfort and space.",
    amenities: ["WiFi", "TV", "AC", "Coffee", "Parking"],
    maxGuests: 3,
    totalRooms: 8,
    bookedRooms: 4,
  },
  {
    id: "executive-suite",
    name: "Executive Suite",
    price: 150000,
    tag: "Luxury experience",
    badge: "Popular",
    description: "A full suite experience with a separate living area and premium bathroom fixtures.",
    amenities: ["WiFi", "TV", "AC", "Coffee", "Parking"],
    maxGuests: 4,
    totalRooms: 5,
    bookedRooms: 3,
  },
  {
    id: "royal-apartment",
    name: "Royal Apartment",
    price: 180000,
    tag: "Spacious luxury",
    description: "Multi-room apartment with a full kitchen, dining area, and lavish interiors for extended stays.",
    amenities: ["WiFi", "TV", "AC", "Coffee", "Parking"],
    maxGuests: 5,
    totalRooms: 4,
    bookedRooms: 2,
  },
  {
    id: "diplomatic-apartment",
    name: "Diplomatic Apartment",
    price: 250000,
    tag: "Elite comfort",
    badge: "Exclusive",
    description: "Exclusively crafted for dignitaries. Private entrance, dedicated butler, and bespoke amenities.",
    amenities: ["WiFi", "TV", "AC", "Coffee", "Parking"],
    maxGuests: 6,
    totalRooms: 3,
    bookedRooms: 1,
  },
  {
    id: "vvip",
    name: "VVIP",
    price: 250000,
    tag: "Exclusive stay",
    badge: "Exclusive",
    description: "Reserved for the most discerning guests. Unmatched privacy, space, and personalised service.",
    amenities: ["WiFi", "TV", "AC", "Coffee", "Parking"],
    maxGuests: 6,
    totalRooms: 2,
    bookedRooms: 0,
  },
  {
    id: "presidential",
    name: "Presidential",
    price: 500000,
    tag: "Ultimate luxury",
    badge: "Exclusive",
    description: "The pinnacle of hospitality. An entire floor experience with panoramic views, private pool, and 24/7 butler.",
    amenities: ["WiFi", "TV", "AC", "Coffee", "Parking"],
    maxGuests: 8,
    totalRooms: 1,
    bookedRooms: 0,
  },
];

const STORAGE_KEY = "mofam_room_inventory";

// ─── Store API ───────────────────────────────────────────────────────────────

/** Load rooms from localStorage, seeding defaults if empty. */
export function getRooms(): RoomInventory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RoomInventory[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Corrupt data – fall through to defaults
  }
  // Seed defaults on first load
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ROOMS));
  return [...DEFAULT_ROOMS];
}

/** Persist the full rooms array. */
export function saveRooms(rooms: RoomInventory[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
}

/** Update a single room by id. Returns the updated list. */
export function updateRoom(
  id: string,
  patch: Partial<Pick<RoomInventory, "price" | "totalRooms" | "bookedRooms">>
): RoomInventory[] {
  const rooms = getRooms();
  const idx = rooms.findIndex((r) => r.id === id);
  if (idx === -1) return rooms;

  const room = rooms[idx];
  const price = patch.price ?? room.price;
  const totalRooms = patch.totalRooms ?? room.totalRooms;
  const bookedRooms = patch.bookedRooms ?? room.bookedRooms;

  // Validation
  rooms[idx] = {
    ...room,
    price: Math.max(1, price),
    totalRooms: Math.max(1, totalRooms),
    bookedRooms: Math.max(0, Math.min(bookedRooms, totalRooms)),
  };

  saveRooms(rooms);
  return rooms;
}

/** Reset to factory defaults. */
export function resetRooms(): RoomInventory[] {
  const fresh = [...DEFAULT_ROOMS];
  saveRooms(fresh);
  return fresh;
}

/** Compute available rooms for a given room object. */
export function getAvailability(room: RoomInventory): number {
  return Math.max(0, room.totalRooms - room.bookedRooms);
}
