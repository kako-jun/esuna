"""
Esuna Backend API
視覚障害者向けアクセシブルWebアプリケーションのバックエンド
"""
from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import logging
from datetime import datetime

# スクレイパーをインポート
from .scrapers import hatena, fivech, sns, aozora, podcast, radio

# ロガー設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Esuna API",
    description="視覚障害者向けコンテンツ集約API",
    version="0.1.0"
)

# CORS設定（開発環境）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切に設定する
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# データモデル
class HatenaEntry(BaseModel):
    title: str
    description: str
    url: str
    comments_url: Optional[str] = None
    bookmark_count: int = 0

class HatenaComment(BaseModel):
    user_name: str
    text: str

class FivechBoard(BaseModel):
    title: str
    url: str
    category: str = ""

class FivechThread(BaseModel):
    title: str
    url: str
    response_count: int = 0

class FivechPost(BaseModel):
    number: int
    name: str
    datetime: str
    text: str

class NovelSection(BaseModel):
    title: str
    content: str

class NovelContent(BaseModel):
    title: str
    author: str
    content: str
    sections: List[NovelSection]

class PodcastEpisode(BaseModel):
    id: str
    title: str
    description: str
    pub_date: str
    audio_url: Optional[str] = None
    duration: int = 0

class ErrorLog(BaseModel):
    level: str
    message: str
    timestamp: str
    user_agent: Optional[str] = None
    url: Optional[str] = None

# ヘルスチェック
@app.get("/")
async def root():
    return {
        "service": "Esuna API",
        "version": "0.1.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

# エラーログ収集
@app.post("/api/log")
async def log_error(error: ErrorLog):
    """フロントエンドからのエラーログを収集"""
    logger.log(
        getattr(logging, error.level.upper(), logging.ERROR),
        f"Frontend Error: {error.message} | URL: {error.url} | UA: {error.user_agent}"
    )
    return {"status": "logged"}

# はてなブックマーク API
@app.get("/api/hatena/hot", response_model=List[HatenaEntry])
async def get_hatena_hot():
    """はてなブックマーク人気エントリーを取得"""
    try:
        entries = await hatena.fetch_hatena_hot()
        return entries
    except Exception as e:
        logger.error(f"Error in get_hatena_hot: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/hatena/latest", response_model=List[HatenaEntry])
async def get_hatena_latest():
    """はてなブックマーク新着エントリーを取得"""
    try:
        entries = await hatena.fetch_hatena_latest()
        return entries
    except Exception as e:
        logger.error(f"Error in get_hatena_latest: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/hatena/comments", response_model=List[HatenaComment])
async def get_hatena_comments(url: str = Query(..., description="はてなブックマークコメントページURL")):
    """はてなブックマークのコメントを取得"""
    try:
        comments = await hatena.fetch_hatena_comments(url)
        return comments
    except Exception as e:
        logger.error(f"Error in get_hatena_comments: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 5ch API
@app.get("/api/5ch/boards", response_model=List[FivechBoard])
async def get_5ch_boards():
    """5chの板一覧を取得"""
    try:
        boards = await fivech.fetch_5ch_boards()
        return boards
    except Exception as e:
        logger.error(f"Error in get_5ch_boards: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/5ch/threads", response_model=List[FivechThread])
async def get_5ch_threads(
    board_url: str = Query(..., description="板のURL"),
    limit: int = Query(50, ge=1, le=100, description="取得件数")
):
    """5chのスレッド一覧を取得"""
    try:
        threads = await fivech.fetch_5ch_threads(board_url, limit)
        return threads
    except Exception as e:
        logger.error(f"Error in get_5ch_threads: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/5ch/posts", response_model=List[FivechPost])
async def get_5ch_posts(
    thread_url: str = Query(..., description="スレッドURL"),
    start: int = Query(1, ge=1, description="開始レス番号"),
    end: int = Query(100, ge=1, le=1000, description="終了レス番号")
):
    """5chの投稿を取得"""
    try:
        posts = await fivech.fetch_5ch_posts(thread_url, start, end)
        return posts
    except Exception as e:
        logger.error(f"Error in get_5ch_posts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# SNS API
@app.get("/api/sns/posts")
async def get_sns_posts(
    platform: str = Query("twitter", description="SNSプラットフォーム (twitter, mastodon, bluesky)"),
    username: Optional[str] = Query(None, description="ユーザー名またはハンドル"),
    limit: int = Query(10, ge=1, le=50, description="取得件数")
):
    """SNSの投稿を取得"""
    try:
        if platform == "twitter":
            posts = await sns.fetch_twitter_posts(username, limit)
        elif platform == "mastodon":
            instance = username or "mastodon.social"
            posts = await sns.fetch_mastodon_posts(instance, limit)
        elif platform == "bluesky":
            posts = await sns.fetch_bluesky_posts(username, limit)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown platform: {platform}")

        return posts
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_sns_posts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 小説 API
@app.get("/api/novels/content", response_model=NovelContent)
async def get_novel_content(
    author_id: str = Query(..., description="作家ID (例: 000148)"),
    file_id: str = Query(..., description="ファイルID (例: 773_14560)")
):
    """青空文庫の小説本文を取得"""
    try:
        content = await aozora.fetch_novel_content(author_id, file_id)
        return content
    except Exception as e:
        logger.error(f"Error in get_novel_content: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Podcast API
@app.get("/api/podcasts/episodes", response_model=List[PodcastEpisode])
async def get_podcast_episodes(
    feed_url: str = Query(..., description="PodcastのRSSフィードURL"),
    limit: int = Query(10, ge=1, le=50, description="取得するエピソード数")
):
    """Podcast RSSフィードからエピソード一覧を取得"""
    try:
        episodes = await podcast.fetch_podcast_episodes(feed_url, limit)
        return episodes
    except Exception as e:
        logger.error(f"Error in get_podcast_episodes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ラジオ API
@app.get("/api/radio/stream-url/{service}/{station_id}")
async def get_radio_stream_url(
    service: str,
    station_id: str
):
    """
    ラジオストリーミングURLを取得

    Args:
        service: サービス名 (nhk, radiko)
        station_id: 局ID

    Returns:
        {
            "streamUrl": str,
            "format": str,
            "expiresAt": str | None
        }
    """
    try:
        stream_data = await radio.get_stream_url(service, station_id)
        return stream_data
    except NotImplementedError as e:
        raise HTTPException(status_code=501, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in get_radio_stream_url: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/radio/now-playing/{service}/{station_id}")
async def get_radio_now_playing(
    service: str,
    station_id: str
):
    """
    現在放送中の番組情報を取得

    Args:
        service: サービス名 (nhk, radiko)
        station_id: 局ID

    Returns:
        {
            "title": str,
            "description": str,
            "startTime": str,
            "endTime": str
        }
        または None
    """
    try:
        now_playing = await radio.get_now_playing(service, station_id)
        if now_playing is None:
            raise HTTPException(status_code=404, detail="Now playing information not available")
        return now_playing
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_radio_now_playing: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# グローバルエラーハンドラー
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc)
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
