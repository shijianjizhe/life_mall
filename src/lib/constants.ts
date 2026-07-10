import type { CategoryMeta } from '../types'

export const APP_NAME = '人生模拟商城'
export const SLOGAN = '永远不会到货，但足够快乐'
export const SCHEMA_VERSION = 1
export const MAX_CART_QTY = 99
export const BACKUP_ORDER_THRESHOLD = 5
export const BACKUP_DAYS_THRESHOLD = 3

export const CATEGORIES: CategoryMeta[] = [
  {
    code: 'too_expensive',
    name: '现实买不起',
    emoji: '😂',
    subtitle: '看看就好，别当真',
    theme: 'from-[#1A1A2E] to-[#D4AF37]',
    cardClass: 'border-[#D4AF37]/55 bg-[#1A1A2E] text-white shadow-[0_10px_24px_rgba(26,26,46,0.18)]',
    priceClass: 'text-[#D4AF37]',
    pageClass: 'bg-[#f8f3e5]',
  },
  {
    code: 'childhood_dream',
    name: '小时候梦想',
    emoji: '🧸',
    subtitle: '给童年的自己补一张订单',
    theme: 'from-[#4ECDC4] to-[#FFE66D]',
    cardClass: 'rounded-3xl border-[#4ECDC4]/35 bg-[#fffdf2]',
    priceClass: 'text-[#FF6B9D]',
    pageClass: 'bg-[#f3fffb]',
  },
  {
    code: 'impossible',
    name: '不可能拥有',
    emoji: '🌕',
    subtitle: '平行宇宙专供',
    theme: 'from-[#2E1F5E] to-[#C0C0F0]',
    cardClass: 'border-[#C0C0F0]/45 bg-[#24194d] text-white shadow-[0_10px_24px_rgba(46,31,94,0.2)]',
    priceClass: 'text-[#C0C0F0]',
    pageClass: 'bg-[#f2f0ff]',
  },
  {
    code: 'abstract',
    name: '抽象商品',
    emoji: '✨',
    subtitle: '能加购就很抽象了',
    theme: 'from-[#0A0A0A] to-[#B4FF39]',
    cardClass: 'border-[#B4FF39]/70 bg-[#0A0A0A] text-white shadow-[0_0_0_1px_rgba(180,255,57,0.25)]',
    priceClass: 'text-[#B4FF39]',
    pageClass: 'bg-[#f5ffe8]',
  },
]

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.code, c]),
) as Record<string, CategoryMeta>

export const FAKE_ADDRESSES = [
  '发往：我的心里',
  '发往：内心深处的平行宇宙',
  '发往：下辈子的快递柜',
  '发往：梦里的海景房',
]

export const FAKE_PAY_METHODS = [
  { id: 'huabei', label: '💰 花呗' },
  { id: 'silver', label: '🪙 碎银子' },
  { id: 'youth', label: '🌸 青春' },
  { id: 'nextlife', label: '😅 下辈子还' },
]

export const CHECKOUT_LOADING_LINES = [
  '正在联系永远不会来的快递员……',
  '正在确认虚拟支付……',
  '正在生成“预计永不送达”面单……',
  '正在把快乐装进购物车……',
  '正在通知平行宇宙仓库……',
]

export const HOT_KEYWORDS = [
  '保时捷',
  '别墅',
  '乐高',
  '好运',
  '月球',
  '时间',
  'PS6',
  '海景房',
]
