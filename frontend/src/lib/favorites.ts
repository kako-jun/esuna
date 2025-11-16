/**
 * お気に入り・ブックマーク管理
 */

export type FavoriteType = 'podcast' | 'novel' | 'rss-feed' | '5ch-board' | '5ch-thread';

export interface Favorite {
  id: string;
  type: FavoriteType;
  title: string;
  description?: string;
  data: any; // 型に応じた元データ
  addedAt: string; // ISO 8601形式の日時
}

const STORAGE_KEY = 'esuna_favorites';

/**
 * お気に入り一覧を取得
 */
export function getFavorites(): Favorite[] {
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
    console.error('Failed to load favorites:', error);
    return [];
  }
}

/**
 * お気に入りを追加
 */
export function addFavorite(favorite: Omit<Favorite, 'id' | 'addedAt'>): Favorite {
  const favorites = getFavorites();

  // IDを生成（type + timestamp）
  const id = `${favorite.type}_${Date.now()}`;

  const newFavorite: Favorite = {
    ...favorite,
    id,
    addedAt: new Date().toISOString(),
  };

  favorites.unshift(newFavorite); // 新しいものを先頭に
  saveFavorites(favorites);

  return newFavorite;
}

/**
 * お気に入りを削除
 */
export function removeFavorite(id: string): void {
  const favorites = getFavorites();
  const filtered = favorites.filter((f) => f.id !== id);
  saveFavorites(filtered);
}

/**
 * お気に入りに存在するか確認
 */
export function isFavorite(type: FavoriteType, title: string): boolean {
  const favorites = getFavorites();
  return favorites.some((f) => f.type === type && f.title === title);
}

/**
 * お気に入りを保存
 */
function saveFavorites(favorites: Favorite[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Failed to save favorites:', error);
  }
}

/**
 * すべてのお気に入りをクリア
 */
export function clearAllFavorites(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * タイプ別にお気に入りを取得
 */
export function getFavoritesByType(type: FavoriteType): Favorite[] {
  return getFavorites().filter((f) => f.type === type);
}
