/**
 * 統一 localStorage 管理
 * すべてのデータを単一キー "esuna" に JSON オブジェクトとして格納する
 */

const ROOT_KEY = 'esuna'

export interface EsunaStore {
  settings?: unknown
  favorites?: unknown
  progress?: unknown
  voiceMemos?: unknown
  timers?: unknown
  autoplaySettings?: unknown
  apiBaseUrl?: unknown
}

/**
 * ルートオブジェクト全体を読み込む
 */
function loadRoot(): EsunaStore {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = localStorage.getItem(ROOT_KEY)
    if (!raw) {
      return {}
    }
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {}
    }
    return parsed as EsunaStore
  } catch {
    return {}
  }
}

/**
 * ルートオブジェクト全体を保存する
 */
function saveRoot(store: EsunaStore): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(ROOT_KEY, JSON.stringify(store))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

/**
 * サブキーの値を取得する
 */
export function getSubKey<K extends keyof EsunaStore>(key: K): EsunaStore[K] {
  const store = loadRoot()
  return store[key]
}

/**
 * サブキーの値を設定する
 */
export function setSubKey<K extends keyof EsunaStore>(key: K, value: EsunaStore[K]): void {
  const store = loadRoot()
  store[key] = value
  saveRoot(store)
}

/**
 * サブキーを削除する
 */
export function removeSubKey<K extends keyof EsunaStore>(key: K): void {
  const store = loadRoot()
  delete store[key]
  saveRoot(store)
}
