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
        // delay後に次へ遷移
        delayTimerRef.current = setTimeout(() => {
          onNext();
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
  }, [enabled, speech, onNext, interval, delay]);

  // 手動でタイマーをキャンセルする関数
  const cancel = () => {
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
  };

  return { cancel };
};
