/**
 * 5ch（旧2ch）のスクレイピング機能
 */
import type { FivechBoard, FivechThread, FivechPost } from "../types";

/** 5chの主要な板（カテゴリ別） */
const POPULAR_BOARDS: FivechBoard[] = [
  {
    title: "ニュース速報+",
    url: "https://asahi.5ch.net/newsplus/",
    category: "ニュース",
  },
  {
    title: "ニュース速報",
    url: "https://hayabusa9.5ch.net/news/",
    category: "ニュース",
  },
  {
    title: "芸スポ速報+",
    url: "https://hayabusa9.5ch.net/mnewsplus/",
    category: "芸能",
  },
  {
    title: "なんでも実況J",
    url: "https://eagle.5ch.net/livejupiter/",
    category: "実況",
  },
  {
    title: "プログラマー",
    url: "https://mevius.5ch.net/tech/",
    category: "PC・技術",
  },
  {
    title: "プログラム",
    url: "https://mevius.5ch.net/prog/",
    category: "PC・技術",
  },
];

/**
 * 5chの板一覧を取得（人気板のリストを返す）
 */
export async function fetch5chBoards(): Promise<FivechBoard[]> {
  return POPULAR_BOARDS;
}

/**
 * subject.txt をパースしてスレッド一覧を作成
 */
function parse5chThreads(
  subjectTxt: string,
  boardUrl: string,
  limit: number
): FivechThread[] {
  const threads: FivechThread[] = [];
  const lines = subjectTxt.trim().split("\n").slice(0, limit);

  for (const line of lines) {
    try {
      if (!line.includes("<>")) continue;

      const [datFile, titleWithCount] = line.split("<>", 2);
      const threadId = datFile.replace(".dat", "");

      // レス数を抽出
      let responseCount = 0;
      let title = titleWithCount;
      const match = titleWithCount.match(/\((\d+)\)/);
      if (match) {
        responseCount = parseInt(match[1], 10);
        title = titleWithCount.replace(/\s*\(\d+\)\s*$/, "");
      }

      // スレッドURLを構築
      const parsed = new URL(boardUrl);
      const boardName = parsed.pathname.replace(/^\/|\/$/g, "");
      const threadUrl = `${parsed.protocol}//${parsed.host}/test/read.cgi/${boardName}/${threadId}/`;

      threads.push({
        title,
        url: threadUrl,
        response_count: responseCount,
        thread_id: threadId,
      });
    } catch (e) {
      console.warn(`Error parsing thread line: ${line}`, e);
    }
  }

  return threads;
}

/**
 * 指定された板のスレッド一覧を取得
 */
export async function fetch5chThreads(
  boardUrl: string,
  limit: number = 50
): Promise<FivechThread[]> {
  const subjectUrl = boardUrl.replace(/\/$/, "") + "/subject.txt";

  const response = await fetch(subjectUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; EsunaBot/0.2)",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  // 5chはShift_JIS（cp932）
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder("shift_jis");
  const text = decoder.decode(buffer);

  return parse5chThreads(text, boardUrl, limit);
}

/**
 * dat形式の投稿をパース
 */
function parse5chPosts(
  datContent: string,
  start: number,
  end: number
): FivechPost[] {
  const posts: FivechPost[] = [];
  const lines = datContent.trim().split("\n");

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    if (lineNum < start || lineNum > end) continue;

    try {
      const parts = lines[i].split("<>");
      if (parts.length < 4) continue;

      const name = parts[0];
      const mail = parts[1];
      const datetimeId = parts[2];
      let text = parts[3];

      // HTMLタグを除去
      text = text.replace(/<br>/gi, "\n");
      text = text.replace(/<[^>]+>/g, "");

      posts.push({
        number: lineNum,
        name,
        datetime: datetimeId,
        text,
        mail,
      });
    } catch (e) {
      console.warn(`Error parsing post line ${lineNum}:`, e);
    }
  }

  return posts;
}

/**
 * スレッドの投稿を取得
 */
export async function fetch5chPosts(
  threadUrl: string,
  start: number = 1,
  end: number = 100
): Promise<FivechPost[]> {
  // thread_url 例: https://asahi.5ch.net/test/read.cgi/newsplus/1234567890/
  // dat URL 例:    https://asahi.5ch.net/newsplus/dat/1234567890.dat
  const match = threadUrl.match(/\/test\/read\.cgi\/([^/]+)\/(\d+)\/?$/);
  if (!match) {
    throw new Error(`Invalid thread URL: ${threadUrl}`);
  }

  const boardName = match[1];
  const threadId = match[2];
  const parsed = new URL(threadUrl);
  const datUrl = `${parsed.protocol}//${parsed.host}/${boardName}/dat/${threadId}.dat`;

  const response = await fetch(datUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; EsunaBot/0.2)",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  // 5chはShift_JIS（cp932）
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder("shift_jis");
  const text = decoder.decode(buffer);

  return parse5chPosts(text, start, end);
}
