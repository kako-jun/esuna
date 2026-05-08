/**
 * はてなブックマークのスクレイピング機能
 */
import * as cheerio from "cheerio";
import type { HatenaEntry, HatenaComment } from "../types";

/**
 * はてなブックマークRSSをパース
 * cheerio で XML を処理する
 */
// 名前空間付き要素 (`hatena:bookmarkcount` 等) は CSS セレクタの `\\:` エスケープが
// 環境（workerd runtime と node）で解釈差を起こす。子要素を直接走査して tagName で
// 振り分ければ namespace の有無に依存せず取れる。
function findChildText(
  $: cheerio.CheerioAPI,
  $item: cheerio.Cheerio<any>,
  tagName: string,
): string {
  let value = "";
  $item.children().each((_, child) => {
    if (value) return;
    if ((child as { tagName?: string }).tagName === tagName) {
      value = $(child).text();
    }
  });
  return value;
}

function parseHatenaRss(xmlContent: string): HatenaEntry[] {
  const $ = cheerio.load(xmlContent, { xmlMode: true });
  const entries: HatenaEntry[] = [];

  $("item").each((_, item) => {
    try {
      const $item = $(item);
      const title = findChildText($, $item, "title");
      const description = findChildText($, $item, "description");
      const url = findChildText($, $item, "link");

      const commentsUrl = findChildText($, $item, "hatena:bookmarkCommentListPageUrl");
      const bookmarkCountText = findChildText($, $item, "hatena:bookmarkcount");
      const bookmarkCount = bookmarkCountText
        ? parseInt(bookmarkCountText, 10) || 0
        : 0;

      entries.push({
        title,
        description,
        url,
        comments_url: commentsUrl,
        bookmark_count: bookmarkCount,
      });
    } catch (e) {
      console.warn("Error parsing RSS item:", e);
    }
  });

  return entries;
}

/**
 * はてなブックマーク人気エントリーを取得
 */
export async function fetchHatenaHot(): Promise<HatenaEntry[]> {
  const url = "https://b.hatena.ne.jp/hotentry?mode=rss";

  const response = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const xmlContent = await response.text();
  return parseHatenaRss(xmlContent);
}

/**
 * はてなブックマーク新着エントリーを取得
 */
export async function fetchHatenaLatest(): Promise<HatenaEntry[]> {
  const url = "https://b.hatena.ne.jp/entrylist?mode=rss";

  const response = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const xmlContent = await response.text();
  return parseHatenaRss(xmlContent);
}

/**
 * はてなブックマークのコメントHTMLをパース
 */
function parseHatenaComments(htmlContent: string): HatenaComment[] {
  const $ = cheerio.load(htmlContent);
  const comments: HatenaComment[] = [];

  $(".js-bookmarks-recent > .entry-comment-contents").each((_, node) => {
    try {
      const $node = $(node);
      const userName =
        $node.find(".entry-comment-username > a").text().trim() || "";
      const text = $node.find(".entry-comment-text").text().trim() || "";

      if (userName || text) {
        comments.push({ user_name: userName, text });
      }
    } catch (e) {
      console.warn("Error parsing comment:", e);
    }
  });

  return comments;
}

/**
 * はてなブックマークのコメントを取得
 */
export async function fetchHatenaComments(
  url: string
): Promise<HatenaComment[]> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const htmlContent = await response.text();
  return parseHatenaComments(htmlContent);
}
