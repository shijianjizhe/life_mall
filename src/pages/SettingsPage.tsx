import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell, TopBar } from '../components/layout/AppShell'
import { AvatarView } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { db } from '../db'
import { clearUserData } from '../db/backup'
import { cn } from '../lib/format'
import { useAppStore } from '../stores/useAppStore'
import type { AiAdvancedMode } from '../types'

const avatarPresets = ['🙂', '😎', '🥹', '🤩', '🛍️', '✨', '🌙', '🍀']

function formatBytes(value?: number) {
  if (!value || value <= 0) return '暂不可用'
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

export function SettingsPage() {
  const navigate = useNavigate()
  const profile = useAppStore((s) => s.profile)
  const aiMode = useAppStore((s) => s.aiMode)
  const updateProfile = useAppStore((s) => s.updateProfile)
  const setAiMode = useAppStore((s) => s.setAiMode)
  const hydrate = useAppStore((s) => s.hydrate)
  const toast = useAppStore((s) => s.toast)

  const [nickname, setNickname] = useState(profile?.nickname ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? '')
  const [key, setKey] = useState(aiMode.apiKey)
  const [provider, setProvider] = useState<AiAdvancedMode['provider']>(
    aiMode.provider,
  )
  const [storageText, setStorageText] = useState('计算中')
  const [chatCount, setChatCount] = useState(0)
  const [darkMode, setDarkMode] = useState(false)

  const loadStorageInfo = async () => {
    const chatRows = await db.aiChatLogs.count()
    setChatCount(chatRows)
    if (!navigator.storage?.estimate) {
      setStorageText('当前浏览器不支持估算')
      return
    }
    const estimate = await navigator.storage.estimate()
    setStorageText(`${formatBytes(estimate.usage)} / ${formatBytes(estimate.quota)}`)
  }

  useEffect(() => {
    setNickname(profile?.nickname ?? '')
    setAvatarUrl(profile?.avatarUrl ?? '')
  }, [profile?.avatarUrl, profile?.nickname])

  useEffect(() => {
    void loadStorageInfo()
    void db.settings.get('darkMode').then((row) => {
      setDarkMode(Boolean(row?.value))
    })
  }, [])

  const toggleDarkMode = async () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.dataset.theme = next ? 'dark' : 'light'
    await db.settings.put({ key: 'darkMode', value: next })
    toast(next ? '深色模式已开启' : '深色模式已关闭')
  }

  const saveProfile = async () => {
    await updateProfile({
      nickname: nickname.trim() || '快乐剁手人',
      avatarUrl,
    })
    toast('个人资料已保存')
  }

  const readAvatarFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast('请选择图片文件')
      return
    }
    if (file.size > 512 * 1024) {
      toast('头像图片请控制在 512KB 以内')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setAvatarUrl(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const saveAi = async (patch: Partial<AiAdvancedMode>) => {
    const next = {
      ...aiMode,
      apiKey: key,
      provider,
      ...patch,
    }
    if (patch.enabled && !aiMode.enabled) {
      if (
        !confirm(
          '开启后 API Key 将保存在本设备浏览器中，仅用于直接请求 AI 服务商。请勿在公共/共享设备使用。确认开启？',
        )
      ) {
        return
      }
    }
    await setAiMode(next)
    toast('AI 设置已保存')
  }

  const cleanOldChats = async () => {
    const before = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const deleted = await db.aiChatLogs.where('createdAt').below(before).delete()
    await loadStorageInfo()
    toast(deleted ? `已清理 ${deleted} 条旧对话` : '暂无 30 天前的旧对话')
  }

  const wipe = async () => {
    const text = prompt('此操作将清空所有本地数据。请输入「确认清空」继续：')
    if (text !== '确认清空') {
      toast('已取消')
      return
    }
    await clearUserData()
    await hydrate()
    toast('本地数据已清空')
    navigate('/onboarding', { replace: true })
  }

  return (
    <AppShell>
      <TopBar title="设置" showBack />
      <div className="space-y-4 px-4 py-4 pb-10">
        <Section title="通用设置">
          <div className="flex items-center gap-3">
            <AvatarView
              avatarUrl={avatarUrl}
              className="h-16 w-16 bg-bg text-3xl ring-1 ring-line"
            />
            <div className="min-w-0 flex-1">
              <label className="block text-xs text-muted">昵称</label>
              <div className="mt-1 flex gap-2">
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2 text-sm"
                />
                <Button onClick={() => void saveProfile()}>保存</Button>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-xs text-muted">预设头像</div>
            <div className="flex flex-wrap gap-2">
              {avatarPresets.map((emoji) => {
                const value = `emoji:${emoji}`
                return (
                  <button
                    key={emoji}
                    type="button"
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full bg-bg text-xl ring-1 ring-line',
                      avatarUrl === value && 'ring-2 ring-brand-pink',
                    )}
                    onClick={() => setAvatarUrl(value)}
                  >
                    {emoji}
                  </button>
                )
              })}
            </div>
          </div>

          <label className="mt-3 block text-sm text-brand-pink">
            上传本地头像
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void readAvatarFile(file)
                event.target.value = ''
              }}
            />
          </label>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-bg px-3 py-2">
            <span className="text-sm">深色模式</span>
            <button
              type="button"
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold',
                darkMode ? 'bg-accent-lime text-black' : 'bg-line text-muted',
              )}
              onClick={() => void toggleDarkMode()}
            >
              {darkMode ? '已开启' : '已关闭'}
            </button>
          </div>

          <button
            type="button"
            className="mt-3 text-sm text-brand-pink"
            onClick={async () => {
              await updateProfile({ onboardingCompleted: false })
              navigate('/onboarding')
            }}
          >
            重新查看启动引导
          </button>
        </Section>

        <Section title="AI 设置">
          <div className="flex items-center justify-between">
            <span className="text-sm">AI 进阶模式</span>
            <button
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                aiMode.enabled
                  ? 'bg-accent-lime text-black'
                  : 'bg-line text-muted'
              }`}
              onClick={() =>
                void saveAi({ enabled: !aiMode.enabled, apiKey: key, provider })
              }
            >
              {aiMode.enabled ? '已开启' : '已关闭'}
            </button>
          </div>
          <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            ⚠️ 密钥仅保存在本设备浏览器，请勿在公共/共享设备开启。默认使用本地吐槽文案库，无需密钥。
          </p>
          {aiMode.enabled ? (
            <div className="mt-3 space-y-2">
              <select
                value={provider}
                onChange={(e) =>
                  setProvider(e.target.value as AiAdvancedMode['provider'])
                }
                className="w-full rounded-xl border border-line px-3 py-2 text-sm"
              >
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
              </select>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="粘贴你的 API Key"
                className="w-full rounded-xl border border-line px-3 py-2 text-sm"
              />
              <Button
                fullWidth
                variant="secondary"
                onClick={() => void saveAi({ apiKey: key, provider })}
              >
                保存 Key
              </Button>
            </div>
          ) : null}
        </Section>

        <Section title="数据管理">
          <div className="rounded-xl bg-bg px-3 py-2 text-xs text-muted">
            当前浏览器存储占用：{storageText}
            <br />
            AI 对话记录：{chatCount} 条
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/backup">
              <Button size="sm">数据备份与恢复</Button>
            </Link>
            <Button size="sm" variant="secondary" onClick={() => void loadStorageInfo()}>
              重新估算
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void cleanOldChats()}>
              清理旧对话
            </Button>
          </div>
          <button
            type="button"
            className="mt-3 text-sm font-medium text-danger"
            onClick={() => void wipe()}
          >
            清空所有本地数据
          </button>
        </Section>

        <Section title="关于我们">
          <p className="text-sm leading-relaxed text-ink">
            <strong>人生模拟商城（Life Mall）</strong>
            ：用购物的形式贩卖“想要”和“拥有”的快感——不用真买，照样爽。
          </p>
          <div className="mt-3 rounded-xl bg-bg p-3 text-xs leading-relaxed text-muted">
            <strong className="text-ink">虚拟购物声明：</strong>
            本产品所有交易均为虚拟娱乐，不涉及真实支付、发货及售后服务。用户数据默认仅存储于本地浏览器，不上传至服务器。请勿将本站内容理解为真实电商服务。
          </div>
          <p className="mt-3 text-xs text-muted">版本 v2.0.0 · 纯前端离线版</p>
        </Section>
      </div>
    </AppShell>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-muted">{title}</h2>
      {children}
    </section>
  )
}



