import { useEffect, useMemo, useState } from 'react'
import { AppShell, TopBar } from '../components/layout/AppShell'
import { ProductGrid } from '../components/product/ProductCard'
import { EmptyState } from '../components/ui/EmptyState'
import { HOT_KEYWORDS } from '../lib/constants'
import { db } from '../db'
import { useAppStore } from '../stores/useAppStore'
import { cn } from '../lib/format'

export function SearchPage() {
  const products = useAppStore((s) => s.products)
  const [q, setQ] = useState('')
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    void db.settings.get('searchHistory').then((row) => {
      setHistory((row?.value as string[]) ?? [])
    })
  }, [])

  const results = useMemo(() => {
    const keyword = q.trim().toLowerCase()
    if (!keyword) return []
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(keyword) ||
        p.tags.some((t) => t.toLowerCase().includes(keyword)) ||
        p.description.toLowerCase().includes(keyword),
    )
  }, [q, products])

  const saveHistory = async (term: string) => {
    const t = term.trim()
    if (!t) return
    const next = [t, ...history.filter((h) => h !== t)].slice(0, 8)
    setHistory(next)
    await db.settings.put({ key: 'searchHistory', value: next })
  }

  return (
    <AppShell showNav={false}>
      <TopBar
        title="搜索"
        showBack
        right={
          <button
            type="button"
            className="text-sm text-muted"
            onClick={() => window.history.back()}
          >
            取消
          </button>
        }
      />
      <div className="px-4 py-3">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void saveHistory(q)
          }}
          placeholder="想买点让自己开心的东西？"
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none ring-brand-pink focus:ring-2"
        />

        {!q.trim() ? (
          <div className="mt-5 space-y-5">
            {history.length ? (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">搜索历史</h3>
                  <button
                    type="button"
                    className="text-xs text-muted"
                    onClick={() => {
                      setHistory([])
                      void db.settings.put({ key: 'searchHistory', value: [] })
                    }}
                  >
                    清空
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setQ(h)}
                      className="rounded-full bg-white px-3 py-1.5 text-xs ring-1 ring-line"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <h3 className="mb-2 text-sm font-semibold">猜你想搜</h3>
              <div className="flex flex-wrap gap-2">
                {HOT_KEYWORDS.map((k, i) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setQ(k)
                      void saveHistory(k)
                    }}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-medium text-white',
                      i % 4 === 0 && 'bg-[#D4AF37]',
                      i % 4 === 1 && 'bg-[#4ECDC4]',
                      i % 4 === 2 && 'bg-[#2E1F5E]',
                      i % 4 === 3 && 'bg-[#0A0A0A] text-accent-lime',
                    )}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : results.length ? (
          <div className="mt-4">
            <p className="mb-3 text-xs text-muted">找到 {results.length} 件</p>
            <ProductGrid products={results} onOpen={() => void saveHistory(q)} />
          </div>
        ) : (
          <EmptyState
            emoji="🔎"
            title="没有找到相关商品"
            description="换个关键词，或者直接去分区瞎逛"
          />
        )}
      </div>
    </AppShell>
  )
}

