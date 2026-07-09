import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppShell, TopBar } from '../components/layout/AppShell'
import { ProductGrid } from '../components/product/ProductCard'
import { EmptyState } from '../components/ui/EmptyState'
import { CATEGORY_MAP } from '../lib/constants'
import { cn } from '../lib/format'
import { useAppStore } from '../stores/useAppStore'
import type { CategoryCode } from '../types'

type SortKey = 'default' | 'price_asc' | 'price_desc' | 'want'

const PAGE = 12

export function CategoryPage() {
  const { categoryCode = 'too_expensive' } = useParams()
  const meta = CATEGORY_MAP[categoryCode]
  const products = useAppStore((s) => s.products)
  const [sort, setSort] = useState<SortKey>('default')
  const [page, setPage] = useState(1)

  const list = useMemo(() => {
    let arr = products.filter(
      (p) => p.categoryCode === (categoryCode as CategoryCode) && p.isActive,
    )
    if (sort === 'price_asc') arr = [...arr].sort((a, b) => a.price - b.price)
    if (sort === 'price_desc') arr = [...arr].sort((a, b) => b.price - a.price)
    if (sort === 'want')
      arr = [...arr].sort(
        (a, b) =>
          Number(b.tags.includes('热门')) - Number(a.tags.includes('热门')),
      )
    return arr
  }, [products, categoryCode, sort])

  const visible = list.slice(0, page * PAGE)
  const hasMore = visible.length < list.length

  if (!meta) {
    return (
      <AppShell>
        <TopBar title="分类" showBack />
        <EmptyState title="未知分区" description="这个星球还不存在" />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className={cn('bg-gradient-to-br text-white', meta.theme)}>
        <TopBar
          title={`${meta.emoji} ${meta.name}`}
          showBack
          right={<span className="text-xs text-white/80">{list.length} 件</span>}
        />
        <div className="px-4 pb-5 pt-2">
          <p className="text-sm text-white/85">{meta.subtitle}</p>
        </div>
      </div>

      <div className={cn('px-4 py-3', meta.pageClass)}>
        <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {(
            [
              ['default', '默认'],
              ['price_asc', '价格↑'],
              ['price_desc', '价格↓'],
              ['want', '最想要'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setSort(k)
                setPage(1)
              }}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium',
                sort === k
                  ? 'brand-gradient text-white'
                  : 'bg-white text-muted ring-1 ring-line',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {visible.length ? (
          <>
            <ProductGrid
              products={visible}
              themePriceClass={meta.priceClass}
              cardClass={meta.cardClass}
            />
            {hasMore ? (
              <button
                type="button"
                className="mt-4 w-full rounded-2xl bg-white py-3 text-sm text-muted ring-1 ring-line"
                onClick={() => setPage((p) => p + 1)}
              >
                加载更多
              </button>
            ) : (
              <p className="py-6 text-center text-xs text-muted">
                已经逛到底啦，去别的分区看看？
              </p>
            )}
          </>
        ) : (
          <EmptyState
            emoji="🪐"
            title="这个星球的商品还在路上"
            description="稍后再来，或者换个分区"
          />
        )}
      </div>
    </AppShell>
  )
}
