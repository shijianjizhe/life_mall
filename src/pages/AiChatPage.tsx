import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppShell, TopBar } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { AI_QUICK_PROMPTS } from '../data/copyPool'
import { db } from '../db'
import { chatWithOptionalLlm } from '../lib/aiRoast'
import { cn, formatDateTime } from '../lib/format'
import { useAppStore } from '../stores/useAppStore'
import type { AiChatLog } from '../types'

export function AiChatPage() {
  const { productId } = useParams()
  const products = useAppStore((s) => s.products)
  const toast = useAppStore((s) => s.toast)
  const aiMode = useAppStore((s) => s.aiMode)
  const product = products.find((p) => p.id === productId)
  const [messages, setMessages] = useState<AiChatLog[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const scopeProductId = product?.id ?? null
  const welcome = useMemo<AiChatLog>(
    () => ({
      productId: scopeProductId,
      role: 'assistant',
      content: product
        ? `亲，《${product.name}》确实很适合你，但我们还是郑重提醒：不会发货，也不会扣款。`
        : '欢迎来到人生商城客服中心。今天想聊点商品，还是想被温柔吐槽一下？',
      createdAt: new Date().toISOString(),
    }),
    [product, scopeProductId],
  )

  useEffect(() => {
    let mounted = true
    void db.aiChatLogs.orderBy('createdAt').toArray().then((rows) => {
      if (!mounted) return
      setMessages(
        rows.filter((row) => (row.productId ?? null) === scopeProductId),
      )
    })
    return () => {
      mounted = false
    }
  }, [scopeProductId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, sending])

  const send = async (raw: string) => {
    const value = raw.trim()
    if (!value || sending) return
    setSending(true)
    setText('')
    try {
      const now = new Date().toISOString()
      const userMessage: AiChatLog = {
        productId: scopeProductId,
        role: 'user',
        content: value,
        createdAt: now,
      }
      setMessages((prev) => [...prev, userMessage])
      await db.aiChatLogs.add(userMessage)

      const reply = await chatWithOptionalLlm(value, product?.name)
      const assistantMessage: AiChatLog = {
        productId: scopeProductId,
        role: 'assistant',
        content: reply,
        createdAt: new Date().toISOString(),
      }
      await db.aiChatLogs.add(assistantMessage)
      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      toast('客服暂时卡住了，稍后再试')
    } finally {
      setSending(false)
    }
  }

  const displayMessages = messages.length ? messages : [welcome]

  return (
    <AppShell showNav={false}>
      <TopBar
        title="AI客服-小助手"
        showBack
        right={<span className="text-xs text-accent-lime">在线</span>}
      />
      <div className="border-b border-line bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full brand-gradient text-2xl shadow-sm">
            🛍️
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-accent-lime" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink">人生商城 AI 小助手</div>
            <div className="mt-0.5 text-xs text-muted">
              {aiMode.enabled && aiMode.apiKey ? '进阶 AI 直连模式' : '本地文案库模式'} · 虚拟客服，不会诱导真实消费
            </div>
          </div>
        </div>
      </div>
      {product ? (
        <div className="border-b border-line bg-bg px-4 py-2 text-sm text-muted">
          正在咨询：{product.emoji} {product.name}
        </div>
      ) : null}

      <div className="space-y-3 px-4 py-4 pb-36">
        {displayMessages.map((message, index) => (
          <div
            key={message.id ?? `${message.createdAt}-${index}`}
            className={cn(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start',
            )}
          >
            <div
              className={cn(
                'max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                message.role === 'user'
                  ? 'brand-gradient text-white'
                  : 'bg-white text-ink ring-1 ring-line',
              )}
            >
              <p className="whitespace-pre-line">{message.content}</p>
              <div
                className={cn(
                  'mt-1 text-[10px]',
                  message.role === 'user' ? 'text-white/70' : 'text-muted',
                )}
              >
                {formatDateTime(message.createdAt)}
              </div>
            </div>
          </div>
        ))}
        {sending ? (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white px-4 py-2.5 text-sm text-muted ring-1 ring-line">
              正在输入...
            </div>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-lg">
          <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
            {AI_QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs text-ink ring-1 ring-line"
                disabled={sending}
                onClick={() => void send(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void send(text)
              }}
              placeholder="问问小助手"
              className="min-w-0 flex-1 rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-pink"
            />
            <Button disabled={sending || !text.trim()} onClick={() => void send(text)}>
              发送
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}


