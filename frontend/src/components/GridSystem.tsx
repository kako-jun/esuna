import { createSignal, onMount, onCleanup, For, Show } from 'solid-js';
import { SpeechManager } from '../lib/speech';

interface GridAction {
  label: string;
  action: () => void;
}

interface GridSystemProps {
  actions: GridAction[];
  speech: SpeechManager;
  onInit?: () => void;
}

let gridIdCounter = 0;

export default function GridSystem(props: GridSystemProps) {
  const [selectedIndex, setSelectedIndex] = createSignal<number | null>(null);
  const [isKeyboardMode, setIsKeyboardMode] = createSignal(false);
  const gridId = `grid-${++gridIdCounter}`;

  onMount(() => {
    if (props.onInit) {
      props.onInit();
    }
  });

  const announceItem = (action: GridAction, index: number) => {
    setSelectedIndex(index);
    props.speech.speak(`${index + 1}番、${action.label}`);
  };

  const executeItem = (action: GridAction, index: number) => {
    setSelectedIndex(index);
    action.action();
  };

  const handleItemClick = (action: GridAction, index: number) => {
    if (selectedIndex() === index) {
      executeItem(action, index);
      return;
    }

    announceItem(action, index);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isKeyboardMode()) {
      setIsKeyboardMode(true);
      setSelectedIndex(0);
      props.speech.speak('キーボードモードに切り替えました。矢印キーで移動、Enterで選択、Escapeで音声読み上げ停止');
      return;
    }

    const currentIndex = selectedIndex() ?? 0;

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        if (currentIndex % 3 < 2 && currentIndex + 1 < props.actions.length) {
          const newIndex = currentIndex + 1;
          setSelectedIndex(newIndex);
          announceItem(props.actions[newIndex], newIndex);
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (currentIndex % 3 > 0) {
          const newIndex = currentIndex - 1;
          setSelectedIndex(newIndex);
          announceItem(props.actions[newIndex], newIndex);
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (currentIndex < 6) {
          const newIndex = currentIndex + 3;
          if (newIndex < 9 && newIndex < props.actions.length) {
            setSelectedIndex(newIndex);
            announceItem(props.actions[newIndex], newIndex);
          }
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (currentIndex >= 3) {
          const newIndex = currentIndex - 3;
          setSelectedIndex(newIndex);
          announceItem(props.actions[newIndex], newIndex);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        {
          const sel = selectedIndex();
          if (sel !== null && props.actions[sel]) {
            executeItem(props.actions[sel], sel);
          }
        }
        break;
      case 'Escape':
        event.preventDefault();
        props.speech.stop();
        break;
      case '1': case '2': case '3':
      case '4': case '5': case '6':
      case '7': case '8': case '9': {
        event.preventDefault();
        const numIndex = parseInt(event.key) - 1;
        if (props.actions[numIndex]) {
          announceItem(props.actions[numIndex], numIndex);
          executeItem(props.actions[numIndex], numIndex);
        }
        break;
      }
    }
  };

  onMount(() => {
    const handleTouchStart = () => {
      setIsKeyboardMode(false);
      setSelectedIndex(null);
    };

    document.addEventListener('touchstart', handleTouchStart);
    onCleanup(() => document.removeEventListener('touchstart', handleTouchStart));
  });

  return (
    <div
      class="grid-container"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="grid"
      aria-label="操作パネル（タップで項目を確認、もう一度同じ場所をタップで実行。1〜9キーで直接選択、矢印キーで移動、Enterで実行、Escapeで停止）"
      aria-activedescendant={selectedIndex() !== null ? `${gridId}-cell-${selectedIndex()}` : undefined}
    >
      <For each={Array.from({ length: 9 }, (_, i) => i)}>
        {(index) => {
          const action = () => props.actions[index];
          const isEmpty = () => !action() || action()?.label === '';
          const isSelected = () => selectedIndex() === index;

          return (
            <div
              id={`${gridId}-cell-${index}`}
              class={`grid-item ${isSelected() ? 'active' : ''} ${isEmpty() ? 'opacity-50' : ''}`}
              onClick={() => {
                const a = action();
                if (a && !isEmpty()) {
                  handleItemClick(a, index);
                }
              }}
              role="gridcell"
              tabIndex={-1}
              aria-label={!isEmpty() ? `${index + 1}番、${action()!.label}` : `空のセル ${index + 1}`}
              aria-disabled={isEmpty()}
              aria-selected={isSelected()}
            >
              {!isEmpty() ? action()!.label : ''}
            </div>
          );
        }}
      </For>
    </div>
  );
}
