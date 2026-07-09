import html2canvas from 'html2canvas'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AppShell, TopBar } from '../components/layout/AppShell'
import { ProductVisual } from '../components/product/ProductCard'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { db } from '../db'
import { cn } from '../lib/format'
import { safeVibrate } from '../lib/haptics'
import { downloadCanvasImage, shareCanvasImage, shareResultMessage } from '../lib/share'
import { useAppStore } from '../stores/useAppStore'
import type { Product, RoomItem } from '../types'

const ROOM_THEME_KEY = 'roomTheme'
const ITEM_SIZE = 64
const SNAP_THRESHOLD = 10

const themes = [
  { id: 'cozy', label: '简约风', className: 'from-[#FDE68A] via-[#FDF2F8] to-[#BAE6FD]' },
  { id: 'space', label: '太空舱', className: 'from-[#2E1F5E] via-[#1A1A2E] to-[#C0C0F0]' },
  { id: 'retro', label: '复古客厅', className: 'from-[#4ECDC4] via-[#FAF7F2] to-[#FF6B9D]' },
]

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function distance(a: { clientX: number; clientY: number }, b: { clientX: number; clientY: number }) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

export function RoomPage() {
  const products = useAppStore((s) => s.products)
  const orders = useAppStore((s) => s.orders)
  const toast = useAppStore((s) => s.toast)
  const [items, setItems] = useState<RoomItem[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [theme, setTheme] = useState(themes[0]!)
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState<{
    id: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)
  const [pinch, setPinch] = useState<{
    id: number
    startDistance: number
    startScale: number
  } | null>(null)
  const [guides, setGuides] = useState<{ x?: number; y?: number }>({})
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const itemsRef = useRef<RoomItem[]>([])
  const lastSnapVibrateAt = useRef(0)

  const ownedProducts = useMemo(() => {
    const ids = new Set<string>()
    for (const order of orders) {
      for (const item of order.items) ids.add(item.productId)
    }
    return [...ids]
      .map((id) => products.find((product) => product.id === id))
      .filter((product): product is Product => Boolean(product))
  }, [orders, products])

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  )

  const placedProductIds = useMemo(
    () => new Set(items.map((item) => item.productId)),
    [items],
  )

  const selected = selectedId
    ? items.find((item) => item.id === selectedId) ?? null
    : null

  const load = async () => {
    const rows = await db.roomItems.toArray()
    setItems(rows.sort((a, b) => a.zIndex - b.zIndex))
  }

  useEffect(() => {
    void load()
    void db.settings.get(ROOM_THEME_KEY).then((row) => {
      const id = row?.value as string | undefined
      const saved = themes.find((entry) => entry.id === id)
      if (saved) setTheme(saved)
    })
  }, [])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    if (!drag) return

    const move = (event: PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const rawX = clamp(drag.originX + event.clientX - drag.startX, 8, rect.width - ITEM_SIZE - 8)
      const rawY = clamp(drag.originY + event.clientY - drag.startY, 8, rect.height - ITEM_SIZE - 8)
      const { x: nextX, y: nextY, guides: nextGuides } = snapPosition(
        rawX,
        rawY,
        drag.id,
        rect.width,
        rect.height,
      )
      setGuides(nextGuides)
      setItems((prev) =>
        prev.map((item) =>
          item.id === drag.id
            ? { ...item, positionX: nextX, positionY: nextY }
            : item,
        ),
      )
    }

    const up = async () => {
      const item = itemsRef.current.find((entry) => entry.id === drag.id)
      if (item?.id != null) {
        await db.roomItems.update(item.id, {
          positionX: item.positionX,
          positionY: item.positionY,
        })
      }
      setDrag(null)
      setGuides({})
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up, { once: true })
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [drag])

  const snapPosition = (
    x: number,
    y: number,
    id: number,
    width: number,
    height: number,
  ) => {
    const centerX = x + ITEM_SIZE / 2
    const centerY = y + ITEM_SIZE / 2
    const canvasCenterX = width / 2
    const canvasCenterY = height / 2
    let nextX = x
    let nextY = y
    const nextGuides: { x?: number; y?: number } = {}

    if (Math.abs(centerX - canvasCenterX) <= SNAP_THRESHOLD) {
      nextX = canvasCenterX - ITEM_SIZE / 2
      nextGuides.x = canvasCenterX
    }
    if (Math.abs(centerY - canvasCenterY) <= SNAP_THRESHOLD) {
      nextY = canvasCenterY - ITEM_SIZE / 2
      nextGuides.y = canvasCenterY
    }

    for (const other of itemsRef.current) {
      if (other.id === id) continue
      const otherCenterX = other.positionX + ITEM_SIZE / 2
      const otherCenterY = other.positionY + ITEM_SIZE / 2
      if (Math.abs(centerX - otherCenterX) <= SNAP_THRESHOLD) {
        nextX = otherCenterX - ITEM_SIZE / 2
        nextGuides.x = otherCenterX
      }
      if (Math.abs(centerY - otherCenterY) <= SNAP_THRESHOLD) {
        nextY = otherCenterY - ITEM_SIZE / 2
        nextGuides.y = otherCenterY
      }
    }

    if (nextGuides.x != null || nextGuides.y != null) {
      const now = Date.now()
      if (now - lastSnapVibrateAt.current > 220) {
        safeVibrate(4)
        lastSnapVibrateAt.current = now
      }
    }
    return { x: nextX, y: nextY, guides: nextGuides }
  }

  const selectTheme = async (entry: (typeof themes)[number]) => {
    setTheme(entry)
    await db.settings.put({ key: ROOM_THEME_KEY, value: entry.id })
  }

  const addToRoom = async (product: Product) => {
    const nextIndex = items.length + 1
    const id = await db.roomItems.add({
      productId: product.id,
      positionX: 32 + (nextIndex % 4) * 48,
      positionY: 48 + (nextIndex % 3) * 42,
      scale: 1,
      zIndex: Date.now(),
    })
    await load()
    setSelectedId(id as number)
    safeVibrate(12)
    toast('已摆进虚拟房间')
  }

  const updateItemScale = async (id: number, scale: number) => {
    await updateItem(id, { scale: clamp(scale, 0.6, 2) })
  }

  const updateSelected = async (patch: Partial<RoomItem>) => {
    if (!selected?.id) return
    await db.roomItems.update(selected.id, patch)
    await load()
  }

  const updateItem = async (id: number, patch: Partial<RoomItem>) => {
    await db.roomItems.update(id, patch)
    await load()
  }

  const removeSelected = async () => {
    if (!selected?.id) return
    await db.roomItems.delete(selected.id)
    safeVibrate([8, 24, 8])
    setSelectedId(null)
    await load()
  }

  const captureRoom = async () => {
    if (!canvasRef.current) throw new Error('room missing')
    return html2canvas(canvasRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
    })
  }

  const saveRoomImage = async () => {
    setBusy(true)
    try {
      setSelectedId(null)
      await new Promise((resolve) => window.setTimeout(resolve, 30))
      const canvas = await captureRoom()
      await downloadCanvasImage(canvas, `lifemall-room-${Date.now()}.png`)
      toast('房间截图已生成')
    } catch {
      toast('生成失败，请稍后再试')
    } finally {
      setBusy(false)
    }
  }

  const shareRoom = async () => {
    setBusy(true)
    try {
      setSelectedId(null)
      await new Promise((resolve) => window.setTimeout(resolve, 30))
      const canvas = await captureRoom()
      const result = await shareCanvasImage({
        canvas,
        filename: 'lifemall-room.png',
        title: '我的人生商城虚拟房间',
        text: '我在 Life Mall 摆好了一个永远不会到货的虚拟房间。',
      })
      toast(shareResultMessage(result))
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      toast('分享失败，请稍后再试')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell showNav={false}>
      <TopBar title="虚拟房间" showBack />
      <div className="space-y-3 px-4 py-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {themes.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => void selectTheme(entry)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold',
                theme.id === entry.id
                  ? 'brand-gradient text-white'
                  : 'bg-white text-muted ring-1 ring-line',
              )}
            >
              {entry.label}
            </button>
          ))}
          <Button size="sm" variant="secondary" onClick={() => toast('房间布局已保存在本地')}>保存</Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => void saveRoomImage()}>保存图</Button>
          <Button size="sm" disabled={busy} onClick={() => void shareRoom()}>分享</Button>
        </div>

        <div
          ref={canvasRef}
          className={cn(
            'relative h-[440px] overflow-hidden rounded-2xl bg-gradient-to-br shadow-inner ring-1 ring-line touch-none',
            theme.className,
          )}
          onPointerDown={() => setSelectedId(null)}
        >
          <div className="absolute inset-x-6 bottom-10 h-28 rounded-[50%] bg-white/35 blur-sm" />
          <div className="absolute left-5 top-5 rounded-full bg-white/25 px-3 py-1 text-xs text-white backdrop-blur">
            已摆放 {items.length} 件
          </div>
          {guides.x != null ? (
            <div
              className="pointer-events-none absolute inset-y-0 w-px bg-brand-pink/80 shadow-[0_0_14px_rgba(255,107,157,0.8)]"
              style={{ left: guides.x }}
            />
          ) : null}
          {guides.y != null ? (
            <div
              className="pointer-events-none absolute inset-x-0 h-px bg-brand-pink/80 shadow-[0_0_14px_rgba(255,107,157,0.8)]"
              style={{ top: guides.y }}
            />
          ) : null}
          {items.map((item) => {
            const product = productMap.get(item.productId)
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  'absolute flex h-16 w-16 items-center justify-center rounded-2xl bg-white/90 text-3xl shadow-lg ring-2 transition active:scale-95',
                  selectedId === item.id ? 'ring-brand-pink' : 'ring-white/60',
                )}
                style={{
                  left: item.positionX,
                  top: item.positionY,
                  zIndex: item.zIndex,
                  transform: `scale(${item.scale})`,
                }}
                onPointerDown={(event) => {
                  event.stopPropagation()
                  if (!item.id) return
                  setSelectedId(item.id)
                  setPinch(null)
                  setDrag({
                    id: item.id,
                    startX: event.clientX,
                    startY: event.clientY,
                    originX: item.positionX,
                    originY: item.positionY,
                  })
                }}
                onWheel={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  if (!item.id) return
                  setSelectedId(item.id)
                  void updateItemScale(item.id, item.scale + (event.deltaY < 0 ? 0.08 : -0.08))
                }}
                onTouchStart={(event) => {
                  if (!item.id || event.touches.length !== 2) return
                  event.stopPropagation()
                  setDrag(null)
                  setSelectedId(item.id)
                  setPinch({
                    id: item.id,
                    startDistance: distance(event.touches[0]!, event.touches[1]!),
                    startScale: item.scale,
                  })
                }}
                onTouchMove={(event) => {
                  if (!pinch || pinch.id !== item.id || event.touches.length !== 2) return
                  event.preventDefault()
                  const nextScale = clamp(
                    pinch.startScale * (distance(event.touches[0]!, event.touches[1]!) / pinch.startDistance),
                    0.6,
                    2,
                  )
                  setItems((prev) =>
                    prev.map((entry) =>
                      entry.id === pinch.id ? { ...entry, scale: nextScale } : entry,
                    ),
                  )
                }}
                onTouchEnd={() => {
                  if (!pinch || pinch.id !== item.id) return
                  const next = itemsRef.current.find((entry) => entry.id === pinch.id)
                  setPinch(null)
                  if (next?.id != null) void db.roomItems.update(next.id, { scale: next.scale })
                }}
              >
                <ProductVisual
                  product={product}
                  emoji={product?.emoji ?? '📦'}
                  className="h-full w-full rounded-2xl text-3xl"
                />
              </button>
            )
          })}
        </div>

        {selected ? (
          <div className="rounded-2xl border border-line bg-white p-3 shadow-sm">
            <div className="mb-3 text-sm font-semibold">
              {productMap.get(selected.productId)?.emoji ?? '📦'}{' '}
              {productMap.get(selected.productId)?.name ?? '商品信息丢失'}
            </div>
            <div className="grid grid-cols-5 gap-2">
              <Button size="sm" variant="secondary" onClick={() => selected.id && void updateItemScale(selected.id, selected.scale - 0.1)}>缩小</Button>
              <Button size="sm" variant="secondary" onClick={() => selected.id && void updateItemScale(selected.id, selected.scale + 0.1)}>放大</Button>
              <Button size="sm" variant="secondary" onClick={() => void updateSelected({ zIndex: Date.now() })}>置顶</Button>
              <Button size="sm" variant="secondary" onClick={() => void updateSelected({ zIndex: Math.min(0, ...items.map((item) => item.zIndex)) - 1 })}>置底</Button>
              <Button size="sm" variant="danger" onClick={() => void removeSelected()}>删除</Button>
            </div>
          </div>
        ) : null}

        <section className="rounded-2xl border border-line bg-white p-3 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">已购素材栏</h2>
          {ownedProducts.length ? (
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
              {ownedProducts.map((product) => {
                const placed = placedProductIds.has(product.id)
                return (
                  <button
                    key={product.id}
                    type="button"
                    className={cn(
                      'relative w-20 shrink-0 text-center transition',
                      placed ? 'text-brand-pink' : 'opacity-60 grayscale',
                    )}
                    onClick={() => void addToRoom(product)}
                  >
                    <ProductVisual
                      product={product}
                      className={cn(
                        'h-16 rounded-2xl text-3xl',
                        placed ? 'ring-2 ring-brand-pink' : 'ring-1 ring-line',
                      )}
                    />
                    {placed ? (
                      <span className="absolute right-1 top-1 rounded-full bg-brand-pink px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        已摆
                      </span>
                    ) : null}
                    <div className="mt-1 line-clamp-1 text-[11px] text-muted">
                      {product.name}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <EmptyState
              emoji="📦"
              title="还没有可摆放的商品"
              description="先完成一笔假订单，再回来布置你的虚拟房间"
            />
          )}
        </section>
      </div>
    </AppShell>
  )
}


