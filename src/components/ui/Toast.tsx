import { useAppStore } from '../../stores/useAppStore'

export function ToastHost() {
  const toasts = useAppStore((s) => s.toasts)

  if (!toasts.length) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto max-w-sm rounded-2xl bg-ink/90 px-4 py-2.5 text-sm text-white shadow-lg backdrop-blur"
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
