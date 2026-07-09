type ShareImageOptions = {
  canvas: HTMLCanvasElement
  filename: string
  title: string
  text?: string
}

export type ShareImageResult = 'shared' | 'downloaded' | 'copied-text'

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('图片生成失败')
  return blob
}

export async function downloadCanvasImage(
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<void> {
  downloadBlob(await canvasToPngBlob(canvas), filename)
}

export async function shareCanvasImage({
  canvas,
  filename,
  title,
  text,
}: ShareImageOptions): Promise<ShareImageResult> {
  const blob = await canvasToPngBlob(canvas)
  const file = new File([blob], filename, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title, text })
    return 'shared'
  }

  downloadBlob(blob, filename)

  if (text && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return 'copied-text'
    } catch {
      // Downloading the image is the important fallback.
    }
  }

  return 'downloaded'
}

export function shareResultMessage(result: ShareImageResult): string {
  if (result === 'shared') return '已唤起系统分享'
  if (result === 'copied-text') return '当前浏览器不支持文件分享，图片已保存，分享文案已复制'
  return '当前浏览器不支持文件分享，图片已保存，可长按或从下载中发送'
}
