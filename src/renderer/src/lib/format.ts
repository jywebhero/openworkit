export function formatCount(value: number, lang: string): string {
  if (lang.startsWith('zh')) {
    if (value >= 10000) {
      const wan = value / 10000
      const digits = wan >= 100 ? 0 : wan >= 10 ? 1 : 2
      return `${trimZeros(wan.toFixed(digits))}万`
    }
    if (value >= 1000) return `${trimZeros((value / 1000).toFixed(1))}K`
    return String(value)
  }
  if (value >= 1_000_000) {
    const millions = value / 1_000_000
    const digits = millions >= 100 ? 0 : millions >= 10 ? 1 : 2
    return `${trimZeros(millions.toFixed(digits))}M`
  }
  if (value >= 1000) {
    const thousands = value / 1000
    return `${trimZeros(thousands.toFixed(thousands >= 100 ? 0 : 1))}K`
  }
  return String(value)
}

function trimZeros(value: string): string {
  return value.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDate(ms: number, lang: string): string {
  const date = new Date(ms)
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

export function shortPath(fullPath: string, max = 46): string {
  if (fullPath.length <= max) return fullPath
  return `…${fullPath.slice(fullPath.length - max + 1)}`
}
