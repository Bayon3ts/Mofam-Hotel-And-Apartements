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

const PENDING_BOOKING_GRACE_PERIOD_HOURS = 6;

async function getOverlappingBookingsCount(roomName, checkIn, checkOut) {
    const graceCutoff = new Date(Date.now() - PENDING_BOOKING_GRACE_PERIOD_HOURS * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('bookings')
      .select('id, check_in, check_out, status, created_at')
      .eq('room_type', roomName)
      .neq('status', 'cancelled')
      .lt('check_in', checkOut)
      .gt('check_out', checkIn);

    const relevant = (data || []).filter((b) => {
      if (b.status === 'cancelled') return false;
      if (b.status === 'confirmed') return true;
      if (b.status === 'pending') {
        return b.created_at >= graceCutoff;
      }
      return false;
    });
    return relevant.length;
}

async function isRoomAvailableForDates(roomName, totalRooms, checkIn, checkOut) {
  const bookedCount = await getOverlappingBookingsCount(roomName, checkIn, checkOut);
  const remaining = Math.max(0, totalRooms - bookedCount);
  return { available: remaining > 0, bookedCount, remaining };
}

async function expireStaleBookings() {
  const graceCutoff = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from('bookings').update({ status: 'expired' }).eq('status', 'pending').lt('created_at', graceCutoff);
  if (error) console.error(error);
}

async function run() {
  const roomName = 'Business';
  const checkIn = '2027-01-01'; // Use a fresh date with no bookings
  const checkOut = '2027-01-02';
  const totalRooms = 1; // Set totalRooms to 1 so 1 booking blocks it

  // 1. Create a test pending booking
  const freshDate = new Date().toISOString();
  const { data: newBooking } = await supabase.from('bookings').insert({
    full_name: 'Test Expiry',
    email: 'test@example.com',
    phone: '12345',
    room_type: roomName,
    check_in: checkIn,
    check_out: checkOut,
    guests: 1,
    total_price: 100,
    status: 'pending',
    created_at: freshDate
  }).select().single();
  
  let res = await isRoomAvailableForDates(roomName, totalRooms, checkIn, checkOut);
  console.log(`State after creating fresh pending booking (should block):`);
  console.log(res);

  // 2. Make it stale
  const staleDate = new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString();
  await supabase.from('bookings').update({ created_at: staleDate }).eq('id', newBooking.id);
  
  // 3. Confirm it's bookable again via public Booking page (bypasses check)
  res = await isRoomAvailableForDates(roomName, totalRooms, checkIn, checkOut);
  console.log(`\nState after making it stale (should allow 1 room):`);
  console.log(res);

  // 4. Run Admin cleanup (Refresh Admin)
  await expireStaleBookings();
  const { data: updatedBooking } = await supabase.from('bookings').select('status').eq('id', newBooking.id).single();
  console.log(`\nAfter Admin cleanup, status is now: ${updatedBooking.status}`);

  // 5. Create a fresh pending booking for same dates to block it again
  const { data: freshBooking } = await supabase.from('bookings').insert({
    full_name: 'Test Fresh',
    email: 'test2@example.com',
    phone: '12345',
    room_type: roomName,
    check_in: checkIn,
    check_out: checkOut,
    guests: 1,
    total_price: 100,
    status: 'pending',
    created_at: new Date().toISOString()
  }).select().single();

  res = await isRoomAvailableForDates(roomName, totalRooms, checkIn, checkOut);
  console.log(`\nState after creating new fresh pending booking (should block again):`);
  console.log(res);

  // Cleanup DB
  await supabase.from('bookings').delete().in('id', [newBooking.id, freshBooking.id]);
}

run();
