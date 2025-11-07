"""
はてなブックマークのスクレイピング機能
"""
import httpx
from bs4 import BeautifulSoup
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

async def fetch_hatena_hot() -> List[Dict]:
    """はてなブックマーク人気エントリーを取得"""
    url = "https://b.hatena.ne.jp/hotentry?mode=rss"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            xml_content = response.text

            return parse_hatena_rss(xml_content)
    except Exception as e:
        logger.error(f"Error fetching Hatena hot entries: {e}")
        raise

async def fetch_hatena_latest() -> List[Dict]:
    """はてなブックマーク新着エントリーを取得"""
    url = "https://b.hatena.ne.jp/entrylist?mode=rss"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            xml_content = response.text

            return parse_hatena_rss(xml_content)
    except Exception as e:
        logger.error(f"Error fetching Hatena latest entries: {e}")
        raise

def parse_hatena_rss(xml_content: str) -> List[Dict]:
    """はてなブックマークRSSをパース"""
    soup = BeautifulSoup(xml_content, 'xml')
    items = soup.find_all('item')

    entries = []
    for item in items:
        try:
            title = item.find('title').text if item.find('title') else ""
            description = item.find('description').text if item.find('description') else ""
            link = item.find('link').text if item.find('link') else ""

            # はてなブックマーク独自の要素
            comments_url = ""
            bookmark_count = 0

            # bookmarkCommentListPageUrl を探す
            comments_url_tag = item.find('bookmarkCommentListPageUrl')
            if comments_url_tag:
                comments_url = comments_url_tag.text

            # bookmarkcount を探す
            bookmark_count_tag = item.find('bookmarkcount')
            if bookmark_count_tag:
                try:
                    bookmark_count = int(bookmark_count_tag.text)
                except ValueError:
                    bookmark_count = 0

            entries.append({
                "title": title,
                "description": description,
                "url": link,
                "comments_url": comments_url,
                "bookmark_count": bookmark_count
            })
        except Exception as e:
            logger.warning(f"Error parsing RSS item: {e}")
            continue

    return entries

async def fetch_hatena_comments(url: str) -> List[Dict]:
    """はてなブックマークのコメントを取得"""
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
            html_content = response.text

            return parse_hatena_comments(html_content)
    except Exception as e:
        logger.error(f"Error fetching Hatena comments from {url}: {e}")
        raise

def parse_hatena_comments(html_content: str) -> List[Dict]:
    """はてなブックマークのコメントHTMLをパース"""
    soup = BeautifulSoup(html_content, 'html.parser')

    # esuna_oldと同じセレクターを使用
    comment_nodes = soup.select('.js-bookmarks-recent > .entry-comment-contents')

    comments = []
    for comment_node in comment_nodes:
        try:
            user_name = ""
            text = ""

            # ユーザー名
            user_name_node = comment_node.select_one('.entry-comment-username > a')
            if user_name_node:
                user_name = user_name_node.get_text(strip=True)

            # コメント本文
            text_node = comment_node.select_one('.entry-comment-text')
            if text_node:
                text = text_node.get_text(strip=True)

            if user_name or text:  # 空のコメントは除外
                comments.append({
                    "user_name": user_name,
                    "text": text
                })
        except Exception as e:
            logger.warning(f"Error parsing comment: {e}")
            continue

    return comments
