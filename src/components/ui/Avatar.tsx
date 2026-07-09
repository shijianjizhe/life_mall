import { cn } from '../../lib/format'

export function AvatarView({
  avatarUrl,
  fallback = '🙂',
  className,
}: {
  avatarUrl?: string
  fallback?: string
  className?: string
}) {
  const emoji = avatarUrl?.startsWith('emoji:') ? avatarUrl.slice(6) : ''

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-full bg-white/20 text-xl',
        className,
      )}
    >
      {emoji ? (
        <span>{emoji}</span>
      ) : avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  )
}
