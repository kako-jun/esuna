/**
 * 音声メモ用 IndexedDB ラッパー
 *
 * - DB 名: "esuna"
 * - Object Store 名: "voiceMemos"
 * - key: memo.id (string)
 * - value: { id, title, audioBlob, duration, createdAt, tags }
 *   ※ audioBlob は Blob で保存し、読み出し時に Base64 変換する
 */

import type { VoiceMemo } from './voice-memo'

const DB_NAME = 'esuna'
const STORE_NAME = 'voiceMemos'
const DB_VERSION = 1

// --------------------------------------------------------------------------
// シングルトン接続
// --------------------------------------------------------------------------

let dbPromise: Promise<IDBDatabase> | null = null

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => { dbPromise = null; reject(req.error) }
    })
  }
  return dbPromise
}

// --------------------------------------------------------------------------
// 内部型
// --------------------------------------------------------------------------

/** IDB に保存する内部表現（Blob ベース） */
interface IDBMemoRecord {
  id: string
  title: string
  audioBlob: Blob
  duration: number
  createdAt: string
  tags: string[]
}

// --------------------------------------------------------------------------
// ユーティリティ
// --------------------------------------------------------------------------

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64: string, mimeType = 'audio/webm'): Blob {
  const bytes = atob(base64)
  const buf = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i)
  return new Blob([buf], { type: mimeType })
}

async function recordToMemo(record: IDBMemoRecord): Promise<VoiceMemo> {
  const audioData = await blobToBase64(record.audioBlob)
  return {
    id: record.id,
    title: record.title,
    audioData,
    duration: record.duration,
    createdAt: record.createdAt,
    tags: record.tags,
  }
}

// --------------------------------------------------------------------------
// 公開 API
// --------------------------------------------------------------------------

/** 全メモを新しい順で取得 */
export async function idbGetAllMemos(): Promise<VoiceMemo[]> {
  const db = await getDB()
  const records = await new Promise<IDBMemoRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.getAll()
    tx.oncomplete = () => resolve(req.result as IDBMemoRecord[])
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(new Error('Transaction aborted'))
  })
  records.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return Promise.all(records.map(recordToMemo))
}

/** メモを保存（audioData は Base64 で受け取り Blob に変換して保存） */
export async function idbSaveMemo(memo: Omit<VoiceMemo, 'id' | 'createdAt'>): Promise<VoiceMemo> {
  const db = await getDB()
  const newMemo: VoiceMemo = {
    ...memo,
    id: `memo_${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
  }
  const audioBlob = base64ToBlob(memo.audioData)
  const record: IDBMemoRecord = {
    id: newMemo.id,
    title: newMemo.title,
    audioBlob,
    duration: newMemo.duration,
    createdAt: newMemo.createdAt,
    tags: newMemo.tags,
  }
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.put(record)
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(new Error('Transaction aborted'))
  })
  return newMemo
}

/** メモを削除 */
export async function idbDeleteMemo(id: string): Promise<void> {
  const db = await getDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(id)
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(new Error('Transaction aborted'))
  })
}

/** メモのメタデータ（title/tags）を更新 */
export async function idbUpdateMemo(
  id: string,
  updates: Partial<Pick<VoiceMemo, 'title' | 'tags'>>,
): Promise<void> {
  const db = await getDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const getReq = store.get(id)
    getReq.onsuccess = () => {
      const record = getReq.result as IDBMemoRecord | undefined
      if (!record) { resolve(); return }
      const updated: IDBMemoRecord = { ...record, ...updates }
      const putReq = store.put(updated)
      putReq.onerror = () => reject(putReq.error)
    }
    getReq.onerror = () => reject(getReq.error)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(new Error('Transaction aborted'))
  })
}

/** 全メモ削除 */
export async function idbClearAllMemos(): Promise<void> {
  const db = await getDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(new Error('Transaction aborted'))
  })
}

// --------------------------------------------------------------------------
// マイグレーション
// --------------------------------------------------------------------------

const MIGRATION_FLAG_KEY = 'esuna_idb_migrated'

/**
 * LocalStorage から IndexedDB へのマイグレーション
 * 専用フラグ（localStorage）で冪等性を保証する。
 * IDB への書き込みが全件完了してからのみ LS を削除する。
 */
export async function migrateFromLocalStorage(
  getLsData: () => VoiceMemo[],
  clearLsData: () => void,
): Promise<void> {
  if (localStorage.getItem(MIGRATION_FLAG_KEY)) return

  const lsMemos = getLsData()
  if (lsMemos.length === 0) {
    localStorage.setItem(MIGRATION_FLAG_KEY, '1')
    return
  }

  const db = await getDB()
  let allSucceeded = true

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    for (const memo of lsMemos) {
      try {
        const audioBlob = base64ToBlob(memo.audioData)
        const record: IDBMemoRecord = {
          id: memo.id,
          title: memo.title,
          audioBlob,
          duration: memo.duration,
          createdAt: memo.createdAt,
          tags: memo.tags,
        }
        const putReq = store.put(record)
        putReq.onerror = (e) => {
          e.preventDefault()
          allSucceeded = false
          console.warn(`Migration: failed to write memo ${memo.id}`, putReq.error)
        }
      } catch (e) {
        allSucceeded = false
        console.warn(`Migration: skipping memo ${memo.id}:`, e)
      }
    }

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    // putReq.onerror で e.preventDefault() しても Safari では tx がアボートする場合がある。
    // 部分失敗（allSucceeded = false）の場合は reject せず resolve し、LS を保持してリトライに委ねる。
    tx.onabort = () => {
      if (!allSucceeded) resolve()
      else reject(new Error('Transaction aborted'))
    }
  })

  // 全件書き込み成功時のみ LS を削除してフラグを立てる
  if (allSucceeded) {
    clearLsData()
    localStorage.setItem(MIGRATION_FLAG_KEY, '1')
  } else {
    console.warn('Migration: some memos failed to write. LS data preserved for retry.')
  }
}
