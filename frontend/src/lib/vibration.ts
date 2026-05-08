import { useAppStore } from './store';

const TAP_VIBRATION_MS = 30;

export const triggerTapVibration = (): void => {
  const store = useAppStore();
  if (!store.state.vibrationEnabled || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(TAP_VIBRATION_MS);
  } catch {
    // 一部ブラウザでは vibrate が例外を投げることがあるので無視
  }
};
