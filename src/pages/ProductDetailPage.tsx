import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppShell, TopBar } from '../components/layout/AppShell'
import { ProductEmojiArt } from '../components/product/ProductCard'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { FAKE_REVIEWS } from '../data/copyPool'
import { db } from '../db'
import { CATEGORY_MAP } from '../lib/constants'
import { cn, formatPrice } from '../lib/format'
import { useAppStore } from '../stores/useAppStore'

type Visual =
  | { type: 'image'; value: string; label: string }
  | { type: 'emoji'; value: string; label: string }

const reviewAvatars = ['🙂', '😎', '🥹', '🤩', '✨']
const reviewTimes = ['刚刚购买', '3分钟前购买', '昨天购买', '7天前购买', '上个月购买']

export function ProductDetailPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const product = useAppStore((s) => s.getProduct(productId ?? ''))
  const addToCart = useAppStore((s) => s.addToCart)
  const toggleFavorite = useAppStore((s) => s.toggleFavorite)
  const refreshWishlist = useAppStore((s) => s.refreshWishlist)
  const toast = useAppStore((s) => s.toast)
  const isFavorite = useAppStore((s) => s.isFavorite(productId ?? ''))
  const [slide, setSlide] = useState(0)
  const [descExpanded, setDescExpanded] = useState(false)
  const visualTouchStartX = useRef<number | null>(null)

  const reviews = useMemo(() => {
    if (!product) return []
    const seed = product.id.charCodeAt(product.id.length - 1)
    return [0, 1, 2].map((i) => FAKE_REVIEWS[(seed + i) % FAKE_REVIEWS.length]!)
  }, [product])

  const visuals = useMemo<Visual[]>(() => {
    if (!product) return []
    const images = [product.mainImageUrl, ...product.galleryImages]
      .filter(Boolean)
      .map((value, index) => ({ type: 'image' as const, value, label: `图 ${index + 1}` }))
    if (images.length) return images
    const cat = CATEGORY_MAP[product.categoryCode]
    return [
      { type: 'emoji', value: product.emoji, label: '主图' },
      { type: 'emoji', value: cat?.emoji ?? product.emoji, label: cat?.name ?? '分区' },
      { type: 'emoji', value: product.tags.includes('热门') ? '🔥' : '✨', label: product.tags[0] ?? '标签' },
    ]
  }, [product])

  if (!product) {
    return (
      <AppShell showNav={false}>
        <TopBar title="商品" showBack />
        <EmptyState title="商品不存在或已下架" />
      </AppShell>
    )
  }

  const cat = CATEGORY_MAP[product.categoryCode]
  const activeVisual = visuals[slide] ?? visuals[0]

  const handleVisualTouchEnd = (clientX: number) => {
    if (visualTouchStartX.current == null || visuals.length <= 1) return
    const delta = clientX - visualTouchStartX.current
    visualTouchStartX.current = null
    if (Math.abs(delta) < 40) return
    setSlide((value) =>
      delta < 0
        ? (value + 1) % visuals.length
        : (value - 1 + visuals.length) % visuals.length,
    )
  }

  const buyNow = async () => {
    await addToCart(product.id, 1)
    navigate(`/checkout?productId=${product.id}`)
  }

  const addToWishlist = async () => {
    const existing = await db.wishlistItems.where('productId').equals(product.id).first()
    if (existing) {
      toast('梦想清单里已经有它了')
      return
    }
    await db.wishlistItems.add({
      productId: product.id,
      customTitle: product.name,
      fulfilled: false,
      createdAt: new Date().toISOString(),
    })
    await refreshWishlist()
    toast('已写进梦想清单')
  }

  return (
    <AppShell showNav={false}>
      <TopBar title="商品详情" showBack />
      <div
        className={cn('relative bg-gradient-to-br p-6', cat?.theme ?? 'from-brand-pink to-brand-purple')}
        onTouchStart={(event) => {
          visualTouchStartX.current = event.touches[0]?.clientX ?? null
        }}
        onTouchEnd={(event) => handleVisualTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
      >
        <div className="mx-auto max-w-xs">
          {activeVisual?.type === 'image' ? (
            <img
              src={activeVisual.value}
              alt={product.name}
              className="h-48 w-full rounded-3xl bg-white object-cover shadow-lg"
            />
          ) : (
            <ProductEmojiArt
              emoji={activeVisual?.value ?? product.emoji}
              className="h-48 w-full rounded-3xl text-7xl shadow-lg"
            />
          )}
        </div>
        {visuals.length > 1 ? (
          <>
            <button
              type="button"
              className="absolute left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-lg shadow"
              onClick={() => setSlide((value) => (value - 1 + visuals.length) % visuals.length)}
            >
              ‹
            </button>
            <button
              type="button"
              className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-lg shadow"
              onClick={() => setSlide((value) => (value + 1) % visuals.length)}
            >
              ›
            </button>
            <div className="mt-4 flex justify-center gap-2">
              {visuals.map((visual, index) => (
                <button
                  key={`${visual.label}-${index}`}
                  type="button"
                  aria-label={visual.label}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    index === slide ? 'w-6 bg-white' : 'w-2 bg-white/45',
                  )}
                  onClick={() => setSlide(index)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className="space-y-4 px-4 py-4 pb-28">
        <div>
          <h1 className="text-xl font-bold">{product.name}</h1>
          <p className="mt-1 text-3xl font-bold text-brand-pink">
            {formatPrice(product.price)}
          </p>
          <p className="mt-1 text-xs text-muted">{product.stockText}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {product.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-brand-purple/10 px-2 py-0.5 text-[11px] text-brand-purple"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">商品描述</h2>
            <Button size="sm" variant="secondary" onClick={() => void addToWishlist()}>
              写进梦想清单
            </Button>
          </div>
          <p
            className={cn(
              'text-sm leading-relaxed text-ink/90',
              !descExpanded && 'line-clamp-3',
            )}
          >
            {product.description}
          </p>
          <button
            type="button"
            className="mt-2 text-xs font-medium text-brand-pink"
            onClick={() => setDescExpanded((value) => !value)}
          >
            {descExpanded ? '收起描述' : '展开描述'}
          </button>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">买家秀（虚构）</h2>
          <div className="space-y-3">
            {reviews.map((r, i) => (
              <div key={i} className="rounded-2xl bg-bg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-base ring-1 ring-line">
                    {reviewAvatars[i % reviewAvatars.length]}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-brand-purple">
                      {r.authorName}
                    </div>
                    <div className="text-[11px] text-muted">
                      {reviewTimes[i % reviewTimes.length]}
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-ink">{r.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <button
            type="button"
            className={cn(
              'flex w-12 flex-col items-center text-xs transition active:scale-110',
              isFavorite ? 'text-danger' : 'text-muted',
            )}
            onClick={() => void toggleFavorite(product.id)}
          >
            <span className="text-xl">{isFavorite ? '❤️' : '🤍'}</span>
            收藏
          </button>
          <Link
            to={`/ai-chat/${product.id}`}
            className="flex w-12 flex-col items-center text-xs text-muted"
          >
            <span className="text-xl">💬</span>
            客服
          </Link>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => void addToCart(product.id)}
          >
            加入购物车
          </Button>
          <Button className="flex-1" onClick={() => void buyNow()}>
            立即下单
          </Button>
        </div>
      </div>
    </AppShell>
  )
}










