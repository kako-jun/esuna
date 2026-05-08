export const FORMAL_SERVICE_NAMES = {
  hatena: 'はてなブックマーク',
  sns: 'Mastodon / Bluesky',
  fivech: '5ちゃんねる',
  rss: 'RSSニュース',
  aozora: '青空文庫',
  podcast: 'Podcast',
  radio: 'ラジオ',
} as const;

export function getFeatureStatusSummary(key: keyof typeof FORMAL_SERVICE_NAMES): string {
  switch (key) {
    case 'hatena':
      return '人気記事とコメントを確認できます。';
    case 'sns':
      return '現在は試験表示です。Xには未対応で、Mastodon と Bluesky を整備中です。';
    case 'fivech':
      return '現在未対応です。板名の確認までで、スレッド一覧とレス取得は使えません。';
    case 'rss':
      return '外部ニュースサイトの RSS を読み込みます。取得先によって失敗する場合があります。';
    case 'aozora':
      return '青空文庫の作品を開きます。現在は取得が不安定で、開けない作品があります。';
    case 'podcast':
      return '外部 Podcast 番組を読み込みます。番組によっては取得に失敗します。';
    case 'radio':
      return 'NHK らじるらじるは一部環境で不安定です。radiko はまだ再生できません。';
  }
}

export function getFormalProgressTypeName(type: string): string {
  switch (type) {
    case 'novel':
      return FORMAL_SERVICE_NAMES.aozora;
    case 'podcast':
      return FORMAL_SERVICE_NAMES.podcast;
    case 'rss-feed':
    case 'rss-article':
      return FORMAL_SERVICE_NAMES.rss;
    case '5ch-board':
    case '5ch-thread':
      return FORMAL_SERVICE_NAMES.fivech;
    default:
      return 'コンテンツ';
  }
}

export function previewText(text: string | undefined | null, maxLength: number = 48): string {
  if (!text) {
    return '';
  }

  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}…`;
}
