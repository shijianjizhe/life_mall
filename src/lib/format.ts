export function formatPrice(n: number): string {
  if (!Number.isFinite(n)) return '¥0'
  if (n >= 10000) {
    const wan = n / 10000
    if (wan >= 100) return `¥${Math.round(wan)}万`
    return `¥${wan % 1 === 0 ? wan.toFixed(0) : wan.toFixed(1)}万`
  }
  if (Number.isInteger(n)) {
    return `¥${n.toLocaleString('zh-CN')}`
  }
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function formatDate(isoOrYmd: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrYmd)) return isoOrYmd
  try {
    return new Date(isoOrYmd).toLocaleDateString('zh-CN')
  } catch {
    return isoOrYmd
  }
}

export function todayYmd(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function daysSince(iso: string): number {
  const start = new Date(iso)
  const now = new Date()
  const ms = now.getTime() - start.getTime()
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)))
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
