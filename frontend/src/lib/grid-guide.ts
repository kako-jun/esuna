import type { GridAction } from '../components/GridSystem';
import { SpeechManager } from './speech';

function normalizeLabel(label: string): string {
  return label.replace(/\n/g, '、').trim();
}

export function buildGridGuide(pageName: string, actions: GridAction[]): string {
  const parts: string[] = [`${pageName}です。`];

  for (let index = 0; index < Math.min(actions.length, 8); index += 1) {
    const action = actions[index];
    if (!action || !action.label.trim()) {
      continue;
    }

    if (index === 4) {
      parts.push(`中央は ${normalizeLabel(action.label)}。`);
    } else {
      parts.push(`${index + 1} は ${normalizeLabel(action.label)}。`);
    }
  }

  parts.push('右下は画面案内です。');
  return parts.join('');
}

export function createGuideAction(
  pageName: string,
  speech: SpeechManager,
  getActions: () => GridAction[],
): GridAction {
  return {
    label: '画面\n案内',
    action: () => {
      speech.speak(buildGridGuide(pageName, getActions()));
    },
  };
}
