/**
 * 音声メモ管理
 */

export interface VoiceMemo {
  id: string;
  title: string;
  audioData: string; // Base64エンコードされた音声データ
  duration: number; // 秒数
  createdAt: string; // ISO 8601
  tags: string[]; // タグ
}

const STORAGE_KEY = 'esuna_voice_memos';

/**
 * すべての音声メモを取得
 */
export function getAllMemos(): VoiceMemo[] {
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
    console.error('Failed to load voice memos:', error);
    return [];
  }
}

/**
 * 音声メモを保存
 */
export function saveMemo(memo: Omit<VoiceMemo, 'id' | 'createdAt'>): VoiceMemo {
  const allMemos = getAllMemos();

  const newMemo: VoiceMemo = {
    ...memo,
    id: `memo_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  allMemos.unshift(newMemo); // 新しいものを先頭に

  // 最大100件まで保存（LocalStorageの容量制限を考慮）
  const limited = allMemos.slice(0, 100);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    } catch (error) {
      console.error('Failed to save voice memo:', error);
      // LocalStorage容量エラーの場合は古いメモを削除
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        const reduced = allMemos.slice(0, 50);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
      }
    }
  }

  return newMemo;
}

/**
 * 音声メモを削除
 */
export function deleteMemo(id: string): void {
  const allMemos = getAllMemos();
  const filtered = allMemos.filter((m) => m.id !== id);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete voice memo:', error);
    }
  }
}

/**
 * 音声メモを更新（タイトル、タグ）
 */
export function updateMemo(id: string, updates: Partial<Pick<VoiceMemo, 'title' | 'tags'>>): void {
  const allMemos = getAllMemos();
  const updated = allMemos.map((m) => (m.id === id ? { ...m, ...updates } : m));

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update voice memo:', error);
    }
  }
}

/**
 * タグで検索
 */
export function searchMemosByTag(tag: string): VoiceMemo[] {
  return getAllMemos().filter((m) => m.tags.includes(tag));
}

/**
 * 日付範囲で検索
 */
export function searchMemosByDateRange(startDate: Date, endDate: Date): VoiceMemo[] {
  return getAllMemos().filter((m) => {
    const createdAt = new Date(m.createdAt);
    return createdAt >= startDate && createdAt <= endDate;
  });
}

/**
 * すべての音声メモをクリア
 */
export function clearAllMemos(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * 音声データをBlobに変換
 */
export function base64ToBlob(base64: string, mimeType: string = 'audio/webm'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Blobをbase64に変換
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
