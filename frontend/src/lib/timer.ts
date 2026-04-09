/**
 * タイマー・アラーム管理
 */

import { getSubKey, setSubKey, removeSubKey } from './storage-root'

export interface Timer {
  id: string
  title: string
  durationSeconds: number
  remainingSeconds: number
  startedAt: string
  isActive: boolean
  onComplete?: () => void
}

export function getAllTimers(): Timer[] {
  try {
    const stored = getSubKey('timers')
    if (!stored || !Array.isArray(stored)) {
      return []
    }
    return stored as Timer[]
  } catch (error) {
    console.error('Failed to load timers:', error)
    return []
  }
}

function saveTimers(timers: Timer[]): void {
  try {
    const serializable = timers.map(({ onComplete, ...rest }) => rest)
    setSubKey('timers', serializable)
  } catch (error) {
    console.error('Failed to save timers:', error)
  }
}

export function createTimer(title: string, durationSeconds: number): Timer {
  const timer: Timer = {
    id: `timer_${Date.now()}`,
    title,
    durationSeconds,
    remainingSeconds: durationSeconds,
    startedAt: new Date().toISOString(),
    isActive: false,
  }

  const timers = getAllTimers()
  timers.push(timer)
  saveTimers(timers)

  return timer
}

export function startTimer(id: string): void {
  const timers = getAllTimers()
  const updated = timers.map((t) =>
    t.id === id ? { ...t, isActive: true, startedAt: new Date().toISOString() } : t,
  )
  saveTimers(updated)
}

export function pauseTimer(id: string): void {
  const timers = getAllTimers()
  const updated = timers.map((t) => (t.id === id ? { ...t, isActive: false } : t))
  saveTimers(updated)
}

export function updateTimerRemaining(id: string, remainingSeconds: number): void {
  const timers = getAllTimers()
  const updated = timers.map((t) => (t.id === id ? { ...t, remainingSeconds } : t))
  saveTimers(updated)
}

export function deleteTimer(id: string): void {
  const timers = getAllTimers()
  const filtered = timers.filter((t) => t.id !== id)
  saveTimers(filtered)
}

export function clearAllTimers(): void {
  removeSubKey('timers')
}

export function getActiveTimers(): Timer[] {
  return getAllTimers().filter((t) => t.isActive)
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}時間${minutes}分${secs}秒`
  } else if (minutes > 0) {
    return `${minutes}分${secs}秒`
  } else {
    return `${secs}秒`
  }
}

export function parseTimeFromText(text: string): number | null {
  let totalSeconds = 0

  const hourMatch = text.match(/(\d+)\s*時間/)
  if (hourMatch) {
    totalSeconds += parseInt(hourMatch[1]) * 3600
  }

  const minuteMatch = text.match(/(\d+)\s*分/)
  if (minuteMatch) {
    totalSeconds += parseInt(minuteMatch[1]) * 60
  }

  const secondMatch = text.match(/(\d+)\s*秒/)
  if (secondMatch) {
    totalSeconds += parseInt(secondMatch[1])
  }

  return totalSeconds > 0 ? totalSeconds : null
}
