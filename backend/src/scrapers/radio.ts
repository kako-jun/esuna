/**
 * ラジオストリーミング取得
 * NHKらじるらじる、radikoなどのストリーミングURLを提供
 *
 * 注意:
 * - radikoは認証とエリア判定が必要で実装が複雑（未実装）
 * - NHKらじるらじるはHLSストリーミングで、一部ブラウザで直接再生可能
 */
import type { RadioStreamData, NowPlayingData } from "../types";

/** NHKらじるらじるのストリーミングURL */
const NHK_STREAM_URLS: Record<string, string> = {
  "nhk-r1":
    "https://radio-stream.nhk.jp/hls/live/2023229/nhkradiruakr1/master.m3u8",
  "nhk-r2":
    "https://radio-stream.nhk.jp/hls/live/2023507/nhkradiruakr2/master.m3u8",
  "nhk-fm":
    "https://radio-stream.nhk.jp/hls/live/2023507/nhkradiruakfm/master.m3u8",
};

/** NHK WORLD (英語放送、認証不要) */
const NHK_WORLD_URL =
  "https://nhkworld.webcdn.stream.ne.jp/www11/radiojapan/all/263944/live.m3u8";

/**
 * NHKらじるらじるのストリーミングURLを取得
 */
function getNhkStreamUrl(stationId: string): string {
  if (stationId === "nhk-world") {
    return NHK_WORLD_URL;
  }

  const url = NHK_STREAM_URLS[stationId];
  if (!url) {
    throw new Error(`Unknown NHK station: ${stationId}`);
  }
  return url;
}

/**
 * ラジオのストリーミングURLを取得
 */
export async function getStreamUrl(
  service: string,
  stationId: string
): Promise<RadioStreamData> {
  if (service === "nhk") {
    const streamUrl = getNhkStreamUrl(stationId);
    return {
      streamUrl,
      format: "hls",
      expiresAt: null,
    };
  }

  if (service === "radiko") {
    throw new Error(
      "radiko streaming is not yet implemented. Please use NHK stations or other services for now."
    );
  }

  if (service === "other") {
    throw new Error("'other' service should not call this API");
  }

  throw new Error(`Unknown service: ${service}`);
}

/**
 * 現在放送中の番組情報を取得
 */
export async function getNowPlaying(
  _service: string,
  _stationId: string
): Promise<NowPlayingData | null> {
  // TODO: 番組表APIを実装
  // NHK: https://api.nhk.or.jp/
  // radiko: 番組表スクレイピングまたはAPI
  return null;
}
