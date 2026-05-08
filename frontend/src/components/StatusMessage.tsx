// 状態種別:
//   loading … 取得中（待機を促す）
//   failure … 失敗（原因と次の行動を伝える）
//   blocked … 機能未成立（戻ることだけを案内する）
// 省略時は中立表示（旧来の動作を維持）

export type StatusType = 'loading' | 'failure' | 'blocked';

interface StatusMessageProps {
  title: string;
  message: string;
  hint?: string;
  type?: StatusType;
}

const TYPE_LABEL: Record<StatusType, string> = {
  loading: '取得中',
  failure: '取得できませんでした',
  blocked: '現在使えません',
};

export default function StatusMessage(props: StatusMessageProps) {
  const typeClass = props.type ? `status-message--${props.type}` : '';
  const typeLabel = props.type ? TYPE_LABEL[props.type] : null;

  return (
    <div
      class={`status-message ${typeClass}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div class="status-message__panel">
        {typeLabel ? (
          <p class="status-message__type-label" aria-hidden="true">
            {typeLabel}
          </p>
        ) : null}
        <h1 class="status-message__title">{props.title}</h1>
        <p class="status-message__body">{props.message}</p>
        {props.hint ? (
          <p class="status-message__hint">{props.hint}</p>
        ) : null}
      </div>
    </div>
  );
}
