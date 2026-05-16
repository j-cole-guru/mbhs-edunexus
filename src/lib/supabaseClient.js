import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tvitevnovhiimpdukebm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aXRldm5vdmhpaW1wZHVrZWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDc5NDksImV4cCI6MjA5MzcyMzk0OX0.ppLsEGZqXAE9YurmXCUqto7Mi3p6ZEVDHS4ODLwJo6Y'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    fetch: (...args) => fetch(...args)
  }
})
