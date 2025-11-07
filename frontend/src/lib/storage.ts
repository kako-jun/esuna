/**
 * LocalStorage管理ユーティリティ
 * 設定の永続化を担当
 */

// 設定のインターフェース
export interface AppSettings {
  // 音声読み上げ設定
  speech: {
    rate: number;      // 読み上げ速度 (0.1 - 10)
    pitch: number;     // ピッチ (0 - 2)
    volume: number;    // 音量 (0 - 1)
    voice: string | null; // 音声名
  };
  // API設定
  api: {
    baseUrl: string;   // API URL
  };
  // UI設定
  ui: {
    theme: 'light' | 'dark' | 'auto';
    autoNavigation: boolean; // 自動ナビゲーション有効化
  };
}

// デフォルト設定
const DEFAULT_SETTINGS: AppSettings = {
  speech: {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    voice: null,
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  ui: {
    theme: 'auto',
    autoNavigation: false,
  },
};

// LocalStorageキー
const STORAGE_KEY = 'esuna_settings';

/**
 * 設定を読み込む
 */
export const loadSettings = (): AppSettings => {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(stored);
    // デフォルト値とマージ（新しい設定項目が追加された場合のため）
    return {
      speech: { ...DEFAULT_SETTINGS.speech, ...parsed.speech },
      api: { ...DEFAULT_SETTINGS.api, ...parsed.api },
      ui: { ...DEFAULT_SETTINGS.ui, ...parsed.ui },
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * 設定を保存する
 */
export const saveSettings = (settings: AppSettings): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

/**
 * 設定をリセットする
 */
export const resetSettings = (): AppSettings => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  return DEFAULT_SETTINGS;
};

/**
 * 特定の設定項目を更新する
 */
export const updateSetting = <K extends keyof AppSettings>(
  category: K,
  values: Partial<AppSettings[K]>
): AppSettings => {
  const current = loadSettings();
  const updated = {
    ...current,
    [category]: {
      ...current[category],
      ...values,
    },
  };
  saveSettings(updated);
  return updated;
};
