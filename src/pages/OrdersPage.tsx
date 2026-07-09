import { Link } from 'react-router-dom'
import { AppShell, TopBar } from '../components/layout/AppShell'
import { ProductEmojiArt } from '../components/product/ProductCard'
import { EmptyState } from '../components/ui/EmptyState'
import { formatDateTime, formatPrice } from '../lib/format'
import { useAppStore } from '../stores/useAppStore'

export function OrdersPage() {
  const orders = useAppStore((s) => s.orders)

  return (
    <AppShell>
      <TopBar title={`我的订单（${orders.length}）`} showBack />
      {orders.length ? (
        <div className="space-y-3 px-4 py-4">
          {orders.map((o) => (
            <Link
              key={o.id}
              to={`/order/${o.id}`}
              className="block rounded-2xl border border-line bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{formatDateTime(o.createdAt)}</span>
                <span>#{o.id}</span>
              </div>
              <div className="mt-3 flex -space-x-2 overflow-hidden pb-1">
                {o.items.slice(0, 6).map((it, i) => (
                  <ProductEmojiArt
                    key={`${it.productId}-${i}`}
                    emoji={it.emoji ?? '📦'}
                    className="h-10 w-10 rounded-xl text-xl ring-2 ring-white"
                  />
                ))}
                {o.items.length > 6 ? (
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg text-xs font-semibold text-muted ring-2 ring-white">
                    +{o.items.length - 6}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted line-clamp-1">
                  {o.deliveryCopy}
                </span>
                <span className="shrink-0 font-bold text-brand-pink">
                  {formatPrice(o.totalAmount)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          emoji="📦"
          title="你还没有下过单"
          description="快去剁手（虚拟）吧"
          actionLabel="去逛逛"
          onAction={() => {
            window.location.hash = ''
            window.location.href = '/'
          }}
        />
      )}
    </AppShell>
  )
}


