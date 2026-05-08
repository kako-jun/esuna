interface StatusMessageProps {
  title: string;
  message: string;
  hint?: string;
}

export default function StatusMessage(props: StatusMessageProps) {
  return (
    <div class="status-message" role="status" aria-live="polite">
      <div class="status-message__panel">
        <h1 class="status-message__title">{props.title}</h1>
        <p class="status-message__body">{props.message}</p>
        {props.hint ? <p class="status-message__hint">{props.hint}</p> : null}
      </div>
    </div>
  );
}
