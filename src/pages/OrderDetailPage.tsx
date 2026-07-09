import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppShell, TopBar } from '../components/layout/AppShell'
import { ProductVisual } from '../components/product/ProductCard'
import { Button } from '../components/ui/Button'
import { EmptyState, PageSpinner } from '../components/ui/EmptyState'
import { db } from '../db'
import { formatDateTime, formatPrice } from '../lib/format'
import { useAppStore } from '../stores/useAppStore'
import type { Order } from '../types'

export function OrderDetailPage() {
  const { orderId } = useParams()
  const products = useAppStore((s) => s.products)
  const [order, setOrder] = useState<Order | null | undefined>(undefined)

  useEffect(() => {
    const id = Number(orderId)
    if (!Number.isFinite(id)) {
      setOrder(null)
      return
    }
    void db.orders.get(id).then((row) => setOrder(row ?? null))
  }, [orderId])

  if (order === undefined) {
    return (
      <AppShell showNav={false}>
        <TopBar title="订单详情" showBack />
        <PageSpinner />
      </AppShell>
    )
  }

  if (!order) {
    return (
      <AppShell showNav={false}>
        <TopBar title="订单详情" showBack />
        <EmptyState emoji="📦" title="订单不存在" description="这笔订单可能只存在于另一个平行宇宙" />
      </AppShell>
    )
  }

  return (
    <AppShell showNav={false}>
      <TopBar title="订单详情" showBack right={<span className="text-xs text-muted">#{order.id}</span>} />
      <div className="space-y-4 px-4 py-4 pb-8">
        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm text-muted">下单时间</div>
              <div className="mt-1 font-semibold">{formatDateTime(order.createdAt)}</div>
            </div>
            <span className="rounded-full bg-accent-lime px-3 py-1 text-xs font-semibold text-black">
              paid_fake
            </span>
          </div>
          <div className="mt-4 rounded-2xl bg-bg p-3 text-sm leading-relaxed text-ink">
            {order.deliveryCopy}
          </div>
          <p className="mt-3 text-xs text-muted">
            {order.addressLabel} · {order.payMethod} · 永不发货
          </p>
        </section>

        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">商品明细</h2>
          <div className="space-y-3">
            {order.items.map((item) => {
              const product = products.find((entry) => entry.id === item.productId)
              return (
                <Link
                  key={`${item.productId}-${item.nameSnapshot}`}
                  to={`/product/${item.productId}`}
                  className="flex items-center gap-3 rounded-2xl bg-bg p-3"
                >
                  <ProductVisual
                    product={product}
                    emoji={item.emoji ?? product?.emoji ?? '📦'}
                    className="h-16 w-16 shrink-0 rounded-xl text-2xl"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 text-sm font-semibold">
                      {item.nameSnapshot}
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      {formatPrice(item.priceSnapshot)} × {item.quantity}
                    </div>
                  </div>
                  <div className="shrink-0 text-sm font-bold text-brand-pink">
                    {formatPrice(item.priceSnapshot * item.quantity)}
                  </div>
                </Link>
              )
            })}
          </div>
          <div className="mt-4 flex justify-between border-t border-line pt-4 font-bold">
            <span>合计</span>
            <span className="text-brand-pink">{formatPrice(order.totalAmount)}</span>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <h2 className="font-semibold">虚拟购物声明</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            本订单仅用于娱乐和情绪价值，不涉及真实支付、发货、物流或售后服务。
          </p>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <Link to={`/share/poster?from=order&orderId=${order.id}`}>
            <Button fullWidth>生成海报</Button>
          </Link>
          <Link to="/orders">
            <Button fullWidth variant="secondary">返回订单</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  )
}

