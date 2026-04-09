/**
 * SNS（Twitter/X, Mastodon, Bluesky）のスクレイピング機能
 *
 * 注意: Twitter/X APIは現在有料のため、サンプルデータを返す実装。
 * Mastodonは公開APIを使用。Blueskyは将来実装予定。
 */
import type { SnsPost } from "../types";

/** サンプル投稿データ */
const SAMPLE_POSTS: SnsPost[] = [
  {
    author: "技術太郎",
    handle: "@tech_taro",
    text: "新しいアクセシビリティ機能を実装してみた。音声読み上げとキーボード操作だけでWebアプリが使えるようになった。",
    timestamp: "5分前",
    likes: 42,
    retweets: 8,
  },
  {
    author: "開発花子",
    handle: "@dev_hanako",
    text: "FastAPIとNext.jsでモノレポ構成のアプリ作ってる。バックエンドでスクレイピング処理をやると、フロントエンドがシンプルになっていい感じ。",
    timestamp: "15分前",
    likes: 38,
    retweets: 5,
  },
  {
    author: "アクセシビリティ次郎",
    handle: "@a11y_jiro",
    text: "視覚障害者向けのWebアプリ開発で大事なのは、統一された操作体系。毎回違う場所にボタンがあると混乱する。",
    timestamp: "30分前",
    likes: 156,
    retweets: 32,
  },
  {
    author: "Web標準子",
    handle: "@web_std",
    text: "ARIAラベルとか、セマンティックHTMLとか、基本的なことをちゃんとやるだけでアクセシビリティは大幅に向上する。",
    timestamp: "1時間前",
    likes: 89,
    retweets: 15,
  },
  {
    author: "Python愛好家",
    handle: "@python_lover",
    text: "BeautifulSoup4でスクレイピングしてたけど、最近はhttpxの非同期クライアントと組み合わせるのが快適。FastAPIとの相性も抜群。",
    timestamp: "2時間前",
    likes: 67,
    retweets: 12,
  },
];

/**
 * タイムスタンプを相対時間に変換
 */
function formatTimestamp(timestampStr: string): string {
  try {
    const timestamp = new Date(timestampStr);
    const now = new Date();
    const deltaMs = now.getTime() - timestamp.getTime();
    const deltaSec = Math.floor(deltaMs / 1000);

    if (deltaSec < 0) return timestampStr;

    const days = Math.floor(deltaSec / 86400);
    if (days > 0) return `${days}日前`;

    const hours = Math.floor(deltaSec / 3600);
    if (hours > 0) return `${hours}時間前`;

    const minutes = Math.floor(deltaSec / 60);
    if (minutes > 0) return `${minutes}分前`;

    return "たった今";
  } catch {
    return timestampStr;
  }
}

/**
 * Mastodon APIのレスポンスをパース
 */
function parseMastodonPosts(
  posts: Array<Record<string, unknown>>
): SnsPost[] {
  const parsed: SnsPost[] = [];

  for (const post of posts) {
    try {
      const content = (post.content as string) || "";
      // HTMLタグを簡易的に除去
      const text = content.replace(/<[^>]+>/g, "");

      const account = post.account as Record<string, unknown>;
      const displayName =
        (account.display_name as string) ||
        (account.username as string) ||
        "";
      const username = (account.username as string) || "";

      parsed.push({
        author: displayName,
        handle: `@${username}`,
        text,
        timestamp: formatTimestamp(post.created_at as string),
        likes: (post.favourites_count as number) || 0,
        retweets: (post.reblogs_count as number) || 0,
        url: (post.url as string) || "",
      });
    } catch (e) {
      console.warn("Error parsing Mastodon post:", e);
    }
  }

  return parsed;
}

/**
 * Twitter/Xの投稿を取得（現在はサンプルデータ）
 */
export async function fetchTwitterPosts(
  _username?: string | null,
  limit: number = 10
): Promise<SnsPost[]> {
  return SAMPLE_POSTS.slice(0, limit);
}

/**
 * Mastodonの公開タイムラインを取得
 */
export async function fetchMastodonPosts(
  instance: string = "mastodon.social",
  limit: number = 10
): Promise<SnsPost[]> {
  try {
    const url = `https://${instance}/api/v1/timelines/public?limit=${limit}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const posts = (await response.json()) as Array<Record<string, unknown>>;
    return parseMastodonPosts(posts);
  } catch (e) {
    console.error(`Error fetching Mastodon posts from ${instance}:`, e);
    // エラー時はサンプルデータを返す
    return SAMPLE_POSTS.slice(0, limit);
  }
}

/**
 * Blueskyの投稿を取得（将来実装予定）
 */
export async function fetchBlueskyPosts(
  _handle?: string | null,
  limit: number = 10
): Promise<SnsPost[]> {
  // TODO: Bluesky AT Protocol実装
  return SAMPLE_POSTS.slice(0, limit);
}
