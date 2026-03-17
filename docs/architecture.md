# Esuna アーキテクチャ設計書

## 概要
Esunaは視覚障害者向けのアクセシブルWebアプリケーションです。
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
- **静的ビルド**: GitHub Pagesで配信可能

---

## システムアーキテクチャ

```
┌─────────────────────────────────────────────────┐
│            ユーザー（視覚障害者）                │
└─────────────────────────────────────────────────┘
                      ↓ 音声・キーボード
┌─────────────────────────────────────────────────┐
│         フロントエンド (Next.js 14)              │
├─────────────────────────────────────────────────┤
│  UI層                                           │
│  - GridSystem (9グリッド)                       │
│  - 各コンポーネント (Reader, Player, etc.)       │
├─────────────────────────────────────────────────┤
│  ロジック層                                      │
│  - SpeechManager (音声合成)                     │
│  - ストレージ管理 (LocalStorage)                 │
│  - 状態管理 (Zustand)                           │
├─────────────────────────────────────────────────┤
│  データ層                                        │
│  - コンテンツリスト (novels, podcasts, radio)    │
│  - ユーザーデータ (favorites, progress, memos)  │
└─────────────────────────────────────────────────┘
                      ↓ HTTP API
┌─────────────────────────────────────────────────┐
│         バックエンド (FastAPI)                   │
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
│  - radiko (今後対応)                            │
└─────────────────────────────────────────────────┘
```

---

## フロントエンド設計

### ディレクトリ構造
```
frontend/src/
├── app/
│   └── page.tsx                 # メインページ（ルーティング管理）
├── components/
│   ├── GridSystem.tsx           # 9グリッドUI基盤
│   ├── HatenaEntryReader.tsx    # はてブ記事リーダー
│   ├── SNSPostReader.tsx        # SNS投稿リーダー
│   ├── FivechBoardList.tsx      # 5ch板一覧
│   ├── NovelReader.tsx          # 小説リーダー
│   ├── PodcastPlayer.tsx        # Podcastプレイヤー
│   ├── RadioPlayer.tsx          # ラジオプレイヤー
│   ├── FavoritesList.tsx        # お気に入り一覧
│   ├── VoiceMemoRecorder.tsx    # 音声メモ録音
│   ├── TimerManager.tsx         # タイマー管理
│   └── AutoplayPlayer.tsx       # おまかせモード
└── lib/
    ├── speech.ts                # 音声合成管理
    ├── storage.ts               # LocalStorage管理
    ├── store.ts                 # グローバル状態 (Zustand)
    ├── novels.ts                # 小説データ
    ├── podcasts.ts              # Podcastデータ
    ├── radio.ts                 # ラジオ局データ
    ├── rss.ts                   # RSSリーダー
    ├── favorites.ts             # お気に入り管理
    ├── progress.ts              # 進捗管理
    ├── voice-memo.ts            # 音声メモ管理
    ├── timer.ts                 # タイマー管理
    ├── autoplay.ts              # 自動再生管理
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

**Props**:
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
- 戻るボタン（左上）
- 前へ/次へナビゲーション
- 読み上げボタン
- 停止ボタン

---

## バックエンド設計

### ディレクトリ構造
```
backend/
├── app/
│   ├── main.py                  # FastAPI アプリケーション
│   └── scrapers/
│       ├── hatena.py            # はてブスクレイパー
│       ├── fivech.py            # 5chスクレイパー
│       ├── sns.py               # SNSスクレイパー
│       ├── aozora.py            # 青空文庫スクレイパー
│       ├── podcast.py           # Podcast RSSパーサー
│       └── radio.py             # ラジオURL取得
└── pyproject.toml
```

### API設計

#### エンドポイント一覧
```
GET  /api/hatena/entries?type={hot|new}
GET  /api/hatena/comments?url={entry_url}
GET  /api/5ch/boards
GET  /api/5ch/threads?board_id={board_id}
GET  /api/5ch/posts?board_id={board_id}&thread_id={thread_id}
GET  /api/sns/posts?platform={twitter|mastodon|bluesky}
GET  /api/novels/content?author_id={id}&file_id={id}
GET  /api/podcasts/episodes?feed_url={url}&limit={n}
GET  /api/radio/stream-url/{service}/{station_id}
GET  /api/radio/now-playing/{service}/{station_id}
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

#### 1. アプリ設定
**キー**: `esuna_settings`
```json
{
  "speech": {
    "rate": 1.0,
    "pitch": 1.0,
    "volume": 1.0,
    "voice": "Google 日本語"
  },
  "ui": {
    "theme": "default",
    "autoNavigation": false,
    "speakTimeOnStart": true,
    "speakWeatherOnStart": true
  },
  "weather": {
    "city": "Tokyo",
    "enabled": true
  },
  "api": {
    "baseUrl": "http://localhost:8000"
  }
}
```

#### 2. お気に入り
**キー**: `esuna_favorites`
```json
[
  {
    "id": "uuid-v4",
    "type": "podcast",
    "title": "Rebuild",
    "data": { /* Podcast詳細 */ },
    "addedAt": "2025-01-01T00:00:00Z"
  }
]
```

#### 3. 進捗
**キー**: `esuna_progress_{type}_{id}`
```json
{
  "id": "content-id",
  "type": "novel",
  "currentIndex": 5,
  "totalCount": 20,
  "lastReadAt": "2025-01-01T00:00:00Z",
  "data": { /* コンテンツ詳細 */ }
}
```

#### 4. 音声メモ
**キー**: `esuna_voice_memos`
```json
[
  {
    "id": "uuid-v4",
    "title": "メモ1",
    "audioData": "data:audio/webm;base64,...",
    "duration": 30,
    "createdAt": "2025-01-01T00:00:00Z",
    "tags": ["仕事", "アイデア"]
  }
]
```

#### 5. タイマー
**キー**: `esuna_timers`
```json
[
  {
    "id": "uuid-v4",
    "title": "作業タイマー",
    "durationSeconds": 300,
    "remainingSeconds": 180,
    "isActive": true
  }
]
```

#### 6. おまかせモード設定
**キー**: `esuna_autoplay_settings`
```json
{
  "enabledTypes": ["novel", "podcast", "radio"],
  "playDuration": 10,
  "shuffle": true
}
```

---

## 音声合成設計

### SpeechManager クラス
```typescript
class SpeechManager {
  private synth: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null;

  // 音声を再生
  speak(text: string, options?: SpeechOptions): void

  // 再生を停止
  stop(): void

  // 再生中かどうか
  isSpeaking(): boolean

  // 音声設定を変更
  setVoice(voice: SpeechSynthesisVoice): void
  setRate(rate: number): void
  setPitch(pitch: number): void
  setVolume(volume: number): void
}
```

### 音声ガイダンス設計原則

1. **すべてのアクションに音声フィードバック**
   - ボタンを押したら何が起こるか事前に伝える
   - 実行後は結果を伝える

2. **簡潔で明確**
   - 1アクション1メッセージ
   - 「〜しました」と完了形で伝える

3. **中断可能**
   - Escapeキーでいつでも停止
   - 新しい音声は前の音声を中断

4. **状況を常に伝える**
   - 「3ページ目」「全10件中5件目」など位置情報
   - 「読み込み中」「再生中」など状態

---

## 9グリッドナビゲーション設計

### グリッド配置ルール
```
1  2  3
4  5  6
7  8  9
```

### 位置ごとの役割（推奨）

| 位置 | 役割 | 例 |
|------|------|-----|
| 1 | 戻る/キャンセル | 戻る、メニューに戻る |
| 2 | 前へ | 前のページ、前の項目 |
| 3 | 次へ | 次のページ、次の項目 |
| 4 | 主要アクション | 読み上げ、再生 |
| 5 | 実行/決定 | 選択、開く |
| 6 | サブアクション | お気に入り追加 |
| 7 | 情報表示 | 詳細情報、ヘルプ |
| 8 | 停止 | 音声停止 |
| 9 | 補助機能 | 設定、その他 |

### キーバインド
- **1-9キー**: 各グリッドを直接選択
- **矢印キー**: フォーカス移動
- **Enter**: 選択実行
- **Escape**: 停止または戻る

---

## パフォーマンス最適化

### 1. バンドルサイズ削減
- Next.js Static Export
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

### 4. レンダリング最適化
- useCallback/useMemo活用
- 不要な再レンダリング防止
- 仮想スクロール（長いリスト）

---

## セキュリティ設計

### 1. XSS対策
- ユーザー入力のサニタイズ
- DOMPurifyの使用（HTMLパース時）
- dangerouslySetInnerHTMLの最小化

### 2. CORS対策
- バックエンドでCORS設定
- 信頼できるオリジンのみ許可

### 3. 認証情報管理
- LocalStorageには機密情報を保存しない
- API Keyは環境変数管理

### 4. スクレイピング倫理
- robots.txt遵守
- レート制限実装
- User-Agent明示

---

## エラーハンドリング

### フロントエンド
```typescript
try {
  // API呼び出し
  const data = await fetchData();
} catch (error) {
  // エラー時は音声で通知
  speechManager.speak('データの取得に失敗しました');
  console.error(error);
}
```

### バックエンド
```python
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )
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

## デプロイ戦略

### フロントエンド
1. `npm run build` で静的ビルド
2. `out/` ディレクトリをGitHub Pagesにデプロイ
3. カスタムドメイン設定（オプション）

### バックエンド
1. Dockerコンテナ化
2. Railway/Render/Herokuにデプロイ
3. 環境変数の設定

### CI/CD
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

---

## 技術的負債管理

### 現在の負債
1. **radiko未対応**: 認証が複雑で未実装
2. **IndexedDB未使用**: LocalStorageの容量制限
3. **テストコード不足**: 自動テストがほぼない
4. **PWA未対応**: オフライン動作が不完全

### 返済計画
- 優先度1: radiko対応（ユーザー価値高）
- 優先度2: IndexedDB移行（音声メモ拡張のため）
- 優先度3: テストコード追加（品質向上）
- 優先度4: PWA化（UX向上）

---

## 参考資料

### Web標準API
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

### フレームワーク
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

### アクセシビリティ
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
