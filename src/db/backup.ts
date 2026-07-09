import { SCHEMA_VERSION } from '../lib/constants'
import type { BackupPayload } from '../types'
import { db } from './index'
import { ensureSeedData } from './seed'

export async function exportBackup(): Promise<BackupPayload> {
  const [
    userProfile,
    cartItems,
    orders,
    favorites,
    checkins,
    aiReports,
    aiChatLogs,
    wishlistItems,
    roomItems,
    settings,
  ] = await Promise.all([
    db.userProfile.toArray(),
    db.cartItems.toArray(),
    db.orders.toArray(),
    db.favorites.toArray(),
    db.checkins.toArray(),
    db.aiReports.toArray(),
    db.aiChatLogs.toArray(),
    db.wishlistItems.toArray(),
    db.roomItems.toArray(),
    db.settings.toArray(),
  ])

  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      userProfile,
      cartItems,
      orders,
      favorites,
      checkins,
      aiReports,
      aiChatLogs,
      wishlistItems,
      roomItems,
      settings,
    },
  }
}

export function downloadBackupJson(payload: BackupPayload): void {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lifemall-backup-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const BACKUP_STORE_KEYS = [
  'userProfile',
  'cartItems',
  'orders',
  'favorites',
  'checkins',
  'aiReports',
  'aiChatLogs',
  'wishlistItems',
  'roomItems',
  'settings',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function assertObjectRows(rows: unknown[], store: string) {
  if (!rows.every(isRecord)) {
    throw new Error(`备份文件中 ${store} 数据格式无效`)
  }
}

function validateBackupPayload(payload: unknown): asserts payload is BackupPayload {
  if (!isRecord(payload)) {
    throw new Error('备份文件格式无效')
  }
  if (payload.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(
      `备份版本不兼容（文件 v${String(payload.schemaVersion)}，应用 v${SCHEMA_VERSION}），请更新应用后再导入`,
    )
  }
  if (!isRecord(payload.data)) {
    throw new Error('备份文件缺少 data 字段')
  }

  for (const key of BACKUP_STORE_KEYS) {
    const rows = payload.data[key]
    if (!Array.isArray(rows)) {
      throw new Error(`备份文件缺少 ${key} 数据数组`)
    }
    assertObjectRows(rows, key)
  }

  const data = payload.data as {
    userProfile: Record<string, unknown>[]
    cartItems: Record<string, unknown>[]
    orders: Record<string, unknown>[]
    favorites: Record<string, unknown>[]
    checkins: Record<string, unknown>[]
    aiReports: Record<string, unknown>[]
    aiChatLogs: Record<string, unknown>[]
    wishlistItems: Record<string, unknown>[]
    roomItems: Record<string, unknown>[]
    settings: Record<string, unknown>[]
  }

  for (const row of data.userProfile) {
    if (typeof row.id !== 'string') throw new Error('备份文件中 userProfile.id 无效')
  }
  for (const row of data.cartItems) {
    if (
      typeof row.productId !== 'string' ||
      typeof row.quantity !== 'number' ||
      typeof row.selected !== 'boolean'
    ) {
      throw new Error('备份文件中 cartItems 数据格式无效')
    }
  }
  for (const row of data.orders) {
    if (
      !Array.isArray(row.items) ||
      typeof row.totalAmount !== 'number' ||
      typeof row.deliveryCopy !== 'string' ||
      typeof row.createdAt !== 'string'
    ) {
      throw new Error('备份文件中 orders 数据格式无效')
    }
    for (const item of row.items) {
      if (
        !isRecord(item) ||
        typeof item.productId !== 'string' ||
        typeof item.nameSnapshot !== 'string' ||
        typeof item.priceSnapshot !== 'number' ||
        typeof item.quantity !== 'number'
      ) {
        throw new Error('备份文件中 orders.items 数据格式无效')
      }
    }
  }
  for (const row of data.favorites) {
    if (typeof row.productId !== 'string' || typeof row.createdAt !== 'string') {
      throw new Error('备份文件中 favorites 数据格式无效')
    }
  }
  for (const row of data.checkins) {
    if (
      typeof row.checkinDate !== 'string' ||
      typeof row.rewardCoin !== 'number' ||
      typeof row.streakDays !== 'number'
    ) {
      throw new Error('备份文件中 checkins 数据格式无效')
    }
  }
  for (const row of data.aiReports) {
    if (
      typeof row.title !== 'string' ||
      typeof row.content !== 'string' ||
      !isRecord(row.basedOnSnapshot) ||
      typeof row.createdAt !== 'string'
    ) {
      throw new Error('备份文件中 aiReports 数据格式无效')
    }
  }
  for (const row of data.aiChatLogs) {
    if (
      (row.productId != null && typeof row.productId !== 'string') ||
      (row.role !== 'user' && row.role !== 'assistant') ||
      typeof row.content !== 'string' ||
      typeof row.createdAt !== 'string'
    ) {
      throw new Error('备份文件中 aiChatLogs 数据格式无效')
    }
  }
  for (const row of data.wishlistItems) {
    if (
      (row.productId != null && typeof row.productId !== 'string') ||
      typeof row.customTitle !== 'string' ||
      typeof row.fulfilled !== 'boolean' ||
      typeof row.createdAt !== 'string'
    ) {
      throw new Error('备份文件中 wishlistItems 数据格式无效')
    }
  }
  for (const row of data.roomItems) {
    if (
      typeof row.productId !== 'string' ||
      typeof row.positionX !== 'number' ||
      typeof row.positionY !== 'number' ||
      typeof row.scale !== 'number' ||
      typeof row.zIndex !== 'number'
    ) {
      throw new Error('备份文件中 roomItems 数据格式无效')
    }
  }
  for (const row of data.settings) {
    if (typeof row.key !== 'string') throw new Error('备份文件中 settings.key 无效')
  }
}
export async function importBackup(payload: BackupPayload): Promise<void> {
  validateBackupPayload(payload)


  await db.transaction(
    'rw',
    [
      db.userProfile,
      db.cartItems,
      db.orders,
      db.favorites,
      db.checkins,
      db.aiReports,
      db.aiChatLogs,
      db.wishlistItems,
      db.roomItems,
      db.settings,
    ],
    async () => {
      await Promise.all([
        db.userProfile.clear(),
        db.cartItems.clear(),
        db.orders.clear(),
        db.favorites.clear(),
        db.checkins.clear(),
        db.aiReports.clear(),
        db.aiChatLogs.clear(),
        db.wishlistItems.clear(),
        db.roomItems.clear(),
        db.settings.clear(),
      ])

      const d = payload.data
      if (d.userProfile?.length) await db.userProfile.bulkPut(d.userProfile)
      if (d.cartItems?.length) await db.cartItems.bulkAdd(d.cartItems as never)
      if (d.orders?.length) await db.orders.bulkAdd(d.orders as never)
      if (d.favorites?.length) await db.favorites.bulkAdd(d.favorites as never)
      if (d.checkins?.length) await db.checkins.bulkAdd(d.checkins as never)
      if (d.aiReports?.length) await db.aiReports.bulkAdd(d.aiReports as never)
      if (d.aiChatLogs?.length) await db.aiChatLogs.bulkAdd(d.aiChatLogs as never)
      if (d.wishlistItems?.length)
        await db.wishlistItems.bulkAdd(d.wishlistItems as never)
      if (d.roomItems?.length) await db.roomItems.bulkAdd(d.roomItems as never)
      if (d.settings?.length) await db.settings.bulkPut(d.settings)
    },
  )

  await ensureSeedData()
  await db.settings.put({
    key: 'lastBackupAt',
    value: new Date().toISOString(),
  })
}

export async function clearUserData(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.userProfile,
      db.cartItems,
      db.orders,
      db.favorites,
      db.checkins,
      db.aiReports,
      db.aiChatLogs,
      db.wishlistItems,
      db.roomItems,
      db.settings,
    ],
    async () => {
      await Promise.all([
        db.userProfile.clear(),
        db.cartItems.clear(),
        db.orders.clear(),
        db.favorites.clear(),
        db.checkins.clear(),
        db.aiReports.clear(),
        db.aiChatLogs.clear(),
        db.wishlistItems.clear(),
        db.roomItems.clear(),
        db.settings.clear(),
      ])
    },
  )
  await ensureSeedData()
}


