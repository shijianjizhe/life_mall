import type { ReactNode } from 'react'
import { Button } from './Button'

export function EmptyState({
  emoji = '🛒',
  title,
  description,
  actionLabel,
  onAction,
}: {
  emoji?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 text-5xl">{emoji}</div>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-xs text-sm text-muted">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <div className="mt-6">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  )
}

export function PageSpinner({ label = '加载中…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-pink/30 border-t-brand-pink" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function SectionTitle({
  title,
  extra,
}: {
  title: string
  extra?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {extra}
    </div>
  )
}
