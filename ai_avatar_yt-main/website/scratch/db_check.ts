
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvjjymolicxvkxlpidji.supabase.co';
const supabaseAnonKey = 'sb_publishable_fgDz-yPQMTe1X_1sqcye6Q_rutqrIT3';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('Checking rooms table...');
  try {
    const { data, error } = await supabase.from('rooms').select('*').limit(1);
    if (error) {
      console.error('Error selecting from rooms:', error.message, error.code);
    } else {
      console.log('Successfully connected to rooms table. Count:', data.length);
    }

    console.log('Checking bookings table...');
    const { error: error2 } = await supabase.from('bookings').select('*').limit(1);
    if (error2) {
      console.error('Error selecting from bookings:', error2.message, error2.code);
    } else {
      console.log('Successfully connected to bookings table.');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkTables();
