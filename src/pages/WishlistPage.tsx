import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell, TopBar } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { db } from '../db'
import { formatDateTime, cn } from '../lib/format'
import { useAppStore } from '../stores/useAppStore'

export function WishlistPage() {
  const wishlist = useAppStore((s) => s.wishlist)
  const products = useAppStore((s) => s.products)
  const refreshWishlist = useAppStore((s) => s.refreshWishlist)
  const toast = useAppStore((s) => s.toast)
  const [title, setTitle] = useState('')
  const [open, setOpen] = useState(false)
  const [productId, setProductId] = useState('')
  const [celebrate, setCelebrate] = useState(false)

  const add = async () => {
    const customTitle = title.trim()
    if (!customTitle && !productId) {
      toast('请输入愿望或选择商品')
      return
    }
    const product = products.find((p) => p.id === productId)
    await db.wishlistItems.add({
      productId: productId || null,
      customTitle: customTitle || product?.name || '未命名愿望',
      fulfilled: false,
      createdAt: new Date().toISOString(),
    })
    setTitle('')
    setProductId('')
    setOpen(false)
    await refreshWishlist()
    toast('愿望已写入星空清单 ✨')
  }

  const toggleFulfilled = async (id: number, fulfilled: boolean) => {
    await db.wishlistItems.update(id, { fulfilled: !fulfilled })
    await refreshWishlist()
    if (!fulfilled) {
      toast('已标记实现！虚拟意义上的自我鼓励 🎉')
      setCelebrate(true)
      window.setTimeout(() => setCelebrate(false), 1400)
    }
  }

  const remove = async (id: number) => {
    await db.wishlistItems.delete(id)
    await refreshWishlist()
  }

  return (
    <AppShell>
      {celebrate ? (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-50 mx-auto h-32 max-w-lg overflow-hidden">
          {Array.from({ length: 14 }).map((_, index) => (
            <span
              key={index}
              className="absolute animate-bounce text-xl"
              style={{
                left: `${(index * 23) % 100}%`,
                top: `${(index * 13) % 45}%`,
                animationDelay: `${index * 0.05}s`,
              }}
            >
              {['🎉', '✨', '⭐', '💫'][index % 4]}
            </span>
          ))}
        </div>
      ) : null}
      <div className="bg-gradient-to-br from-[#2E1F5E] to-[#C0C0F0] text-white">
        <TopBar title="梦想清单 ✨" showBack />
        <p className="px-4 pb-4 text-sm text-white/85">
          写下你想拥有的一切，不管多离谱
        </p>
      </div>

      <div className="space-y-3 px-4 py-4 pb-28">
        {wishlist.length ? (
          wishlist.map((w) => {
            const product = w.productId
              ? products.find((p) => p.id === w.productId)
              : null
            return (
              <div
                key={w.id}
                className={cn(
                  'rounded-2xl border border-line bg-white p-4 shadow-sm',
                  w.fulfilled && 'opacity-70',
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{product?.emoji ?? '⭐'}</span>
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        'font-semibold',
                        w.fulfilled && 'line-through text-muted',
                      )}
                    >
                      {w.customTitle}
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      {formatDateTime(w.createdAt)}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant={w.fulfilled ? 'secondary' : 'primary'}
                        onClick={() =>
                          w.id != null && void toggleFulfilled(w.id, w.fulfilled)
                        }
                      >
                        {w.fulfilled ? '取消实现' : '标记已实现'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => w.id != null && void remove(w.id)}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <EmptyState
            emoji="🌌"
            title="清单还是空的"
            description="加一个离谱愿望开始吧"
          />
        )}
      </div>

      <div className="fixed inset-x-0 bottom-14 z-30 px-4 pb-3">
        <div className={cn('mx-auto grid max-w-lg gap-2', wishlist.length ? 'grid-cols-2' : 'grid-cols-1')}>
          <Button fullWidth size="lg" onClick={() => setOpen(true)}>
            + 添加新愿望
          </Button>
          {wishlist.length ? (
            <Link to="/share/poster?from=wishlist">
              <Button fullWidth size="lg" variant="secondary">
                生成海报
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold">新愿望</h3>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：环游世界 / 买套海景房"
              className="mt-3 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-pink"
            />
            <label className="mt-3 block text-xs text-muted">或关联商品</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm"
            >
              <option value="">不关联</option>
              {products.slice(0, 40).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.emoji} {p.name}
                </option>
              ))}
            </select>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button fullWidth onClick={() => void add()}>
                添加
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}


