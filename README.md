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
├── backend/         # Hono (Cloudflare Workers) + TypeScript
└── compose.yaml     # Docker Compose設定
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

### はてなブックマーク

- `GET /api/hatena/hot` - 人気エントリー
- `GET /api/hatena/latest` - 新着エントリー
- `GET /api/hatena/comments?url=<URL>` - コメント

### 5ch

- `GET /api/5ch/boards` - 板一覧
- `GET /api/5ch/threads?board_url=<URL>` - スレッド一覧
- `GET /api/5ch/posts?thread_url=<URL>` - 投稿

### SNS

- `GET /api/sns/posts?platform=<twitter|mastodon|bluesky>` - 投稿一覧

### 小説（青空文庫）

- `GET /api/novels/content?author_id=<ID>&file_id=<ID>` - 小説本文

### Podcast

- `GET /api/podcasts/episodes?feed_url=<URL>` - エピソード一覧

### ラジオ

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

### 9分割グリッド

```
┌─────┬──────────────┬─────┐
│  1  │      2      │  3  │
│戻る │ リロード     │設定 │
├─────┼──────────────┼─────┤
│  4  │      5      │  6  │
│前へ │メインコンテンツ│次へ │
├─────┼──────────────┼─────┤
│  7  │      8      │  9  │
│機能 │   機能      │機能 │
└─────┴──────────────┴─────┘
```

## デプロイ

### フロントエンド（Cloudflare Pages）

- `main` ブランチへのプッシュで自動デプロイ
- ビルドコマンド: `cd frontend && npm run build`
- 出力ディレクトリ: `frontend/dist`
- カスタムドメイン: `esuna.llll-ll.com`

### バックエンド（Cloudflare Workers）

```bash
cd backend
npx wrangler deploy
```

## 開発

### ブランチ戦略

- `main`: 安定版
- `claude/*`: 開発ブランチ（Claude Code用）

### コミット

```bash
# 変更をステージング
git add .

# コミット
git commit -m "適切なコミットメッセージ"

# プッシュ
git push -u origin <branch-name>
```

## ライセンス

MIT License

## 開発者

[@kako-jun](https://github.com/kako-jun)

## 関連ドキュメント

- [CLAUDE.md](./CLAUDE.md) - プロジェクトコンセプトと開発方針
