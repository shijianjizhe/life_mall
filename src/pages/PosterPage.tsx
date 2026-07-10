import html2canvas from 'html2canvas'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppShell, TopBar } from '../components/layout/AppShell'
import { ProductVisual } from '../components/product/ProductCard'
import { Button } from '../components/ui/Button'
import { db } from '../db'
import { CATEGORY_MAP } from '../lib/constants'
import { cn, formatDateTime, formatPrice } from '../lib/format'
import { downloadCanvasImage, shareCanvasImage, shareResultMessage } from '../lib/share'
import { useAppStore } from '../stores/useAppStore'
import type { AiReport, Order, Product } from '../types'

type Template = 'cart' | 'favorite' | 'annual' | 'dream' | 'order'

const templates: Array<{ id: Template; label: string }> = [
  { id: 'cart', label: '购物车画像' },
  { id: 'favorite', label: '收藏夹海报' },
  { id: 'annual', label: '年度账单' },
  { id: 'dream', label: '梦想清单' },
  { id: 'order', label: '订单战绩' },
]

export function PosterPage() {
  const [searchParams] = useSearchParams()
  const products = useAppStore((s) => s.products)
  const cartItems = useAppStore((s) => s.cartItems)
  const favorites = useAppStore((s) => s.favorites)
  const orders = useAppStore((s) => s.orders)
  const wishlist = useAppStore((s) => s.wishlist)
  const toast = useAppStore((s) => s.toast)
  const orderIdParam = searchParams.get('orderId')
  const [template, setTemplate] = useState<Template>(() => {
    const from = searchParams.get('from')
    if (from === 'order') return 'order'
    if (from === 'report') return 'annual'
    if (from === 'wishlist') return 'dream'
    if (from === 'favorites') return 'favorite'
    return 'cart'
  })
  const [busy, setBusy] = useState(false)
  const [report, setReport] = useState<AiReport | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const posterRef = useRef<HTMLDivElement | null>(null)

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  )

  useEffect(() => {
    void db.aiReports.orderBy('createdAt').reverse().first().then((latest) => {
      setReport(latest ?? null)
    })
  }, [])

  useEffect(() => {
    const id = Number(orderIdParam)
    if (!orderIdParam || !Number.isFinite(id)) {
      setSelectedOrder(null)
      return
    }
    void db.orders.get(id).then((order) => setSelectedOrder(order ?? null))
  }, [orderIdParam])

  const posterOrder = selectedOrder ?? (template === 'order' ? orders[0] ?? null : null)
  const favoriteProducts = favorites
    .map((favorite) => productMap.get(favorite.productId))
    .filter((product): product is Product => Boolean(product))
  const cartProducts = cartItems
    .map((item) => productMap.get(item.productId))
    .filter((product): product is Product => Boolean(product))
  const sourceProducts = favoriteProducts.length ? favoriteProducts : cartProducts

  const topCategory = useMemo(() => {
    const count = new Map<string, number>()
    for (const product of sourceProducts) {
      count.set(product.categoryCode, (count.get(product.categoryCode) ?? 0) + 1)
    }
    let top = sourceProducts[0]?.categoryCode ?? 'abstract'
    let max = -1
    for (const [category, value] of count) {
      if (value > max) {
        max = value
        top = category as Product['categoryCode']
      }
    }
    return CATEGORY_MAP[top]?.name ?? '抽象商品'
  }, [sourceProducts])

  const orderTotal = orders.reduce((sum, order) => sum + order.totalAmount, 0)
  const cartTotal = cartItems.reduce((sum, item) => {
    const product = productMap.get(item.productId)
    return sum + (product?.price ?? 0) * item.quantity
  }, 0)
  const posterOrderCount = posterOrder?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
  const hasPosterItems =
    template === 'dream'
      ? wishlist.length > 0
      : template === 'order'
        ? Boolean(posterOrder?.items.length)
        : sourceProducts.length > 0

  const capture = async () => {
    if (!posterRef.current) throw new Error('poster missing')
    return html2canvas(posterRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
    })
  }

  const save = async () => {
    setBusy(true)
    try {
      const canvas = await capture()
      await downloadCanvasImage(canvas, `lifemall-poster-${Date.now()}.png`)
      toast('海报已生成')
    } catch {
      toast('生成失败，请稍后再试')
    } finally {
      setBusy(false)
    }
  }

  const share = async () => {
    setBusy(true)
    try {
      const canvas = await capture()
      const result = await shareCanvasImage({
        canvas,
        filename: 'lifemall-poster.png',
        title: '人生模拟商城战绩',
        text: '我的人生模拟商城战绩：永远不会到货，但足够快乐。',
      })
      toast(shareResultMessage(result))
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      toast('分享失败，请稍后再试')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell showNav={false}>
      <TopBar title="生成分享海报" showBack />
      <div className="space-y-4 px-4 py-4 pb-28">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {templates.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTemplate(entry.id)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold',
                template === entry.id
                  ? 'brand-gradient text-white'
                  : 'bg-white text-muted ring-1 ring-line',
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <div
            ref={posterRef}
            className={cn(
              'w-full max-w-[360px] overflow-hidden rounded-2xl p-6 shadow-lg',
              template === 'cart' && 'bg-gradient-to-br from-[#FF6B9D] to-[#A855F7] text-white',
              template === 'favorite' && 'bg-gradient-to-br from-[#FF6B9D] to-[#FFE66D] text-white',
              template === 'annual' && 'bg-gradient-to-br from-[#1A1A2E] to-[#D4AF37] text-white',
              template === 'dream' && 'bg-gradient-to-br from-[#2E1F5E] to-[#C0C0F0] text-white',
              template === 'order' && 'bg-gradient-to-br from-[#0A0A0A] to-[#B4FF39] text-white',
            )}
          >
            <div className="text-xs opacity-75">Life Mall</div>
            <h1 className="mt-2 text-2xl font-bold leading-tight">
              {template === 'cart' && '我的购物车画像'}
              {template === 'favorite' && '我的心动收藏'}
              {template === 'annual' && (report?.title ?? '我的年度精神账单')}
              {template === 'dream' && '我的梦想清单'}
              {template === 'order' && '我的订单战绩'}
            </h1>
            <p className="mt-2 text-sm opacity-85">
              永远不会到货，但足够快乐
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {template === 'cart' ? (
                <>
                  <PosterStat label="购物车合计" value={formatPrice(cartTotal)} />
                  <PosterStat label="心动分类" value={topCategory} />
                </>
              ) : null}
              {template === 'favorite' ? (
                <>
                  <PosterStat label="心动收藏" value={`${favorites.length} 件`} />
                  <PosterStat label="心动分类" value={topCategory} />
                </>
              ) : null}
              {template === 'annual' ? (
                <>
                  <PosterStat label="下单" value={`${orders.length} 次`} />
                  <PosterStat label="虚拟消费" value={formatPrice(orderTotal)} />
                </>
              ) : null}
              {template === 'dream' ? (
                <>
                  <PosterStat label="愿望数量" value={`${wishlist.length} 个`} />
                  <PosterStat label="收藏数量" value={`${favorites.length} 件`} />
                </>
              ) : null}
              {template === 'order' ? (
                <>
                  <PosterStat label="订单金额" value={formatPrice(posterOrder?.totalAmount ?? 0)} />
                  <PosterStat label="商品数量" value={`${posterOrderCount} 件`} />
                </>
              ) : null}
            </div>

            {template === 'order' && posterOrder ? (
              <p className="mt-4 rounded-2xl bg-white/16 px-4 py-3 text-sm leading-relaxed opacity-95 backdrop-blur">
                #{posterOrder.id} · {formatDateTime(posterOrder.createdAt)}
                <br />
                {posterOrder.deliveryCopy}
              </p>
            ) : null}

            <div className="mt-6 rounded-2xl bg-white/16 p-4 backdrop-blur">
              <div className="mb-3 text-sm font-semibold opacity-90">
                {template === 'dream'
                  ? '愿望摘录'
                  : template === 'order'
                    ? '订单商品'
                    : template === 'favorite'
                      ? '收藏商品'
                      : '代表商品'}
              </div>
              {hasPosterItems ? (
                <div className="grid grid-cols-4 gap-2 text-center">
                  {template === 'dream'
                  ? wishlist.slice(0, 8).map((item) => (
                      <div key={item.id} className="rounded-xl bg-white/20 px-1 py-2">
                        <PosterThumb
                          product={item.productId ? productMap.get(item.productId) : null}
                          emoji={item.productId ? productMap.get(item.productId)?.emoji ?? '⭐' : '⭐'}
                        />
                        <div className="mt-1 line-clamp-1 text-[10px] opacity-90">
                          {item.customTitle}
                        </div>
                      </div>
                    ))
                  : template === 'order'
                    ? (posterOrder?.items ?? []).slice(0, 8).map((item, index) => (
                        <div key={`${item.productId}-${index}`} className="rounded-xl bg-white/20 px-1 py-2">
                          <PosterThumb
                            product={productMap.get(item.productId)}
                            emoji={item.emoji ?? productMap.get(item.productId)?.emoji ?? '📦'}
                          />
                          <div className="mt-1 line-clamp-1 text-[10px] opacity-90">
                            {item.nameSnapshot}
                          </div>
                        </div>
                      ))
                    : sourceProducts.slice(0, 8).map((product) => (
                        <div key={product.id} className="rounded-xl bg-white/20 px-1 py-2">
                          <PosterThumb product={product} emoji={product.emoji} />
                          <div className="mt-1 line-clamp-1 text-[10px] opacity-90">
                            {product.name}
                          </div>
                        </div>
                      ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-white/20 px-4 py-6 text-center">
                  <div className="text-4xl">
                    {template === 'cart' && '🛒'}
                    {template === 'favorite' && '💖'}
                    {template === 'annual' && '🧾'}
                    {template === 'dream' && '⭐'}
                    {template === 'order' && '📦'}
                  </div>
                  <p className="mt-3 text-sm font-semibold opacity-95">
                    {template === 'cart' && '购物车还在等第一个幻想'}
                    {template === 'favorite' && '心动收藏还没开始发光'}
                    {template === 'annual' && '年度账单正在攒素材'}
                    {template === 'dream' && '梦想清单还留着第一颗星'}
                    {template === 'order' && '订单战绩尚未解锁'}
                  </p>
                  <p className="mt-1 text-xs opacity-75">先保存这张空状态，也很有纪念意义。</p>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-white/25 pt-4 text-xs opacity-75">
              虚拟购物 · 不收款 · 不发货 · 数据仅存本地
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-2 gap-2">
          <Button fullWidth disabled={busy} onClick={() => void save()}>
            保存图片
          </Button>
          <Button fullWidth variant="secondary" disabled={busy} onClick={() => void share()}>
            分享
          </Button>
        </div>
      </div>
    </AppShell>
  )
}

function PosterStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/18 p-3 backdrop-blur">
      <div className="text-base font-bold">{value}</div>
      <div className="mt-1 text-[11px] opacity-75">{label}</div>
    </div>
  )
}

function PosterThumb({
  product,
  emoji,
}: {
  product?: Product | null
  emoji: string
}) {
  return (
    <ProductVisual
      product={product}
      emoji={emoji}
      className="mx-auto h-10 w-10 rounded-xl bg-white/80 text-lg"
    />
  )
}
