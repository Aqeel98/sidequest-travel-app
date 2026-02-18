import { createClient } from '@supabase/supabase-js'

// --- PROJECT CONFIG (Now pulled securely from Vercel) ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- INITIALIZATION ---
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,   
    autoRefreshToken: true, 
    detectSessionInUrl: true 
  }
})