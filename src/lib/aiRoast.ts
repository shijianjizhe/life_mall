import {
  AI_CHAT_REPLIES,
  CART_ROASTS,
  PRODUCT_ROASTS_BY_TAG,
} from '../data/copyPool'
import type { AiAdvancedMode, Product } from '../types'
import { pickRandom } from './format'
import { db } from '../db'

export function roastFromProducts(products: Product[]): string {
  if (!products.length) {
    return '购物车空空如也，快去挑几个不用还房贷的东西吧'
  }
  const tagCount = new Map<string, number>()
  for (const p of products) {
    for (const t of p.tags) {
      tagCount.set(t, (tagCount.get(t) ?? 0) + 1)
    }
  }
  let topTag = 'default'
  let max = 0
  for (const [tag, count] of tagCount) {
    if (count > max) {
      max = count
      topTag = tag
    }
  }
  const pool =
    PRODUCT_ROASTS_BY_TAG[topTag] ??
    PRODUCT_ROASTS_BY_TAG.default ??
    CART_ROASTS
  return pickRandom([...pool, ...CART_ROASTS])
}

export function localChatReply(userText: string, productName?: string): string {
  const text = userText.toLowerCase()
  if (text.includes('发货') || text.includes('物流')) {
    return '物流政策：永不发货，永久提供情绪价值。签收方式：会心一笑。'
  }
  if (text.includes('砍') || text.includes('便宜')) {
    return '已为您砍掉 100% 的真实付款压力，实付：0 元（假的也砍不动更低了）。'
  }
  if (text.includes('安慰') || text.includes('难过') || text.includes('emo')) {
    return '抱抱你。想买就加购，想哭就下单——反正不会扣款，你值得这点快乐。'
  }
  if (text.includes('好看') || text.includes('推荐')) {
    return productName
      ? `《${productName}》在平行宇宙好评如潮，建议先加购治疗一下。`
      : pickRandom(AI_CHAT_REPLIES)
  }
  return pickRandom(AI_CHAT_REPLIES)
}

export async function getAiMode(): Promise<AiAdvancedMode> {
  const row = await db.settings.get('aiAdvancedMode')
  const value = (row?.value ?? {
    enabled: false,
    apiKey: '',
    provider: 'anthropic',
  }) as AiAdvancedMode
  return value
}

/** 可选：用户自备 Key 时直连；失败则回退本地 */
export async function chatWithOptionalLlm(
  userText: string,
  productName?: string,
): Promise<string> {
  const mode = await getAiMode()
  if (!mode.enabled || !mode.apiKey?.trim()) {
    return localChatReply(userText, productName)
  }

  try {
    if (mode.provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mode.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                '你是「人生模拟商城」的损友风 AI 客服。幽默解压，明确这是虚拟购物不发货不收款。简短回复，中文。',
            },
            {
              role: 'user',
              content: productName
                ? `商品：${productName}\n用户：${userText}`
                : userText,
            },
          ],
          max_tokens: 200,
        }),
      })
      if (!res.ok) throw new Error('openai failed')
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>
      }
      return data.choices?.[0]?.message?.content?.trim() || localChatReply(userText, productName)
    }

    // anthropic
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': mode.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 200,
        system:
          '你是「人生模拟商城」的损友风 AI 客服。幽默解压，明确这是虚拟购物不发货不收款。简短回复，中文。',
        messages: [
          {
            role: 'user',
            content: productName
              ? `商品：${productName}\n用户：${userText}`
              : userText,
          },
        ],
      }),
    })
    if (!res.ok) throw new Error('anthropic failed')
    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>
    }
    const text = data.content?.find((c) => c.type === 'text')?.text
    return text?.trim() || localChatReply(userText, productName)
  } catch {
    return `${localChatReply(userText, productName)}\n（进阶 AI 暂不可用，已切换本地损友模式）`
  }
}

export function buildPersonalityReport(input: {
  topCategoryName: string
  totalOrders: number
  totalSpent: number
  favoriteCount: number
  cartCount: number
}): { title: string; content: string; basedOnSnapshot: Record<string, unknown> } {
  const titles = [
    `${input.topCategoryName}荷尔蒙过盛型购物人格`,
    `精神消费艺术家（${input.topCategoryName}专精）`,
    `平行宇宙剁手官 · ${input.topCategoryName}赛道`,
    `情绪价值收割机（爱逛${input.topCategoryName}）`,
  ]
  const title = pickRandom(titles)
  const content = [
    `你累计「假下单」${input.totalOrders} 次，虚拟花掉 ${Math.round(input.totalSpent).toLocaleString('zh-CN')} 元——钱包安全，心灵富裕。`,
    `你最常流连的分区是「${input.topCategoryName}」，说明你很清楚自己缺的不是东西，是一点被允许幻想的自由。`,
    `收藏 ${input.favoriteCount} 件，购物车常驻 ${input.cartCount} 件：你不是冲动，你是持续地、温柔地想要。`,
    `建议：继续逛。反正不会到货，但足够快乐。`,
  ].join('\n\n')

  return {
    title,
    content,
    basedOnSnapshot: { ...input, generatedAt: new Date().toISOString() },
  }
}
