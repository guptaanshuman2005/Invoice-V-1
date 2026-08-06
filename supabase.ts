import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// You will need to provide your Supabase URL and Anon Key in .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
