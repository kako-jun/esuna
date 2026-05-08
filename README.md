# Esuna（エスナ）

視覚障害者が安心して使える、統一操作インターフェースを持つWebアプリケーション

## プロジェクト概要

Esunaは、失明しても今と同じ趣味を楽しめるように設計された、アクセシビリティファーストのWebアプリケーションです。ファイナルファンタジーの回復魔法「エスナ」が名前の由来で、視覚障害者が絶望しない世界を目指しています。

### 主な特徴

- **9分割グリッドUI**: タップ位置を特定しやすい統一された操作体系
- **音声読み上げ**: すべてのコンテンツを音声で提供
- **キーボード操作**: 完全なキーボードナビゲーション対応
- **コンテンツ集約**: ニュース、SNS、5chなどを一箇所で閲覧

## アーキテクチャ

モノレポ構成（Frontend + Backend）

```
esuna/
├── frontend/        # Vite + SolidJS + TypeScript
└── backend/         # Hono (Cloudflare Workers) + TypeScript
```

### 技術スタック

**フロントエンド:**
- Vite
- SolidJS
- TypeScript
- Web Speech API

**バックエンド:**
- Hono（Cloudflare Workers）
- TypeScript
- cheerio（HTMLパース）

## セットアップ

### 必要な環境

- Node.js 20+

### 開発サーバー起動

```bash
# リポジトリをクローン
git clone https://github.com/kako-jun/esuna.git
cd esuna

# フロントエンド
cd frontend && npm install && npm run dev
# → http://localhost:5173

# バックエンド（別ターミナル）
cd backend && npm install && npm run dev
# → http://localhost:8787
```

## API エンドポイント

### はてなブックマーク（成立）

- `GET /api/hatena/hot` - 人気エントリー
- `GET /api/hatena/latest` - 新着エントリー
- `GET /api/hatena/comments?url=<URL>` - コメント

### 5ch（未対応: HTTP 530）

- `GET /api/5ch/boards` - 板一覧
- `GET /api/5ch/threads?board_url=<URL>` - スレッド一覧
- `GET /api/5ch/posts?thread_url=<URL>` - 投稿

### SNS（試験的）

- `GET /api/sns/posts?platform=<mastodon|bluesky>` - 投稿一覧

### 小説 / 青空文庫（試験的）

- `GET /api/novels/content?author_id=<ID>&file_id=<ID>` - 小説本文

### Podcast（試験的）

- `GET /api/podcasts/episodes?feed_url=<URL>` - エピソード一覧

### ラジオ / radiko（未対応: 501 Not Implemented）

- `GET /api/radio/stream-url/:service/:stationId` - ストリーミングURL
- `GET /api/radio/now-playing/:service/:stationId` - 放送中の番組情報

### その他

- `POST /api/log` - エラーログ送信

## 使い方

### 基本操作

- **数字キー（1-9）**: 各エリアを直接選択
- **矢印キー**: エリア間を移動
- **Enterキー**: 決定
- **Escapeキー**: 読み上げ停止/戻る

### 9分割グリッド（正規配置）

```
┌─────┬──────────────┬─────┐
│  1  │      2      │  3  │
│戻る │  前の項目    │次の項目│
├─────┼──────────────┼─────┤
│  4  │      5      │  6  │
│情報 │  主対象      │アクション│
├─────┼──────────────┼─────┤
│  7  │      8      │  9  │
│補助 │    停止      │画面案内│
└─────┴──────────────┴─────┘
```

| 位置 | 役割 | 説明 |
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

## デプロイ

### フロントエンド（Cloudflare Pages）

- `main` ブランチへのプッシュで自動デプロイ
- ビルドコマンド: `cd frontend && npm run build`
- 出力ディレクトリ: `frontend/dist`
- URL: https://esuna.llll-ll.com

### バックエンド（Cloudflare Workers）

```bash
cd backend
npx wrangler deploy
```

URL: https://esuna-api.kako-jun.workers.dev

## 開発

### ブランチ戦略

- `main`: 安定版（push = CF Pages 自動デプロイ）
- `fix/*` / `feat/*`: 開発ブランチ

### コミット

```bash
git add .
git commit -m "適切なコミットメッセージ"
git push -u origin <branch-name>
```

## ライセンス

MIT License

## 開発者

[@kako-jun](https://github.com/kako-jun)

## 関連ドキュメント

- [CLAUDE.md](./CLAUDE.md) - プロジェクトコンセプトと開発方針
- [docs/grid-layout.md](./docs/grid-layout.md) - 9マスUI規約
- [docs/status-matrix.md](./docs/status-matrix.md) - 機能の成立状況
- [docs/architecture.md](./docs/architecture.md) - アーキテクチャ設計
