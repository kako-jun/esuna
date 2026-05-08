/**
 * SNS（Twitter/X, Mastodon, Bluesky）のスクレイピング機能
 *
 * 注意: Twitter/X APIは現在有料のため未対応。
 * Mastodon は公開 API を使用。Bluesky は public.api.bsky.app を使用。
 */
import type { SnsPost } from "../types";

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
      const text = content.replace(/<[^>]+>/g, "").trim();
      if (!text) continue;

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
 * Bluesky APIのレスポンスをパース
 */
function parseBlueskyPosts(
  feed: Array<Record<string, unknown>>
): SnsPost[] {
  const parsed: SnsPost[] = [];

  for (const item of feed) {
    try {
      const post = item.post as Record<string, unknown>;
      if (!post) continue;

      const author = post.author as Record<string, unknown>;
      const record = post.record as Record<string, unknown>;
      const text = (record?.text as string) || "";
      if (!text) continue;

      const displayName = (author?.displayName as string) || (author?.handle as string) || "";
      const handle = (author?.handle as string) || "";
      const did = (author?.did as string) || "";
      const indexedAt = (post.indexedAt as string) || "";
      const likeCount = (post.likeCount as number) || 0;
      const repostCount = (post.repostCount as number) || 0;
      const rkey = ((post.uri as string) || "").split("/").pop() || "";
      const url = did && rkey ? `https://bsky.app/profile/${did}/post/${rkey}` : "";

      parsed.push({
        author: displayName,
        handle: `@${handle}`,
        text,
        timestamp: formatTimestamp(indexedAt),
        likes: likeCount,
        retweets: repostCount,
        url,
      });
    } catch (e) {
      console.warn("Error parsing Bluesky post:", e);
    }
  }

  return parsed;
}

/**
 * Twitter/X の投稿取得（API 有料のため未対応）
 */
export async function fetchTwitterPosts(
  _username?: string | null,
  _limit: number = 10
): Promise<SnsPost[]> {
  throw new Error("Twitter/X API は未対応です");
}

/**
 * Mastodon の公開タイムラインを取得
 */
export async function fetchMastodonPosts(
  instance: string = "mastodon.social",
  limit: number = 10
): Promise<SnsPost[]> {
  const url = `https://${instance}/api/v1/timelines/public?limit=${limit}`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`Mastodon API HTTP ${response.status}`);
  }
  const posts = (await response.json()) as Array<Record<string, unknown>>;
  return parseMastodonPosts(posts);
}

/**
 * Bluesky の公開フィードを取得（認証不要）
 * What's Hot フィード: at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.graph.list/3ld7brljmcs2b
 */
export async function fetchBlueskyPosts(
  _handle?: string | null,
  limit: number = 10
): Promise<SnsPost[]> {
  // What's Hot（公開フィード、認証不要）
  const feed = "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.graph.list/3ld7brljmcs2b";
  const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getFeed?feed=${encodeURIComponent(feed)}&limit=${limit}`;
  const response = await fetch(url, {
    headers: { "Accept": "application/json" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`Bluesky API HTTP ${response.status}`);
  }
  const data = (await response.json()) as Record<string, unknown>;
  const feedItems = (data.feed as Array<Record<string, unknown>>) || [];
  return parseBlueskyPosts(feedItems);
}
