"""
SNS（Twitter/X, Mastodon等）のスクレイピング機能

注意: Twitter/X APIは現在有料のため、サンプルデータを返す実装になっています。
将来的にMastodon、Bluesky等のオープンなSNSに対応予定。
"""
import httpx
from typing import List, Dict
import logging
from datetime import datetime, timedelta
import random

logger = logging.getLogger(__name__)

# サンプル投稿データ
SAMPLE_POSTS = [
    {
        "author": "技術太郎",
        "handle": "@tech_taro",
        "text": "新しいアクセシビリティ機能を実装してみた。音声読み上げとキーボード操作だけでWebアプリが使えるようになった。",
        "timestamp": "5分前",
        "likes": 42,
        "retweets": 8
    },
    {
        "author": "開発花子",
        "handle": "@dev_hanako",
        "text": "FastAPIとNext.jsでモノレポ構成のアプリ作ってる。バックエンドでスクレイピング処理をやると、フロントエンドがシンプルになっていい感じ。",
        "timestamp": "15分前",
        "likes": 38,
        "retweets": 5
    },
    {
        "author": "アクセシビリティ次郎",
        "handle": "@a11y_jiro",
        "text": "視覚障害者向けのWebアプリ開発で大事なのは、統一された操作体系。毎回違う場所にボタンがあると混乱する。",
        "timestamp": "30分前",
        "likes": 156,
        "retweets": 32
    },
    {
        "author": "Web標準子",
        "handle": "@web_std",
        "text": "ARIAラベルとか、セマンティックHTMLとか、基本的なことをちゃんとやるだけでアクセシビリティは大幅に向上する。",
        "timestamp": "1時間前",
        "likes": 89,
        "retweets": 15
    },
    {
        "author": "Python愛好家",
        "handle": "@python_lover",
        "text": "BeautifulSoup4でスクレイピングしてたけど、最近はhttpxの非同期クライアントと組み合わせるのが快適。FastAPIとの相性も抜群。",
        "timestamp": "2時間前",
        "likes": 67,
        "retweets": 12
    },
]

async def fetch_twitter_posts(username: str = None, limit: int = 10) -> List[Dict]:
    """
    Twitter/Xの投稿を取得（現在はサンプルデータ）

    Args:
        username: ユーザー名（未実装）
        limit: 取得件数

    Returns:
        投稿のリスト
    """
    # TODO: 実際のTwitter API実装または代替SNS対応
    logger.info(f"Fetching Twitter posts (sample data) for {username}, limit={limit}")

    # サンプルデータを返す
    return SAMPLE_POSTS[:limit]

async def fetch_mastodon_posts(instance: str = "mastodon.social", limit: int = 10) -> List[Dict]:
    """
    Mastodonの公開タイムラインを取得

    Args:
        instance: Mastodonインスタンス
        limit: 取得件数

    Returns:
        投稿のリスト
    """
    try:
        url = f"https://{instance}/api/v1/timelines/public"
        params = {"limit": limit}

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            posts = response.json()

            return parse_mastodon_posts(posts)
    except Exception as e:
        logger.error(f"Error fetching Mastodon posts from {instance}: {e}")
        # エラー時はサンプルデータを返す
        return SAMPLE_POSTS[:limit]

def parse_mastodon_posts(posts: List[Dict]) -> List[Dict]:
    """Mastodon APIのレスポンスをパース"""
    parsed_posts = []

    for post in posts:
        try:
            # HTMLタグを簡易的に除去
            import re
            text = re.sub(r'<[^>]+>', '', post.get('content', ''))

            parsed_posts.append({
                "author": post['account']['display_name'] or post['account']['username'],
                "handle": f"@{post['account']['username']}",
                "text": text,
                "timestamp": format_timestamp(post['created_at']),
                "likes": post.get('favourites_count', 0),
                "retweets": post.get('reblogs_count', 0),
                "url": post.get('url', '')
            })
        except Exception as e:
            logger.warning(f"Error parsing Mastodon post: {e}")
            continue

    return parsed_posts

def format_timestamp(timestamp_str: str) -> str:
    """タイムスタンプを相対時間に変換"""
    try:
        from dateutil import parser
        timestamp = parser.parse(timestamp_str)
        now = datetime.now(timestamp.tzinfo)
        delta = now - timestamp

        if delta.days > 0:
            return f"{delta.days}日前"
        elif delta.seconds >= 3600:
            return f"{delta.seconds // 3600}時間前"
        elif delta.seconds >= 60:
            return f"{delta.seconds // 60}分前"
        else:
            return "たった今"
    except:
        return timestamp_str

async def fetch_bluesky_posts(handle: str = None, limit: int = 10) -> List[Dict]:
    """
    Blueskyの投稿を取得（将来実装予定）

    Args:
        handle: ユーザーハンドル
        limit: 取得件数

    Returns:
        投稿のリスト
    """
    # TODO: Bluesky AT Protocol実装
    logger.info(f"Bluesky posts not implemented yet, returning sample data")
    return SAMPLE_POSTS[:limit]
