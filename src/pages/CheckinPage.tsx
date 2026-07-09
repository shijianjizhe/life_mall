import { useEffect, useMemo, useState } from 'react'
import { AppShell, TopBar } from '../components/layout/AppShell'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import { Button } from '../components/ui/Button'
import { db } from '../db'
import { cn, todayYmd } from '../lib/format'
import { safeVibrate } from '../lib/haptics'
import { useAppStore } from '../stores/useAppStore'
import type { Checkin } from '../types'

function parseYmd(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1)
}

function diffDays(next: string, prev: string): number {
  const ms = parseYmd(next).getTime() - parseYmd(prev).getTime()
  return Math.round(ms / (24 * 60 * 60 * 1000))
}

function getMonthCells(now: Date) {
  const year = now.getFullYear()
  const month = now.getMonth()
  const days = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  return [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: days }, (_, index) => {
      const day = index + 1
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }),
  ]
}

export function CheckinPage() {
  const profile = useAppStore((s) => s.profile)
  const refreshProfile = useAppStore((s) => s.refreshProfile)
  const toast = useAppStore((s) => s.toast)
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [busy, setBusy] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const [displayCoin, setDisplayCoin] = useState(profile?.happyCoin ?? 0)

  const today = todayYmd()
  const now = useMemo(() => new Date(), [])
  const cells = useMemo(() => getMonthCells(now), [now])
  const signedDates = useMemo(
    () => new Set(checkins.map((item) => item.checkinDate)),
    [checkins],
  )
  const latest = checkins[checkins.length - 1]
  const signedToday = signedDates.has(today)
  const currentStreak = latest
    ? latest.checkinDate === today || diffDays(today, latest.checkinDate) === 1
      ? latest.streakDays
      : 0
    : 0
  const rewardPreview = (currentStreak + 1) % 7 === 0 ? 30 : 10

  const load = async () => {
    const rows = await db.checkins.orderBy('checkinDate').toArray()
    setCheckins(rows)
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    setDisplayCoin(profile?.happyCoin ?? 0)
  }, [profile?.happyCoin])

  const signIn = async () => {
    if (busy) return
    setBusy(true)
    try {
      const last = await db.checkins.orderBy('checkinDate').reverse().first()
      if (last && today < last.checkinDate) {
        toast('检测到系统日期早于最近签到记录，请确认时间后再签到')
        return
      }
      if (last?.checkinDate === today) {
        toast('今天已经签过啦，明天再来')
        return
      }

      const streakDays = last && diffDays(today, last.checkinDate) === 1 ? last.streakDays + 1 : 1
      const rewardCoin = streakDays % 7 === 0 ? 30 : 10
      setDisplayCoin(profile?.happyCoin ?? 0)

      await db.transaction('rw', [db.checkins, db.userProfile], async () => {
        await db.checkins.add({
          checkinDate: today,
          rewardCoin,
          streakDays,
        })
        const user = await db.userProfile.get('local-user')
        if (user) {
          await db.userProfile.put({
            ...user,
            happyCoin: user.happyCoin + rewardCoin,
          })
        }
      })

      await Promise.all([load(), refreshProfile()])
      toast(`签到成功，快乐币 +${rewardCoin}`)
      safeVibrate([10, 24, 10])
      setCelebrate(true)
      window.setTimeout(() => setCelebrate(false), 1400)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell>
      {celebrate ? (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-50 mx-auto h-32 max-w-lg overflow-hidden">
          {Array.from({ length: 14 }).map((_, index) => (
            <span
              key={index}
              className="absolute animate-bounce text-xl"
              style={{
                left: `${(index * 19) % 100}%`,
                top: `${(index * 11) % 45}%`,
                animationDelay: `${index * 0.05}s`,
              }}
            >
              {['🎉', '✨', '💫', '🎊'][index % 4]}
            </span>
          ))}
        </div>
      ) : null}
      <div className="bg-gradient-to-br from-[#FF6B9D] to-[#FFE66D] text-white">
        <TopBar title="每日签到" showBack />
        <div className="px-4 pb-5 pt-3">
          <div className="text-sm text-white/85">连续签到</div>
          <div className="mt-1 text-4xl font-bold">{currentStreak} 天</div>
          <div className="mt-2 inline-flex rounded-full bg-white/20 px-3 py-1 text-sm">
            快乐币 <AnimatedNumber value={displayCoin} className="ml-1 font-semibold" />
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 py-4">
        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-ink">
              {now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
            </h2>
            <span className="text-xs text-muted">已签 {checkins.length} 天</span>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted">
            {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
              <div key={day} className="py-1 font-medium">
                {day}
              </div>
            ))}
            {cells.map((date, index) => {
              const isToday = date === today
              const signed = date ? signedDates.has(date) : false
              return (
                <div
                  key={date ?? `blank-${index}`}
                  className={cn(
                    'flex aspect-square items-center justify-center rounded-xl text-sm font-semibold',
                    !date && 'opacity-0',
                    date && !signed && 'bg-bg text-muted',
                    signed && 'brand-gradient text-white shadow-sm',
                    isToday && !signed && 'animate-breathe ring-2 ring-brand-pink/40',
                  )}
                >
                  {date ? (signed ? '✓' : Number(date.slice(-2))) : ''}
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-4 text-center shadow-sm">
          <div className="text-4xl">{signedToday ? '🌞' : '🎁'}</div>
          <h2 className="mt-2 text-lg font-bold">
            {signedToday ? '今天已领取快乐' : `签到领 ${rewardPreview} 快乐币`}
          </h2>
          <p className="mt-1 text-sm text-muted">
            连续 7 天会有额外奖励，快乐币先攒着，未来拿来换更离谱的快乐。
          </p>
          <Button
            fullWidth
            size="lg"
            className="mt-4"
            disabled={signedToday || busy}
            onClick={() => void signIn()}
          >
            {signedToday ? '明天再来' : '签到领快乐币'}
          </Button>
        </section>

        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <h2 className="font-semibold">连续奖励</h2>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            {[
              ['1 天', '+10'],
              ['7 天', '+30'],
              ['30 天', '隐藏房间主题'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-bg px-2 py-3">
                <div className="font-bold text-brand-pink">{label}</div>
                <div className="mt-1 text-muted">{value}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
