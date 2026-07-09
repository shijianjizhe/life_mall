import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn, formatPrice } from '../../lib/format'
import { useAppStore } from '../../stores/useAppStore'
import type { Product } from '../../types'

export function ProductEmojiArt({
  emoji,
  className,
}: {
  emoji: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-gradient-to-br from-white to-[#f0ebe3] text-5xl',
        className,
      )}
    >
      <span className="select-none drop-shadow-sm">{emoji}</span>
    </div>
  )
}

export function ProductCard({
  product,
  themePriceClass,
  showAdd = true,
  onOpen,
  extraAction,
}: {
  product: Product
  themePriceClass?: string
  showAdd?: boolean
  onOpen?: (product: Product) => void
  extraAction?: ReactNode
}) {
  const addToCart = useAppStore((s) => s.addToCart)

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link
        to={`/product/${product.id}`}
        className="block"
        onClick={() => onOpen?.(product)}
      >
        <ProductEmojiArt
          emoji={product.emoji}
          className="aspect-[4/3] w-full text-5xl"
        />
        <div className="space-y-1 p-3">
          <h3 className="line-clamp-1 text-sm font-semibold text-ink">
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
            void addToCart(product.id)
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
  showAdd = true,
  onOpen,
  extraAction,
}: {
  products: Product[]
  themePriceClass?: string
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
          showAdd={showAdd}
          onOpen={onOpen}
          extraAction={extraAction?.(p)}
        />
      ))}
    </div>
  )
}
