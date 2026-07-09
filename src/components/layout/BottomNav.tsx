import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/format'
import { useAppStore } from '../../stores/useAppStore'

const items = [
  { to: '/', label: '首页', icon: '🏠', end: true },
  { to: '/category/too_expensive', label: '分类', icon: '🗂️', end: false },
  { to: '/cart', label: '购物车', icon: '🛒', end: false },
  { to: '/profile', label: '我的', icon: '👤', end: false },
]

export function BottomNav() {
  const cartCount = useAppStore((s) => s.cartCount())

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-lg items-stretch justify-around">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]',
                isActive ? 'font-semibold text-brand-pink' : 'text-muted',
              )
            }
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span>{item.label}</span>
            {item.to === '/cart' && cartCount > 0 ? (
              <span className="absolute right-[18%] top-1 min-w-4 animate-breathe rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-4 text-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            ) : null}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
