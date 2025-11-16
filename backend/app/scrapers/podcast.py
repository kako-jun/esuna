"""
Podcastスクレイパー
RSSフィードからPodcastエピソード情報を取得
"""
import httpx
from bs4 import BeautifulSoup
from typing import List, Dict, Any
import logging
from datetime import datetime
import xml.etree.ElementTree as ET

logger = logging.getLogger(__name__)

# タイムアウト設定
TIMEOUT = 30.0


async def fetch_podcast_episodes(feed_url: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Podcast RSSフィードからエピソード一覧を取得

    Args:
        feed_url: RSSフィードのURL
        limit: 取得するエピソード数

    Returns:
        エピソード情報のリスト
    """
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
            response = await client.get(feed_url)
            response.raise_for_status()

            # エンコーディングを適切に設定
            if response.encoding is None or response.encoding == 'ISO-8859-1':
                response.encoding = 'utf-8'

            xml_content = response.text

        # XMLをパース
        root = ET.fromstring(xml_content)

        # RSS 2.0とAtom両方に対応
        episodes = []

        # RSS 2.0の場合
        channel = root.find('channel')
        if channel is not None:
            items = channel.findall('item')[:limit]

            for item in items:
                title_elem = item.find('title')
                description_elem = item.find('description')
                pub_date_elem = item.find('pubDate')
                duration_elem = item.find('{http://www.itunes.com/dtds/podcast-1.0.dtd}duration')

                # enclosure要素から音声ファイルURLを取得
                enclosure = item.find('enclosure')
                audio_url = None
                if enclosure is not None:
                    audio_url = enclosure.get('url')

                # guidをIDとして使用
                guid_elem = item.find('guid')
                episode_id = guid_elem.text if guid_elem is not None else None

                # タイトルをクリーンアップ（HTMLタグを削除）
                title = clean_html(title_elem.text if title_elem is not None else "不明")
                description = clean_html(description_elem.text if description_elem is not None else "")

                # 長さを秒数に変換
                duration_seconds = parse_duration(duration_elem.text if duration_elem is not None else "0")

                episode = {
                    "id": episode_id or f"episode_{len(episodes)}",
                    "title": title,
                    "description": description[:300] if description else "",  # 説明文は300文字まで
                    "pub_date": pub_date_elem.text if pub_date_elem is not None else "",
                    "audio_url": audio_url,
                    "duration": duration_seconds,
                }

                episodes.append(episode)

        # Atomフィードの場合
        else:
            # Atomの名前空間
            ns = {'atom': 'http://www.w3.org/2005/Atom'}
            entries = root.findall('atom:entry', ns)[:limit]

            for entry in entries:
                title_elem = entry.find('atom:title', ns)
                summary_elem = entry.find('atom:summary', ns)
                published_elem = entry.find('atom:published', ns)

                # link要素から音声ファイルURLを取得
                audio_url = None
                links = entry.findall('atom:link', ns)
                for link in links:
                    if link.get('type', '').startswith('audio/'):
                        audio_url = link.get('href')
                        break

                episode_id = entry.find('atom:id', ns)

                title = clean_html(title_elem.text if title_elem is not None else "不明")
                description = clean_html(summary_elem.text if summary_elem is not None else "")

                episode = {
                    "id": episode_id.text if episode_id is not None else f"episode_{len(episodes)}",
                    "title": title,
                    "description": description[:300] if description else "",
                    "pub_date": published_elem.text if published_elem is not None else "",
                    "audio_url": audio_url,
                    "duration": 0,
                }

                episodes.append(episode)

        logger.info(f"Successfully fetched {len(episodes)} episodes from {feed_url}")

        return episodes

    except ET.ParseError as e:
        logger.error(f"XML parse error for {feed_url}: {e}")
        raise
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error fetching podcast {feed_url}: {e}")
        raise
    except Exception as e:
        logger.error(f"Error fetching podcast {feed_url}: {e}")
        raise


def clean_html(text: str) -> str:
    """
    HTMLタグを削除してプレーンテキストに変換
    """
    if not text:
        return ""

    # BeautifulSoupでHTMLタグを削除
    soup = BeautifulSoup(text, 'html.parser')
    return soup.get_text(strip=True)


def parse_duration(duration_str: str) -> int:
    """
    時間文字列を秒数に変換

    形式:
    - HH:MM:SS
    - MM:SS
    - 秒数
    """
    if not duration_str:
        return 0

    try:
        # 秒数のみの場合
        if ':' not in duration_str:
            return int(float(duration_str))

        # HH:MM:SS または MM:SS形式
        parts = duration_str.split(':')
        parts = [int(p) for p in parts]

        if len(parts) == 3:
            # HH:MM:SS
            return parts[0] * 3600 + parts[1] * 60 + parts[2]
        elif len(parts) == 2:
            # MM:SS
            return parts[0] * 60 + parts[1]
        else:
            return 0

    except ValueError:
        return 0


def format_duration(seconds: int) -> str:
    """
    秒数を読みやすい形式に変換
    例: 3665 -> "1時間1分5秒"
    """
    if seconds < 60:
        return f"{seconds}秒"

    minutes = seconds // 60
    secs = seconds % 60

    if minutes < 60:
        if secs > 0:
            return f"{minutes}分{secs}秒"
        else:
            return f"{minutes}分"

    hours = minutes // 60
    mins = minutes % 60

    if mins > 0 and secs > 0:
        return f"{hours}時間{mins}分{secs}秒"
    elif mins > 0:
        return f"{hours}時間{mins}分"
    else:
        return f"{hours}時間"
