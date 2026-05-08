# esuna アーキテクチャ設計書

## 概要
esunaは視覚障害者向けのアクセシブルWebアプリケーションです。
すべての操作を音声ガイダンスで行い、見なくても使える設計になっています。

---

## 設計原則

### 1. アクセシビリティ・ファースト
- **すべての操作に音声フィードバック**
- **9グリッドナビゲーション**: 画面を9分割し、1-9キーまたは矢印キーで操作
- **物理キーボード対応必須**: タッチ操作だけでなく、外付けキーボードでも完全操作可能
- **視覚情報ゼロでも使える**: 色、アイコン、画像に依存しない

### 2. シンプルな操作体系
- **一貫した操作ルール**: どの画面でも同じ操作方法
- **階層は最小限**: メニュー階層は2階層まで
- **戻るは常に左上**: 予測可能な配置

### 3. オフライン・ファースト
- **ブラウザ内で完結**: サーバー不要で動作
- **LocalStorage活用**: 設定、お気に入り、進捗を保存

---

## システムアーキテクチャ

```
┌─────────────────────────────────────────────────┐
│            ユーザー（視覚障害者）                │
└─────────────────────────────────────────────────┘
                      ↓ 音声・キーボード
┌─────────────────────────────────────────────────┐
│         フロントエンド (Vite + SolidJS)          │
├─────────────────────────────────────────────────┤
│  UI層                                           │
│  - GridSystem (9グリッド)                       │
│  - 各コンポーネント (Reader, Player, etc.)       │
├─────────────────────────────────────────────────┤
│  ロジック層                                      │
│  - SpeechManager (音声合成)                     │
│  - ストレージ管理 (LocalStorage)                 │
│  - 状態管理 (SolidJS createSignal / store.ts)   │
├─────────────────────────────────────────────────┤
│  データ層                                        │
│  - コンテンツリスト (novels, podcasts, radio)    │
│  - ユーザーデータ (favorites, progress, memos)  │
└─────────────────────────────────────────────────┘
                      ↓ HTTP API
┌─────────────────────────────────────────────────┐
│         バックエンド (Hono / Cloudflare Workers) │
├─────────────────────────────────────────────────┤
│  - スクレイパー (hatena, 5ch, SNS, aozora)      │
│  - Podcast RSSパーサー                          │
│  - ラジオストリーミングURL取得                   │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│         外部サービス                             │
│  - はてなブックマーク                            │
│  - 5ちゃんねる                                   │
│  - RSS フィード                                 │
│  - 青空文庫                                      │
│  - Podcast配信サイト                            │
│  - NHKらじるらじる                              │
│  - radiko (未対応)                              │
└─────────────────────────────────────────────────┘
```

---

## フロントエンド設計

### ディレクトリ構造
```
frontend/src/
├── App.tsx                      # ルートコンポーネント
├── index.tsx                    # エントリポイント
├── env.d.ts
├── components/
│   ├── GridSystem.tsx           # 9グリッドUI基盤
│   ├── ContentReader.tsx        # 汎用コンテンツリーダー
│   ├── HatenaEntryReader.tsx    # はてブ記事リーダー
│   ├── HatenaCommentReader.tsx  # はてブコメントリーダー
│   ├── SNSPostReader.tsx        # SNS投稿リーダー
│   ├── FivechBoardList.tsx      # 5ch板一覧
│   ├── FivechThreadList.tsx     # 5chスレッド一覧
│   ├── FivechPostReader.tsx     # 5ch投稿リーダー
│   ├── NovelList.tsx            # 小説一覧
│   ├── NovelReader.tsx          # 小説リーダー
│   ├── PodcastList.tsx          # Podcast一覧
│   ├── PodcastPlayer.tsx        # Podcastプレイヤー
│   ├── RadioPlayer.tsx          # ラジオプレイヤー
│   ├── RadioStationList.tsx     # ラジオ局一覧
│   ├── RSSFeedList.tsx          # RSSフィード一覧
│   ├── RSSArticleReader.tsx     # RSS記事リーダー
│   ├── FavoritesList.tsx        # お気に入り一覧
│   ├── ContinueReading.tsx      # 続きから
│   ├── VoiceMemoRecorder.tsx    # 音声メモ録音
│   ├── TimerManager.tsx         # タイマー管理
│   ├── AutoplayPlayer.tsx       # おまかせモード
│   ├── AutoplaySettings.tsx     # おまかせ設定
│   └── StatusMessage.tsx        # ステータス表示
└── lib/
    ├── api-client.ts            # バックエンドAPIクライアント
    ├── speech.ts                # 音声合成管理
    ├── storage-root.ts          # LocalStorageルート管理
    ├── storage.ts               # LocalStorage操作
    ├── store.ts                 # グローバル状態 (SolidJS createSignal)
    ├── novels.ts                # 小説データ
    ├── podcasts.ts              # Podcastデータ
    ├── radio.ts                 # ラジオ局データ
    ├── rss.ts                   # RSSリーダー
    ├── favorites.ts             # お気に入り管理
    ├── progress.ts              # 進捗管理
    ├── voice-memo.ts            # 音声メモ管理
    ├── timer.ts                 # タイマー管理
    ├── autoplay.ts              # 自動再生管理
    ├── content-scraper.ts       # コンテンツスクレイパー
    ├── grid-guide.ts            # グリッド案内
    ├── service-copy.ts          # サービス表示テキスト
    ├── useAutoNavigation.ts     # 自動ナビゲーションフック
    └── weather.ts               # 天気予報取得
```

### コンポーネント設計

#### GridSystem（コア）
すべてのUIの基盤となるコンポーネント。

**責務**:
- 9つのボタンを3x3グリッドで配置
- キーボード入力（1-9、矢印キー、Enter、Escape）
- 音声ガイダンス
- フォーカス管理

**Props（SolidJS）**:
```typescript
interface GridSystemProps {
  actions: Array<{
    label: string;
    action: () => void;
  }>;
  speech: SpeechManager;
}
```

#### 各Reader/Playerコンポーネント
特定のコンテンツを表示・再生するコンポーネント。

**共通設計**:
```typescript
interface ReaderProps {
  speech: SpeechManager;
  onBack: () => void;
  // コンテンツ固有のprops
}
```

**必須機能**:
- 戻るボタン（1番・左上）
- 前へ/次へナビゲーション（2番・3番）
- 読み上げ・情報ボタン（4番）
- 停止ボタン（8番・固定）
- 画面案内（9番・固定）

---

## バックエンド設計

### ディレクトリ構造
```
backend/src/
├── index.ts                     # Hono アプリケーション エントリポイント
├── types.ts                     # 型定義
├── middleware/                  # ミドルウェア
└── scrapers/
    ├── hatena.ts                # はてブスクレイパー
    ├── fivech.ts                # 5chスクレイパー
    ├── sns.ts                   # SNSスクレイパー
    ├── aozora.ts                # 青空文庫スクレイパー
    ├── podcast.ts               # Podcast RSSパーサー
    └── radio.ts                 # ラジオURL取得
```

### API設計

#### エンドポイント一覧
```
GET  /api/hatena/hot
GET  /api/hatena/latest
GET  /api/hatena/comments?url={entry_url}
GET  /api/5ch/boards
GET  /api/5ch/threads?board_url={url}
GET  /api/5ch/posts?thread_url={url}
GET  /api/sns/posts?platform={mastodon|bluesky}
GET  /api/novels/content?author_id={id}&file_id={id}
GET  /api/podcasts/episodes?feed_url={url}&limit={n}
GET  /api/radio/stream-url/{service}/{station_id}
GET  /api/radio/now-playing/{service}/{station_id}
POST /api/log
```

#### レスポンス形式（共通）
```json
{
  "data": [...],
  "error": null
}
```

エラー時:
```json
{
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}
```

---

## データ設計

### LocalStorage構造

すべてのデータは単一キー `"esuna"` に JSON オブジェクトとして格納される。
管理は `storage-root.ts` が担当し、各モジュールは `getSubKey` / `setSubKey` / `removeSubKey` で読み書きする。

**キー**: `esuna`
```json
{
  "settings": {
    "speech": { "rate": 1.0, "pitch": 1.0, "volume": 1.0, "voice": "Google 日本語" },
    "ui": { "theme": "default", "autoNavigation": false, "speakTimeOnStart": true, "speakWeatherOnStart": true },
    "weather": { "city": "Tokyo", "enabled": true }
  },
  "favorites": [
    { "id": "podcast_1234", "type": "podcast", "title": "Rebuild", "data": {}, "addedAt": "2025-01-01T00:00:00Z" }
  ],
  "progress": [
    { "id": "content-id", "type": "novel", "currentIndex": 5, "totalCount": 20, "lastReadAt": "2025-01-01T00:00:00Z", "data": {} }
  ],
  "voiceMemos": [
    { "id": "memo_1234", "title": "メモ1", "audioData": "base64...", "duration": 30, "createdAt": "2025-01-01T00:00:00Z", "tags": ["仕事"] }
  ],
  "timers": [
    { "id": "timer_1234", "title": "作業タイマー", "durationSeconds": 300, "remainingSeconds": 180, "isActive": true }
  ],
  "autoplaySettings": {
    "enabledTypes": ["novel", "podcast", "radio"],
    "playDuration": 10,
    "shuffle": true
  },
  "apiBaseUrl": "https://esuna-api.kako-jun.workers.dev"
}
```

---

## 音声合成設計

### SpeechManager クラス
```typescript
class SpeechManager {
  private synth: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null;

  speak(text: string, options?: SpeechOptions): void
  stop(): void
  isSpeaking(): boolean
  setVoice(voice: SpeechSynthesisVoice): void
  setRate(rate: number): void
  setPitch(pitch: number): void
  setVolume(volume: number): void
}
```

### 音声ガイダンス設計原則

1. **すべてのアクションに音声フィードバック**
2. **簡潔で明確** — 1アクション1メッセージ、「〜しました」完了形
3. **中断可能** — Escapeキーでいつでも停止
4. **状況を常に伝える** — 「3ページ目」「全10件中5件目」など

---

## 9グリッドナビゲーション設計

### グリッド配置（正規配置）
```
1  2  3
4  5  6
7  8  9
```

### 位置ごとの役割

| 位置 | 役割 | 備考 |
|------|------|------|
| 1 | 戻る | 固定 |
| 2 | 前の項目 | — |
| 3 | 次の項目 | — |
| 4 | 読み上げ / リロード / 情報 | — |
| 5 | 主対象 | 固定 |
| 6 | 主アクション（開く・再生・コメント等） | — |
| 7 | 補助情報（件数・位置） | — |
| 8 | 停止 | 固定 |
| 9 | 画面案内 | 固定 |

### キーバインド
- **1-9キー**: 各グリッドを直接選択
- **矢印キー**: フォーカス移動
- **Enter**: 選択実行
- **Escape**: 停止または戻る

---

## デプロイ戦略

### フロントエンド（Cloudflare Pages）
1. `main` ブランチへの push で自動デプロイ
2. ビルドコマンド: `cd frontend && npm run build`
3. 出力ディレクトリ: `frontend/dist`
4. カスタムドメイン: https://esuna.llll-ll.com

### バックエンド（Cloudflare Workers）
```bash
cd backend
npx wrangler deploy
```
デプロイURL: https://esuna-api.kako-jun.workers.dev

### CI/CD
```yaml
# .github/workflows/ci.yml
# push/PR to main で tsc + vite build を実行
```

---

## パフォーマンス最適化

### 1. バンドルサイズ削減
- Vite + SolidJS による高効率バンドル
- Tree Shaking
- Code Splitting（動的import）

### 2. LocalStorage最適化
- 音声メモは最大100件で自動クリーンアップ
- Base64圧縮
- 定期的な不要データ削除

### 3. ネットワーク最適化
- APIレスポンスのキャッシュ
- CORS Proxyの利用（RSS取得）
- ストリーミングデータの遅延読み込み

---

## セキュリティ設計

### 1. XSS対策
- ユーザー入力のサニタイズ
- HTMLパース時の sanitize 処理

### 2. CORS対策
- Hono ミドルウェアでCORS設定
- 信頼できるオリジンのみ許可

### 3. 認証情報管理
- LocalStorageには機密情報を保存しない
- API Keyは環境変数管理（wrangler.toml / CF Workers Secrets）

### 4. スクレイピング倫理
- robots.txt遵守
- レート制限実装
- User-Agent明示

---

## エラーハンドリング

### フロントエンド（SolidJS）
```typescript
try {
  const data = await fetchData();
} catch (error) {
  speechManager.speak('データの取得に失敗しました');
  console.error(error);
}
```

### バックエンド（Hono）
```typescript
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, 500);
});
```

---

## テスト戦略

### 1. 単体テスト
- 各ユーティリティ関数のテスト
- SpeechManagerのテスト
- ストレージ管理のテスト

### 2. 統合テスト
- API呼び出しのテスト
- コンポーネント間連携のテスト

### 3. E2Eテスト（手動）
- 実際に視覚を使わずに操作
- 音声のみで全機能を使えるか確認

### 4. アクセシビリティテスト
- スクリーンリーダーでの動作確認
- キーボードのみでの操作確認

---

## 技術的負債管理

### 現在の負債
1. **radiko未対応**: 認証が複雑で未実装（501 Not Implemented）
2. **5ch未対応**: HTTP 530 が返る
3. **IndexedDB未使用**: LocalStorageの容量制限
4. **テストコード不足**: 自動テストがほぼない

---

## 参考資料

### Web標準API
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

### フレームワーク
- [SolidJS Documentation](https://www.solidjs.com/docs/latest)
- [Hono Documentation](https://hono.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)

### アクセシビリティ
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
