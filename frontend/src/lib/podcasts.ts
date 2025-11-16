/**
 * Podcastフィード一覧
 */

export interface Podcast {
  id: string;
  title: string;
  description: string;
  feedUrl: string;
  category: string;
}

/**
 * 人気Podcast一覧
 * 実際の音声ファイルはブラウザで直接再生可能
 */
export const POPULAR_PODCASTS: Podcast[] = [
  {
    id: 'rebuild',
    title: 'Rebuild',
    description: '宮川達彦とゲストによるテクノロジー系トークPodcast',
    feedUrl: 'https://feeds.rebuild.fm/rebuildfm',
    category: 'テクノロジー',
  },
  {
    id: 'researchat',
    title: 'Researchat.fm',
    description: 'バイオロジー、化学、物理学など幅広いサイエンストピックを扱うPodcast',
    feedUrl: 'https://researchat.fm/feed.xml',
    category: 'サイエンス',
  },
  {
    id: 'backspace',
    title: 'backspace.fm',
    description: 'ドリキンとゲストによるテクノロジー、ガジェット、カルチャー系トークPodcast',
    feedUrl: 'https://backspace.fm/feed.xml',
    category: 'テクノロジー',
  },
  {
    id: 'mozaic',
    title: 'mozaic.fm',
    description: 'Webとブラウザの技術を深掘りするPodcast',
    feedUrl: 'https://feed.mozaic.fm/',
    category: 'Web技術',
  },
  {
    id: 'ajito',
    title: 'ajitofm',
    description: 'fukaboriとyomogiによるソフトウェア開発についてのPodcast',
    feedUrl: 'https://anchor.fm/s/14480e04/podcast/rss',
    category: 'ソフトウェア開発',
  },
  {
    id: 'soussune',
    title: 'そうっすね',
    description: 'デザイン、フロントエンド、ものづくりについてのトークPodcast',
    feedUrl: 'https://feeds.soussune.com/soussune',
    category: 'デザイン',
  },
  {
    id: 'codelunch',
    title: 'CodeLunch.fm',
    description: 'プログラミング、開発手法についての雑談Podcast',
    feedUrl: 'https://anchor.fm/s/1e84ad88/podcast/rss',
    category: 'プログラミング',
  },
  {
    id: 'yatteiki',
    title: 'Yatteiki.fm',
    description: 'プログラミングやギークカルチャーについてのPodcast',
    feedUrl: 'https://yatteiki.fm/rss',
    category: 'ギークカルチャー',
  },
  {
    id: 'misreading',
    title: 'Misreading Chat',
    description: 'コンピュータサイエンスや技術書の読み違いについて語るPodcast',
    feedUrl: 'https://misreading.chat/feed.xml',
    category: 'コンピュータサイエンス',
  },
];
