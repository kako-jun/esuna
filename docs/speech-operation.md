# 音声操作仕様

Esuna における音声操作（停止・一時停止・再開・自動送り）の正本。

## 用語定義

| 用語 | 意味 |
|---|---|
| **発話キャンセル** | `SpeechSynthesis.cancel()` を呼び、現在の発話とキューを全消去する |
| **停止** | 発話キャンセルを行う操作（グリッド idx=8 の固定ラベル） |
| **一時停止** | 自動送りを一時的に止める操作（AutoplayPlayer 専用） |
| **再開** | 一時停止を解除して自動送りを再開する操作（AutoplayPlayer 専用） |
| **自動送り** | AutoplayPlayer のタイマーによるコンテンツ自動遷移 |

## グリッド idx=8「停止」の動作

- `speech.stop()` を呼ぶ（`SpeechSynthesis.cancel()`）
- 現在の発話とキューを全消去する
- 自動送りタイマーは**停止しない**（`isPlaying` フラグを変えない）
- PodcastPlayer / RadioPlayer の音楽/音声ストリームは**停止しない**（別途 audio 要素を操作）

idx=8 は「今しゃべっているのを黙らせる」ボタンである。

## 一時停止・再開（AutoplayPlayer 専用）

AutoplayPlayer のみ「一時停止/再開」の概念を持つ。

- **idx=6「一時停止」**（`isPlaying() === true` のとき）
  - `setIsPlaying(false)` でタイマーを一時停止
  - `speech.stop()` で現在の発話もキャンセル
  - 読み上げ: 「一時停止しました」
- **idx=6「再生」**（`isPlaying() === false` のとき）
  - `setIsPlaying(true)` でタイマーを再開
  - 読み上げ: 「再生を再開しました」

## 自動送り（AutoplayPlayer）

- `isPlaying()` が `true` の間、1秒ごとに `timeRemaining` がカウントダウンされる
- 0 になると `nextContent()` が呼ばれ次のコンテンツへ遷移
- `isPlaying()` が `false` のときはタイマーが進まない
- `speech.stop()` だけを呼んでも自動送りは止まらない

## PodcastPlayer / RadioPlayer の停止

これらの画面は音楽/ラジオ（audio 要素）と音声ガイド（speech）が分離している。

| 操作 | audio 要素 | speech |
|---|---|---|
| idx=6「一時停止/再生」 | `audio.pause()` / `audio.play()` | 読み上げのみ |
| idx=8「停止」 | **変化なし** | `speech.stop()` |
| 戻る（idx=1） | `audio.pause(); audio.src = ''` | `speech.stop()` |

音楽を一時停止するには idx=6 を使う。idx=8 はあくまで「音声ガイドのキャンセル」。

## SpeechManager の責務

```ts
speech.speak(text, options?)  // 発話（interrupt: true でキャンセル後に発話）
speech.stop()                 // 発話キャンセル（SpeechSynthesis.cancel()）
speech.pause()                // SpeechSynthesis.pause()（現在未使用）
speech.resume()               // SpeechSynthesis.resume()（現在未使用）
```

`speech.pause()` / `speech.resume()` は Web Speech API のメソッドだが、ブラウザ実装が不安定なため現在は未使用。一時停止の実装には `stop()` + 再発話 のパターンを使う。

## useAutoNavigation との関係

`useAutoNavigation` は `isSpeaking()` のポーリングによって「読み上げ終了を検知して次へ進む」フック。AutoplayPlayer では**使用していない**。AutoplayPlayer は独自のタイマー（`setInterval`）で自動送りを実装している。

`useAutoNavigation` を使うコンポーネントでは、`speech.stop()` を呼ぶと「読み上げ終了」と誤検知する可能性がある。該当コンポーネントでの `speech.stop()` 呼び出し後には注意が必要。

## 画面ごとの対応表

| 画面 | idx=6 | idx=8 |
|---|---|---|
| はてなブックマーク | 読み上げ（主アクション） | 停止 |
| SNS投稿一覧 | 切替（特例） | 停止 |
| 5ちゃんねる板一覧 | 主アクション（未対応） | 停止 |
| RSS一覧 | 主アクション | 停止 |
| 青空文庫一覧 | 主アクション | 停止 |
| Podcast一覧 | 主アクション | 停止 |
| PodcastPlayer | **一時停止/再生**（audio） | **音声停止**（speech） |
| ラジオ局一覧 | 再生（局選択） | 停止 |
| RadioPlayer | **一時停止/再生**（audio） | 停止（speech） |
| AutoplayPlayer | **一時停止/再生**（タイマー） | 停止（speech） |
| お気に入り | 削除 | 停止 |
| 続きから再開 | 削除 | 停止 |
| タイマー | 主アクション | 停止 |
| 音声メモ | 主アクション | 停止 |
