/**
 * 続きから再生（進捗管理）
 */

export type ProgressType = 'novel' | 'podcast' | 'rss-article' | '5ch-thread';

export interface Progress {
  id: string;
  type: ProgressType;
  title: string;
  currentIndex: number; // 現在のセクション/エピソード/記事/レス番号
  totalCount: number; // 全体の数
  lastReadAt: string; // 最後に読んだ日時（ISO 8601）
  data: any; // 再開に必要なデータ
}

const STORAGE_KEY = 'esuna_progress';

/**
 * すべての進捗を取得
 */
export function getAllProgress(): Progress[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load progress:', error);
    return [];
  }
}

/**
 * 特定の進捗を取得
 */
export function getProgress(type: ProgressType, id: string): Progress | null {
  const allProgress = getAllProgress();
  return allProgress.find((p) => p.type === type && p.id === id) || null;
}

/**
 * 進捗を保存
 */
export function saveProgress(progress: Omit<Progress, 'lastReadAt'>): void {
  const allProgress = getAllProgress();

  // 既存の進捗を削除
  const filtered = allProgress.filter((p) => !(p.type === progress.type && p.id === progress.id));

  // 新しい進捗を追加
  const newProgress: Progress = {
    ...progress,
    lastReadAt: new Date().toISOString(),
  };

  filtered.unshift(newProgress); // 新しいものを先頭に

  // 最大50件まで保存
  const limited = filtered.slice(0, 50);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }
}

/**
 * 進捗を削除
 */
export function removeProgress(type: ProgressType, id: string): void {
  const allProgress = getAllProgress();
  const filtered = allProgress.filter((p) => !(p.type === type && p.id === id));

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove progress:', error);
    }
  }
}

/**
 * すべての進捗をクリア
 */
export function clearAllProgress(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * 最近読んだものを取得（最大10件）
 */
export function getRecentProgress(limit: number = 10): Progress[] {
  const allProgress = getAllProgress();
  return allProgress.slice(0, limit);
}

/**
 * タイプ別に進捗を取得
 */
export function getProgressByType(type: ProgressType): Progress[] {
  return getAllProgress().filter((p) => p.type === type);
}
