"""
ラジオストリーミング取得
NHKらじるらじる、radikoなどのストリーミングURLを提供

注意:
- radikoは認証とエリア判定が必要で実装が複雑
- NHKらじるらじるはHLSストリーミングで、一部ブラウザで直接再生可能
- 現在は簡易実装のみ。将来的にはradiko-pyなどのライブラリを使用
"""

from typing import Dict, Any, Optional
import httpx
from datetime import datetime


# NHKらじるらじるのストリーミングURL
# 注意: これらのURLは変更される可能性があります
NHK_STREAM_URLS = {
    "nhk-r1": "https://radio-stream.nhk.jp/hls/live/2023229/nhkradiruakr1/master.m3u8",
    "nhk-r2": "https://radio-stream.nhk.jp/hls/live/2023507/nhkradiruakr2/master.m3u8",
    "nhk-fm": "https://radio-stream.nhk.jp/hls/live/2023507/nhkradiruakfm/master.m3u8",
}

# NHK WORLD (英語放送、認証不要)
NHK_WORLD_URL = "https://nhkworld.webcdn.stream.ne.jp/www11/radiojapan/all/263944/live.m3u8"


async def get_nhk_stream_url(station_id: str) -> str:
    """
    NHKらじるらじるのストリーミングURLを取得

    Args:
        station_id: 局ID (nhk-r1, nhk-r2, nhk-fm)

    Returns:
        ストリーミングURL (HLS m3u8)

    Raises:
        ValueError: 不明な局IDの場合
    """
    if station_id == "nhk-world":
        return NHK_WORLD_URL

    if station_id not in NHK_STREAM_URLS:
        raise ValueError(f"Unknown NHK station: {station_id}")

    # NHKらじるらじるのストリーミングURLを返す
    # 注意: 実際には時刻によってURLが変わる可能性があるため
    # 将来的にはNHK APIを使用してリアルタイムで取得すべき
    return NHK_STREAM_URLS[station_id]


async def get_radiko_stream_url(station_id: str) -> str:
    """
    radikoのストリーミングURLを取得

    注意: 現在は未実装。将来的に実装予定。
    radikoは以下の手順が必要:
    1. partial_keyの取得
    2. auth_tokenの取得
    3. エリア判定
    4. ストリーミングURLの生成

    Args:
        station_id: 局ID (TBS, QRR, LFR, など)

    Returns:
        ストリーミングURL

    Raises:
        NotImplementedError: 現在未実装
    """
    # TODO: radiko-pyや類似のライブラリを使用して実装
    # または、radikoの認証APIを直接呼び出す
    # 参考: https://github.com/jackyzy823/radiko

    raise NotImplementedError(
        "radiko streaming is not yet implemented. "
        "Please use NHK stations or other services for now."
    )


async def get_stream_url(service: str, station_id: str) -> Dict[str, Any]:
    """
    ラジオのストリーミングURLを取得

    Args:
        service: サービス名 (nhk, radiko, other)
        station_id: 局ID

    Returns:
        {
            "streamUrl": str,  # ストリーミングURL
            "format": str,     # フォーマット (hls, mp3, など)
            "expiresAt": str,  # 有効期限 (ISO 8601)
        }

    Raises:
        ValueError: 不明なサービスまたは局ID
        NotImplementedError: 未実装のサービス
    """
    if service == "nhk":
        stream_url = await get_nhk_stream_url(station_id)
        return {
            "streamUrl": stream_url,
            "format": "hls",
            "expiresAt": None,  # NHKのURLは基本的に長期間有効
        }

    elif service == "radiko":
        stream_url = await get_radiko_stream_url(station_id)
        return {
            "streamUrl": stream_url,
            "format": "hls",
            "expiresAt": None,  # TODO: 実装時に設定
        }

    elif service == "other":
        # その他のサービスは、フロントエンドで直接URLを持っているため
        # このAPIは呼ばれない想定
        raise ValueError(f"'other' service should not call this API")

    else:
        raise ValueError(f"Unknown service: {service}")


async def get_now_playing(service: str, station_id: str) -> Optional[Dict[str, Any]]:
    """
    現在放送中の番組情報を取得

    Args:
        service: サービス名 (nhk, radiko)
        station_id: 局ID

    Returns:
        {
            "title": str,       # 番組名
            "description": str, # 番組説明
            "startTime": str,   # 開始時刻 (ISO 8601)
            "endTime": str,     # 終了時刻 (ISO 8601)
        }
        または None (情報が取得できない場合)

    Note:
        現在は未実装。将来的にNHK/radikoの番組表APIを使用して実装予定
    """
    # TODO: 番組表APIを実装
    # NHK: https://api.nhk.or.jp/
    # radiko: 番組表スクレイピングまたはAPI
    return None
