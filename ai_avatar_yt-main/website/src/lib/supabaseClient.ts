import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_url' || supabaseAnonKey === 'your_key') {
  console.warn('Supabase credentials are missing or using defaults. Database features will not work.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
