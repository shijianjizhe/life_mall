import Dexie, { type Table } from 'dexie'
import type {
  AiChatLog,
  AiReport,
  CartItem,
  Checkin,
  Favorite,
  Order,
  Product,
  ProductCopy,
  RoomItem,
  SettingRecord,
  UserProfile,
  WishlistItem,
} from '../types'

export class LifeMallDB extends Dexie {
  userProfile!: Table<UserProfile, string>
  products!: Table<Product, string>
  productCopies!: Table<ProductCopy, number>
  cartItems!: Table<CartItem, number>
  orders!: Table<Order, number>
  favorites!: Table<Favorite, number>
  checkins!: Table<Checkin, number>
  aiReports!: Table<AiReport, number>
  aiChatLogs!: Table<AiChatLog, number>
  wishlistItems!: Table<WishlistItem, number>
  roomItems!: Table<RoomItem, number>
  settings!: Table<SettingRecord, string>

  constructor() {
    super('LifeMallDB')
    this.version(1).stores({
      userProfile: 'id',
      products: 'id, categoryCode',
      productCopies: '++id, productId, copyType',
      cartItems: '++id, productId',
      orders: '++id, createdAt',
      favorites: '++id, productId',
      checkins: '++id, checkinDate',
      aiReports: '++id, createdAt',
      aiChatLogs: '++id, productId, createdAt',
      wishlistItems: '++id, productId',
      roomItems: '++id, productId',
      settings: 'key',
    })
  }
}

export const db = new LifeMallDB()
