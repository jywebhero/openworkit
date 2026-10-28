import { useEffect } from 'react'
import { navigate } from '@/lib/router'

export function useGlobalHotkeys(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const meta = event.metaKey || event.ctrlKey
      if (!meta) return

      const key = event.key.toLowerCase()

      if (key === 'k') {
        event.preventDefault()
        window.dispatchEvent(new CustomEvent('openwork:focus-search'))
        return
      }

      if (key === 'r') {
        event.preventDefault()
        window.dispatchEvent(new CustomEvent('openwork:rescan'))
        return
      }

      if (key === '1') {
        event.preventDefault()
        navigate('market')
        return
      }

      if (key === '2') {
        event.preventDefault()
        navigate('installed')
        return
      }

      if (key === '3') {
        event.preventDefault()
        navigate('connectors')
        return
      }

      if (key === ',') {
        event.preventDefault()
        navigate('settings')
        return
      }

      if (key === '4') {
        event.preventDefault()
        navigate('settings')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}

export function focusSearch(): void {
  window.dispatchEvent(new CustomEvent('openwork:focus-search'))
}
