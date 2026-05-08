/**
 * ラジオストリーミング取得
 * NHKらじるらじる、radikoなどのストリーミングURLを提供
 *
 * 注意:
 * - radikoは認証とエリア判定が必要で実装が複雑（未実装）
 * - NHKらじるらじるはHLSストリーミングで、一部ブラウザで直接再生可能
 */
import type { RadioStreamData, NowPlayingData } from "../types";

/**
 * NHKらじるらじるのストリーミングURL（東京エリア）
 *
 * 旧 `radio-stream.nhk.jp` ホストは 2026 年時点で NXDOMAIN になっており、
 * 公式 config XML (https://www.nhk.or.jp/radio/config/config_web.xml) では
 * `simul.drdi.st.nhk` への移行が反映されている。
 *
 * URL は将来また変わる可能性があるので、動的取得（config XML を fetch して
 * parse）に切り替える余地あり。CORS は `Access-Control-Allow-Origin: *` で
 * フロントから hls.js で直接読みに行ける。
 */
const NHK_STREAM_URLS: Record<string, string> = {
  "nhk-r1": "https://simul.drdi.st.nhk/live/3/joined/master.m3u8",
  "nhk-r2": "https://simul.drdi.st.nhk/live/4/joined/master.m3u8",
  "nhk-fm": "https://simul.drdi.st.nhk/live/5/joined/master.m3u8",
};

/**
 * NHK WORLD (英語放送)
 * 旧 nhkworld.webcdn.stream.ne.jp の固定 URL は 404。
 * 現在の URL を確定できないため一旦 null とし、UI 側でも未対応扱いにする。
 */
const NHK_WORLD_URL: string | null = null;

/**
 * NHKらじるらじるのストリーミングURLを取得
 */
function getNhkStreamUrl(stationId: string): string {
  if (stationId === "nhk-world") {
    if (!NHK_WORLD_URL) {
      throw new Error("NHK WORLD のストリーミング URL が未確定です。現在は未対応");
    }
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
