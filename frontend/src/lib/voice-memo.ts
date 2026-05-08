/**
 * 音声メモ管理
 *
 * IndexedDB をバックエンドに使用する。
 * LocalStorage からの移行は初回呼び出し時に自動実行される。
 */

import { getSubKey, removeSubKey } from './storage-root'
import {
  idbGetAllMemos,
  idbSaveMemo,
  idbDeleteMemo,
  idbUpdateMemo,
  idbClearAllMemos,
  migrateFromLocalStorage,
} from './idb-voice-memo'

export interface VoiceMemo {
  id: string
  title: string
  audioData: string
  duration: number
  createdAt: string
  tags: string[]
}

export type SaveMemoResult =
  | { ok: true }
  | { ok: false; reason: 'quota_exceeded' }
  | { ok: false; reason: 'unknown' }

// ---------------------------------------------------------------------------
// LocalStorage からのマイグレーション（1回限り）
// ---------------------------------------------------------------------------

let migrationDone = false

async function ensureMigrated(): Promise<void> {
  if (migrationDone) return
  try {
    await migrateFromLocalStorage(
      () => {
        const stored = getSubKey('voiceMemos')
        if (!stored || !Array.isArray(stored)) return []
        return stored as VoiceMemo[]
      },
      () => removeSubKey('voiceMemos'),
    )
    // 成功してからフラグを立てる（失敗時は次回再試行される）
    migrationDone = true
  } catch (e) {
    console.warn('Migration from LocalStorage failed:', e)
    // migrationDone は false のまま → 次回再試行
  }
}

// ---------------------------------------------------------------------------
// 公開 API（非同期）
// ---------------------------------------------------------------------------

export async function getAllMemos(): Promise<VoiceMemo[]> {
  await ensureMigrated()
  return idbGetAllMemos()
}

export async function saveMemo(
  memo: Omit<VoiceMemo, 'id' | 'createdAt'>,
): Promise<{ memo?: VoiceMemo; result: SaveMemoResult }> {
  await ensureMigrated()
  try {
    const newMemo = await idbSaveMemo(memo)
    return { memo: newMemo, result: { ok: true } }
  } catch (e) {
    console.error('Failed to save voice memo:', e)
    const isQuota =
      e instanceof DOMException && e.name === 'QuotaExceededError'
    return {
      result: { ok: false, reason: isQuota ? 'quota_exceeded' : 'unknown' },
    }
  }
}

export async function deleteMemo(id: string): Promise<void> {
  await ensureMigrated()
  await idbDeleteMemo(id)
}

export async function updateMemo(
  id: string,
  updates: Partial<Pick<VoiceMemo, 'title' | 'tags'>>,
): Promise<void> {
  await ensureMigrated()
  await idbUpdateMemo(id, updates)
}

export async function clearAllMemos(): Promise<void> {
  await ensureMigrated()
  await idbClearAllMemos()
}

export function searchMemosByTag(memos: VoiceMemo[], tag: string): VoiceMemo[] {
  return memos.filter((m) => m.tags.includes(tag))
}

export function searchMemosByDateRange(
  memos: VoiceMemo[],
  startDate: Date,
  endDate: Date,
): VoiceMemo[] {
  return memos.filter((m) => {
    const createdAt = new Date(m.createdAt)
    return createdAt >= startDate && createdAt <= endDate
  })
}

// ---------------------------------------------------------------------------
// Base64 / Blob ユーティリティ（後方互換のため維持）
// ---------------------------------------------------------------------------

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
