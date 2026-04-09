/**
 * 青空文庫スクレイパー
 * https://www.aozora.gr.jp/
 */
import * as cheerio from "cheerio";
import type { NovelContent, NovelSection } from "../types";

/**
 * ルビ（ふりがな）や注釈を削除
 * 例: 漢字《かんじ》 -> 漢字
 */
function cleanRuby(text: string): string {
  // 《》で囲まれたルビを削除
  text = text.replace(/《[^》]+》/g, "");
  // ［］で囲まれた注釈を削除
  text = text.replace(/［[^］]+］/g, "");
  // ｜（縦棒）を削除
  text = text.replace(/｜/g, "");
  return text;
}

/**
 * テキストがセクションタイトルかどうか判定
 */
function isSectionTitle(text: string): boolean {
  if (text.length > 30) return false;

  // 数字のみ
  if (/^\d+$/.test(text)) return true;

  // 全角数字のみ
  if (/^[０-９]+$/.test(text)) return true;

  // 漢数字のみ
  if (/^[一二三四五六七八九十百千]+$/.test(text)) return true;

  // セクションを示すキーワード
  const keywords = ["序", "章", "編", "部", "話", "エピローグ", "プロローグ"];
  for (const keyword of keywords) {
    if (text.includes(keyword)) return true;
  }

  return false;
}

/**
 * 青空文庫の小説本文を取得
 */
export async function fetchNovelContent(
  authorId: string,
  fileId: string
): Promise<NovelContent> {
  const url = `https://www.aozora.gr.jp/cards/${authorId}/files/${fileId}.html`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  // 青空文庫はShift_JIS
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder("shift_jis");
  const html = decoder.decode(buffer);

  const $ = cheerio.load(html);

  // タイトルと著者を取得
  const title = $("h1.title").text().trim() || "不明";
  const author = $("h2.author").text().trim() || "不明";

  // 本文を取得
  const mainTextElem = $("div.main_text");

  if (mainTextElem.length === 0) {
    console.warn(`No main text found for ${authorId}/${fileId}`);
    return { title, author, content: "", sections: [] };
  }

  // セクションに分割（段落ごと）
  const sections: NovelSection[] = [];
  let currentSection: NovelSection = { title: "", content: "" };

  mainTextElem.find("p, div").each((_, para) => {
    let text = $(para).text().trim();
    if (!text) return;

    // ルビなどの注釈を削除
    text = cleanRuby(text);

    // セクションタイトルかどうか判定
    if (isSectionTitle(text) && text.length < 30) {
      // 前のセクションを保存
      if (currentSection.content) {
        sections.push({ ...currentSection });
      }
      // 新しいセクション開始
      currentSection = { title: text, content: "" };
    } else {
      // 本文に追加
      if (currentSection.content) {
        currentSection.content += " ";
      }
      currentSection.content += text;
    }

    // 一定の長さごとに区切る（読み上げ用）
    if (currentSection.content.length > 1000) {
      sections.push({ ...currentSection });
      currentSection = { title: "", content: "" };
    }
  });

  // 最後のセクションを追加
  if (currentSection.content) {
    sections.push(currentSection);
  }

  // セクションがない場合は全文を1つのセクションに
  if (sections.length === 0) {
    const fullText = cleanRuby(mainTextElem.text().trim());
    sections.push({ title: "本文", content: fullText });
  }

  const content = sections.map((s) => s.content).join(" ");

  return { title, author, content, sections };
}
