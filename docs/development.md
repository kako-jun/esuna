# esuna 開発ガイドライン

このドキュメントは、esunaプロジェクトに貢献する開発者のためのガイドです。

---

## 🎯 開発の基本方針

### 1. 視覚障害者ファースト
- **すべての判断基準は「見えなくても使えるか」**
- 色、アイコン、画像に依存しない
- 音声ガイダンスがすべて

### 2. シンプルイズベスト
- 複雑な機能より、シンプルで確実な機能
- 階層は浅く、操作は少なく
- 迷わせない設計

### 3. 一貫性の重視
- 同じ操作は同じ結果
- ボタンの配置は予測可能に
- 音声メッセージの表現を統一

---

## 🏗️ プロジェクト構成

### ディレクトリ構造
```
esuna/
├── frontend/              # Vite + SolidJS フロントエンド
│   ├── src/
│   │   ├── App.tsx       # ルートコンポーネント
│   │   ├── index.tsx     # エントリポイント
│   │   ├── components/   # SolidJS コンポーネント
│   │   └── lib/          # ユーティリティ・ロジック
│   └── package.json
├── backend/              # Hono (Cloudflare Workers) バックエンド
│   ├── src/
│   │   ├── index.ts     # エントリポイント
│   │   ├── types.ts     # 型定義
│   │   ├── middleware/  # ミドルウェア
│   │   └── scrapers/    # スクレイパー群
│   └── package.json
├── docs/                 # プロジェクト管理ドキュメント
│   ├── architecture.md           # アーキテクチャ設計
│   ├── development.md            # このファイル
│   ├── features.md               # 機能一覧
│   ├── grid-layout.md            # 9マスUI規約
│   ├── overview.md               # 概要
│   └── status-matrix.md          # 機能の成立状況
└── CLAUDE.md             # プロジェクト概要・開発方針
```

---

## 💻 開発環境セットアップ

### フロントエンド

#### 必要なもの
- Node.js 20以上

#### セットアップ
```bash
cd frontend
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開く

#### ビルド
```bash
npm run build
```

---

### バックエンド

#### 必要なもの
- Node.js 20以上

#### セットアップ
```bash
cd backend
npm install
npm run dev
```

APIは `http://localhost:8787` で起動

#### デプロイ
```bash
npx wrangler deploy
```

---

## 📝 コーディング規約

### TypeScript / SolidJS

#### 命名規則
- **コンポーネント**: PascalCase (`NovelReader`, `GridSystem`)
- **関数**: camelCase (`loadSettings`, `updateSetting`)
- **定数**: UPPER_SNAKE_CASE (`POPULAR_NOVELS`, `DEFAULT_SETTINGS`)
- **型**: PascalCase (`SpeechManager`, `AutoplaySettings`)

#### ファイル構成
```typescript
// 1. import文
import { createSignal, onMount } from 'solid-js'
import { SpeechManager } from '../lib/speech'

// 2. 型定義
interface ComponentProps {
  speech: SpeechManager;
  onBack: () => void;
}

// 3. コンポーネント
export default function Component(props: ComponentProps) {
  // 3-1. シグナル
  const [state, setState] = createSignal(...)

  // 3-2. ライフサイクル
  onMount(() => {
    // ...
  })

  // 3-3. ハンドラー
  const handleClick = () => {
    // ...
  }

  // 3-4. レンダリング
  return <div>...</div>
}
```

#### コンポーネント設計原則
1. **単一責任の原則**: 1つのコンポーネントは1つの責務
2. **Props は必要最小限**: 不要なデータを渡さない
3. **音声ガイダンスは必須**: すべてのアクションに音声フィードバック

#### SolidJS の状態管理
- `createSignal`: ローカルな状態管理
- `createStore`: 複数フィールドの状態管理
- `store.ts`: グローバル状態（SolidJS createSignal ベース）

---

## 🎨 UI/UX ガイドライン

### 9グリッドレイアウト（正規配置）

```
1  2  3
4  5  6
7  8  9
```

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

詳細は `docs/grid-layout.md` を参照。

---

### 音声ガイダンス

#### 基本原則
1. **すべてのアクションに音声フィードバック**
   ```typescript
   onClick={() => {
     speech.speak('ニュースを開きました')
     navigateTo('news')
   }}
   ```

2. **簡潔で明確なメッセージ**
   - ❌ 「処理を実行しています。しばらくお待ちください。」
   - ✅ 「読み込み中」

3. **完了形で伝える**
   - ❌ 「設定を保存します」
   - ✅ 「設定を保存しました」

4. **位置情報を含める**
   - ✅ 「3ページ目」「全10件中5件目」

#### 音声テキストの例
```typescript
// 良い例
speech.speak('小説一覧に移動しました')
speech.speak('次のページに移動しました。3ページ目')
speech.speak('お気に入りに追加しました')

// 悪い例
speech.speak('移動') // 何に？
speech.speak('OK')   // 何が？
```

---

### キーボード操作

#### サポート必須のキー
- **1-9**: グリッド直接選択
- **矢印キー**: フォーカス移動
- **Enter**: 実行
- **Escape**: 停止または戻る

---

## 🔧 新機能の追加方法

### Step 1: 成立状況の確認
`docs/status-matrix.md` を確認し、未成立機能に UI を追加しないこと。

### Step 2: 設計
1. 必要に応じて `docs/architecture.md` を更新
2. 9マス規約（`docs/grid-layout.md`）に従ったグリッド配置を設計

### Step 3: データ層の実装
1. `frontend/src/lib/` に新しいファイルを作成
2. データ構造（interface）を定義
3. LocalStorage操作関数を実装

例: `frontend/src/lib/calendar.ts`
```typescript
export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
}

export function getEvents(): CalendarEvent[] {
  // LocalStorage から取得
}

export function addEvent(event: CalendarEvent): void {
  // LocalStorage に保存
}
```

### Step 4: コンポーネントの実装
1. `frontend/src/components/` に新しいコンポーネントを作成（SolidJS）
2. GridSystem を使用
3. 音声ガイダンスを実装
4. 正規配置（docs/grid-layout.md）に従うこと

例: `frontend/src/components/CalendarView.tsx`
```typescript
import { SpeechManager } from '../lib/speech'
import GridSystem from './GridSystem'

interface Props {
  speech: SpeechManager;
  onBack: () => void;
}

export default function CalendarView(props: Props) {
  const actions = [
    {
      label: '戻る',
      action: () => {
        props.speech.speak('メニューに戻りました')
        props.onBack()
      }
    },
    // ...
  ]

  return <GridSystem actions={actions} speech={props.speech} />
}
```

### Step 5: App.tsx へのルーティング統合
1. `frontend/src/App.tsx` を編集
2. Page型に追加
3. 条件分岐に追加

### Step 6: テスト
1. 実際に操作してみる
2. 音声ガイダンスが適切か確認
3. エラー処理が適切か確認
4. キーボード操作が正しく動くか確認

### Step 7: ドキュメント更新
1. `docs/status-matrix.md` に成立状況を記録
2. 必要に応じて `CLAUDE.md` を更新

---

## 🧪 テストガイドライン

### 手動テスト（必須）

#### 音声テスト
1. すべてのボタンを押して音声ガイダンスを確認
2. エラーを発生させて音声エラーメッセージを確認
3. 長文読み上げを Escape で停止できるか確認

#### キーボードテスト
1. 1-9キーでナビゲーション
2. 矢印キーでフォーカス移動
3. Enterで実行
4. Escapeで停止/戻る

#### アクセシビリティテスト
1. 目をつぶって操作 — 音声だけで目的を達成できるか
2. スクリーンリーダーで確認（可能なら）

---

## 🐛 デバッグのヒント

### よくあるエラー

#### 1. 音声が出ない
**原因**:
- `speechManager` がnull
- ブラウザが音声合成に対応していない

**対処**:
```typescript
if (!speechManager) {
  console.error('SpeechManager is not initialized')
  return
}
```

#### 2. LocalStorage容量オーバー
**対処**:
```typescript
try {
  localStorage.setItem(key, value)
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    cleanupOldData()
  }
}
```

#### 3. GridSystemでキーが反応しない
- GridSystemコンポーネントがマウントされているか確認
- 他のイベントリスナーが干渉していないか確認

---

## 📦 リリースフロー

### 1. 機能開発
1. ブランチを作成 `git checkout -b feat/new-feature`
2. 開発・コミット
3. テスト

### 2. プルリクエスト
1. `main` ブランチにPR作成
2. CI（tsc + vite build）が通ることを確認
3. マージ → CF Pages に自動デプロイ

### 3. バックエンドデプロイ
```bash
cd backend
npx wrangler deploy
```

---

## 🎓 学習リソース

### SolidJS
- [公式ドキュメント](https://www.solidjs.com/docs/latest)
- [SolidJS チュートリアル](https://www.solidjs.com/tutorial/introduction_basics)

### Hono
- [公式ドキュメント](https://hono.dev/)

### TypeScript
- [公式ハンドブック](https://www.typescriptlang.org/docs/handbook/intro.html)

### Cloudflare Workers
- [公式ドキュメント](https://developers.cloudflare.com/workers/)

### Web Accessibility
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM](https://webaim.org/)

---

## 💬 コミュニケーション

### バグ報告
1. Issue作成
2. 再現手順を記載
3. 環境情報を記載（OS、ブラウザ等）

### 機能提案
1. `docs/status-matrix.md` で成立可能性を確認
2. Issueで議論

---

## 📜 ライセンス・倫理

### スクレイピング
- `robots.txt` を遵守
- レート制限を実装
- User-Agentを明示

### 個人情報
- LocalStorageには機密情報を保存しない

### アクセシビリティ
- WCAG 2.1 AA レベルを目指す
- 実際の視覚障害者にテストしてもらう（可能なら）

---

## 🙏 貢献のお願い

esunaは視覚障害者の方々の生活を豊かにするプロジェクトです。
以下のような貢献をお待ちしています：

- **コード**: 機能追加、バグ修正
- **ドキュメント**: 説明の改善、翻訳
- **テスト**: 実際に使ってフィードバック
- **デザイン**: 音声ガイダンスの改善提案
- **アイデア**: 新機能の提案

すべての貢献者に感謝します！
