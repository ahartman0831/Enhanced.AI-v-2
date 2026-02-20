'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to check if current user has dev_mode_enabled.
 * Used to gate unfinished features (e.g. progress photos) so only the developer sees them.
 * Remove this gating when feature is ready for all users.
 */
export function useDevMode() {
  const [devModeEnabled, setDevModeEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/user', { cache: 'no-store', credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setDevModeEnabled(!!data.dev_mode_enabled)
        } else if (!cancelled) {
          setDevModeEnabled(false)
        }
      })
      .catch(() => {
        if (!cancelled) setDevModeEnabled(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return {
    devModeEnabled: devModeEnabled ?? false,
    loading: devModeEnabled === null,
  }
}
