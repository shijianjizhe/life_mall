import { useEffect, useState } from 'react'
import { AppShell, TopBar } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import {
  downloadBackupJson,
  exportBackup,
  importBackup,
} from '../db/backup'
import { db } from '../db'
import { formatDateTime } from '../lib/format'
import { useAppStore } from '../stores/useAppStore'
import type { BackupPayload } from '../types'

export function BackupPage() {
  const toast = useAppStore((s) => s.toast)
  const hydrate = useAppStore((s) => s.hydrate)
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const loadMeta = async () => {
    const row = await db.settings.get('lastBackupAt')
    setLastBackup((row?.value as string | null) ?? null)
  }

  useEffect(() => {
    void loadMeta()
  }, [])

  const onExport = async () => {
    setBusy(true)
    try {
      const payload = await exportBackup()
      downloadBackupJson(payload)
      await db.settings.put({
        key: 'lastBackupAt',
        value: new Date().toISOString(),
      })
      await loadMeta()
      toast('备份文件已下载，收好你的小宇宙 💾')
    } catch {
      toast('导出失败，请重试')
    } finally {
      setBusy(false)
    }
  }

  const onImportFile = async (file: File) => {
    if (
      !confirm(
        '导入将覆盖当前所有本地数据（购物车/订单/收藏等），此操作不可撤销。确认继续吗？',
      )
    ) {
      return
    }
    setBusy(true)
    try {
      const text = await file.text()
      const payload = JSON.parse(text) as BackupPayload
      await importBackup(payload)
      await hydrate()
      await loadMeta()
      toast('恢复成功！欢迎回家')
    } catch (e) {
      toast(e instanceof Error ? e.message : '导入失败，请检查文件')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell>
      <div className="bg-slate-100">
        <TopBar title="数据备份与恢复" showBack />
      </div>
      <div className="space-y-4 px-4 py-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-ink">
          你的所有数据（购物车、订单、收藏等）都只保存在这台设备的浏览器里，清除浏览器数据会导致丢失。建议定期备份！
        </div>

        <div className="rounded-2xl border border-line bg-white p-4">
          <h2 className="font-semibold">导出数据</h2>
          <p className="mt-1 text-xs text-muted">
            导出为 JSON 文件，可保存到手机/电脑
          </p>
          <Button
            className="mt-3"
            fullWidth
            disabled={busy}
            onClick={() => void onExport()}
          >
            导出为文件
          </Button>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4">
          <h2 className="font-semibold">导入 / 恢复数据</h2>
          <p className="mt-1 text-xs text-muted">全量覆盖当前本地数据</p>
          <label className="mt-3 block">
            <span className="sr-only">选择备份文件</span>
            <input
              type="file"
              accept="application/json,.json"
              disabled={busy}
              className="block w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-brand-pink/10 file:px-3 file:py-2 file:text-brand-pink"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onImportFile(f)
                e.target.value = ''
              }}
            />
          </label>
        </div>

        <p className="text-center text-xs text-muted">
          上次备份时间：
          {lastBackup ? formatDateTime(lastBackup) : '尚未备份'}
        </p>
      </div>
    </AppShell>
  )
}
