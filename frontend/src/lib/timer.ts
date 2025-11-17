/**
 * タイマー・アラーム管理
 */

export interface Timer {
  id: string;
  title: string;
  durationSeconds: number; // 設定時間（秒）
  remainingSeconds: number; // 残り時間（秒）
  startedAt: string; // 開始日時（ISO 8601）
  isActive: boolean;
  onComplete?: () => void; // 完了時のコールバック
}

const STORAGE_KEY = 'esuna_timers';

/**
 * すべてのタイマーを取得
 */
export function getAllTimers(): Timer[] {
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
    console.error('Failed to load timers:', error);
    return [];
  }
}

/**
 * タイマーを保存
 */
function saveTimers(timers: Timer[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // onCompleteは保存しない
    const serializable = timers.map(({ onComplete, ...rest }) => rest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch (error) {
    console.error('Failed to save timers:', error);
  }
}

/**
 * タイマーを作成
 */
export function createTimer(title: string, durationSeconds: number): Timer {
  const timer: Timer = {
    id: `timer_${Date.now()}`,
    title,
    durationSeconds,
    remainingSeconds: durationSeconds,
    startedAt: new Date().toISOString(),
    isActive: false,
  };

  const timers = getAllTimers();
  timers.push(timer);
  saveTimers(timers);

  return timer;
}

/**
 * タイマーを開始
 */
export function startTimer(id: string): void {
  const timers = getAllTimers();
  const updated = timers.map((t) =>
    t.id === id ? { ...t, isActive: true, startedAt: new Date().toISOString() } : t
  );
  saveTimers(updated);
}

/**
 * タイマーを一時停止
 */
export function pauseTimer(id: string): void {
  const timers = getAllTimers();
  const updated = timers.map((t) => (t.id === id ? { ...t, isActive: false } : t));
  saveTimers(updated);
}

/**
 * タイマーの残り時間を更新
 */
export function updateTimerRemaining(id: string, remainingSeconds: number): void {
  const timers = getAllTimers();
  const updated = timers.map((t) => (t.id === id ? { ...t, remainingSeconds } : t));
  saveTimers(updated);
}

/**
 * タイマーを削除
 */
export function deleteTimer(id: string): void {
  const timers = getAllTimers();
  const filtered = timers.filter((t) => t.id !== id);
  saveTimers(filtered);
}

/**
 * すべてのタイマーをクリア
 */
export function clearAllTimers(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * アクティブなタイマーを取得
 */
export function getActiveTimers(): Timer[] {
  return getAllTimers().filter((t) => t.isActive);
}

/**
 * 時間をフォーマット（HH:MM:SS）
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}時間${minutes}分${secs}秒`;
  } else if (minutes > 0) {
    return `${minutes}分${secs}秒`;
  } else {
    return `${secs}秒`;
  }
}

/**
 * 音声入力から時間を解析
 * 例: "30分", "1時間30分", "10秒"
 */
export function parseTimeFromText(text: string): number | null {
  let totalSeconds = 0;

  // 時間を解析
  const hourMatch = text.match(/(\d+)\s*時間/);
  if (hourMatch) {
    totalSeconds += parseInt(hourMatch[1]) * 3600;
  }

  // 分を解析
  const minuteMatch = text.match(/(\d+)\s*分/);
  if (minuteMatch) {
    totalSeconds += parseInt(minuteMatch[1]) * 60;
  }

  // 秒を解析
  const secondMatch = text.match(/(\d+)\s*秒/);
  if (secondMatch) {
    totalSeconds += parseInt(secondMatch[1]);
  }

  return totalSeconds > 0 ? totalSeconds : null;
}
