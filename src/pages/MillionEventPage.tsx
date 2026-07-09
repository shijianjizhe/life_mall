import html2canvas from 'html2canvas'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell, TopBar } from '../components/layout/AppShell'
import { ProductVisual } from '../components/product/ProductCard'
import { Button } from '../components/ui/Button'
import { db } from '../db'
import { CATEGORIES } from '../lib/constants'
import { cn, formatPrice } from '../lib/format'
import { downloadCanvasImage } from '../lib/share'
import { useAppStore } from '../stores/useAppStore'
import type { CategoryCode } from '../types'

const BUDGET = 1_000_000
const MILLION_LIST_KEY = 'millionChallengeList'

export function MillionEventPage() {
  const products = useAppStore((s) => s.products)
  const toast = useAppStore((s) => s.toast)
  const [category, setCategory] = useState<CategoryCode | 'all'>('all')
  const [list, setList] = useState<Record<string, number>>({})
  const [listLoaded, setListLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const posterRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let mounted = true
    void db.settings.get(MILLION_LIST_KEY).then((row) => {
      if (!mounted) return
      const saved = (row?.value as Record<string, number> | undefined) ?? {}
      setList(saved)
      setListLoaded(true)
    })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!listLoaded) return
    void db.settings.put({
      key: MILLION_LIST_KEY,
      value: list,
    })
  }, [list, listLoaded])
  const activeProducts = useMemo(
    () =>
      products.filter(
        (product) => product.isActive && (category === 'all' || product.categoryCode === category),
      ),
    [category, products],
  )

  const selectedLines = useMemo(
    () =>
      Object.entries(list)
        .map(([productId, quantity]) => {
          const product = products.find((entry) => entry.id === productId)
          return product ? { product, quantity } : null
        })
        .filter((line): line is NonNullable<typeof line> => Boolean(line)),
    [list, products],
  )

  const total = selectedLines.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  )
  const remaining = BUDGET - total
  const ratio = Math.min(1, total / BUDGET)
  const perfect = remaining >= 0 && remaining <= 1000
  const overspent = remaining < 0
  const progressColor = overspent ? '#FF5A5F' : ratio > 0.85 ? '#F59E0B' : '#B4FF39'

  useEffect(() => {
    if (!perfect || !selectedLines.length) return
    setCelebrate(true)
    const timer = window.setTimeout(() => setCelebrate(false), 1400)
    return () => window.clearTimeout(timer)
  }, [perfect, selectedLines.length])

  const add = (productId: string) => {
    setList((prev) => ({ ...prev, [productId]: (prev[productId] ?? 0) + 1 }))
  }

  const remove = (productId: string) => {
    setList((prev) => {
      const next = { ...prev }
      const value = (next[productId] ?? 0) - 1
      if (value <= 0) delete next[productId]
      else next[productId] = value
      return next
    })
  }

  const reset = () => {
    setList({})
    toast('100 万清单已清空')
  }

  const savePoster = async () => {
    if (!posterRef.current) return
    setBusy(true)
    try {
      const canvas = await html2canvas(posterRef.current, {
        backgroundColor: null,
        scale: 2,
      })
      await downloadCanvasImage(canvas, `lifemall-million-${Date.now()}.png`)
      toast('专题海报已生成')
    } catch {
      toast('生成失败，请稍后再试')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell>
      {celebrate ? (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-50 mx-auto h-36 max-w-lg overflow-hidden">
          {Array.from({ length: 18 }).map((_, index) => (
            <span
              key={index}
              className="absolute animate-bounce text-xl"
              style={{
                left: `${(index * 17) % 100}%`,
                top: `${(index * 13) % 48}%`,
                animationDelay: `${index * 0.05}s`,
              }}
            >
              {['🎊', '✨', '💰', '🎉'][index % 4]}
            </span>
          ))}
        </div>
      ) : null}
      <div className="bg-gradient-to-br from-[#1A1A2E] to-[#D4AF37] text-white">
        <TopBar title="如果你有 100 万" showBack />
        <div className="px-4 pb-5 pt-3">
          <div className="text-sm text-white/80">挑战预算</div>
          <div className="mt-1 text-4xl font-bold">{formatPrice(BUDGET)}</div>
          <p className="mt-2 text-sm text-white/85">如果给你 100 万，你会怎么花？</p>
        </div>
      </div>

      <div className="sticky top-12 z-20 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur">
        <div ref={posterRef} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-muted">剩余预算</div>
              <div className={cn('text-2xl font-bold', overspent ? 'text-danger' : 'text-brand-pink')}>
                {formatPrice(remaining)}
              </div>
            </div>
            <div className="text-right text-xs text-muted">
              已选 {selectedLines.reduce((sum, line) => sum + line.quantity, 0)} 件
              <br />
              合计 {formatPrice(total)}
            </div>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${ratio * 100}%`, backgroundColor: progressColor }}
            />
          </div>
          <div className="mt-3 min-h-5 text-sm font-medium">
            {perfect ? '财富自由挑战达成！预算花得刚刚好。' : null}
            {overspent ? '就知道你 managing money 能力不行，但没关系反正是假钱。' : null}
            {!perfect && !overspent ? '继续挑，平行宇宙的钱包正在为你撑腰。' : null}
          </div>
          {selectedLines.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selectedLines.slice(0, 12).map((line) => (
                <ProductVisual
                  key={line.product.id}
                  product={line.product}
                  className="h-9 w-9 rounded-xl text-lg ring-1 ring-line"
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 px-4 py-4 pb-8">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold',
              category === 'all' ? 'brand-gradient text-white' : 'bg-white text-muted ring-1 ring-line',
            )}
          >
            全部
          </button>
          {CATEGORIES.map((entry) => (
            <button
              key={entry.code}
              type="button"
              onClick={() => setCategory(entry.code)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold',
                category === entry.code
                  ? 'brand-gradient text-white'
                  : 'bg-white text-muted ring-1 ring-line',
              )}
            >
              {entry.emoji} {entry.name}
            </button>
          ))}
        </div>

        {selectedLines.length ? (
          <section className="rounded-2xl border border-line bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">我的 100 万清单</h2>
              <button type="button" className="text-xs text-danger" onClick={reset}>
                清空
              </button>
            </div>
            <div className="space-y-2">
              {selectedLines.map((line) => (
                <div key={line.product.id} className="flex items-center gap-2 rounded-xl bg-bg px-3 py-2 text-sm">
                  <ProductVisual product={line.product} className="h-10 w-10 shrink-0 rounded-xl text-lg" />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 font-medium">{line.product.name}</div>
                    <div className="text-xs text-muted">
                      {formatPrice(line.product.price)} × {line.quantity}
                    </div>
                  </div>
                  <button type="button" className="px-2 text-lg" onClick={() => remove(line.product.id)}>−</button>
                  <button type="button" className="px-2 text-lg" onClick={() => add(line.product.id)}>+</button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          {activeProducts.map((product) => (
            <div key={product.id} className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
              <Link to={`/product/${product.id}`}>
                <ProductVisual product={product} className="aspect-[4/3] text-5xl" />
              </Link>
              <div className="space-y-2 p-3">
                <Link to={`/product/${product.id}`} className="line-clamp-1 text-sm font-semibold">
                  {product.name}
                </Link>
                <div className="font-bold text-brand-pink">{formatPrice(product.price)}</div>
                <Button fullWidth size="sm" onClick={() => add(product.id)}>
                  加入清单
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button fullWidth size="lg" disabled={busy || !selectedLines.length} onClick={() => void savePoster()}>
          生成专题海报
        </Button>
      </div>
    </AppShell>
  )
}


