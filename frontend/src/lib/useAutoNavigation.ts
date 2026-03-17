/**
 * 自動ナビゲーションフック
 * esuna_oldの自動ナビゲーション機能を移植
 * 音声読み上げ完了後、自動的に次のコンテンツに遷移
 */
import { useEffect, useRef } from 'react';
import { SpeechManager } from './speech';

interface UseAutoNavigationProps {
  enabled: boolean;
  speech: SpeechManager;
  onNext: () => void;
  interval?: number; // チェック間隔（ミリ秒）
  delay?: number;    // 遷移までの待機時間（ミリ秒）
}

export const useAutoNavigation = ({
  enabled,
  speech,
  onNext,
  interval = 1000,
  delay = 2000,
}: UseAutoNavigationProps) => {
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);
  const delayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeakingStateRef = useRef<boolean>(false);
  // Keep a ref to the latest onNext to avoid stale closures inside setInterval
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;

  useEffect(() => {
    // 自動ナビゲーションが無効の場合はクリーンアップ
    if (!enabled) {
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }
      return;
    }

    // 定期的に音声読み上げ状態をチェック
    timerIdRef.current = setInterval(() => {
      const isSpeaking = speech.isSpeaking();

      // 読み上げ中から停止に変わった瞬間を検知
      if (lastSpeakingStateRef.current && !isSpeaking) {
        // delay後に次へ遷移（最新の onNext を ref 経由で呼ぶ）
        delayTimerRef.current = setTimeout(() => {
          onNextRef.current();
        }, delay);
      }

      lastSpeakingStateRef.current = isSpeaking;
    }, interval);

    // クリーンアップ
    return () => {
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
      }
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
      }
    };
    // onNext は ref 経由で参照するので deps から外す（stale closure 対策）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, speech, interval, delay]);

  // 手動でタイマーをキャンセルする関数
  const cancel = () => {
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
  };

  return { cancel };
};
