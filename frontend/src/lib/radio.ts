/**
 * ラジオストリーミング管理
 * NHKらじるらじる、radikoなどのラジオ局を扱う
 */

export interface RadioStation {
  id: string;
  name: string;
  description: string;
  service: 'nhk' | 'radiko' | 'other';
  streamUrl?: string; // 直接ストリーミング可能な場合
  requiresBackend?: boolean; // バックエンドAPIが必要な場合
}

/**
 * NHKらじるらじる
 * NHKの公式ラジオサービス
 */
export const NHK_STATIONS: RadioStation[] = [
  {
    id: 'nhk-r1',
    name: 'NHKラジオ第1',
    description: 'ニュース、スポーツ、情報番組',
    service: 'nhk',
    requiresBackend: true, // HLSストリーミングのため
  },
  {
    id: 'nhk-r2',
    name: 'NHKラジオ第2',
    description: '教育番組、語学番組',
    service: 'nhk',
    requiresBackend: true,
  },
  {
    id: 'nhk-fm',
    name: 'NHK-FM',
    description: '音楽番組、クラシック、ジャズ',
    service: 'nhk',
    requiresBackend: true,
  },
];

/**
 * radiko（主要局のみ）
 * エリア判定とAPI認証が必要なため、バックエンド経由で取得
 */
export const RADIKO_STATIONS: RadioStation[] = [
  {
    id: 'TBS',
    name: 'TBSラジオ',
    description: '総合エンターテイメント、ニュース、トーク',
    service: 'radiko',
    requiresBackend: true,
  },
  {
    id: 'QRR',
    name: '文化放送',
    description: 'アニメ、声優、音楽',
    service: 'radiko',
    requiresBackend: true,
  },
  {
    id: 'LFR',
    name: 'ニッポン放送',
    description: '総合エンターテイメント、野球中継',
    service: 'radiko',
    requiresBackend: true,
  },
  {
    id: 'INT',
    name: 'interfm',
    description: '洋楽、多言語放送',
    service: 'radiko',
    requiresBackend: true,
  },
  {
    id: 'FMT',
    name: 'TOKYO FM',
    description: '音楽、トーク、情報',
    service: 'radiko',
    requiresBackend: true,
  },
  {
    id: 'FMJ',
    name: 'J-WAVE',
    description: '洋楽、邦楽、カルチャー',
    service: 'radiko',
    requiresBackend: true,
  },
];

/**
 * その他のネットラジオ
 * 直接アクセス可能なストリーミングURL
 */
export const OTHER_STATIONS: RadioStation[] = [
  {
    id: 'nhk-world',
    name: 'NHK WORLD RADIO JAPAN',
    description: '英語による日本のニュース',
    service: 'other',
    streamUrl: 'https://nhkworld.webcdn.stream.ne.jp/www11/radiojapan/all/263944/live.m3u8',
  },
];

/**
 * すべてのラジオ局を取得
 */
export function getAllStations(): RadioStation[] {
  return [...NHK_STATIONS, ...RADIKO_STATIONS, ...OTHER_STATIONS];
}

/**
 * サービスごとのラジオ局を取得
 */
export function getStationsByService(service: 'nhk' | 'radiko' | 'other'): RadioStation[] {
  return getAllStations().filter(station => station.service === service);
}

/**
 * IDからラジオ局を取得
 */
export function getStationById(id: string): RadioStation | undefined {
  return getAllStations().find(station => station.id === id);
}

/**
 * ラジオのストリーミングURLを取得
 * バックエンドAPIが必要な場合は、APIを呼び出す
 */
export async function getStreamUrl(stationId: string): Promise<string> {
  const station = getStationById(stationId);

  if (!station) {
    throw new Error(`Station not found: ${stationId}`);
  }

  // 直接ストリーミング可能な場合
  if (station.streamUrl) {
    return station.streamUrl;
  }

  // バックエンドAPIが必要な場合
  if (station.requiresBackend) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiBaseUrl}/api/radio/stream-url/${station.service}/${stationId}`);

    if (!response.ok) {
      throw new Error(`Failed to get stream URL: ${response.status}`);
    }

    const data = await response.json();
    return data.streamUrl;
  }

  throw new Error('No stream URL available for this station');
}

/**
 * 現在放送中の番組情報を取得（将来実装）
 */
export async function getNowPlaying(stationId: string): Promise<{
  title: string;
  description: string;
  startTime: string;
  endTime: string;
} | null> {
  // TODO: バックエンドAPIから番組表を取得
  // radikoやNHKの番組表APIを使用
  return null;
}
