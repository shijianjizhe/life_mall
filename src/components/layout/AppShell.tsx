import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { useAppStore } from '../../stores/useAppStore'
import { cn } from '../../lib/format'
import { AvatarView } from '../ui/Avatar'

export function AppShell({
  children,
  showNav = true,
  className,
}: {
  children: ReactNode
  showNav?: boolean
  className?: string
}) {
  return (
    <div className={cn('mx-auto min-h-full max-w-lg bg-bg', className)}>
      <div className={cn(showNav && 'pb-20')}>{children}</div>
      {showNav ? <BottomNav /> : null}
    </div>
  )
}

export function TopBar({
  title,
  showBack,
  right,
  brand,
}: {
  title?: string
  showBack?: boolean
  right?: ReactNode
  brand?: boolean
}) {
  const cartCount = useAppStore((s) => s.cartCount())
  const profile = useAppStore((s) => s.profile)

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between gap-2 border-b border-line/80 bg-bg/90 px-4 backdrop-blur">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {showBack ? (
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-xl px-2 py-1 text-sm text-ink hover:bg-black/5"
          >
            ←
          </button>
        ) : null}
        {brand ? (
          <Link to="/" className="truncate text-base font-bold brand-text">
            人生商城
          </Link>
        ) : (
          <h1 className="truncate text-base font-bold text-ink">{title}</h1>
        )}
      </div>
      <div className="flex items-center gap-2">
        {right}
        {!right && !showBack ? (
          <>
            <Link
              to="/profile"
              className="block h-8 w-8 rounded-full shadow-sm ring-1 ring-line"
              title={profile?.nickname}
            >
              <AvatarView avatarUrl={profile?.avatarUrl} className="h-full w-full bg-white text-sm" />
            </Link>
            <Link
              to="/cart"
              className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm shadow-sm ring-1 ring-line"
            >
              🛒
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-4 text-white animate-breathe">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              ) : null}
            </Link>
          </>
        ) : null}
      </div>
    </header>
  )
}

export function DisclaimerBanner() {
  return (
    <div className="overflow-hidden bg-amber-50 text-amber-800">
      <div className="animate-marquee flex whitespace-nowrap py-1.5 text-xs">
        <span className="mx-4">
          本站商品仅供娱乐，不会真实发货收款 · 数据仅保存在你的浏览器本地 ·
          请定期备份 · 本站商品仅供娱乐，不会真实发货收款 ·
          数据仅保存在你的浏览器本地 · 请定期备份
        </span>
        <span className="mx-4" aria-hidden>
          本站商品仅供娱乐，不会真实发货收款 · 数据仅保存在你的浏览器本地 ·
          请定期备份 · 本站商品仅供娱乐，不会真实发货收款 ·
          数据仅保存在你的浏览器本地 · 请定期备份
        </span>
      </div>
    </div>
  )
}

