/**
 * SSRF防止ミドルウェア
 * 許可されたドメインのみへのリクエストを許可する
 */

const ALLOWED_DOMAINS: string[] = [
  // はてなブックマーク
  "b.hatena.ne.jp",
  "hatena.ne.jp",
  // 5ch
  "5ch.net",
  // Podcast RSS フィード（主要ホスト）
  "feeds.feedburner.com",
  "anchor.fm",
  "feeds.buzzsprout.com",
  "feeds.simplecast.com",
  "feeds.megaphone.fm",
  "feeds.redcircle.com",
  "rss.art19.com",
  "feeds.transistor.fm",
  "feeds.acast.com",
  "podcasts.files.bbci.co.uk",
  "www.omnycontent.com",
  "feeds.npr.org",
  "rss.nikkei.com",
  "feeds.nhk.or.jp",
  "www3.nhk.or.jp",
  // Mastodon instances
  "mastodon.social",
  "mastodon.jp",
  "mstdn.jp",
  "fedibird.com",
  // Bluesky
  "bsky.social",
  "bsky.app",
  "public.api.bsky.app",
  // 青空文庫
  "www.aozora.gr.jp",
  "aozora.gr.jp",
  // NHKラジオ
  "www.nhk.or.jp",
  "nhk.or.jp",
  "radio.nhk.or.jp",
  // radiko
  "radiko.jp",
  "f-radiko.smartstream.ne.jp",
];

/**
 * URLが許可リストに含まれるドメインかチェックする
 *
 * CF Workers ではDNS解決によるプライベートIP検出ができないため、
 * ドメインのallowlistのみで防御する。
 */
export function isUrlAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    const scheme = parsed.protocol.replace(":", "");
    const hostname = parsed.hostname.toLowerCase();

    // HTTPとHTTPSのみ許可
    if (scheme !== "http" && scheme !== "https") {
      return false;
    }

    if (!hostname) {
      return false;
    }

    // IPアドレス直接指定を拒否
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return false;
    }
    // IPv6
    if (hostname.startsWith("[") || hostname.includes(":")) {
      return false;
    }

    // 許可ドメインリストとの照合（サブドメインも許可）
    for (const domain of ALLOWED_DOMAINS) {
      if (hostname === domain || hostname.endsWith("." + domain)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}
