import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell, TopBar } from '../components/layout/AppShell'
import { ProductEmojiArt } from '../components/product/ProductCard'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { DELIVERY_COPIES } from '../data/copyPool'
import {
  CHECKOUT_LOADING_LINES,
  FAKE_ADDRESSES,
  FAKE_PAY_METHODS,
} from '../lib/constants'
import { formatPrice, pickRandom } from '../lib/format'
import { useAppStore } from '../stores/useAppStore'

export function CheckoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const checkoutProductId = searchParams.get('productId')
  const cartItems = useAppStore((s) => s.cartItems)
  const products = useAppStore((s) => s.products)
  const createOrder = useAppStore((s) => s.createOrder)
  const selected = cartItems.filter((i) =>
    i.selected && (!checkoutProductId || i.productId === checkoutProductId),
  )

  const [address, setAddress] = useState(FAKE_ADDRESSES[0]!)
  const [customAddress, setCustomAddress] = useState('')
  const [pay, setPay] = useState(FAKE_PAY_METHODS[0]!.id)
  const [paying, setPaying] = useState(false)
  const [loadingLine, setLoadingLine] = useState(CHECKOUT_LOADING_LINES[0]!)

  const lines = useMemo(
    () =>
      selected.map((item) => ({
        item,
        product: products.find((p) => p.id === item.productId),
      })),
    [selected, products],
  )

  const total = lines.reduce(
    (s, l) => s + (l.product?.price ?? 0) * l.item.quantity,
    0,
  )

  useEffect(() => {
    if (!paying) return
    const t = window.setInterval(() => {
      setLoadingLine(pickRandom(CHECKOUT_LOADING_LINES))
    }, 600)
    return () => window.clearInterval(t)
  }, [paying])

  if (!selected.length && !paying) {
    return (
      <AppShell showNav={false}>
        <TopBar title="结算" showBack />
        <EmptyState
          title="没有可结算的商品"
          actionLabel="回购物车"
          onAction={() => navigate('/cart')}
        />
      </AppShell>
    )
  }

  const confirmPay = async () => {
    setPaying(true)
    const duration = 1500 + Math.random() * 1000
    await new Promise((r) => setTimeout(r, duration))
    const orderId = await createOrder({
      items: selected,
      deliveryCopy: pickRandom(DELIVERY_COPIES),
      addressLabel: customAddress.trim() || address,
      payMethod:
        FAKE_PAY_METHODS.find((m) => m.id === pay)?.label ?? pay,
    })
    navigate(`/order/success/${orderId}`, { replace: true })
  }

  if (paying) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center bg-gradient-to-b from-purple-50 to-pink-50 px-6 text-center">
        <div className="mb-6 text-6xl animate-bounce">🛒</div>
        <div className="mb-4 h-2 w-48 overflow-hidden rounded-full bg-white">
          <div className="h-full w-2/3 animate-pulse brand-gradient" />
        </div>
        <p className="text-sm text-muted">{loadingLine}</p>
        <p className="mt-6 text-xs text-muted">虚拟支付中，请勿当真…</p>
      </div>
    )
  }

  return (
    <AppShell showNav={false}>
      <TopBar title="假结算" showBack />
      <div className="space-y-4 px-4 py-4 pb-28">
        <div className="rounded-2xl border border-line bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">订单摘要</h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {lines.map(({ item, product }) => (
              <div key={item.id} className="w-16 shrink-0 text-center">
                <ProductEmojiArt
                  emoji={product?.emoji ?? '❓'}
                  className="h-14 w-14 rounded-xl text-2xl"
                />
                <div className="mt-1 text-[10px] text-muted">x{item.quantity}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-right text-lg font-bold text-brand-pink">
            合计 {formatPrice(total)}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">收货地址（娱乐）</h2>
          <div className="space-y-2">
            {FAKE_ADDRESSES.map((a) => (
              <label
                key={a}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-bg px-3 py-2 text-sm"
              >
                <input
                  type="radio"
                  name="addr"
                  checked={address === a && !customAddress}
                  onChange={() => {
                    setAddress(a)
                    setCustomAddress('')
                  }}
                />
                {a}
              </label>
            ))}
            <input
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              placeholder="自定义：发往……"
              className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-pink"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">支付方式（假的）</h2>
          <div className="space-y-2">
            {FAKE_PAY_METHODS.map((m) => (
              <label
                key={m.id}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-bg px-3 py-2 text-sm"
              >
                <input
                  type="radio"
                  name="pay"
                  checked={pay === m.id}
                  onChange={() => setPay(m.id)}
                />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted">
          虚拟购物声明：本流程不产生真实扣款、不发货、不提供售后。
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-lg">
          <Button fullWidth size="lg" onClick={() => void confirmPay()}>
            确认支付 {formatPrice(total)}
          </Button>
        </div>
      </div>
    </AppShell>
  )
}

