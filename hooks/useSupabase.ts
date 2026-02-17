import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { useMemo } from 'react'

export function useSupabase() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  return { supabase }
}