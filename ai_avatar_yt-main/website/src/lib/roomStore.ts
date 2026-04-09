// ─── Room Data Store ─────────────────────────────────────────────────────────
// Centralized data source for room inventory.
// Uses Supabase for persistence.
// Both Booking page and Admin panel read/write from this store.

import { supabase } from "./supabaseClient";

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

// ─── Mapping Helpers ────────────────────────────────────────────────────────

const mapDbToRoom = (db: any): RoomInventory => ({
  id: db.id,
  name: db.name,
  price: db.price,
  tag: db.tag,
  badge: db.badge,
  description: db.description,
  amenities: db.amenities || [],
  maxGuests: db.max_guests,
  totalRooms: db.total_rooms,
  bookedRooms: db.booked_rooms,
});

const mapRoomToDb = (room: Partial<RoomInventory>) => {
  const db: any = {};
  if (room.id !== undefined) db.id = room.id;
  if (room.name !== undefined) db.name = room.name;
  if (room.price !== undefined) db.price = room.price;
  if (room.tag !== undefined) db.tag = room.tag;
  if (room.badge !== undefined) db.badge = room.badge;
  if (room.description !== undefined) db.description = room.description;
  if (room.amenities !== undefined) db.amenities = room.amenities;
  if (room.maxGuests !== undefined) db.max_guests = room.maxGuests;
  if (room.totalRooms !== undefined) db.total_rooms = room.totalRooms;
  if (room.bookedRooms !== undefined) db.booked_rooms = room.bookedRooms;
  return db;
};

// ─── Store API ───────────────────────────────────────────────────────────────

/** Load rooms from Supabase, seeding defaults if empty. */
export async function getRooms(): Promise<RoomInventory[]> {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      if (error.code === 'PGRST301' || error.status === 401) {
        console.warn('Supabase Auth error (401). Check env variables or RLS policies.');
      }
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('No rooms found in Supabase. Seeding defaults...');
      return await seedRooms();
    }

    const mapped = data.map(mapDbToRoom);
    console.log("[roomStore] Fetched rooms:", mapped);
    return Array.isArray(mapped) ? mapped : [];
  } catch (err) {
    console.error('Error fetching rooms from Supabase:', err);
    return []; // Return empty array to prevent .filter crashes
  }
}

/** Seed rooms into Supabase. */
async function seedRooms(): Promise<RoomInventory[]> {
  try {
    const seedData = DEFAULT_ROOMS.map(mapRoomToDb);
    const { data, error } = await supabase
      .from('rooms')
      .insert(seedData)
      .select();

    if (error) throw error;
    const mapped = (data || []).map(mapDbToRoom);
    return Array.isArray(mapped) ? mapped : [];
  } catch (err) {
    console.error('Error seeding rooms:', err);
    // Fallback to local defaults if seeding fails
    return DEFAULT_ROOMS;
  }
}

/** Update a single room by id. Returns the updated list. */
export async function updateRoom(
  id: string,
  patch: Partial<Pick<RoomInventory, "price" | "totalRooms" | "bookedRooms">>
): Promise<RoomInventory[]> {
  try {
    const dbPatch = mapRoomToDb(patch);
    
    if (patch.price !== undefined) dbPatch.price = Math.max(1, patch.price);
    if (patch.totalRooms !== undefined) dbPatch.total_rooms = Math.max(1, patch.totalRooms);
    if (patch.bookedRooms !== undefined) dbPatch.booked_rooms = Math.max(0, patch.bookedRooms);

    const { error } = await supabase
      .from('rooms')
      .update(dbPatch)
      .eq('id', id);

    if (error) throw error;
    
    return await getRooms();
  } catch (err) {
    console.error('Error updating room:', err);
    return await getRooms();
  }
}

/** Reset to factory defaults. */
export async function resetRooms(): Promise<RoomInventory[]> {
  try {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .neq('id', 'placeholder_force_all');

    if (error) throw error;
    return await seedRooms();
  } catch (err) {
    console.error('Error resetting rooms:', err);
    return await getRooms();
  }
}

/** Compute available rooms for a given room object. */
export function getAvailability(room: RoomInventory): number {
  if (!room) return 0;
  return Math.max(0, (room.totalRooms || 0) - (room.bookedRooms || 0));
}
