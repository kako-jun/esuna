/**
 * 自動ナビゲーションフック（SolidJS版）
 * 音声読み上げ完了後、自動的に次のコンテンツに遷移
 */
import { createEffect, onCleanup } from 'solid-js';
import { SpeechManager } from './speech';

interface UseAutoNavigationProps {
  enabled: boolean;
  speech: SpeechManager;
  onNext: () => void;
  interval?: number;
  delay?: number;
}

export function useAutoNavigation(props: UseAutoNavigationProps) {
  let timerId: ReturnType<typeof setInterval> | null = null;
  let delayTimer: ReturnType<typeof setTimeout> | null = null;
  let lastSpeakingState = false;

  const cleanup = () => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    if (delayTimer) {
      clearTimeout(delayTimer);
      delayTimer = null;
    }
  };

  createEffect(() => {
    // Re-run whenever enabled changes
    const enabled = props.enabled;
    const speech = props.speech;
    const checkInterval = props.interval ?? 1000;
    const transitionDelay = props.delay ?? 2000;

    cleanup();

    if (!enabled) {
      return;
    }

    lastSpeakingState = false;

    timerId = setInterval(() => {
      const isSpeaking = speech.isSpeaking();

      // 読み上げ中から停止に変わった瞬間を検知
      if (lastSpeakingState && !isSpeaking) {
        delayTimer = setTimeout(() => {
          props.onNext();
        }, transitionDelay);
      }

      lastSpeakingState = isSpeaking;
    }, checkInterval);
  });

  onCleanup(cleanup);

  // 手動でタイマーをキャンセルする関数
  const cancel = () => {
    if (delayTimer) {
      clearTimeout(delayTimer);
      delayTimer = null;
    }
  };

  return { cancel };
}
