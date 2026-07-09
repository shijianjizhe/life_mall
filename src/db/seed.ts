import { FAKE_REVIEWS } from '../data/copyPool'
import { SEED_PRODUCTS } from '../data/products'
import type { UserProfile } from '../types'
import { db } from './index'

export async function ensureSeedData(): Promise<void> {
  const productCount = await db.products.count()
  if (productCount === 0) {
    await db.products.bulkPut(SEED_PRODUCTS)
    const copies = SEED_PRODUCTS.flatMap((product, i) => {
      const review = FAKE_REVIEWS[i % FAKE_REVIEWS.length]
      return [
        {
          productId: product.id,
          copyType: 'review' as const,
          content: review.content,
          authorName: review.authorName,
        },
        {
          productId: product.id,
          copyType: 'desc' as const,
          content: product.description,
          authorName: '人生商城小编',
        },
      ]
    })
    await db.productCopies.bulkAdd(copies)
  } else {
    // 种子升级：合并新商品，不覆盖用户数据
    const existingIds = new Set((await db.products.toArray()).map((p) => p.id))
    const missing = SEED_PRODUCTS.filter((p) => !existingIds.has(p.id))
    if (missing.length) {
      await db.products.bulkPut(missing)
    }
  }

  const profile = await db.userProfile.get('local-user')
  if (!profile) {
    const defaultProfile: UserProfile = {
      id: 'local-user',
      nickname: '快乐剁手人',
      avatarUrl: '',
      happyCoin: 0,
      joinedAt: new Date().toISOString(),
      onboardingCompleted: false,
    }
    await db.userProfile.put(defaultProfile)
  }

  const aiMode = await db.settings.get('aiAdvancedMode')
  if (!aiMode) {
    await db.settings.put({
      key: 'aiAdvancedMode',
      value: { enabled: false, apiKey: '', provider: 'anthropic' },
    })
  }
  if (!(await db.settings.get('lastBackupAt'))) {
    await db.settings.put({ key: 'lastBackupAt', value: null })
  }
  if (!(await db.settings.get('backupReminders'))) {
    await db.settings.put({
      key: 'backupReminders',
      value: { firstOrderShown: false, order5Shown: false, day3Shown: false },
    })
  }
  if (!(await db.settings.get('searchHistory'))) {
    await db.settings.put({ key: 'searchHistory', value: [] as string[] })
  }
  if (!(await db.settings.get('darkMode'))) {
    await db.settings.put({ key: 'darkMode', value: false })
  }
}

