"""
5ch（旧2ch）のスクレイピング機能
"""
import httpx
from bs4 import BeautifulSoup
from typing import List, Dict
import logging
import re

logger = logging.getLogger(__name__)

# 5chの主要な板（カテゴリ別）
POPULAR_BOARDS = [
    {"title": "ニュース速報+", "url": "https://asahi.5ch.net/newsplus/", "category": "ニュース"},
    {"title": "ニュース速報", "url": "https://hayabusa9.5ch.net/news/", "category": "ニュース"},
    {"title": "芸スポ速報+", "url": "https://hayabusa9.5ch.net/mnewsplus/", "category": "芸能"},
    {"title": "なんでも実況J", "url": "https://eagle.5ch.net/livejupiter/", "category": "実況"},
    {"title": "プログラマー", "url": "https://mevius.5ch.net/tech/", "category": "PC・技術"},
    {"title": "プログラム", "url": "https://mevius.5ch.net/prog/", "category": "PC・技術"},
]

async def fetch_5ch_boards() -> List[Dict]:
    """5chの板一覧を取得（人気板のリストを返す）"""
    # 簡易実装：予め定義された人気板のリストを返す
    # 完全な板一覧の取得は複雑なため、主要な板のみ提供
    return POPULAR_BOARDS

async def fetch_5ch_threads(board_url: str, limit: int = 50) -> List[Dict]:
    """指定された板のスレッド一覧を取得"""
    try:
        # subject.txt を取得（5chの標準的なスレッド一覧フォーマット）
        subject_url = board_url.rstrip('/') + '/subject.txt'

        async with httpx.AsyncClient(timeout=30.0) as client:
            # 5chサーバーへのリクエストには適切なUser-Agentが必要
            headers = {
                'User-Agent': 'Mozilla/5.0 (compatible; EsunaBot/0.1)',
            }
            response = await client.get(subject_url, headers=headers)
            response.encoding = 'cp932'  # 5chの文字コード
            response.raise_for_status()

            return parse_5ch_threads(response.text, board_url, limit)
    except Exception as e:
        logger.error(f"Error fetching 5ch threads from {board_url}: {e}")
        raise

def parse_5ch_threads(subject_txt: str, board_url: str, limit: int) -> List[Dict]:
    """subject.txt をパースしてスレッド一覧を作成"""
    threads = []
    lines = subject_txt.strip().split('\n')[:limit]

    for line in lines:
        try:
            # subject.txt のフォーマット: "datファイル名.dat<>スレッドタイトル (レス数)"
            # 例: "1234567890.dat<>テストスレッド (100)"
            if '<>' not in line:
                continue

            dat_file, title_with_count = line.split('<>', 1)
            thread_id = dat_file.replace('.dat', '')

            # レス数を抽出
            response_count = 0
            match = re.search(r'\((\d+)\)', title_with_count)
            if match:
                response_count = int(match.group(1))
                title = re.sub(r'\s*\(\d+\)\s*$', '', title_with_count)
            else:
                title = title_with_count

            # スレッドURLを構築
            thread_url = f"{board_url.rstrip('/')}/test/read.cgi/{thread_id}/"

            threads.append({
                "title": title,
                "url": thread_url,
                "response_count": response_count,
                "thread_id": thread_id
            })
        except Exception as e:
            logger.warning(f"Error parsing thread line: {line} - {e}")
            continue

    return threads

async def fetch_5ch_posts(thread_url: str, start: int = 1, end: int = 100) -> List[Dict]:
    """スレッドの投稿を取得"""
    try:
        # dat形式で取得（より軽量）
        # URLからthread_idを抽出
        match = re.search(r'/(\d+)/?$', thread_url.rstrip('/'))
        if not match:
            raise ValueError(f"Invalid thread URL: {thread_url}")

        thread_id = match.group(1)
        board_url = re.sub(r'/test/read\.cgi/\d+/?$', '', thread_url)
        dat_url = f"{board_url}/{thread_id}.dat"

        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {
                'User-Agent': 'Mozilla/5.0 (compatible; EsunaBot/0.1)',
            }
            response = await client.get(dat_url, headers=headers)
            response.encoding = 'cp932'
            response.raise_for_status()

            return parse_5ch_posts(response.text, start, end)
    except Exception as e:
        logger.error(f"Error fetching 5ch posts from {thread_url}: {e}")
        raise

def parse_5ch_posts(dat_content: str, start: int, end: int) -> List[Dict]:
    """dat形式の投稿をパース"""
    posts = []
    lines = dat_content.strip().split('\n')

    for i, line in enumerate(lines, start=1):
        if i < start or i > end:
            continue

        try:
            # dat形式: "名前<>メール<>日付 ID<>本文<>スレタイ"
            parts = line.split('<>')
            if len(parts) < 4:
                continue

            name = parts[0]
            mail = parts[1]
            datetime_id = parts[2]
            text = parts[3]

            # HTMLタグを除去
            text = re.sub(r'<br>', '\n', text)
            text = re.sub(r'<[^>]+>', '', text)

            posts.append({
                "number": i,
                "name": name,
                "datetime": datetime_id,
                "text": text,
                "mail": mail
            })
        except Exception as e:
            logger.warning(f"Error parsing post line {i}: {e}")
            continue

    return posts
