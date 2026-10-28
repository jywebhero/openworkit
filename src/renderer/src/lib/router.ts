import { useEffect, useState } from 'react'

export type PageId = 'market' | 'installed' | 'connectors' | 'settings'

export interface Route {
  page: PageId
  section?: string
}

const PAGES: PageId[] = ['market', 'installed', 'connectors', 'settings']

export function parseRoute(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '')
  const [page, section] = clean.split('/')
  if (PAGES.includes(page as PageId)) {
    return { page: page as PageId, section: section || undefined }
  }
  return { page: 'market' }
}

export function navigate(path: string): void {
  const next = path.startsWith('#') ? path : `#/${path.replace(/^\/+/, '')}`
  if (window.location.hash === next) return
  window.location.hash = next
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash))

  useEffect(() => {
    const onChange = (): void => setRoute(parseRoute(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}
