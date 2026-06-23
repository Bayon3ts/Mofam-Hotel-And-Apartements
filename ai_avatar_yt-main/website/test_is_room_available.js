import { createClient } from '@supabase/supabase-js';

// Setup Supabase locally (hardcode the keys for testing based on what we found)
import fs from 'fs';
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

async function getOverlappingBookingsCount(roomName, checkIn, checkOut) {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, check_in, check_out, status')
      .eq('room_type', roomName)
      .neq('status', 'cancelled')
      .lt('check_in', checkOut)
      .gt('check_out', checkIn);
    return data?.length || 0;
}

async function isRoomAvailableForDates(roomName, totalRooms, checkIn, checkOut) {
  const bookedCount = await getOverlappingBookingsCount(roomName, checkIn, checkOut);
  const remaining = Math.max(0, totalRooms - bookedCount);
  return { available: remaining > 0, bookedCount, remaining };
}

async function run() {
  const roomName = 'Business';
  // Use dates from my DB dump where there are 4 bookings
  const checkIn = '2026-06-22';
  const checkOut = '2026-06-23';
  
  // Total rooms for Business is 10
  const totalRooms = 10;
  
  console.log('Testing with totalRooms =', totalRooms);
  const res = await isRoomAvailableForDates(roomName, totalRooms, checkIn, checkOut);
  console.log(res);
}

run();
