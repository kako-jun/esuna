/**
 * おまかせモード（自動再生）
 * ランダムにコンテンツを選択して連続再生する
 */

import { POPULAR_NOVELS } from './novels'
import { POPULAR_PODCASTS } from './podcasts'
import { getAllStations } from './radio'
import { RSSReader } from './rss'

// コンテンツタイプ
export type AutoplayContentType =
  | 'novel'
  | 'podcast'
  | 'radio'
  | 'rss-news'
  | 'hatena'

// 自動再生設定
export interface AutoplaySettings {
  enabledTypes: AutoplayContentType[]
  playDuration: number // 各コンテンツの再生時間（分）
  shuffle: boolean // シャッフル再生
}

// デフォルト設定
const DEFAULT_AUTOPLAY_SETTINGS: AutoplaySettings = {
  enabledTypes: ['novel', 'podcast', 'radio', 'rss-news'],
  playDuration: 10, // 10分
  shuffle: true,
}

// LocalStorageキー
const STORAGE_KEY = 'esuna_autoplay_settings'

/**
 * 自動再生設定を読み込む
 */
export function loadAutoplaySettings(): AutoplaySettings {
  if (typeof window === 'undefined') {
    return DEFAULT_AUTOPLAY_SETTINGS
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return DEFAULT_AUTOPLAY_SETTINGS
    }

    const parsed = JSON.parse(stored)
    return {
      ...DEFAULT_AUTOPLAY_SETTINGS,
      ...parsed,
    }
  } catch (error) {
    console.error('Failed to load autoplay settings:', error)
    return DEFAULT_AUTOPLAY_SETTINGS
  }
}

/**
 * 自動再生設定を保存する
 */
export function saveAutoplaySettings(settings: AutoplaySettings): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save autoplay settings:', error)
  }
}

/**
 * コンテンツアイテム
 */
export interface AutoplayItem {
  type: AutoplayContentType
  title: string
  description: string
  data: any // タイプごとに異なるデータ
}

/**
 * ランダムにコンテンツを生成
 */
export function generateRandomPlaylist(settings: AutoplaySettings, count: number = 10): AutoplayItem[] {
  const playlist: AutoplayItem[] = []
  const { enabledTypes } = settings

  if (enabledTypes.length === 0) {
    return []
  }

  for (let i = 0; i < count; i++) {
    // ランダムにタイプを選択
    const randomType = enabledTypes[Math.floor(Math.random() * enabledTypes.length)]
    const item = getRandomItemByType(randomType)
    if (item) {
      playlist.push(item)
    }
  }

  // シャッフルが有効な場合
  if (settings.shuffle) {
    shuffleArray(playlist)
  }

  return playlist
}

/**
 * タイプごとにランダムなアイテムを取得
 */
function getRandomItemByType(type: AutoplayContentType): AutoplayItem | null {
  switch (type) {
    case 'novel': {
      const novels = POPULAR_NOVELS
      const novel = novels[Math.floor(Math.random() * novels.length)]
      return {
        type: 'novel',
        title: novel.title,
        description: `${novel.author} の小説`,
        data: novel,
      }
    }

    case 'podcast': {
      const podcasts = POPULAR_PODCASTS
      const podcast = podcasts[Math.floor(Math.random() * podcasts.length)]
      return {
        type: 'podcast',
        title: podcast.title,
        description: podcast.description,
        data: podcast,
      }
    }

    case 'radio': {
      const stations = getAllStations()
      const station = stations[Math.floor(Math.random() * stations.length)]
      return {
        type: 'radio',
        title: station.name,
        description: station.description,
        data: station,
      }
    }

    case 'rss-news': {
      const rssReader = new RSSReader()
      const feeds = rssReader.getDefaultFeeds()
      const feed = feeds[Math.floor(Math.random() * feeds.length)]
      return {
        type: 'rss-news',
        title: feed.name,
        description: 'RSSニュースフィード',
        data: feed,
      }
    }

    case 'hatena': {
      return {
        type: 'hatena',
        title: 'はてなブックマーク',
        description: '人気エントリー',
        data: { category: 'hot' },
      }
    }

    default:
      return null
  }
}

/**
 * 配列をシャッフル（Fisher-Yates アルゴリズム）
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

/**
 * コンテンツタイプの日本語名を取得
 */
export function getContentTypeName(type: AutoplayContentType): string {
  switch (type) {
    case 'novel':
      return '小説'
    case 'podcast':
      return 'Podcast'
    case 'radio':
      return 'ラジオ'
    case 'rss-news':
      return 'RSSニュース'
    case 'hatena':
      return 'はてなブックマーク'
    default:
      return type
  }
}
