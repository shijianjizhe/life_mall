import { create } from 'zustand'
import { db } from '../db'
import { MAX_CART_QTY } from '../lib/constants'
import { ensureSeedData } from '../db/seed'
import type {
  AiAdvancedMode,
  CartItem,
  Favorite,
  Order,
  Product,
  UserProfile,
  WishlistItem,
} from '../types'

interface ToastItem {
  id: number
  message: string
}

export interface CartFlyRequest {
  id: number
  imageUrl?: string
  emoji: string
  from: DOMRectReadOnly
}

interface AppState {
  ready: boolean
  products: Product[]
  cartItems: CartItem[]
  favorites: Favorite[]
  orders: Order[]
  wishlist: WishlistItem[]
  profile: UserProfile | null
  aiMode: AiAdvancedMode
  toasts: ToastItem[]
  cartFly: CartFlyRequest | null
  hydrate: () => Promise<void>
  refreshCart: () => Promise<void>
  refreshFavorites: () => Promise<void>
  refreshOrders: () => Promise<void>
  refreshWishlist: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshAiMode: () => Promise<void>
  toast: (message: string) => void
  dismissToast: (id: number) => void
  triggerCartFly: (request: Omit<CartFlyRequest, 'id'>) => void
  clearCartFly: (id: number) => void
  getProduct: (id: string) => Product | undefined
  cartCount: () => number
  cartTotalSelected: () => number
  addToCart: (productId: string, qty?: number) => Promise<void>
  setCartQty: (id: number, quantity: number) => Promise<void>
  toggleCartSelected: (id: number) => Promise<void>
  setAllCartSelected: (selected: boolean) => Promise<void>
  removeCartItem: (id: number) => Promise<void>
  clearCart: () => Promise<void>
  toggleFavorite: (productId: string) => Promise<boolean>
  isFavorite: (productId: string) => boolean
  createOrder: (payload: {
    items: CartItem[]
    deliveryCopy: string
    addressLabel: string
    payMethod: string
  }) => Promise<number>
  completeOnboarding: () => Promise<void>
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>
  setAiMode: (mode: AiAdvancedMode) => Promise<void>
}

let toastSeq = 1
let cartFlySeq = 1

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  products: [],
  cartItems: [],
  favorites: [],
  orders: [],
  wishlist: [],
  profile: null,
  aiMode: { enabled: false, apiKey: '', provider: 'anthropic' },
  toasts: [],
  cartFly: null,

  hydrate: async () => {
    try {
      await ensureSeedData()
      const [products, cartItems, favorites, orders, wishlist, profile, aiRow] =
        await Promise.all([
          db.products.toArray(),
          db.cartItems.toArray(),
          db.favorites.toArray(),
          db.orders.orderBy('createdAt').reverse().toArray(),
          db.wishlistItems.orderBy('createdAt').reverse().toArray(),
          db.userProfile.get('local-user'),
          db.settings.get('aiAdvancedMode'),
        ])
      set({
        ready: true,
        products,
        cartItems,
        favorites,
        orders,
        wishlist,
        profile: profile ?? null,
        aiMode: (aiRow?.value as AiAdvancedMode) ?? {
          enabled: false,
          apiKey: '',
          provider: 'anthropic',
        },
      })
    } catch (e) {
      console.error(e)
      set({ ready: true })
      get().toast('本地数据库初始化异常，部分功能可能不可用（如隐私模式）')
    }
  },

  refreshCart: async () => {
    set({ cartItems: await db.cartItems.toArray() })
  },
  refreshFavorites: async () => {
    set({ favorites: await db.favorites.toArray() })
  },
  refreshOrders: async () => {
    set({
      orders: await db.orders.orderBy('createdAt').reverse().toArray(),
    })
  },
  refreshWishlist: async () => {
    set({
      wishlist: await db.wishlistItems.orderBy('createdAt').reverse().toArray(),
    })
  },
  refreshProfile: async () => {
    set({ profile: (await db.userProfile.get('local-user')) ?? null })
  },
  refreshAiMode: async () => {
    const row = await db.settings.get('aiAdvancedMode')
    set({
      aiMode: (row?.value as AiAdvancedMode) ?? {
        enabled: false,
        apiKey: '',
        provider: 'anthropic',
      },
    })
  },

  toast: (message) => {
    const id = toastSeq++
    set((s) => ({ toasts: [...s.toasts, { id, message }] }))
    window.setTimeout(() => get().dismissToast(id), 2600)
  },
  dismissToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },

  triggerCartFly: (request) => {
    set({ cartFly: { ...request, id: cartFlySeq++ } })
  },
  clearCartFly: (id) => {
    set((s) => (s.cartFly?.id === id ? { cartFly: null } : s))
  },

  getProduct: (id) => get().products.find((p) => p.id === id),

  cartCount: () =>
    get().cartItems.reduce((sum, i) => sum + i.quantity, 0),

  cartTotalSelected: () => {
    const { cartItems, products } = get()
    return cartItems
      .filter((i) => i.selected)
      .reduce((sum, i) => {
        const p = products.find((x) => x.id === i.productId)
        return sum + (p?.price ?? 0) * i.quantity
      }, 0)
  },

  addToCart: async (productId, qty = 1) => {
    const existing = await db.cartItems.where('productId').equals(productId).first()
    if (existing?.id != null) {
      const next = Math.min(MAX_CART_QTY, existing.quantity + qty)
      if (existing.quantity + qty > MAX_CART_QTY) get().toast('单个商品最多 ' + MAX_CART_QTY + ' 件')
      await db.cartItems.update(existing.id, { quantity: next, selected: true })
    } else {
      await db.cartItems.add({
        productId,
        quantity: Math.min(MAX_CART_QTY, qty),
        selected: true,
        addedAt: new Date().toISOString(),
      })
    }
    await get().refreshCart()
    get().toast('已加入购物车（这次是真的）')
  },

  setCartQty: async (id, quantity) => {
    const q = Math.max(1, Math.min(MAX_CART_QTY, quantity))
    if (quantity > MAX_CART_QTY) get().toast('单个商品最多 ' + MAX_CART_QTY + ' 件')
    await db.cartItems.update(id, { quantity: q })
    await get().refreshCart()
  },

  toggleCartSelected: async (id) => {
    const item = get().cartItems.find((i) => i.id === id)
    if (!item?.id) return
    await db.cartItems.update(id, { selected: !item.selected })
    await get().refreshCart()
  },

  setAllCartSelected: async (selected) => {
    const items = await db.cartItems.toArray()
    await Promise.all(
      items.map((i) =>
        i.id != null ? db.cartItems.update(i.id, { selected }) : Promise.resolve(),
      ),
    )
    await get().refreshCart()
  },

  removeCartItem: async (id) => {
    await db.cartItems.delete(id)
    await get().refreshCart()
  },

  clearCart: async () => {
    await db.cartItems.clear()
    await get().refreshCart()
  },

  toggleFavorite: async (productId) => {
    const existing = await db.favorites.where('productId').equals(productId).first()
    if (existing?.id != null) {
      await db.favorites.delete(existing.id)
      await get().refreshFavorites()
      get().toast('已取消收藏')
      return false
    }
    await db.favorites.add({
      productId,
      createdAt: new Date().toISOString(),
    })
    await get().refreshFavorites()
    get().toast('已加入心动收藏')
    return true
  },

  isFavorite: (productId) =>
    get().favorites.some((f) => f.productId === productId),

  createOrder: async ({ items, deliveryCopy, addressLabel, payMethod }) => {
    const { products } = get()
    const selected = items.filter((i) => i.selected)
    const snapshots = selected.map((i) => {
      const p = products.find((x) => x.id === i.productId)
      return {
        productId: i.productId,
        nameSnapshot: p?.name ?? '商品信息丢失',
        priceSnapshot: p?.price ?? 0,
        quantity: i.quantity,
        emoji: p?.emoji,
      }
    })
    const totalAmount = snapshots.reduce(
      (s, i) => s + i.priceSnapshot * i.quantity,
      0,
    )
    const orderId = await db.orders.add({
      items: snapshots,
      totalAmount,
      status: 'paid_fake',
      deliveryStatus: 'never_delivered',
      deliveryCopy,
      addressLabel,
      payMethod,
      createdAt: new Date().toISOString(),
    })
    const selectedIds = selected.map((i) => i.id).filter((id): id is number => id != null)
    await db.cartItems.bulkDelete(selectedIds)
    await Promise.all([get().refreshCart(), get().refreshOrders()])
    return orderId as number
  },

  completeOnboarding: async () => {
    const profile = await db.userProfile.get('local-user')
    if (!profile) return
    await db.userProfile.put({ ...profile, onboardingCompleted: true })
    await get().refreshProfile()
  },

  updateProfile: async (patch) => {
    const profile = await db.userProfile.get('local-user')
    if (!profile) return
    await db.userProfile.put({ ...profile, ...patch, id: 'local-user' })
    await get().refreshProfile()
  },

  setAiMode: async (mode) => {
    await db.settings.put({ key: 'aiAdvancedMode', value: mode })
    set({ aiMode: mode })
  },
}))


