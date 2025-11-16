"""
青空文庫スクレイパー
https://www.aozora.gr.jp/
"""
import httpx
from bs4 import BeautifulSoup
from typing import List, Dict, Any
import logging
import re

logger = logging.getLogger(__name__)

# タイムアウト設定
TIMEOUT = 30.0


async def fetch_novel_content(author_id: str, file_id: str) -> Dict[str, Any]:
    """
    青空文庫の小説本文を取得

    Args:
        author_id: 作家ID (例: "000148")
        file_id: ファイルID (例: "773_14560")

    Returns:
        小説の内容（タイトル、著者、セクション分割されたテキスト）
    """
    url = f"https://www.aozora.gr.jp/cards/{author_id}/files/{file_id}.html"

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(url)
            response.raise_for_status()

            # エンコーディングを指定（青空文庫はShift_JIS）
            response.encoding = 'shift_jis'
            html = response.text

        soup = BeautifulSoup(html, 'html.parser')

        # タイトルと著者を取得
        title_elem = soup.find('h1', class_='title')
        author_elem = soup.find('h2', class_='author')

        title = title_elem.get_text(strip=True) if title_elem else "不明"
        author = author_elem.get_text(strip=True) if author_elem else "不明"

        # 本文を取得
        main_text_elem = soup.find('div', class_='main_text')

        if not main_text_elem:
            logger.warning(f"No main text found for {author_id}/{file_id}")
            return {
                "title": title,
                "author": author,
                "content": "",
                "sections": []
            }

        # セクションに分割（段落ごと）
        sections = []
        paragraphs = main_text_elem.find_all(['p', 'div'])

        current_section = {
            "title": "",
            "content": ""
        }

        for i, para in enumerate(paragraphs):
            text = para.get_text(strip=True)

            # 空行をスキップ
            if not text:
                continue

            # ルビなどの注釈を削除
            text = clean_ruby(text)

            # セクションタイトルかどうか判定（全角数字や「一」「二」など）
            if is_section_title(text) and len(text) < 30:
                # 前のセクションを保存
                if current_section["content"]:
                    sections.append(current_section.copy())

                # 新しいセクション開始
                current_section = {
                    "title": text,
                    "content": ""
                }
            else:
                # 本文に追加
                if current_section["content"]:
                    current_section["content"] += " "
                current_section["content"] += text

            # 一定の長さごとに区切る（読み上げ用）
            if len(current_section["content"]) > 1000:
                sections.append(current_section.copy())
                current_section = {
                    "title": "",
                    "content": ""
                }

        # 最後のセクションを追加
        if current_section["content"]:
            sections.append(current_section)

        # セクションがない場合は全文を1つのセクションに
        if not sections:
            full_text = main_text_elem.get_text(strip=True)
            full_text = clean_ruby(full_text)
            sections = [{
                "title": "本文",
                "content": full_text
            }]

        logger.info(f"Successfully fetched novel: {title} by {author} ({len(sections)} sections)")

        return {
            "title": title,
            "author": author,
            "content": " ".join([s["content"] for s in sections]),
            "sections": sections
        }

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error fetching novel {author_id}/{file_id}: {e}")
        raise
    except Exception as e:
        logger.error(f"Error fetching novel {author_id}/{file_id}: {e}")
        raise


def clean_ruby(text: str) -> str:
    """
    ルビ（ふりがな）や注釈を削除

    例: 漢字《かんじ》 -> 漢字
    """
    # 《》で囲まれたルビを削除
    text = re.sub(r'《[^》]+》', '', text)

    # ［］で囲まれた注釈を削除
    text = re.sub(r'［[^］]+］', '', text)

    # ｜（縦棒）を削除
    text = text.replace('｜', '')

    return text


def is_section_title(text: str) -> bool:
    """
    テキストがセクションタイトルかどうか判定

    条件:
    - 短い（30文字以下）
    - 数字のみ、または「一」「二」などの漢数字
    - 「序」「一」「二」「章」などのキーワードを含む
    """
    if len(text) > 30:
        return False

    # 数字のみ
    if text.isdigit():
        return True

    # 全角数字のみ
    if re.match(r'^[０-９]+$', text):
        return True

    # 漢数字のみ
    if re.match(r'^[一二三四五六七八九十百千]+$', text):
        return True

    # セクションを示すキーワード
    keywords = ['序', '章', '編', '部', '話', 'エピローグ', 'プロローグ']
    for keyword in keywords:
        if keyword in text:
            return True

    return False
