/**
 * Esuna API クライアント
 * バックエンドAPIとの通信を管理
 */

// API設定
const getApiBaseUrl = (): string => {
  // 環境変数から取得、またはLocalStorageから取得、デフォルトは開発環境URL
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('apiBaseUrl');
    if (stored) return stored;
  }

  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};

// API URLを設定
export const setApiBaseUrl = (url: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('apiBaseUrl', url);
  }
};

// 共通のfetch関数
const apiFetch = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error: ${endpoint}`, error);
    throw error;
  }
};

// データ型定義
export interface HatenaEntry {
  title: string;
  description: string;
  url: string;
  comments_url?: string;
  bookmark_count: number;
}

export interface HatenaComment {
  user_name: string;
  text: string;
}

export interface FivechBoard {
  title: string;
  url: string;
  category: string;
}

export interface FivechThread {
  title: string;
  url: string;
  response_count: number;
  thread_id?: string;
}

export interface FivechPost {
  number: number;
  name: string;
  datetime: string;
  text: string;
  mail?: string;
}

export interface SNSPost {
  author: string;
  handle: string;
  text: string;
  timestamp: string;
  likes: number;
  retweets: number;
  url?: string;
}

export interface NovelContent {
  title: string;
  author: string;
  content: string;
  sections: NovelSection[];
}

export interface NovelSection {
  title: string;
  content: string;
}

export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  pub_date: string;
  audio_url?: string;
  duration: number;
}

// はてなブックマーク API
export const fetchHatenaHot = async (): Promise<HatenaEntry[]> => {
  return apiFetch<HatenaEntry[]>('/api/hatena/hot');
};

export const fetchHatenaLatest = async (): Promise<HatenaEntry[]> => {
  return apiFetch<HatenaEntry[]>('/api/hatena/latest');
};

export const fetchHatenaComments = async (url: string): Promise<HatenaComment[]> => {
  const encodedUrl = encodeURIComponent(url);
  return apiFetch<HatenaComment[]>(`/api/hatena/comments?url=${encodedUrl}`);
};

// 5ch API
export const fetch5chBoards = async (): Promise<FivechBoard[]> => {
  return apiFetch<FivechBoard[]>('/api/5ch/boards');
};

export const fetch5chThreads = async (
  boardUrl: string,
  limit: number = 50
): Promise<FivechThread[]> => {
  const encodedUrl = encodeURIComponent(boardUrl);
  return apiFetch<FivechThread[]>(`/api/5ch/threads?board_url=${encodedUrl}&limit=${limit}`);
};

export const fetch5chPosts = async (
  threadUrl: string,
  start: number = 1,
  end: number = 100
): Promise<FivechPost[]> => {
  const encodedUrl = encodeURIComponent(threadUrl);
  return apiFetch<FivechPost[]>(
    `/api/5ch/posts?thread_url=${encodedUrl}&start=${start}&end=${end}`
  );
};

// SNS API
export const fetchSNSPosts = async (
  platform: 'twitter' | 'mastodon' | 'bluesky' = 'twitter',
  username?: string,
  limit: number = 10
): Promise<SNSPost[]> => {
  const params = new URLSearchParams({
    platform,
    limit: limit.toString(),
  });

  if (username) {
    params.append('username', username);
  }

  return apiFetch<SNSPost[]>(`/api/sns/posts?${params.toString()}`);
};

// 小説 API
export const fetchNovelContent = async (
  authorId: string,
  fileId: string
): Promise<NovelContent> => {
  return apiFetch<NovelContent>(`/api/novels/content?author_id=${authorId}&file_id=${fileId}`);
};

// Podcast API
export const fetchPodcastEpisodes = async (
  feedUrl: string,
  limit: number = 10
): Promise<PodcastEpisode[]> => {
  const encodedUrl = encodeURIComponent(feedUrl);
  return apiFetch<PodcastEpisode[]>(`/api/podcasts/episodes?feed_url=${encodedUrl}&limit=${limit}`);
};

// エラーログ送信
export const sendErrorLog = async (
  level: 'error' | 'warn' | 'info',
  message: string,
  url?: string
): Promise<void> => {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';

  await apiFetch('/api/log', {
    method: 'POST',
    body: JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      user_agent: userAgent,
      url,
    }),
  });
};
