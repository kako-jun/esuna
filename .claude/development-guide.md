# Esuna 開発ガイドライン

このドキュメントは、Esunaプロジェクトに貢献する開発者のためのガイドです。

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
├── frontend/              # Next.js フロントエンド
│   ├── src/
│   │   ├── app/          # ページ
│   │   ├── components/   # Reactコンポーネント
│   │   └── lib/          # ユーティリティ・ロジック
│   ├── public/           # 静的ファイル
│   └── package.json
├── backend/              # FastAPI バックエンド
│   ├── app/
│   │   ├── main.py      # エントリポイント
│   │   └── scrapers/    # スクレイパー群
│   └── pyproject.toml
├── .claude/              # プロジェクト管理ドキュメント
│   ├── architecture.md           # アーキテクチャ設計
│   ├── todo.md                   # TODO リスト
│   ├── development-guide.md      # このファイル
│   ├── future-features.md        # 将来実装予定の機能
│   └── implementation-progress.md # 実装進捗
└── CLAUDE.md             # プロジェクト概要
```

---

## 💻 開発環境セットアップ

### フロントエンド

#### 必要なもの
- Node.js 18以上
- npm または yarn

#### セットアップ
```bash
cd frontend
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開く

#### ビルド
```bash
npm run build
```

#### リンター
```bash
npm run lint
```

---

### バックエンド

#### 必要なもの
- Python 3.11以上
- pip

#### セットアップ
```bash
cd backend
pip install -e .
```

#### 起動
```bash
python -m app.main
```

APIは `http://localhost:8000` で起動

#### API ドキュメント
`http://localhost:8000/docs` でSwagger UIを確認

---

## 📝 コーディング規約

### TypeScript/React

#### 命名規則
- **コンポーネント**: PascalCase (`NovelReader`, `GridSystem`)
- **関数**: camelCase (`loadSettings`, `updateSetting`)
- **定数**: UPPER_SNAKE_CASE (`POPULAR_NOVELS`, `DEFAULT_SETTINGS`)
- **型**: PascalCase (`SpeechManager`, `AutoplaySettings`)

#### ファイル構成
```typescript
// 1. import文
import { useState } from 'react'
import { SpeechManager } from '@/lib/speech'

// 2. 型定義
interface ComponentProps {
  speech: SpeechManager;
  onBack: () => void;
}

// 3. コンポーネント
export default function Component({ speech, onBack }: ComponentProps) {
  // 3-1. State
  const [state, setState] = useState(...)

  // 3-2. Effect
  useEffect(() => {
    // ...
  }, [])

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

#### Hooksの使用ルール
- `useState`: 画面の状態管理
- `useEffect`: 副作用（API呼び出し、イベントリスナー）
- `useCallback`: 関数のメモ化（パフォーマンス最適化）
- `useMemo`: 計算結果のメモ化

---

### Python/FastAPI

#### 命名規則
- **関数**: snake_case (`fetch_novel_content`, `get_stream_url`)
- **クラス**: PascalCase (`HatenaScraper`, `RadioAPI`)
- **定数**: UPPER_SNAKE_CASE (`NHK_STREAM_URLS`, `DEFAULT_LIMIT`)

#### ファイル構成
```python
"""
モジュールの説明
"""

# 1. 標準ライブラリ
import logging
from typing import Dict, Any

# 2. サードパーティライブラリ
from fastapi import HTTPException
import httpx

# 3. ローカルインポート
from .utils import parse_html

# 4. ロガー設定
logger = logging.getLogger(__name__)

# 5. 定数
DEFAULT_TIMEOUT = 30

# 6. 関数
async def fetch_data(url: str) -> Dict[str, Any]:
    """データを取得する"""
    # ...
```

#### エラーハンドリング
```python
try:
    result = await fetch_data()
    return result
except httpx.HTTPError as e:
    logger.error(f"HTTP error: {e}")
    raise HTTPException(status_code=500, detail="Failed to fetch data")
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    raise HTTPException(status_code=500, detail="Internal server error")
```

---

## 🎨 UI/UX ガイドライン

### 9グリッドレイアウト

#### 基本ルール
```
1  2  3
4  5  6
7  8  9
```

| 位置 | 推奨用途 |
|------|----------|
| 1 | 戻る/キャンセル（最優先） |
| 2-3 | ナビゲーション（前へ/次へ） |
| 4-6 | 主要アクション |
| 7-9 | 補助機能 |

#### 必須要素
- **戻るボタン**: 常に1番（左上）
- **停止ボタン**: 8番または9番
- **読み上げボタン**: 4番または5番

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
speech.speak('OK') // 何が？
speech.speak('完了') // 何が完了？
```

---

### キーボード操作

#### サポート必須のキー
- **1-9**: グリッド直接選択
- **矢印キー**: フォーカス移動
- **Enter**: 実行
- **Escape**: 停止または戻る

#### 実装例
```typescript
<GridSystem
  actions={actions}
  speech={speech}
/>
```

GridSystemが自動的にキーバインドを処理する

---

## 🔧 新機能の追加方法

### Step 1: 設計
1. `.claude/future-features.md` に機能案を追加
2. `.claude/todo.md` にタスクを追加
3. 必要に応じて `.claude/architecture.md` を更新

### Step 2: データ層の実装
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

### Step 3: コンポーネントの実装
1. `frontend/src/components/` に新しいコンポーネントを作成
2. GridSystem を使用
3. 音声ガイダンスを実装

例: `frontend/src/components/CalendarView.tsx`
```typescript
export default function CalendarView({ speech, onBack }) {
  const actions = [
    {
      label: '戻る',
      action: () => {
        speech.speak('メニューに戻りました')
        onBack()
      }
    },
    // ...
  ]

  return <GridSystem actions={actions} speech={speech} />
}
```

### Step 4: ルーティングへの統合
1. `frontend/src/app/page.tsx` を編集
2. Page型に追加
3. case文に追加

```typescript
type Page = '...' | 'calendar'

// ...

case 'calendar':
  return (
    <main>
      <CalendarView
        speech={speechManager}
        onBack={() => navigateTo('main')}
      />
    </main>
  )
```

### Step 5: メニューに追加
1. `mainMenuActions` または適切なサブメニューに追加

```typescript
{
  label: 'カレンダー',
  action: () => {
    navigateTo('calendar')
    speechManager?.speak('カレンダーに移動しました')
  }
}
```

### Step 6: テスト
1. 実際に操作してみる
2. 音声ガイダンスが適切か確認
3. エラー処理が適切か確認
4. キーボード操作が正しく動くか確認

### Step 7: ドキュメント更新
1. `.claude/implementation-progress.md` に実装内容を追加
2. `.claude/todo.md` の該当タスクをチェック
3. 必要に応じて `CLAUDE.md` を更新

---

## 🧪 テストガイドライン

### 手動テスト（必須）

#### 音声テスト
1. **すべてのボタンを押してみる**
   - 音声ガイダンスが流れるか
   - メッセージは適切か

2. **エラーを発生させてみる**
   - エラーメッセージが流れるか
   - 音声で内容が分かるか

3. **長文の読み上げをテスト**
   - Escapeで停止できるか
   - 次の音声で中断されるか

#### キーボードテスト
1. **1-9キーでナビゲーション**
   - すべてのグリッドが選択できるか

2. **矢印キーでナビゲーション**
   - フォーカス移動が正しいか

3. **Enterで実行**
   - 選択中のアクションが実行されるか

4. **Escapeで停止/戻る**
   - 音声が停止するか
   - 前の画面に戻るか

#### アクセシビリティテスト
1. **目をつぶって操作**
   - 音声だけで操作できるか
   - 迷わずに目的を達成できるか

2. **スクリーンリーダーで確認**（可能なら）
   - NVDA、JAWS等で動作確認

---

### 自動テスト（今後導入）

#### 単体テスト
```typescript
// 例: SpeechManager のテスト
describe('SpeechManager', () => {
  it('should speak text', () => {
    const manager = new SpeechManager()
    manager.speak('テスト')
    expect(manager.isSpeaking()).toBe(true)
  })
})
```

#### 統合テスト
```typescript
// 例: コンポーネントのテスト
describe('NovelReader', () => {
  it('should render and speak on mount', () => {
    const mockSpeech = { speak: jest.fn() }
    render(<NovelReader speech={mockSpeech} />)
    expect(mockSpeech.speak).toHaveBeenCalled()
  })
})
```

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
**原因**:
- データが多すぎる
- 音声メモの容量が大きい

**対処**:
```typescript
try {
  localStorage.setItem(key, value)
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    // 古いデータを削除
    cleanupOldData()
  }
}
```

#### 3. GridSystemでキーが反応しない
**原因**:
- フォーカスが外れている
- イベントリスナーが登録されていない

**対処**:
- GridSystemコンポーネントがマウントされているか確認
- 他のイベントリスナーが干渉していないか確認

---

### ログの活用

#### 開発時のログ
```typescript
// 重要な処理の前後にログを入れる
console.log('Fetching data...')
const data = await fetchData()
console.log('Data fetched:', data)
```

#### 本番環境のログ
```typescript
// エラーのみログに残す
try {
  // ...
} catch (error) {
  console.error('Error:', error)
}
```

---

## 📦 リリースフロー

### 1. 機能開発
1. ブランチを作成 `git checkout -b feature/new-feature`
2. 開発・コミット
3. テスト

### 2. プルリクエスト
1. `main` ブランチにPR作成
2. レビュー
3. マージ

### 3. バージョンアップ
1. `package.json` のバージョンを更新
2. `.claude/implementation-progress.md` を更新
3. コミット

### 4. デプロイ
1. `npm run build`
2. GitHub Pagesにデプロイ

---

## 🎓 学習リソース

### Next.js
- [公式ドキュメント](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

### React
- [公式ドキュメント](https://react.dev/)
- [Hooks入門](https://react.dev/learn/state-a-components-memory)

### TypeScript
- [公式ハンドブック](https://www.typescriptlang.org/docs/handbook/intro.html)

### FastAPI
- [公式ドキュメント](https://fastapi.tiangolo.com/)
- [チュートリアル](https://fastapi.tiangolo.com/tutorial/)

### Web Accessibility
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM](https://webaim.org/)

---

## 💬 コミュニケーション

### 質問・相談
- GitHub Issuesで質問
- 技術的な議論はDiscussion

### バグ報告
1. Issue作成
2. 再現手順を記載
3. 環境情報を記載（OS、ブラウザ等）

### 機能提案
1. `.claude/future-features.md` に追加
2. Issueで議論

---

## 📜 ライセンス・倫理

### スクレイピング
- `robots.txt` を遵守
- レート制限を実装
- User-Agentを明示

### 個人情報
- LocalStorageには機密情報を保存しない
- ユーザーデータは暗号化（将来的に）

### アクセシビリティ
- WCAG 2.1 AA レベルを目指す
- 実際の視覚障害者にテストしてもらう（可能なら）

---

## 🙏 貢献のお願い

Esunaは視覚障害者の方々の生活を豊かにするプロジェクトです。
以下のような貢献をお待ちしています：

- **コード**: 機能追加、バグ修正
- **ドキュメント**: 説明の改善、翻訳
- **テスト**: 実際に使ってフィードバック
- **デザイン**: 音声ガイダンスの改善提案
- **アイデア**: 新機能の提案

すべての貢献者に感謝します！
