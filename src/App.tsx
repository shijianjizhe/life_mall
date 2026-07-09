import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { AppShell, TopBar } from './components/layout/AppShell'
import { Button } from './components/ui/Button'
import { PageSpinner } from './components/ui/EmptyState'
import { ToastHost } from './components/ui/Toast'
import { db } from './db'
import { BACKUP_DAYS_THRESHOLD } from './lib/constants'
import { daysSince } from './lib/format'
import { AiChatPage } from './pages/AiChatPage'
import { AiReportPage } from './pages/AiReportPage'
import { BackupPage } from './pages/BackupPage'
import { CartPage } from './pages/CartPage'
import { CategoryPage } from './pages/CategoryPage'
import { CheckinPage } from './pages/CheckinPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { HomePage } from './pages/HomePage'
import { MillionEventPage } from './pages/MillionEventPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { OrderSuccessPage } from './pages/OrderSuccessPage'
import { OrdersPage } from './pages/OrdersPage'
import { PosterPage } from './pages/PosterPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { ProfilePage } from './pages/ProfilePage'
import { RoomPage } from './pages/RoomPage'
import { SearchPage } from './pages/SearchPage'
import { SettingsPage } from './pages/SettingsPage'
import { WishlistPage } from './pages/WishlistPage'
import { useAppStore } from './stores/useAppStore'

type BackupReminderState = {
  firstOrderShown?: boolean
  order5Shown?: boolean
  day3Shown?: boolean
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

function AppRoutes() {
  const location = useLocation()
  const ready = useAppStore((s) => s.ready)
  const profile = useAppStore((s) => s.profile)
  const hydrate = useAppStore((s) => s.hydrate)
  const [showBackupReminder, setShowBackupReminder] = useState(false)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!ready) return
    let mounted = true
    void db.settings.get('darkMode').then((row) => {
      if (!mounted) return
      document.documentElement.dataset.theme = row?.value ? 'dark' : 'light'
    })
    return () => {
      mounted = false
    }
  }, [ready])

  useEffect(() => {
    if (!ready || !profile?.onboardingCompleted || location.pathname === '/backup') return
    if (daysSince(profile.joinedAt) < BACKUP_DAYS_THRESHOLD) return

    let mounted = true
    void db.settings.get('backupReminders').then((row) => {
      const reminders = (row?.value as BackupReminderState | undefined) ?? {}
      if (mounted && !reminders.day3Shown) setShowBackupReminder(true)
    })

    return () => {
      mounted = false
    }
  }, [location.pathname, profile, ready])

  const closeBackupReminder = async () => {
    setShowBackupReminder(false)
    const row = await db.settings.get('backupReminders')
    const reminders = (row?.value as BackupReminderState | undefined) ?? {}
    await db.settings.put({
      key: 'backupReminders',
      value: { ...reminders, day3Shown: true },
    })
  }

  if (!ready) {
    return (
      <div className="min-h-full bg-bg">
        <PageSpinner label="正在装载你的购物车小宇宙..." />
      </div>
    )
  }

  if (profile && !profile.onboardingCompleted && location.pathname !== '/onboarding') {
    return (
      <>
        <ToastHost />
        <Navigate to="/onboarding" replace />
      </>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/category/:categoryCode" element={<CategoryPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/product/:productId" element={<ProductDetailPage />} />
        <Route path="/ai-chat" element={<AiChatPage />} />
        <Route path="/ai-chat/:productId" element={<AiChatPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order/success/:orderId" element={<OrderSuccessPage />} />
        <Route path="/order/:orderId" element={<OrderDetailPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/room" element={<RoomPage />} />
        <Route path="/share/poster" element={<PosterPage />} />
        <Route path="/ai-report" element={<AiReportPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/backup" element={<BackupPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/checkin" element={<CheckinPage />} />
        <Route path="/event/million" element={<MillionEventPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {showBackupReminder ? (
        <BackupReminder onClose={() => void closeBackupReminder()} />
      ) : null}
      <ToastHost />
    </>
  )
}

function BackupReminder({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-20 z-50 px-4">
      <div className="mx-auto max-w-lg rounded-2xl border border-brand-pink/20 bg-white p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💾</div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-ink">建议备份一下数据</div>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              你的购物车、订单和收藏只保存在本设备浏览器里，定期导出更安心。
            </p>
            <div className="mt-3 flex gap-2">
              <Link to="/backup" onClick={onClose}>
                <Button size="sm">去备份</Button>
              </Link>
              <Button size="sm" variant="secondary" onClick={onClose}>
                稍后
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function NotFoundPage() {
  return (
    <AppShell>
      <TopBar title="页面不存在" showBack />
      <div className="px-4 py-8">
        <div className="rounded-2xl border border-line bg-white p-6 text-center shadow-sm">
          <div className="text-5xl">🪐</div>
          <h1 className="mt-4 text-xl font-bold text-ink">这个星球还没开张</h1>
          <p className="mt-2 text-sm text-muted">换个入口继续逛逛吧。</p>
          <Link to="/" className="mt-5 inline-block">
            <Button>回首页</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  )
}

export default App


