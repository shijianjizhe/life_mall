import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { SLOGAN } from '../lib/constants'
import { cn } from '../lib/format'
import { useAppStore } from '../stores/useAppStore'

const slides = [
  {
    emoji: '🛒✨',
    title: '人生模拟商城',
    desc: SLOGAN,
  },
  {
    emoji: '👀 → ➕ → 💳 → 🎉',
    title: '怎么玩',
    desc: '逛分区 → 加购 → 下单 → 领取情绪价值。全程不扣款、不发货。',
  },
  {
    emoji: '💾',
    title: '数据只在这台设备',
    desc: '购物车、订单、收藏都保存在浏览器本地。清缓存会丢，记得常备份哦。',
  },
]

export function OnboardingPage() {
  const [idx, setIdx] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const navigate = useNavigate()
  const completeOnboarding = useAppStore((s) => s.completeOnboarding)
  const slide = slides[idx]!
  const last = idx === slides.length - 1

  const finish = async () => {
    await completeOnboarding()
    navigate('/', { replace: true })
  }

  const goNext = () => setIdx((value) => Math.min(slides.length - 1, value + 1))
  const goPrev = () => setIdx((value) => Math.max(0, value - 1))

  const handleTouchEnd = (clientX: number) => {
    if (touchStartX.current == null) return
    const delta = clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 40) return
    if (delta < 0) goNext()
    else goPrev()
  }

  return (
    <div
      className="flex min-h-full flex-col brand-gradient text-white"
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null
      }}
      onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
    >
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="mb-6 text-5xl">{slide.emoji}</div>
        <h1 className="text-3xl font-bold">{slide.title}</h1>
        <p className="mt-4 max-w-sm text-base/relaxed text-white/90">{slide.desc}</p>
      </div>
      <div className="space-y-4 px-6 pb-12">
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`第${i + 1}屏`}
              onClick={() => setIdx(i)}
              className={cn(
                'h-2 rounded-full transition-all',
                i === idx ? 'w-6 bg-white' : 'w-2 bg-white/40',
              )}
            />
          ))}
        </div>
        {last ? (
          <Button
            fullWidth
            size="lg"
            className="bg-white! text-brand-purple! shadow-none"
            onClick={() => void finish()}
          >
            开始逛
          </Button>
        ) : (
          <Button
            fullWidth
            size="lg"
            className="bg-white! text-brand-purple! shadow-none"
            onClick={goNext}
          >
            下一步
          </Button>
        )}
        {!last ? (
          <button
            type="button"
            className="w-full text-center text-sm text-white/80"
            onClick={() => void finish()}
          >
            跳过
          </button>
        ) : null}
      </div>
    </div>
  )
}
