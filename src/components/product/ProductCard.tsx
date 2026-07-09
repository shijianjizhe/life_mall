import { useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn, formatPrice } from '../../lib/format'
import { safeVibrate } from '../../lib/haptics'
import { useAppStore } from '../../stores/useAppStore'
import type { Product } from '../../types'

export function ProductEmojiArt({
  emoji,
  className,
}: {
  emoji: string
  className?: string
}) {
  return <ProductVisual emoji={emoji} className={className} />
}

export function ProductVisual({
  product,
  emoji,
  imageUrl,
  alt,
  className,
}: {
  product?: Product | null
  emoji?: string
  imageUrl?: string | null
  alt?: string
  className?: string
}) {
  const src = imageUrl ?? product?.mainImageUrl
  const label = alt ?? product?.name ?? '商品图'
  const fallbackEmoji = emoji ?? product?.emoji ?? '✨'
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(src) && !failed

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden bg-gradient-to-br from-white to-[#f0ebe3] text-5xl',
        className,
      )}
    >
      {showImage ? (
        <img
          src={src ?? ''}
          alt={label}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="select-none drop-shadow-sm">{fallbackEmoji}</span>
      )}
    </div>
  )
}

export function ProductCard({
  product,
  themePriceClass,
  cardClass,
  showAdd = true,
  onOpen,
  extraAction,
}: {
  product: Product
  themePriceClass?: string
  cardClass?: string
  showAdd?: boolean
  onOpen?: (product: Product) => void
  extraAction?: ReactNode
}) {
  const addToCart = useAppStore((s) => s.addToCart)
  const triggerCartFly = useAppStore((s) => s.triggerCartFly)
  const visualRef = useRef<HTMLDivElement | null>(null)

  const add = async () => {
    const rect = visualRef.current?.getBoundingClientRect()
    if (rect) {
      triggerCartFly({
        from: rect,
        imageUrl: product.mainImageUrl,
        emoji: product.emoji,
      })
    }
    safeVibrate(10)
    await addToCart(product.id)
  }

  return (
    <div className={cn('group relative overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md', cardClass)}>
      <Link
        to={`/product/${product.id}`}
        className="block"
        onClick={() => onOpen?.(product)}
      >
        <div ref={visualRef}>
          <ProductVisual
            product={product}
            className="aspect-[4/3] w-full text-5xl"
          />
        </div>
        <div className="space-y-1 p-3">
          <h3 className="line-clamp-1 text-sm font-semibold text-current">
            {product.name}
          </h3>
          <p
            className={cn(
              'text-base font-bold text-brand-pink',
              themePriceClass,
            )}
          >
            {formatPrice(product.price)}
          </p>
        </div>
      </Link>
      {extraAction ? <div className="absolute right-3 top-3 z-10">{extraAction}</div> : null}
      {showAdd ? (
        <button
          type="button"
          aria-label="加入购物车"
          onClick={(e) => {
            e.preventDefault()
            void add()
          }}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full brand-gradient text-lg font-bold text-white shadow-md transition active:scale-90"
        >
          +
        </button>
      ) : null}
    </div>
  )
}

export function ProductGrid({
  products,
  themePriceClass,
  cardClass,
  showAdd = true,
  onOpen,
  extraAction,
}: {
  products: Product[]
  themePriceClass?: string
  cardClass?: string
  showAdd?: boolean
  onOpen?: (product: Product) => void
  extraAction?: (product: Product) => ReactNode
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          themePriceClass={themePriceClass}
          cardClass={cardClass}
          showAdd={showAdd}
          onOpen={onOpen}
          extraAction={extraAction?.(p)}
        />
      ))}
    </div>
  )
}
