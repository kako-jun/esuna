/**
 * Podcastスクレイパー
 * RSSフィードからPodcastエピソード情報を取得
 */
import * as cheerio from "cheerio";
import type { PodcastEpisode } from "../types";

/**
 * HTMLタグを削除してプレーンテキストに変換
 */
function cleanHtml(text: string): string {
  if (!text) return "";
  const $ = cheerio.load(text);
  return $.text().trim();
}

/**
 * 時間文字列を秒数に変換
 *
 * 形式: HH:MM:SS / MM:SS / 秒数
 */
function parseDuration(durationStr: string): number {
  if (!durationStr) return 0;

  try {
    // 秒数のみの場合
    if (!durationStr.includes(":")) {
      return Math.floor(parseFloat(durationStr)) || 0;
    }

    // HH:MM:SS または MM:SS形式
    const parts = durationStr.split(":").map((p) => parseInt(p, 10));

    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Podcast RSSフィードからエピソード一覧を取得
 */
export async function fetchPodcastEpisodes(
  feedUrl: string,
  limit: number = 10
): Promise<PodcastEpisode[]> {
  const response = await fetch(feedUrl, {
    signal: AbortSignal.timeout(30_000),
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const xmlContent = await response.text();

  // cheerio で XML をパース
  const $ = cheerio.load(xmlContent, { xmlMode: true });

  const episodes: PodcastEpisode[] = [];

  // RSS 2.0の場合
  const channel = $("channel");
  if (channel.length > 0) {
    const items = channel.find("item");
    items.each((index, item) => {
      if (index >= limit) return false; // break

      const $item = $(item);
      const titleRaw = $item.find("title").text();
      const descriptionRaw = $item.find("description").text();
      const pubDate = $item.find("pubDate").text() || "";

      // itunes:duration
      const durationText =
        $item.find("itunes\\:duration, duration").text() || "0";

      // enclosure要素から音声ファイルURL
      const enclosure = $item.find("enclosure");
      const audioUrl = enclosure.attr("url") || null;

      // guidをIDとして使用
      const guidText = $item.find("guid").text();

      const title = cleanHtml(titleRaw) || "不明";
      const description = cleanHtml(descriptionRaw);
      const durationSeconds = parseDuration(durationText);

      episodes.push({
        id: guidText || `episode_${index}`,
        title,
        description: description.slice(0, 300),
        pub_date: pubDate,
        audio_url: audioUrl,
        duration: durationSeconds,
      });
    });
  } else {
    // Atomフィードの場合
    const entries = $("entry");
    entries.each((index, entry) => {
      if (index >= limit) return false;

      const $entry = $(entry);
      const titleRaw = $entry.find("title").text();
      const summaryRaw = $entry.find("summary").text();
      const published = $entry.find("published").text() || "";

      // link要素から音声ファイルURL
      let audioUrl: string | null = null;
      $entry.find("link").each((_, link) => {
        const type = $(link).attr("type") || "";
        if (type.startsWith("audio/")) {
          audioUrl = $(link).attr("href") || null;
          return false; // break
        }
      });

      const idText = $entry.find("id").text();

      const title = cleanHtml(titleRaw) || "不明";
      const description = cleanHtml(summaryRaw);

      episodes.push({
        id: idText || `episode_${index}`,
        title,
        description: description.slice(0, 300),
        pub_date: published,
        audio_url: audioUrl,
        duration: 0,
      });
    });
  }

  return episodes;
}
