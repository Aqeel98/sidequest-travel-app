import { createClient } from '@supabase/supabase-js'

// --- PROJECT CONFIG ---
const supabaseUrl = 'https://sisyjuaspeznyrmipmlo.supabase.co'
const supabaseKey = 'sb_publishable_9D215og-rz3FuUK1Z2GFoA_9UPHcvKZ'

// --- INITIALIZATION ---
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true, // Crucial for your refresh-logout issue
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// --- DEBUG ACCESS ---
// This allows you to run "await supabase.from..." in the browser console
if (typeof window !== 'undefined') {
  window.supabase = supabase
}