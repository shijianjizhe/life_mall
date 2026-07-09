import { Link } from 'react-router-dom'
import { AppShell, TopBar } from '../components/layout/AppShell'
import { ProductGrid } from '../components/product/ProductCard'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { useAppStore } from '../stores/useAppStore'

export function FavoritesPage() {
  const favorites = useAppStore((s) => s.favorites)
  const products = useAppStore((s) => s.products)
  const toggleFavorite = useAppStore((s) => s.toggleFavorite)
  const list = favorites
    .map((f) => products.find((p) => p.id === f.productId))
    .filter((p): p is NonNullable<typeof p> => !!p)

  return (
    <AppShell>
      <div className="brand-gradient px-1 pb-2 text-white">
        <TopBar title={`我的收藏（${list.length}）`} showBack />
      </div>
      {list.length ? (
        <div className="relative px-4 py-4">
          <ProductGrid
            products={list}
            showAdd={false}
            extraAction={(product) => (
              <button
                type="button"
                aria-label="取消收藏"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-lg shadow-md ring-1 ring-line active:scale-95"
                onClick={() => void toggleFavorite(product.id)}
              >
                ❤️
              </button>
            )}
          />
          <Link to="/share/poster?from=favorites" className="fixed bottom-24 right-4 z-20 max-w-lg">
            <Button className="shadow-lg">一键生成收藏海报</Button>
          </Link>
        </div>
      ) : (
        <EmptyState
          emoji="💖"
          title="还没有心动的商品"
          description="去逛逛看有没有一见钟情的"
          actionLabel="去逛逛"
          onAction={() => {
            window.location.href = '/'
          }}
        />
      )}
    </AppShell>
  )
}
