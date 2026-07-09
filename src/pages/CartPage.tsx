import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell, TopBar } from '../components/layout/AppShell'
import { ProductEmojiArt } from '../components/product/ProductCard'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { roastFromProducts } from '../lib/aiRoast'
import { formatPrice, cn } from '../lib/format'
import { useAppStore } from '../stores/useAppStore'

export function CartPage() {
  const navigate = useNavigate()
  const cartItems = useAppStore((s) => s.cartItems)
  const products = useAppStore((s) => s.products)
  const setCartQty = useAppStore((s) => s.setCartQty)
  const toggleCartSelected = useAppStore((s) => s.toggleCartSelected)
  const setAllCartSelected = useAppStore((s) => s.setAllCartSelected)
  const removeCartItem = useAppStore((s) => s.removeCartItem)
  const clearCart = useAppStore((s) => s.clearCart)
  const total = useAppStore((s) => s.cartTotalSelected())
  const toast = useAppStore((s) => s.toast)
  const [swipedItemId, setSwipedItemId] = useState<number | null>(null)
  const swipeStart = useRef<{ id: number; x: number; y: number } | null>(null)

  const lines = useMemo(
    () =>
      cartItems.map((item) => ({
        item,
        product: products.find((p) => p.id === item.productId),
      })),
    [cartItems, products],
  )

  const roast = useMemo(
    () =>
      roastFromProducts(
        lines.map((l) => l.product).filter((p): p is NonNullable<typeof p> => !!p),
      ),
    [lines],
  )

  const allSelected =
    cartItems.length > 0 && cartItems.every((i) => i.selected)
  const selectedCount = cartItems
    .filter((i) => i.selected)
    .reduce((s, i) => s + i.quantity, 0)
  const exploded = cartItems.reduce((s, i) => s + i.quantity, 0) >= 8

  const handleSwipeEnd = (clientX: number, clientY: number) => {
    const start = swipeStart.current
    swipeStart.current = null
    if (!start) return
    const dx = clientX - start.x
    const dy = clientY - start.y
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.2) return
    if (dx < 0) setSwipedItemId(start.id)
    else setSwipedItemId((current) => (current === start.id ? null : current))
  }

  return (
    <AppShell>
      <TopBar
        title={`购物车（共 ${cartItems.reduce((s, i) => s + i.quantity, 0)} 件）`}
        right={
          cartItems.length ? (
            <button
              type="button"
              className="text-xs text-muted"
              onClick={() => {
                if (confirm('确定清空购物车？')) void clearCart()
              }}
            >
              清空
            </button>
          ) : null
        }
      />

      {exploded ? (
        <div className="bg-accent-lime px-4 py-2 text-center text-sm font-semibold text-black">
          你的购物车已突破天际🚀
        </div>
      ) : null}

      {cartItems.length ? (
        <>
          <div className="mx-4 mt-3 rounded-2xl border border-brand-purple/20 bg-brand-purple/5 px-3 py-2 text-sm text-ink">
            <span className="mr-1">🤖</span>
            {roast}
          </div>

          <div className="space-y-3 px-4 py-3 pb-28">
            {lines.map(({ item, product }) => (
              <div
                key={item.id}
                className="relative overflow-hidden rounded-2xl"
                onTouchStart={(event) => {
                  if (item.id == null) return
                  const touch = event.touches[0]
                  if (!touch) return
                  swipeStart.current = {
                    id: item.id,
                    x: touch.clientX,
                    y: touch.clientY,
                  }
                }}
                onTouchEnd={(event) => {
                  const touch = event.changedTouches[0]
                  if (!touch) return
                  handleSwipeEnd(touch.clientX, touch.clientY)
                }}
              >
                <button
                  type="button"
                  aria-label="删除购物车商品"
                  className="absolute inset-y-0 right-0 flex w-20 items-center justify-center rounded-2xl bg-danger text-sm font-semibold text-white"
                  onClick={() => item.id && void removeCartItem(item.id)}
                >
                  删除
                </button>
                <div
                  className={cn(
                    'relative flex gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm transition-transform duration-200 ease-out',
                    item.id === swipedItemId && '-translate-x-20',
                  )}
                >
                  <button
                    type="button"
                    className={cn(
                      'mt-4 h-5 w-5 shrink-0 rounded-md border',
                      item.selected
                        ? 'brand-gradient border-transparent'
                        : 'border-line bg-white',
                    )}
                    onClick={() => item.id && void toggleCartSelected(item.id)}
                  />
                  <ProductEmojiArt
                    emoji={product?.emoji ?? '❓'}
                    className="h-20 w-20 shrink-0 rounded-xl text-3xl"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/product/${item.productId}`}
                      className="line-clamp-1 font-semibold"
                    >
                      {product?.name ?? '商品信息丢失'}
                    </Link>
                    <div className="mt-1 text-sm font-bold text-brand-pink">
                      {formatPrice(product?.price ?? 0)}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-xl bg-bg ring-1 ring-line">
                        <button
                          type="button"
                          className="px-3 py-1 text-lg"
                          onClick={() =>
                            item.id &&
                            void setCartQty(item.id, item.quantity - 1)
                          }
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center text-sm">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="px-3 py-1 text-lg"
                          onClick={() =>
                            item.id &&
                            void setCartQty(item.id, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="text-xs text-danger"
                        onClick={() => item.id && void removeCartItem(item.id)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="fixed inset-x-0 bottom-14 z-30 border-t border-line bg-white/95 px-4 py-3 backdrop-blur">
            <div className="mx-auto flex max-w-lg items-center gap-3">
              <button
                type="button"
                className="flex items-center gap-2 text-sm"
                onClick={() => void setAllCartSelected(!allSelected)}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-md border text-[10px] text-white',
                    allSelected
                      ? 'brand-gradient border-transparent'
                      : 'border-line',
                  )}
                >
                  {allSelected ? '✓' : ''}
                </span>
                全选
              </button>
              <div className="flex-1 text-right">
                <span className="text-xs text-muted">合计 </span>
                <span className="text-lg font-bold text-brand-pink">
                  {formatPrice(total)}
                </span>
              </div>
              <Button
                disabled={selectedCount === 0}
                onClick={() => {
                  if (selectedCount === 0) {
                    toast('请先选择商品')
                    return
                  }
                  navigate('/checkout')
                }}
              >
                立即结算
              </Button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          emoji="🛒"
          title="购物车空空如也"
          description="快去挑几个不用还房贷的东西吧"
          actionLabel="去逛逛"
          onAction={() => navigate('/')}
        />
      )}
    </AppShell>
  )
}
