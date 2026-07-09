import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell, TopBar } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { PageSpinner } from '../components/ui/EmptyState'
import { db } from '../db'
import { buildPersonalityReport } from '../lib/aiRoast'
import { CATEGORY_MAP } from '../lib/constants'
import { formatDateTime, formatPrice } from '../lib/format'
import { useAppStore } from '../stores/useAppStore'
import type { AiReport, CategoryCode } from '../types'

export function AiReportPage() {
  const products = useAppStore((s) => s.products)
  const orders = useAppStore((s) => s.orders)
  const favorites = useAppStore((s) => s.favorites)
  const cartItems = useAppStore((s) => s.cartItems)
  const toast = useAppStore((s) => s.toast)
  const [report, setReport] = useState<AiReport | null>(null)
  const [loading, setLoading] = useState(true)

  const stats = useMemo(() => {
    const productMap = new Map(products.map((product) => [product.id, product]))
    const categoryCount = new Map<CategoryCode, number>()

    const countProduct = (productId: string, weight = 1) => {
      const product = productMap.get(productId)
      if (!product) return
      categoryCount.set(
        product.categoryCode,
        (categoryCount.get(product.categoryCode) ?? 0) + weight,
      )
    }

    for (const order of orders) {
      for (const item of order.items) countProduct(item.productId, item.quantity)
    }
    for (const item of cartItems) countProduct(item.productId, item.quantity)
    for (const favorite of favorites) countProduct(favorite.productId)

    let topCategory: CategoryCode = 'abstract'
    let max = -1
    for (const [category, count] of categoryCount) {
      if (count > max) {
        max = count
        topCategory = category
      }
    }

    return {
      topCategoryName: CATEGORY_MAP[topCategory]?.name ?? '抽象商品',
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      favoriteCount: favorites.length,
      cartCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    }
  }, [cartItems, favorites, orders, products])

  const generate = async () => {
    const next = buildPersonalityReport(stats)
    const id = await db.aiReports.add({
      ...next,
      createdAt: new Date().toISOString(),
    })
    const saved = await db.aiReports.get(id as number)
    setReport(saved ?? null)
    toast('购物人格报告已生成')
  }

  useEffect(() => {
    let mounted = true
    void db.aiReports
      .orderBy('createdAt')
      .reverse()
      .first()
      .then(async (latest) => {
        if (!mounted) return
        if (latest) {
          setReport(latest)
        } else {
          await generate()
        }
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <AppShell showNav={false}>
        <TopBar title="购物人格报告" showBack />
        <PageSpinner label="正在分析你的购物车灵魂..." />
      </AppShell>
    )
  }

  return (
    <AppShell showNav={false}>
      <div className="brand-gradient text-white">
        <TopBar title="购物人格报告" showBack />
        <div className="px-4 pb-8 pt-5 text-center">
          <div className="text-5xl">🧬</div>
          <p className="mt-3 text-sm text-white/80">你的购物人格报告</p>
          <h1 className="mt-2 text-2xl font-bold leading-snug">
            {report?.title ?? '精神消费艺术家'}
          </h1>
        </div>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="snap-y snap-mandatory space-y-4">
        <section className="flex min-h-[58vh] snap-start flex-col justify-center rounded-2xl border border-line bg-white p-4 shadow-sm">
          <h2 className="font-semibold">数据切片</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
            {[
              ['偏爱分区', stats.topCategoryName],
              ['假下单', `${stats.totalOrders} 次`],
              ['虚拟消费', formatPrice(stats.totalSpent)],
              ['购物车常驻', `${stats.cartCount} 件`],
              ['收藏心动', `${stats.favoriteCount} 件`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-bg px-2 py-3">
                <div className="font-bold text-brand-pink">{value}</div>
                <div className="mt-1 text-muted">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-h-[58vh] snap-start flex-col justify-center rounded-2xl border border-line bg-white p-4 shadow-sm">
          <h2 className="font-semibold">人格解读</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/90">
            {report?.content}
          </p>
          {report?.createdAt ? (
            <p className="mt-3 text-xs text-muted">
              生成时间：{formatDateTime(report.createdAt)}
            </p>
          ) : null}
        </section>
        </div>

        <div className="grid grid-cols-2 gap-2 pb-4">
          <Link to="/share/poster?from=report">
            <Button fullWidth>生成分享图</Button>
          </Link>
          <Button variant="secondary" fullWidth onClick={() => void generate()}>
            重新测一次
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
