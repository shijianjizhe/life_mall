import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppShell, TopBar } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { EmptyState, PageSpinner } from '../components/ui/EmptyState'
import { db } from '../db'
import { BACKUP_ORDER_THRESHOLD } from '../lib/constants'
import { formatPrice } from '../lib/format'
import { useAppStore } from '../stores/useAppStore'
import type { Order } from '../types'

type BackupReason = 'first' | 'threshold' | null

export function OrderSuccessPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState<Order | null | undefined>(undefined)
  const [backupReason, setBackupReason] = useState<BackupReason>(null)
  const orders = useAppStore((s) => s.orders)
  const toast = useAppStore((s) => s.toast)

  useEffect(() => {
    const id = Number(orderId)
    void db.orders.get(id).then(async (o) => {
      setOrder(o ?? null)
      if (!o) return
      const totalOrders = await db.orders.count()
      const reminders =
        ((await db.settings.get('backupReminders'))?.value as {
          firstOrderShown?: boolean
          order5Shown?: boolean
          day3Shown?: boolean
        }) ?? {}
      if (totalOrders === 1 && !reminders.firstOrderShown) {
        setBackupReason('first')
        await db.settings.put({
          key: 'backupReminders',
          value: { ...reminders, firstOrderShown: true },
        })
      } else if (totalOrders >= BACKUP_ORDER_THRESHOLD && !reminders.order5Shown) {
        setBackupReason('threshold')
        toast(`已累计下单 ${BACKUP_ORDER_THRESHOLD} 次，建议备份你的购物车小宇宙~`)
        await db.settings.put({
          key: 'backupReminders',
          value: { ...reminders, order5Shown: true },
        })
      }
    })
  }, [orderId, toast])

  if (order === undefined) {
    return (
      <AppShell showNav={false}>
        <PageSpinner />
      </AppShell>
    )
  }

  if (!order) {
    return (
      <AppShell showNav={false}>
        <TopBar title="订单" showBack />
        <EmptyState title="订单不存在" />
      </AppShell>
    )
  }

  const backupTitle =
    backupReason === 'threshold'
      ? `已累计下单 ${BACKUP_ORDER_THRESHOLD} 次！`
      : '第一单达成！'
  const backupDescription =
    backupReason === 'threshold'
      ? '你已经攒了不少本地战绩，建议现在导出一份备份，以防清缓存丢失。'
      : '建议现在就备份一下你的购物车小宇宙，以防清缓存丢失。'

  return (
    <AppShell showNav={false}>
      <div className="relative min-h-full overflow-hidden brand-gradient text-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className="absolute animate-bounce text-lg opacity-80"
              style={{
                left: `${(i * 17) % 100}%`,
                top: `${(i * 13) % 40}%`,
                animationDelay: `${i * 0.08}s`,
              }}
            >
              {['🎊', '✨', '🎉', '💫'][i % 4]}
            </span>
          ))}
        </div>

        <TopBar
          title="下单成功"
          showBack
          right={<span className="text-xs text-white/80">#{order.id}</span>}
        />

        <div className="relative space-y-4 px-4 py-6">
          <div className="text-center">
            <div className="text-5xl">✅</div>
            <h1 className="mt-3 text-3xl font-bold">订单成功！🎉</h1>
            <p className="mt-3 rounded-2xl bg-white/15 px-4 py-3 text-base font-medium backdrop-blur">
              {order.deliveryCopy}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 text-ink shadow-lg">
            <div className="text-sm text-muted">订单摘要</div>
            <div className="mt-2 space-y-1">
              {order.items.map((it, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>
                    {it.emoji ?? ''} {it.nameSnapshot} ×{it.quantity}
                  </span>
                  <span>{formatPrice(it.priceSnapshot * it.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between border-t border-line pt-3 font-bold">
              <span>合计</span>
              <span className="text-brand-pink">
                {formatPrice(order.totalAmount)}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted">
              {order.addressLabel} · {order.payMethod}
            </p>
          </div>

          {backupReason ? (
            <div className="rounded-2xl bg-white p-4 text-ink shadow-lg">
              <div className="font-semibold">{backupTitle}</div>
              <p className="mt-1 text-sm text-muted">{backupDescription}</p>
              <Link to="/backup" className="mt-3 block">
                <Button fullWidth>去备份</Button>
              </Link>
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-2">
            <Link to={`/share/poster?from=order&orderId=${order.id}`}>
              <Button variant="secondary" fullWidth className="text-xs!">
                生成海报
              </Button>
            </Link>
            <Link to="/">
              <Button variant="secondary" fullWidth className="text-xs!">
                继续逛
              </Button>
            </Link>
            <Link to="/orders">
              <Button variant="secondary" fullWidth className="text-xs!">
                历史订单
              </Button>
            </Link>
          </div>

          <p className="text-center text-xs text-white/80">
            虚拟购物 · 不发货 · 不收款 · 数据仅存本地
          </p>
          <p className="text-center text-[11px] text-white/60">
            当前共 {orders.length} 笔假订单
          </p>
        </div>
      </div>
    </AppShell>
  )
}

