/**
 * Esuna Backend API
 * 視覚障害者向けアクセシブルWebアプリケーションのバックエンド
 *
 * Hono on Cloudflare Workers
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";
import { isUrlAllowed } from "./middleware/ssrf";
import { fetchHatenaHot, fetchHatenaLatest, fetchHatenaComments } from "./scrapers/hatena";
import { fetch5chBoards, fetch5chThreads, fetch5chPosts } from "./scrapers/fivech";
import { fetchTwitterPosts, fetchMastodonPosts, fetchBlueskyPosts } from "./scrapers/sns";
import { fetchNovelContent } from "./scrapers/aozora";
import { fetchPodcastEpisodes } from "./scrapers/podcast";
import { getStreamUrl, getNowPlaying } from "./scrapers/radio";

const app = new Hono<{ Bindings: Env }>();

// CORS設定
app.use("*", async (c, next) => {
  const originsStr = c.env.CORS_ORIGINS || "http://localhost:5173";
  const origins = originsStr.split(",").map((o: string) => o.trim());

  const corsMiddleware = cors({
    origin: origins,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  return corsMiddleware(c, next);
});

// ヘルスチェック
app.get("/", (c) => {
  return c.json({
    service: "Esuna API",
    version: "0.2.0",
    status: "running",
  });
});

app.get("/health", (c) => {
  return c.json({ status: "healthy" });
});

// エラーログ収集
app.post("/api/log", async (c) => {
  const body = await c.req.json();
  console.log(
    `Frontend Error: ${body.message} | URL: ${body.url} | UA: ${body.user_agent}`
  );
  return c.json({ status: "logged" });
});

// =============================================================
// はてなブックマーク API
// =============================================================

app.get("/api/hatena/hot", async (c) => {
  try {
    const entries = await fetchHatenaHot();
    return c.json(entries);
  } catch (e) {
    console.error("Error in get_hatena_hot:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.get("/api/hatena/latest", async (c) => {
  try {
    const entries = await fetchHatenaLatest();
    return c.json(entries);
  } catch (e) {
    console.error("Error in get_hatena_latest:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.get("/api/hatena/comments", async (c) => {
  const url = c.req.query("url");
  if (!url) {
    return c.json({ error: "url parameter is required" }, 400);
  }
  if (!isUrlAllowed(url)) {
    return c.json({ error: "許可されていないURLです" }, 400);
  }
  try {
    const comments = await fetchHatenaComments(url);
    return c.json(comments);
  } catch (e) {
    console.error("Error in get_hatena_comments:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// =============================================================
// 5ch API
// =============================================================

app.get("/api/5ch/boards", async (c) => {
  try {
    const boards = await fetch5chBoards();
    return c.json(boards);
  } catch (e) {
    console.error("Error in get_5ch_boards:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.get("/api/5ch/threads", async (c) => {
  const boardUrl = c.req.query("board_url");
  if (!boardUrl) {
    return c.json({ error: "board_url parameter is required" }, 400);
  }
  if (!isUrlAllowed(boardUrl)) {
    return c.json({ error: "許可されていないURLです" }, 400);
  }
  const limit = Math.min(
    Math.max(parseInt(c.req.query("limit") || "50", 10) || 50, 1),
    100
  );
  try {
    const threads = await fetch5chThreads(boardUrl, limit);
    return c.json(threads);
  } catch (e) {
    console.error("Error in get_5ch_threads:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.get("/api/5ch/posts", async (c) => {
  const threadUrl = c.req.query("thread_url");
  if (!threadUrl) {
    return c.json({ error: "thread_url parameter is required" }, 400);
  }
  if (!isUrlAllowed(threadUrl)) {
    return c.json({ error: "許可されていないURLです" }, 400);
  }
  const start = Math.max(parseInt(c.req.query("start") || "1", 10) || 1, 1);
  const end = Math.min(
    Math.max(parseInt(c.req.query("end") || "100", 10) || 100, 1),
    1000
  );
  try {
    const posts = await fetch5chPosts(threadUrl, start, end);
    return c.json(posts);
  } catch (e) {
    console.error("Error in get_5ch_posts:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// =============================================================
// SNS API
// =============================================================

app.get("/api/sns/posts", async (c) => {
  const platform = c.req.query("platform") || "twitter";
  const username = c.req.query("username") || null;
  const limit = Math.min(
    Math.max(parseInt(c.req.query("limit") || "10", 10) || 10, 1),
    50
  );

  try {
    if (platform === "twitter") {
      const posts = await fetchTwitterPosts(username, limit);
      return c.json(posts);
    } else if (platform === "mastodon") {
      const instance = username || "mastodon.social";
      const posts = await fetchMastodonPosts(instance, limit);
      return c.json(posts);
    } else if (platform === "bluesky") {
      const posts = await fetchBlueskyPosts(username, limit);
      return c.json(posts);
    } else {
      return c.json({ error: `Unknown platform: ${platform}` }, 400);
    }
  } catch (e) {
    console.error("Error in get_sns_posts:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// =============================================================
// 小説 API
// =============================================================

app.get("/api/novels/content", async (c) => {
  const authorId = c.req.query("author_id");
  const fileId = c.req.query("file_id");
  if (!authorId || !fileId) {
    return c.json(
      { error: "author_id and file_id parameters are required" },
      400
    );
  }
  try {
    const content = await fetchNovelContent(authorId, fileId);
    return c.json(content);
  } catch (e) {
    console.error("Error in get_novel_content:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// =============================================================
// Podcast API
// =============================================================

app.get("/api/podcasts/episodes", async (c) => {
  const feedUrl = c.req.query("feed_url");
  if (!feedUrl) {
    return c.json({ error: "feed_url parameter is required" }, 400);
  }
  if (!isUrlAllowed(feedUrl)) {
    return c.json(
      { error: "許可されていないURLです。許可されたPodcastホストを使用してください" },
      400
    );
  }
  const limit = Math.min(
    Math.max(parseInt(c.req.query("limit") || "10", 10) || 10, 1),
    50
  );
  try {
    const episodes = await fetchPodcastEpisodes(feedUrl, limit);
    return c.json(episodes);
  } catch (e) {
    console.error("Error in get_podcast_episodes:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// =============================================================
// ラジオ API
// =============================================================

app.get("/api/radio/stream-url/:service/:stationId", async (c) => {
  const service = c.req.param("service");
  const stationId = c.req.param("stationId");

  try {
    const streamData = await getStreamUrl(service, stationId);
    return c.json(streamData);
  } catch (e) {
    const message = String(e);
    if (message.includes("not yet implemented")) {
      return c.json({ error: message }, 501);
    }
    if (
      message.includes("Unknown") ||
      message.includes("should not call")
    ) {
      return c.json({ error: message }, 400);
    }
    console.error("Error in get_radio_stream_url:", e);
    return c.json({ error: message }, 500);
  }
});

app.get("/api/radio/now-playing/:service/:stationId", async (c) => {
  const service = c.req.param("service");
  const stationId = c.req.param("stationId");

  try {
    const nowPlaying = await getNowPlaying(service, stationId);
    if (nowPlaying === null) {
      return c.json(
        { error: "Now playing information not available" },
        404
      );
    }
    return c.json(nowPlaying);
  } catch (e) {
    console.error("Error in get_radio_now_playing:", e);
    return c.json({ error: String(e) }, 500);
  }
});

// グローバルエラーハンドラー
app.onError((err, c) => {
  console.error("Unhandled exception:", err);
  return c.json(
    {
      error: "Internal server error",
      message: String(err),
    },
    500
  );
});

export default app;
