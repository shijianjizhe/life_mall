export type CategoryCode =
  | 'too_expensive'
  | 'childhood_dream'
  | 'impossible'
  | 'abstract'

export interface Product {
  id: string
  categoryCode: CategoryCode
  name: string
  price: number
  mainImageUrl: string
  galleryImages: string[]
  stockText: string
  description: string
  tags: string[]
  isActive: boolean
  emoji: string
}

export interface ProductCopy {
  id?: number
  productId: string
  copyType: 'review' | 'desc' | 'roast'
  content: string
  authorName: string
}

export interface CartItem {
  id?: number
  productId: string
  quantity: number
  selected: boolean
  addedAt: string
}

export interface OrderItemSnapshot {
  productId: string
  nameSnapshot: string
  priceSnapshot: number
  quantity: number
  emoji?: string
}

export interface Order {
  id?: number
  items: OrderItemSnapshot[]
  totalAmount: number
  status: 'paid_fake'
  deliveryStatus: 'never_delivered'
  deliveryCopy: string
  addressLabel: string
  payMethod: string
  createdAt: string
}

export interface Favorite {
  id?: number
  productId: string
  createdAt: string
}

export interface Checkin {
  id?: number
  checkinDate: string
  rewardCoin: number
  streakDays: number
}

export interface AiReport {
  id?: number
  title: string
  content: string
  basedOnSnapshot: Record<string, unknown>
  createdAt: string
}

export interface AiChatLog {
  id?: number
  productId?: string | null
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface WishlistItem {
  id?: number
  productId: string | null
  customTitle: string
  fulfilled: boolean
  createdAt: string
}

export interface RoomItem {
  id?: number
  productId: string
  positionX: number
  positionY: number
  scale: number
  zIndex: number
}

export interface UserProfile {
  id: 'local-user'
  nickname: string
  avatarUrl: string
  happyCoin: number
  joinedAt: string
  onboardingCompleted: boolean
}

export interface SettingRecord {
  key: string
  value: unknown
}

export interface AiAdvancedMode {
  enabled: boolean
  apiKey: string
  provider: 'anthropic' | 'openai'
}

export interface BackupPayload {
  schemaVersion: number
  exportedAt: string
  data: {
    userProfile: UserProfile[]
    cartItems: CartItem[]
    orders: Order[]
    favorites: Favorite[]
    checkins: Checkin[]
    aiReports: AiReport[]
    aiChatLogs: AiChatLog[]
    wishlistItems: WishlistItem[]
    roomItems: RoomItem[]
    settings: SettingRecord[]
  }
}

export interface CategoryMeta {
  code: CategoryCode
  name: string
  emoji: string
  subtitle: string
  theme: string
  cardClass?: string
  priceClass?: string
  pageClass?: string
}
