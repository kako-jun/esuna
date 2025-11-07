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
├── frontend/        # Next.js + React + TypeScript
├── backend/         # FastAPI + Python
└── compose.yaml     # Docker Compose設定
```

### 技術スタック

**フロントエンド:**
- Next.js 14（App Router）
- React 18
- TypeScript
- Tailwind CSS
- Web Speech API

**バックエンド:**
- FastAPI
- Python 3.11+
- httpx（非同期HTTPクライアント）
- BeautifulSoup4（HTMLパース）

## セットアップ

### 必要な環境

- Docker & Docker Compose（推奨）
- または、Node.js 20+ と Python 3.11+

### Docker Composeで起動（推奨）

```bash
# リポジトリをクローン
git clone https://github.com/kako-jun/esuna.git
cd esuna

# Docker Composeで起動
docker-compose up -d

# フロントエンド: http://localhost:3000
# バックエンドAPI: http://localhost:8000
# APIドキュメント: http://localhost:8000/docs
```

### 手動セットアップ

**バックエンド:**

```bash
cd backend

# uvをインストール（推奨）
pip install uv

# 依存関係をインストール
uv sync

# 開発サーバー起動
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**フロントエンド:**

```bash
cd frontend

# 依存関係をインストール
npm install

# 開発サーバー起動
npm run dev
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

### その他

- `POST /api/log` - エラーログ送信

詳細なAPIドキュメントは `http://localhost:8000/docs` を参照してください。

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
