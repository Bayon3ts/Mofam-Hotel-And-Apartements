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
  { id: "standard", name: "Standard", price: 35000, tag: "Affordable comfort", badge: "", description: "A well-appointed room with all the essentials for a pleasant stay. Perfect for solo travellers and couples.", amenities: ["WIFI", "TV", "AC"], maxGuests: 2, totalRooms: 10, bookedRooms: 10 },
  { id: "business", name: "Business", price: 45000, tag: "Best Value", badge: "BEST VALUE", description: "Designed for the modern professional. Comes with a dedicated work desk and express services.", amenities: ["WIFI", "TV", "AC", "COFFEE"], maxGuests: 2, totalRooms: 10, bookedRooms: 5 },
  { id: "executive", name: "Executive", price: 70000, tag: "Business & comfort", badge: "POPULAR", description: "Elevated comfort meets productivity. Spacious layout with premium furnishings.", amenities: ["WIFI", "TV", "AC", "COFFEE", "PARKING"], maxGuests: 4, totalRooms: 10, bookedRooms: 5 },
  { id: "royal", name: "Royal", price: 85000, tag: "Premium stay", badge: "PREMIUM CHOICE", description: "Regal aesthetics with modern amenities. Enjoy a superior level of comfort and space.", amenities: ["WIFI", "TV", "AC", "COFFEE", "PARKING"], maxGuests: 4, totalRooms: 10, bookedRooms: 5 },
  { id: "executive-suite", name: "Executive Suite", price: 150000, tag: "Luxury experience", badge: "POPULAR", description: "A full suite experience with a separate living area and premium bathroom fixtures.", amenities: ["WIFI", "TV", "AC", "COFFEE", "PARKING"], maxGuests: 4, totalRooms: 10, bookedRooms: 5 },
  { id: "royal-apartment", name: "Royal Apartment", price: 180000, tag: "Spacious luxury", badge: "PREMIUM CHOICE", description: "Multi-room apartment with a full kitchen, dining area and smart interiors for extended stays.", amenities: ["WIFI", "TV", "AC", "COFFEE", "PARKING"], maxGuests: 6, totalRooms: 10, bookedRooms: 5 },
  { id: "diplomatic-apartment", name: "Diplomatic Apartment", price: 250000, tag: "Elite comfort", badge: "LAST UNIT", description: "Exclusively crafted for dignitaries. Private entrance, dedicated butler and bespoke amenities.", amenities: ["WIFI", "TV", "AC", "COFFEE", "PARKING", "BUTLER"], maxGuests: 6, totalRooms: 10, bookedRooms: 5 },
  { id: "vvip", name: "VVIP Apartment", price: 350000, tag: "Unmatched privacy", badge: "EXCLUSIVE", description: "Experience top-tier security and lavish privacy perfect for elite VIPs. Luxury finishing and tailored service.", amenities: ["WIFI", "TV", "AC", "COFFEE", "PARKING", "BUTLER", "PRIVATE BALCONY"], maxGuests: 6, totalRooms: 5, bookedRooms: 2 },
  { id: "presidential", name: "Presidential Apartment", price: 600000, tag: "The pinnacle of luxury", badge: "SIGNATURE", description: "Sprawling grandeur with a commanding view, grand living spaces, and world-class service.", amenities: ["WIFI", "TV", "AC", "COFFEE", "PARKING", "BUTLER", "PRIVATE CHEF"], maxGuests: 8, totalRooms: 2, bookedRooms: 0 }
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
