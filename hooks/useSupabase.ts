import { createSupabaseClient } from '@/lib/supabase'
import { useMemo } from 'react'

export function useSupabase() {
  const supabase = useMemo(() => createSupabaseClient(), [])
  return { supabase }
}