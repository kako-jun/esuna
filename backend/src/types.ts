/**
 * Esuna API 共通型定義
 */

export interface HatenaEntry {
  title: string;
  description: string;
  url: string;
  comments_url: string;
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

export interface NovelSection {
  title: string;
  content: string;
}

export interface NovelContent {
  title: string;
  author: string;
  content: string;
  sections: NovelSection[];
}

export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  pub_date: string;
  audio_url: string | null;
  duration: number;
}

export interface RadioStreamData {
  streamUrl: string;
  format: string;
  expiresAt: string | null;
}

export interface NowPlayingData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

export interface SnsPost {
  author: string;
  handle: string;
  text: string;
  timestamp: string;
  likes: number;
  retweets: number;
  url?: string;
}

export interface Env {
  CORS_ORIGINS: string;
}
