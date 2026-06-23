import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAvailability() {
  // 1. Check totalRooms for Business
  const { data: roomData, error: roomError } = await supabase
    .from('rooms')
    .select('total_rooms, booked_rooms')
    .eq('name', 'Business')
    .single();

  if (roomError) {
    console.error('Error fetching room:', roomError);
    return;
  }

  const totalRooms = roomData.total_rooms;
  console.log(`Business Room - total_rooms in DB: ${totalRooms}`);

  // 2. Check overlap logic
  const checkIn = '2026-06-21';
  const checkOut = '2026-06-22';
  const roomName = 'Business';

  const { data: overlaps, error: overlapError } = await supabase
    .from('bookings')
    .select('id, check_in, check_out, status')
    .eq('room_type', roomName)
    .neq('status', 'cancelled')
    .lt('check_in', checkOut)
    .gt('check_out', checkIn);

  if (overlapError) {
    console.error('Error fetching overlaps:', overlapError);
    return;
  }

  const bookedCount = overlaps.length;
  console.log(`Overlapping bookings count for ${checkIn} to ${checkOut}: ${bookedCount}`);
  console.log(`Overlapping bookings details:`, JSON.stringify(overlaps, null, 2));

  const remaining = Math.max(0, totalRooms - bookedCount);
  const available = remaining > 0;

  console.log(`Remaining: ${remaining}`);
  console.log(`Available: ${available}`);
}

testAvailability();
