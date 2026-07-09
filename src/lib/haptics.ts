export function safeVibrate(pattern: number | number[] = 12): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
  try {
    navigator.vibrate(pattern)
  } catch {
    // Vibration is a progressive enhancement; unsupported browsers can ignore it.
  }
}
