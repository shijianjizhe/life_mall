import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  AppShell,
  DisclaimerBanner,
  TopBar,
} from '../components/layout/AppShell'
import { ProductVisual } from '../components/product/ProductCard'
import { CATEGORIES, CATEGORY_MAP } from '../lib/constants'
import { formatPrice, todayYmd } from '../lib/format'
import { useAppStore } from '../stores/useAppStore'
import type { CategoryCode, Product } from '../types'

function hashText(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 9973
  }
  return hash
}

function pickTopCategory(scores: Map<CategoryCode, number>) {
  let top: CategoryCode | null = null
  let max = 0
  for (const [category, score] of scores) {
    if (score > max) {
      top = category
      max = score
    }
  }
  return top
}

export function HomePage() {
  const products = useAppStore((s) => s.products)
  const cartItems = useAppStore((s) => s.cartItems)
  const favorites = useAppStore((s) => s.favorites)
  const orders = useAppStore((s) => s.orders)

  const { recommended, topCategory } = useMemo(() => {
    const productMap = new Map(products.map((product) => [product.id, product]))
    const categoryScores = new Map<CategoryCode, number>()
    const productScores = new Map<string, number>()

    const add = (productId: string, weight: number) => {
      const product = productMap.get(productId)
      if (!product) return
      categoryScores.set(
        product.categoryCode,
        (categoryScores.get(product.categoryCode) ?? 0) + weight,
      )
      productScores.set(product.id, (productScores.get(product.id) ?? 0) + weight)
    }

    for (const item of cartItems) add(item.productId, item.quantity * 4)
    for (const favorite of favorites) add(favorite.productId, 3)
    for (const order of orders) {
      for (const item of order.items) add(item.productId, item.quantity * 2)
    }

    const dateKey = todayYmd()
    const sorted = products
      .filter((product) => product.isActive)
      .map((product) => {
        const categoryScore = categoryScores.get(product.categoryCode) ?? 0
        const productScore = productScores.get(product.id) ?? 0
        const hotScore = product.tags.includes('热门') ? 1.5 : 0
        const dailyScore = hashText(`${dateKey}-${product.id}`) / 10000
        return {
          product,
          score: categoryScore * 3 + productScore + hotScore + dailyScore,
        }
      })
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.product)
      .slice(0, 8)

    return {
      recommended: sorted,
      topCategory: pickTopCategory(categoryScores),
    }
  }, [cartItems, favorites, orders, products])

  const recommendationCopy = topCategory
    ? `根据你最近偏爱的「${CATEGORY_MAP[topCategory]?.name ?? '抽象商品'}」推荐`
    : '今天适合买点让自己开心的东西（反正不真扣钱）'

  return (
    <AppShell>
      <TopBar brand />
      <DisclaimerBanner />

      <div className="space-y-5 px-4 py-4">
        <Link
          to="/search"
          className="flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-muted shadow-sm"
        >
          <span>🔍</span>
          <span>想买点让自己开心的东西？</span>
        </Link>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">情绪分区</h2>
            <Link to="/checkin" className="text-sm text-brand-pink">
              每日签到 →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((c) => (
              <Link
                key={c.code}
                to={`/category/${c.code}`}
                className={cnCard(c.theme)}
              >
                <span className="text-3xl">{c.emoji}</span>
                <span className="mt-2 text-base font-bold">{c.name}</span>
                <span className="mt-1 text-xs text-white/80">{c.subtitle}</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-1 text-lg font-bold">今日推荐</h2>
          <p className="mb-3 text-xs text-muted">{recommendationCopy}</p>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {recommended.map((p: Product) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className="w-36 shrink-0 overflow-hidden rounded-2xl border border-line bg-white shadow-sm"
              >
                <ProductVisual product={p} className="h-24 text-4xl" />
                <div className="p-2">
                  <div className="line-clamp-1 text-xs font-semibold">{p.name}</div>
                  <div className="text-sm font-bold text-brand-pink">
                    {formatPrice(p.price)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <Link
          to="/event/million"
          className="block overflow-hidden rounded-2xl brand-gradient p-5 text-white shadow-md"
        >
          <div className="text-xs font-medium text-white/80">专题活动</div>
          <div className="mt-1 text-xl font-bold">如果你有 100 万</div>
          <div className="mt-1 text-sm text-white/90">
            你会怎么花？点进来挑战一下 →
          </div>
        </Link>

        <div className="grid grid-cols-2 gap-3 pb-2">
          <Link
            to="/ai-report"
            className="rounded-2xl border border-line bg-white p-4 shadow-sm"
          >
            <div className="text-2xl">🧬</div>
            <div className="mt-1 font-semibold">购物人格报告</div>
            <div className="text-xs text-muted">看看你被种草的样子</div>
          </Link>
          <Link
            to="/room"
            className="rounded-2xl border border-line bg-white p-4 shadow-sm"
          >
            <div className="text-2xl">🛋️</div>
            <div className="mt-1 font-semibold">虚拟房间</div>
            <div className="text-xs text-muted">把已购幻想摆进房间</div>
          </Link>
        </div>
      </div>
    </AppShell>
  )
}

function cnCard(theme: string) {
  return `flex min-h-[120px] flex-col items-start justify-end rounded-2xl bg-gradient-to-br ${theme} p-4 text-white shadow-md transition hover:scale-[1.02] active:scale-[0.98]`
}
