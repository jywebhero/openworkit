import { useEffect, useState } from 'react'
import type { AppInfo } from '@shared/types'
import { api } from '@/lib/api'

export function useAppInfo(): AppInfo | null {
  const [info, setInfo] = useState<AppInfo | null>(null)

  useEffect(() => {
    let active = true
    void api.app.info().then((next) => {
      if (active) setInfo(next)
    })
    return () => {
      active = false
    }
  }, [])

  return info
}
