import { createClient } from '@supabase/supabase-js'

// 1. Go to your Supabase Dashboard -> Project Settings -> API
// 2. Copy "Project URL" and "anon" (public) Key
const supabaseUrl = 'https://sisyjuaspeznyrmipmlo.supabase.co'
const supabaseKey = 'sb_publishable_9D215og-rz3FuUK1Z2GFoA_9UPHcvKZ'

export const supabase = createClient(supabaseUrl, supabaseKey)