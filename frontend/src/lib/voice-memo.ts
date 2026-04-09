/**
 * 音声メモ管理
 */

import { getSubKey, setSubKey, removeSubKey } from './storage-root'

export interface VoiceMemo {
  id: string
  title: string
  audioData: string
  duration: number
  createdAt: string
  tags: string[]
}

export function getAllMemos(): VoiceMemo[] {
  try {
    const stored = getSubKey('voiceMemos')
    if (!stored || !Array.isArray(stored)) {
      return []
    }
    return stored as VoiceMemo[]
  } catch (error) {
    console.error('Failed to load voice memos:', error)
    return []
  }
}

export function saveMemo(memo: Omit<VoiceMemo, 'id' | 'createdAt'>): VoiceMemo {
  const allMemos = getAllMemos()

  const newMemo: VoiceMemo = {
    ...memo,
    id: `memo_${Date.now()}`,
    createdAt: new Date().toISOString(),
  }

  allMemos.unshift(newMemo)

  const limited = allMemos.slice(0, 100)

  try {
    setSubKey('voiceMemos', limited)
  } catch (error) {
    console.error('Failed to save voice memo:', error)
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      const reduced = allMemos.slice(0, 50)
      setSubKey('voiceMemos', reduced)
    }
  }

  return newMemo
}

export function deleteMemo(id: string): void {
  const allMemos = getAllMemos()
  const filtered = allMemos.filter((m) => m.id !== id)

  try {
    setSubKey('voiceMemos', filtered)
  } catch (error) {
    console.error('Failed to delete voice memo:', error)
  }
}

export function updateMemo(id: string, updates: Partial<Pick<VoiceMemo, 'title' | 'tags'>>): void {
  const allMemos = getAllMemos()
  const updated = allMemos.map((m) => (m.id === id ? { ...m, ...updates } : m))

  try {
    setSubKey('voiceMemos', updated)
  } catch (error) {
    console.error('Failed to update voice memo:', error)
  }
}

export function searchMemosByTag(tag: string): VoiceMemo[] {
  return getAllMemos().filter((m) => m.tags.includes(tag))
}

export function searchMemosByDateRange(startDate: Date, endDate: Date): VoiceMemo[] {
  return getAllMemos().filter((m) => {
    const createdAt = new Date(m.createdAt)
    return createdAt >= startDate && createdAt <= endDate
  })
}

export function clearAllMemos(): void {
  removeSubKey('voiceMemos')
}

export function base64ToBlob(base64: string, mimeType: string = 'audio/webm'): Blob {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }

  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
