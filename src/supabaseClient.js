import { createClient } from '@supabase/supabase-js'

// --- PROJECT CONFIG ---
const supabaseUrl = 'https://sisyjuaspeznyrmipmlo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpc3lqdWFzcGV6bnlybWlwbWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NjgyNjAsImV4cCI6MjA4MTU0NDI2MH0.QM8owoSgpVT2E-m3QuyhpL_1VG0j4EJcdF3sylk0nIU'

// --- INITIALIZATION ---
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,   // Keeps you logged in
    autoRefreshToken: true, // Renews the session automatically
    detectSessionInUrl: true 
  }
})

// --- DEBUG ACCESS ---
if (typeof window !== 'undefined') {
  window.supabase = supabase
}
