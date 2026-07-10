import { Link } from 'react-router-dom'
import { AppShell, TopBar } from '../components/layout/AppShell'
import { AvatarView } from '../components/ui/Avatar'
import { daysSince, formatPrice } from '../lib/format'
import { useAppStore } from '../stores/useAppStore'
import { useEffect, useState } from 'react'
import { db } from '../db'

const links = [
  { to: '/ai-report', icon: '🧬', label: 'AI 购物人格报告' },
  { to: '/orders', icon: '📦', label: '历史订单' },
  { to: '/favorites', icon: '❤️', label: '收藏夹' },
  { to: '/wishlist', icon: '✨', label: '梦想清单' },
  { to: '/room', icon: '🛋️', label: '虚拟房间' },
  { to: '/share/poster', icon: '🖼️', label: '海报分享' },
  { to: '/checkin', icon: '📅', label: '每日签到' },
  { to: '/backup', icon: '💾', label: '数据备份与恢复' },
  { to: '/settings', icon: '⚙️', label: '设置 / 关于' },
]

export function ProfilePage() {
  const profile = useAppStore((s) => s.profile)
  const orders = useAppStore((s) => s.orders)
  const favorites = useAppStore((s) => s.favorites)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    void db.checkins.orderBy('checkinDate').reverse().first().then((c) => {
      setStreak(c?.streakDays ?? 0)
    })
  }, [])

  const spent = orders.reduce((s, o) => s + o.totalAmount, 0)
  const day = profile ? daysSince(profile.joinedAt) + 1 : 1

  return (
    <AppShell>
      <div className="brand-gradient pb-6 text-white">
        <TopBar title="我的" />
        <div className="flex items-center gap-4 px-4 pt-2">
          <AvatarView
            avatarUrl={profile?.avatarUrl}
            className="h-16 w-16 bg-white/20 text-3xl ring-2 ring-white/40"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xl font-bold">
              {profile?.nickname ?? '快乐剁手人'}
            </div>
            <div className="mt-1 text-sm text-white/85">加入第 {day} 天</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/18 px-3 py-1 text-sm text-accent-lime">
                快乐币 {profile?.happyCoin ?? 0}
              </span>
              <Link
                to="/settings"
                className="rounded-full bg-white/18 px-3 py-1 text-xs text-white ring-1 ring-white/20"
              >
                编辑资料
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="-mt-3 grid grid-cols-2 gap-3 px-4 sm:grid-cols-4">
        {[
          { label: '下单', value: `${orders.length} 次` },
          { label: '虚拟消费', value: formatPrice(spent) },
          { label: '收藏', value: `${favorites.length}` },
          { label: '连续签到', value: `${streak} 天` },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-line bg-white p-3 text-center shadow-sm"
          >
            <div className="text-sm font-bold text-ink">{s.value}</div>
            <div className="mt-1 text-[11px] text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-1 px-4 pb-6">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-sm shadow-sm ring-1 ring-line"
          >
            <span className="flex items-center gap-3">
              <span className="text-lg">{l.icon}</span>
              {l.label}
            </span>
            <span className="text-muted">›</span>
          </Link>
        ))}
      </div>
    </AppShell>
  )
}


