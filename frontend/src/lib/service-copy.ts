// ── 状態別メッセージ生成 ──────────────────────────────────────
// 利用者が「いま何が起きているか」「次にどうすればよいか」を
// 常に把握できるよう、状態ごとに文言を統一する。
//
// 5 状態モデル:
//   loading  … 取得中。対象名つきで待機を促す
//   success  … 成功。件数や作品名など結果を伝える
//   failure  … 失敗。原因 + 次の行動（戻る/再試行）を案内する
//   blocked  … 機能未成立。戻ることだけを案内する
//   retrying … 再試行中（loading のバリエーション）

/** 待機中メッセージ（UI 表示用・読み上げ用共通）*/
export function loadingMessage(targetName: string): string {
  return `${targetName}を開いています。少し待ってください。`
}

/** 失敗メッセージ（UI 表示用）*/
export function failureMessage(targetName: string, cause: string): string {
  return `${targetName}を取得できませんでした。${cause}`
}

/** 失敗メッセージ（読み上げ用）。次の行動案内つき */
export function failureSpeech(targetName: string, cause: string, canRetry: boolean = true): string {
  const nav = canRetry ? '1番で戻る、4番でもう一度試せます。' : '1番で戻ってください。'
  return `${targetName}を取得できませんでした。${cause}${nav}`
}

/** 機能未成立メッセージ（UI 表示用）*/
export function blockedMessage(targetName: string, reason: string): string {
  return `${targetName}は現在使えません。${reason}`
}

/** 機能未成立メッセージ（読み上げ用）*/
export function blockedSpeech(targetName: string, reason: string): string {
  return `${targetName}は現在使えません。${reason}1番で戻ってください。`
}

/** 再試行中メッセージ（読み上げ用）*/
export function retryingSpeech(targetName: string): string {
  return `${targetName}をもう一度取得しています。少し待ってください。`
}

/** 再試行失敗メッセージ（読み上げ用）*/
export function retryFailureSpeech(targetName: string): string {
  return `${targetName}を再取得できませんでした。1番で戻ってください。`
}

// ──────────────────────────────────────────────────────────────

export const FORMAL_SERVICE_NAMES = {
  hatena: 'はてなブックマーク',
  sns: 'Mastodon / Bluesky',
  fivech: '5ちゃんねる',
  rss: 'RSSニュース',
  aozora: '青空文庫',
  podcast: 'Podcast',
  radio: 'ラジオ',
} as const

export function getFeatureStatusSummary(key: keyof typeof FORMAL_SERVICE_NAMES): string {
  switch (key) {
    case 'hatena':
      return '人気記事とコメントを確認できます。'
    case 'sns':
      return '現在は試験表示です。Xには未対応で、Mastodon と Bluesky を整備中です。'
    case 'fivech':
      return '現在未対応です。板名の確認までで、スレッド一覧とレス取得は使えません。'
    case 'rss':
      return '外部ニュースサイトの RSS を読み込みます。取得先によって失敗する場合があります。'
    case 'aozora':
      return '青空文庫の作品を開きます。'
    case 'podcast':
      return '外部 Podcast 番組を読み込みます。番組によっては取得に失敗します。'
    case 'radio':
      return 'NHKラジオ第2は時間帯により放送休止することがあります。radiko はまだ再生できません。'
  }
}

export function getFormalProgressTypeName(type: string): string {
  switch (type) {
    case 'novel':
      return FORMAL_SERVICE_NAMES.aozora
    case 'podcast':
      return FORMAL_SERVICE_NAMES.podcast
    case 'rss-feed':
    case 'rss-article':
      return FORMAL_SERVICE_NAMES.rss
    case '5ch-board':
    case '5ch-thread':
      return FORMAL_SERVICE_NAMES.fivech
    default:
      return 'コンテンツ'
  }
}

export function previewText(text: string | undefined | null, maxLength: number = 48): string {
  if (!text) {
    return ''
  }

  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength)}…`
}
