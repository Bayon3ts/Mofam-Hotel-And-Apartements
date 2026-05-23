
import { supabase } from '../src/lib/supabaseClient';

async function testInsert() {
  const dummyBooking = {
    full_name: "Test User",
    email: "test@example.com",
    phone: "1234567890",
    room_type: "Standard",
    check_in: "2026-05-01",
    check_out: "2026-05-05",
    guests: 2,
    total_price: 140000,
    status: 'pending'
  };

  console.log("Testing insert into 'bookings' table...");
  const { data, error } = await supabase
    .from('bookings')
    .insert([dummyBooking])
    .select();

  if (error) {
    console.error("Insert failed!");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Error details:", error.details);
    console.error("Hint:", error.hint);
  } else {
    console.log("Insert successful!");
    console.log("Data:", data);
  }
}

testInsert();
