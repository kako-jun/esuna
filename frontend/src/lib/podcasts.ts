/**
 * Podcastフィード一覧
 *
 * esuna は視覚障害者向けポータルなので、聴くだけで完結する音声コンテンツを
 * ジャンル横断で揃える方針。技術系に偏らず、ニュース・歴史・生活・科学・
 * 教養・エンタメまでバランスを取る。各 feed は本番 API 経由でエピソード
 * 取得を確認済（2026-05-08）。
 */

export interface Podcast {
  id: string
  title: string
  description: string
  feedUrl: string
  category: string
}

export const POPULAR_PODCASTS: Podcast[] = [
  {
    id: 'nhk-news',
    title: 'NHKラジオニュース',
    description:
      'NHKによる定時ニュースのポッドキャスト。最新の国内・国際ニュースを音声で確認できる',
    feedUrl: 'https://www.nhk.or.jp/s-media/news/podcast/list/v1/all.xml',
    category: 'ニュース',
  },
  {
    id: 'coten-radio',
    title: '歴史を面白く学ぶコテンラジオ',
    description:
      '深井龍之介・楊睿之・樋口聖典による歴史トークPodcast。長尺で語り口が面白く耳学問に最適',
    feedUrl: 'https://anchor.fm/s/8c2088c/podcast/rss',
    category: '歴史・カルチャー',
  },
  {
    id: 'jane-su-life',
    title: 'ジェーン・スー　生活は踊る',
    description: 'TBSラジオ。ジェーン・スーがお送りする昼の生活情報番組のポッドキャスト版',
    feedUrl: 'https://feeds.megaphone.fm/TBS1408470359',
    category: '生活・トーク',
  },
  {
    id: 'tonari-no-zatsudan',
    title: 'となりの雑談',
    description: 'TBSラジオ。ジェーン・スーと桜林直子による日常の雑談Podcast',
    feedUrl: 'https://feeds.megaphone.fm/TBS6714057012',
    category: '雑談',
  },
  {
    id: 'sasaki-uchu',
    title: '佐々木亮の宇宙ばなし',
    description: '宇宙物理学者の佐々木亮による、宇宙・天文の話を分かりやすく語るPodcast',
    feedUrl: 'https://anchor.fm/s/33afc1b0/podcast/rss',
    category: '科学・宇宙',
  },
  {
    id: 'cho-soutaisei',
    title: '超相対性理論',
    description: '渡邊康太郎・荒木博行・吉田陽子による教養系トークPodcast',
    feedUrl: 'https://anchor.fm/s/57a9101c/podcast/rss',
    category: '教養・思想',
  },
  {
    id: 'yoru-mystery',
    title: '令和版・夜のミステリー',
    description: 'TBSラジオの音声ドラマ。聴くだけで楽しめるミステリー作品',
    feedUrl: 'https://feeds.megaphone.fm/TBS6253527190',
    category: '朗読・ドラマ',
  },
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
]
