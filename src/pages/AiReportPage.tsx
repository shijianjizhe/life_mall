import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell, TopBar } from '../components/layout/AppShell'
import { ProductVisual } from '../components/product/ProductCard'
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
          const next = buildPersonalityReport(stats)
          const id = await db.aiReports.add({
            ...next,
            createdAt: new Date().toISOString(),
          })
          const saved = await db.aiReports.get(id as number)
          if (mounted) {
            setReport(saved ?? null)
            toast('购物人格报告已生成')
          }
        }
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [stats, toast])

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
      <TopBar title="购物人格报告" showBack />
      <div className="snap-y snap-mandatory space-y-4 px-4 py-4">
        <section className="flex min-h-[72vh] snap-start flex-col justify-center overflow-hidden rounded-2xl brand-gradient p-5 text-center text-white shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/18 text-5xl backdrop-blur">
            🧬
          </div>
          <p className="mt-5 text-sm text-white/80">你的购物人格报告</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight">正在分析购物车灵魂</h1>
          <div className="mx-auto mt-6 h-2 w-44 overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-4/5 animate-pulse rounded-full bg-white" />
          </div>
          <p className="mt-4 text-xs text-white/75">虚拟数据，本地生成，不上传服务器</p>
        </section>

        <section className="flex min-h-[72vh] snap-start flex-col justify-center rounded-2xl border border-line bg-white p-5 text-center shadow-sm">
          <ProductVisual emoji="🛍️" className="mx-auto h-28 w-28 rounded-3xl text-6xl shadow-sm ring-1 ring-line" />
          <p className="mt-5 text-sm text-muted">人格标题揭晓</p>
          <h2 className="mt-2 text-2xl font-bold leading-tight text-ink">
            {report?.title ?? '精神消费艺术家'}
          </h2>
          {report?.createdAt ? (
            <p className="mt-4 text-xs text-muted">
              生成时间：{formatDateTime(report.createdAt)}
            </p>
          ) : null}
        </section>

        <section className="flex min-h-[72vh] snap-start flex-col justify-center rounded-2xl border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-ink">数据支撑</h2>
          <p className="mt-1 text-sm text-muted">这些本地行为暴露了你的一点点想要</p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-center text-xs">
            {[
              ['偏爱分区', stats.topCategoryName],
              ['假下单', `${stats.totalOrders} 次`],
              ['虚拟消费', formatPrice(stats.totalSpent)],
              ['购物车常驻', `${stats.cartCount} 件`],
              ['收藏心动', `${stats.favoriteCount} 件`],
              ['报告来源', '本地 IndexedDB'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-bg px-2 py-4">
                <div className="break-words text-base font-bold text-brand-pink">{value}</div>
                <div className="mt-1 text-muted">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-h-[72vh] snap-start flex-col justify-center rounded-2xl border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-ink">人格点评</h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink/90">
            {report?.content}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Link to="/share/poster?from=report">
              <Button fullWidth>生成分享图</Button>
            </Link>
            <Button variant="secondary" fullWidth onClick={() => void generate()}>
              重新测一次
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
