import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

let envContent = '';
try { envContent += fs.readFileSync('.env', 'utf-8') + '\n'; } catch {}
try { envContent += fs.readFileSync('.env.local', 'utf-8') + '\n'; } catch {}
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2];
});
const supabaseUrl = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function isRoomAvailableForDates(roomName, totalRooms, checkIn, checkOut) {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, check_in, check_out, status')
      .eq('room_type', roomName)
      .neq('status', 'cancelled')
      .lt('check_in', checkOut)
      .gt('check_out', checkIn);

    const bookedCount = data?.length || 0;
    const remaining = Math.max(0, totalRooms - bookedCount);
    return { available: remaining > 0, bookedCount, remaining };
}

async function run() {
  const roomName = 'Business';
  const checkIn = '2026-06-22';
  const checkOut = '2026-06-23';
  
  // Get live totalRooms
  const { data: roomData } = await supabase.from('rooms').select('total_rooms, booked_rooms').eq('name', roomName).single();
  const totalRooms = roomData.total_rooms;
  
  console.log(`Live DB Total Rooms for ${roomName}:`, totalRooms);

  const { available, bookedCount, remaining } = await isRoomAvailableForDates(roomName, totalRooms, checkIn, checkOut);
  
  console.log(`Check for ${checkIn} -> ${checkOut}:`);
  console.log(`Booked Count:`, bookedCount);
  console.log(`Remaining:`, remaining);
  console.log(`Available:`, available);

  if (available) {
    console.log(`Result: SUCCESS. Booking allowed. Toast error bypassed.`);
  } else {
    console.log(`Result: BLOCKED. Toast error shown.`);
  }
}

run();
