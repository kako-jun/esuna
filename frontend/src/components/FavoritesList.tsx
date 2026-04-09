import { createSignal, onMount } from 'solid-js';
import { SpeechManager } from '../lib/speech';
import { getFavorites, removeFavorite, Favorite, FavoriteType } from '../lib/favorites';
import GridSystem from './GridSystem';

interface FavoritesListProps {
  speech: SpeechManager;
  onBack: () => void;
  onSelectFavorite: (favorite: Favorite) => void;
}

export default function FavoritesList(props: FavoritesListProps) {
  const [favorites, setFavorites] = createSignal<Favorite[]>([]);
  const [currentIndex, setCurrentIndex] = createSignal(0);

  onMount(() => {
    const allFavorites = getFavorites();
    setFavorites(allFavorites);
    setTimeout(() => {
      if (allFavorites.length === 0) { props.speech.speak('お気に入りはまだ登録されていません。コンテンツを閲覧中にお気に入りに追加できます'); }
      else { props.speech.speak(`お気に入り、${allFavorites.length}件が登録されています`); setTimeout(() => speakFavorite(), 2000); }
    }, 500);
  });

  const getTypeText = (type: FavoriteType): string => {
    switch (type) { case 'podcast': return 'Podcast'; case 'novel': return '小説'; case 'rss-feed': return 'RSSフィード'; case '5ch-board': return '5ちゃんねる 板'; case '5ch-thread': return '5ちゃんねる スレッド'; default: return 'コンテンツ'; }
  };

  const speakFavorite = () => {
    const fav = favorites()[currentIndex()];
    if (!fav) return;
    props.speech.speak(`${getTypeText(fav.type)}、${fav.title}。${fav.description || ''}`, { interrupt: true });
  };

  const actions = () => [
    { label: '戻る', action: () => { props.speech.stop(); props.onBack(); } },
    { label: '前', action: () => { if (currentIndex() > 0) { setCurrentIndex(currentIndex() - 1); setTimeout(speakFavorite, 100); } else { props.speech.speak('最初のお気に入りです'); } } },
    { label: '次', action: () => { if (currentIndex() < favorites().length - 1) { setCurrentIndex(currentIndex() + 1); setTimeout(speakFavorite, 100); } else { props.speech.speak('最後のお気に入りです'); } } },
    { label: '読み上げ', action: speakFavorite },
    { label: '開く', action: () => { const fav = favorites()[currentIndex()]; if (!fav) { props.speech.speak('お気に入りがありません'); return; } props.speech.speak(`${fav.title} を開きます`); props.onSelectFavorite(fav); } },
    {
      label: '削除',
      action: () => {
        const fav = favorites()[currentIndex()];
        if (!fav) { props.speech.speak('お気に入りがありません'); return; }
        removeFavorite(fav.id);
        props.speech.speak(`${fav.title} をお気に入りから削除しました`);
        const updated = getFavorites();
        setFavorites(updated);
        if (currentIndex() >= updated.length && updated.length > 0) { setCurrentIndex(updated.length - 1); }
        else if (updated.length === 0) { setCurrentIndex(0); setTimeout(() => { props.speech.speak('お気に入りがすべて削除されました'); }, 1500); }
      },
    },
    { label: '件数', action: () => { if (favorites().length === 0) { props.speech.speak('お気に入りはまだ登録されていません'); } else { props.speech.speak(`全${favorites().length}件中、${currentIndex() + 1}番目のお気に入りです`); } } },
    { label: '停止', action: () => { props.speech.stop(); } },
    { label: '先頭', action: () => { if (favorites().length > 0) { setCurrentIndex(0); setTimeout(speakFavorite, 100); } else { props.speech.speak('お気に入りがありません'); } } },
  ];

  return <GridSystem actions={actions()} speech={props.speech} />;
}
