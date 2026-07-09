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
    // 商品是应用预置数据。每次启动同步种子字段，便于补图片等静态资产。
    await db.products.bulkPut(SEED_PRODUCTS)
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

