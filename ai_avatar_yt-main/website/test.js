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
  const { data: allOverlaps } = await supabase.from('bookings').select('id, check_in, check_out, status, room_type, full_name');
  console.log(`All bookings:`, allOverlaps.map(b => `${b.room_type} | ${b.check_in} -> ${b.check_out} | ${b.full_name}`));
}

run();
