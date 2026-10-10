import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiFetch } from '../lib/api'
import type { Catalog, Option, Profile, Usage } from '../types'

type MeState = {
  me: Profile | null
  catalog: Catalog | null
  usage: Usage | null
  error: string | null
  refresh: () => Promise<void> // reload after changing the profile or goal
  refreshUsage: () => void
  label: (list: keyof Pick<Catalog, 'roles' | 'experienceLevels' | 'companyTypes'>, id: string | null | undefined) => string
}

const MeContext = createContext<MeState | null>(null)

// Loads "who am I" (profile + active goal) and the option lists once, and shares them with every page in the app.
export function MeProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Profile | null>(null)
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [usage, setUsage] = useState<Usage | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const [m, c] = await Promise.all([apiFetch<Profile>('/me'), apiFetch<Catalog>('/catalog')])
      setMe(m)
      setCatalog(c)
    } catch (err) {
      setError((err as Error).message)
    }
  }, [])

  const refreshUsage = useCallback(() => { apiFetch<Usage>('/usage').then(setUsage).catch(() => {}) }, [])

  useEffect(() => { refresh(); refreshUsage() }, [refresh, refreshUsage])

  const label: MeState['label'] = (list, id) =>
    ((catalog?.[list] ?? []) as Option[]).find((o) => o.id === id)?.label ?? ''

  return <MeContext.Provider value={{ me, catalog, usage, error, refresh, refreshUsage, label }}>{children}</MeContext.Provider>
}

export function useMe() {
  const ctx = useContext(MeContext)
  if (!ctx) throw new Error('useMe must be used inside <MeProvider>')
  return ctx
}
