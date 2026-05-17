import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, ANON_KEY } from './config'

export const supabase = createClient(SUPABASE_URL, ANON_KEY)
