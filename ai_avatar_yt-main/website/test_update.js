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

async function run() {
  const { data: newBooking } = await supabase.from('bookings').insert({
    full_name: 'Test Update',
    email: 'test@example.com',
    phone: '12345',
    room_type: 'Business',
    check_in: '2027-01-01',
    check_out: '2027-01-02',
    guests: 1,
    total_price: 100,
    status: 'pending'
  }).select().single();
  
  const staleDate = new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString();
  const res = await supabase.from('bookings').update({ created_at: staleDate, status: 'expired' }).eq('id', newBooking.id);
  console.log('Update result:', res);
  
  await supabase.from('bookings').delete().eq('id', newBooking.id);
}
run();
