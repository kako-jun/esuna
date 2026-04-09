import { createSignal, onMount, onCleanup, Show, Switch, Match } from 'solid-js';
import GridSystem from './components/GridSystem';
import HatenaEntryReader from './components/HatenaEntryReader';
import HatenaCommentReader from './components/HatenaCommentReader';
import SNSPostReader from './components/SNSPostReader';
import FivechBoardList from './components/FivechBoardList';
import FivechThreadList from './components/FivechThreadList';
import FivechPostReader from './components/FivechPostReader';
import NovelList from './components/NovelList';
import NovelReader from './components/NovelReader';
import PodcastList from './components/PodcastList';
import PodcastPlayer from './components/PodcastPlayer';
import RSSFeedList from './components/RSSFeedList';
import RSSArticleReader from './components/RSSArticleReader';
import FavoritesList from './components/FavoritesList';
import ContinueReading from './components/ContinueReading';
import VoiceMemoRecorder from './components/VoiceMemoRecorder';
import TimerManager from './components/TimerManager';
import RadioStationList from './components/RadioStationList';
import RadioPlayer from './components/RadioPlayer';
import AutoplaySettings from './components/AutoplaySettings';
import AutoplayPlayer from './components/AutoplayPlayer';
import { SpeechManager } from './lib/speech';
import { useAppStore } from './lib/store';
import { loadSettings, updateSetting } from './lib/storage';
import { fetchWeather, getCurrentTimeText, getWeatherText, getGreeting } from './lib/weather';
import type { Favorite } from './lib/favorites';
import type { Progress } from './lib/progress';
import type { RadioStation } from './lib/radio';
import type { AutoplayItem } from './lib/autoplay';

type Page = 'main' | 'news' | 'sns' | 'settings' | 'help' | 'tools' | 'audio' |
            'hatena-comments' | '5ch-boards' | '5ch-threads' | '5ch-posts' |
            'novel-list' | 'novel-content' | 'podcast-list' | 'podcast-episodes' |
            'rss-feeds' | 'rss-articles' | 'favorites' | 'continue-reading' |
            'voice-memo' | 'timer' | 'radio-stations' | 'radio-player' |
            'autoplay-settings' | 'autoplay-player';

export default function App() {
  const [speechManager, setSpeechManager] = createSignal<SpeechManager | null>(null);
  const [currentPage, setCurrentPage] = createSignal<Page>('main');
  const [selectedRadioStation, setSelectedRadioStation] = createSignal<RadioStation | null>(null);
  const store = useAppStore();

  onMount(() => {
    const manager = new SpeechManager();

    const settings = loadSettings();
    if (settings.speech.voice) {
      manager.setVoiceByName(settings.speech.voice);
    }

    store.setAutoNavigation(settings.ui.autoNavigation);
    setSpeechManager(manager);

    setTimeout(async () => {
      let message = getGreeting() + '。Esuna へようこそ。';

      if (settings.ui.speakTimeOnStart) {
        message += getCurrentTimeText() + '。';
      }

      if (settings.ui.speakWeatherOnStart && settings.weather.enabled) {
        try {
          const weather = await fetchWeather(settings.weather.city);
          message += getWeatherText(weather) + '。';
        } catch (error) {
          console.error('Weather fetch error:', error);
        }
      }

      message += 'キーボードの任意のキーを押してキーボードモードに切り替えるか、画面をタップして操作してください。';
      manager.speak(message, {
        rate: settings.speech.rate,
        pitch: settings.speech.pitch,
        volume: settings.speech.volume,
      });
    }, 1000);

    onCleanup(() => {
      manager.stop();
    });
  });

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
    store.setPage(page as any);
  };

  const mainMenuActions = () => [
    { label: 'はてブ', action: () => { navigateTo('news'); store.setContentType('hatena-hot'); speechManager()?.speak('はてなブックマーク 人気エントリーに移動しました'); } },
    { label: 'SNS', action: () => { navigateTo('sns'); store.setContentType('sns'); speechManager()?.speak('SNS投稿に移動しました'); } },
    { label: '5ch', action: () => { navigateTo('5ch-boards'); speechManager()?.speak('5ちゃんねる 板一覧に移動しました'); } },
    { label: 'ニュース', action: () => { navigateTo('rss-feeds'); speechManager()?.speak('RSSニュース フィード一覧に移動しました'); } },
    { label: '小説', action: () => { navigateTo('novel-list'); store.setContentType('novel'); speechManager()?.speak('青空文庫 小説一覧に移動しました'); } },
    { label: 'オーディオ', action: () => { navigateTo('audio'); speechManager()?.speak('オーディオメニューに移動しました。Podcastとラジオが利用できます'); } },
    { label: 'ツール', action: () => { navigateTo('tools'); speechManager()?.speak('ツールメニューに移動しました。お気に入り、続きから再生、音声メモ、タイマーが利用できます'); } },
    { label: '設定', action: () => { navigateTo('settings'); speechManager()?.speak('設定ページに移動しました'); } },
    { label: '停止', action: () => { speechManager()?.stop(); } },
  ];

  const toolsMenuActions = () => [
    { label: '戻る', action: () => { navigateTo('main'); speechManager()?.speak('メインメニューに戻りました'); } },
    { label: 'お気に入り', action: () => { navigateTo('favorites'); speechManager()?.speak('お気に入り一覧に移動しました'); } },
    { label: '続きから', action: () => { navigateTo('continue-reading'); speechManager()?.speak('続きから再生に移動しました'); } },
    { label: 'メモ', action: () => { navigateTo('voice-memo'); speechManager()?.speak('音声メモに移動しました'); } },
    { label: 'タイマー', action: () => { navigateTo('timer'); speechManager()?.speak('タイマーに移動しました'); } },
    { label: 'おまかせ', action: () => { navigateTo('autoplay-settings'); speechManager()?.speak('おまかせモード設定に移動しました'); } },
    { label: 'ヘルプ', action: () => { navigateTo('help'); speechManager()?.speak('ヘルプページに移動しました'); } },
    {
      label: '情報',
      action: () => {
        speechManager()?.speak(
          'Esuna バージョン 0.6.0。視覚障害者向けアクセシブルWebアプリケーション。' +
          'はてなブックマーク、SNS、5ちゃんねる、RSSニュース、青空文庫、Podcast、ラジオ、' +
          'お気に入り、続きから再生、音声メモ、タイマー、おまかせモードが利用できます。'
        );
      },
    },
    { label: '読み上げ', action: () => { speechManager()?.speak('ツールメニュー。お気に入り、続きから再生、音声メモ、タイマー、おまかせ、ヘルプ、情報、読み上げ、停止が利用できます'); } },
    { label: '停止', action: () => { speechManager()?.stop(); } },
  ];

  const audioMenuActions = () => [
    { label: '戻る', action: () => { navigateTo('main'); speechManager()?.speak('メインメニューに戻りました'); } },
    { label: 'Podcast', action: () => { navigateTo('podcast-list'); store.setContentType('podcast'); speechManager()?.speak('Podcast一覧に移動しました'); } },
    { label: 'ラジオ', action: () => { navigateTo('radio-stations'); speechManager()?.speak('ラジオ局一覧に移動しました'); } },
    { label: '読み上げ', action: () => { speechManager()?.speak('オーディオメニュー。Podcast、ラジオ、読み上げ、停止が利用できます'); } },
    { label: '停止', action: () => { speechManager()?.stop(); } },
    { label: '', action: () => {} },
    { label: '', action: () => {} },
    { label: '', action: () => {} },
    { label: '', action: () => {} },
  ];

  const settingsActions = () => [
    { label: '戻る', action: () => { navigateTo('main'); speechManager()?.speak('メインメニューに戻りました'); } },
    { label: '速度：遅', action: () => { updateSetting('speech', { rate: 0.7 }); speechManager()?.speak('読み上げ速度を遅くしました。設定を保存しました', { rate: 0.7 }); } },
    { label: '速度：標準', action: () => { updateSetting('speech', { rate: 1.0 }); speechManager()?.speak('読み上げ速度を標準にしました。設定を保存しました', { rate: 1.0 }); } },
    { label: '速度：速', action: () => { updateSetting('speech', { rate: 1.5 }); speechManager()?.speak('読み上げ速度を速くしました。設定を保存しました', { rate: 1.5 }); } },
    { label: 'ピッチ：低', action: () => { updateSetting('speech', { pitch: 0.7 }); speechManager()?.speak('ピッチを低くしました。設定を保存しました', { pitch: 0.7 }); } },
    { label: 'ピッチ：標準', action: () => { updateSetting('speech', { pitch: 1.0 }); speechManager()?.speak('ピッチを標準にしました。設定を保存しました', { pitch: 1.0 }); } },
    { label: 'ピッチ：高', action: () => { updateSetting('speech', { pitch: 1.5 }); speechManager()?.speak('ピッチを高くしました。設定を保存しました', { pitch: 1.5 }); } },
    { label: '音量：小', action: () => { updateSetting('speech', { volume: 0.5 }); speechManager()?.speak('音量を小さくしました。設定を保存しました', { volume: 0.5 }); } },
    {
      label: store.state.autoNavigationEnabled ? '自動OFF' : '自動ON',
      action: () => {
        const newValue = !store.state.autoNavigationEnabled;
        store.setAutoNavigation(newValue);
        updateSetting('ui', { autoNavigation: newValue });
        speechManager()?.speak(newValue ? '自動ナビゲーションを有効にしました。音声読み上げ後、自動的に次のコンテンツに移動します' : '自動ナビゲーションを無効にしました');
      },
    },
  ];

  const helpActions = () => [
    { label: '戻る', action: () => { navigateTo('main'); speechManager()?.speak('メインメニューに戻りました'); } },
    { label: '操作方法', action: () => { speechManager()?.speak('操作方法を説明します。画面は9つのエリアに分かれています。数字の1から9のキーで直接選択するか、矢印キーで移動してEnterキーで決定できます。Escapeキーで読み上げを停止できます。'); } },
    { label: '機能説明', action: () => { speechManager()?.speak('利用可能な機能を説明します。はてブ：はてなブックマークの人気エントリーとコメントを閲覧できます。SNS：Twitter、Mastodon、Blueskyの投稿を閲覧できます。5ch：5ちゃんねるの板、スレッド、投稿を閲覧できます。'); } },
    { label: 'キーボード', action: () => { speechManager()?.speak('キーボード操作を説明します。1から9キー：各エリアを直接選択。矢印キー：エリア間を移動。Enterキー：選択したエリアを実行。Escapeキー：読み上げ停止または前のページに戻る。'); } },
    { label: 'タッチ', action: () => { speechManager()?.speak('タッチ操作を説明します。画面をタップ：そのエリアを選択して実行。ダブルタップ：再度実行。'); } },
    { label: '音声', action: () => { speechManager()?.speak('音声機能を説明します。すべての操作は音声でガイダンスされます。設定から読み上げ速度とピッチを調整できます。停止ボタンでいつでも読み上げを停止できます。'); } },
    { label: '自動ナビゲーション', action: () => { speechManager()?.speak('自動ナビゲーション機能を説明します。設定で有効にすると、音声読み上げ完了後、自動的に次のコンテンツに移動します。ハンズフリーで連続閲覧ができます。'); } },
    { label: 'バージョン', action: () => { speechManager()?.speak('Esuna バージョン 0.6.0'); } },
    { label: '停止', action: () => { speechManager()?.stop(); } },
  ];

  return (
    <Show when={speechManager()} fallback={
      <div class="grid-container" role="status" aria-live="polite">
        <div class="grid-item" style={{ "grid-column": '1 / -1', "grid-row": '1 / -1' }}>読み込み中...</div>
      </div>
    }>
      <Switch fallback={<main><GridSystem actions={mainMenuActions()} speech={speechManager()!} /></main>}>
        <Match when={currentPage() === 'news'}>
          <main><HatenaEntryReader type="hot" speech={speechManager()!} onBack={() => { navigateTo('main'); speechManager()!.speak('メインメニューに戻りました'); }} onViewComments={() => { navigateTo('hatena-comments'); }} /></main>
        </Match>
        <Match when={currentPage() === 'sns'}>
          <main><SNSPostReader speech={speechManager()!} onBack={() => { navigateTo('main'); speechManager()!.speak('メインメニューに戻りました'); }} /></main>
        </Match>
        <Match when={currentPage() === 'hatena-comments'}>
          <main><HatenaCommentReader speech={speechManager()!} onBack={() => { navigateTo('news'); speechManager()!.speak('はてなブックマークに戻りました'); }} /></main>
        </Match>
        <Match when={currentPage() === '5ch-boards'}>
          <main><FivechBoardList speech={speechManager()!} onBack={() => { navigateTo('main'); speechManager()!.speak('メインメニューに戻りました'); }} onSelectBoard={() => { navigateTo('5ch-threads'); }} /></main>
        </Match>
        <Match when={currentPage() === '5ch-threads'}>
          <main><FivechThreadList speech={speechManager()!} onBack={() => { navigateTo('5ch-boards'); speechManager()!.speak('板一覧に戻りました'); }} onSelectThread={() => { navigateTo('5ch-posts'); }} /></main>
        </Match>
        <Match when={currentPage() === '5ch-posts'}>
          <main><FivechPostReader speech={speechManager()!} onBack={() => { navigateTo('5ch-threads'); speechManager()!.speak('スレッド一覧に戻りました'); }} /></main>
        </Match>
        <Match when={currentPage() === 'novel-list'}>
          <main><NovelList speech={speechManager()!} onBack={() => { navigateTo('main'); speechManager()!.speak('メインメニューに戻りました'); }} onSelectNovel={() => { navigateTo('novel-content'); }} /></main>
        </Match>
        <Match when={currentPage() === 'novel-content'}>
          <main><NovelReader speech={speechManager()!} onBack={() => { navigateTo('novel-list'); speechManager()!.speak('小説一覧に戻りました'); }} /></main>
        </Match>
        <Match when={currentPage() === 'podcast-list'}>
          <main><PodcastList speech={speechManager()!} onBack={() => { navigateTo('audio'); speechManager()!.speak('オーディオメニューに戻りました'); }} onSelectPodcast={() => { navigateTo('podcast-episodes'); }} /></main>
        </Match>
        <Match when={currentPage() === 'podcast-episodes'}>
          <main><PodcastPlayer speech={speechManager()!} onBack={() => { navigateTo('podcast-list'); speechManager()!.speak('Podcast一覧に戻りました'); }} /></main>
        </Match>
        <Match when={currentPage() === 'rss-feeds'}>
          <main><RSSFeedList speech={speechManager()!} onBack={() => { navigateTo('main'); speechManager()!.speak('メインメニューに戻りました'); }} onSelectFeed={() => { navigateTo('rss-articles'); }} /></main>
        </Match>
        <Match when={currentPage() === 'rss-articles'}>
          <main><RSSArticleReader speech={speechManager()!} onBack={() => { navigateTo('rss-feeds'); speechManager()!.speak('フィード一覧に戻りました'); }} /></main>
        </Match>
        <Match when={currentPage() === 'favorites'}>
          <main><FavoritesList speech={speechManager()!} onBack={() => { navigateTo('main'); speechManager()!.speak('メインメニューに戻りました'); }} onSelectFavorite={(favorite: Favorite) => {
            switch (favorite.type) {
              case 'podcast':
                if (favorite.data?.feedUrl) { store.setSelectedPodcast(favorite.data); navigateTo('podcast-episodes'); speechManager()!.speak(`Podcast「${favorite.title}」を開きます`); }
                else { navigateTo('podcast-list'); speechManager()!.speak('Podcast一覧に移動しました'); }
                break;
              case 'novel':
                if (favorite.data?.authorId && favorite.data?.fileId) { store.setSelectedNovel(favorite.data); navigateTo('novel-content'); speechManager()!.speak(`小説「${favorite.title}」を開きます`); }
                else { navigateTo('novel-list'); speechManager()!.speak('小説一覧に移動しました'); }
                break;
              case 'rss-feed':
                navigateTo('rss-articles'); speechManager()!.speak(`RSSフィード「${favorite.title}」を開きます`);
                break;
              case '5ch-board':
                if (favorite.data?.url) {
                  const boards = store.state.fivechBoards;
                  const boardIndex = boards.findIndex((b: any) => b.url === favorite.data.url);
                  if (boardIndex >= 0) { store.setCurrentBoardIndex(boardIndex); }
                  navigateTo('5ch-threads'); speechManager()!.speak(`5ちゃんねる板「${favorite.title}」を開きます`);
                } else { navigateTo('5ch-boards'); speechManager()!.speak('5ちゃんねる板一覧に移動しました'); }
                break;
              case '5ch-thread':
                if (favorite.data?.url) { navigateTo('5ch-posts'); speechManager()!.speak(`スレッド「${favorite.title}」を開きます`); }
                else { navigateTo('5ch-boards'); speechManager()!.speak('5ちゃんねる板一覧に移動しました'); }
                break;
              default:
                speechManager()!.speak(`${favorite.title} を開けませんでした。対応していないコンテンツタイプです`);
            }
          }} /></main>
        </Match>
        <Match when={currentPage() === 'continue-reading'}>
          <main><ContinueReading speech={speechManager()!} onBack={() => { navigateTo('main'); speechManager()!.speak('メインメニューに戻りました'); }} onSelectProgress={(progress: Progress) => {
            switch (progress.type) {
              case 'novel':
                if (progress.data?.authorId && progress.data?.fileId) {
                  store.setSelectedNovel(progress.data);
                  setTimeout(() => { store.setCurrentSectionIndex(progress.currentIndex); }, 100);
                  navigateTo('novel-content');
                  speechManager()!.speak(`小説「${progress.title}」の続きから再生します。${progress.currentIndex + 1}番目のセクションからです`);
                } else { navigateTo('novel-list'); speechManager()!.speak('小説一覧に移動しました'); }
                break;
              case 'podcast':
                if (progress.data?.feedUrl) {
                  store.setSelectedPodcast(progress.data);
                  setTimeout(() => { store.setCurrentEpisodeIndex(progress.currentIndex); }, 100);
                  navigateTo('podcast-episodes');
                  speechManager()!.speak(`Podcast「${progress.title}」の続きから再生します。${progress.currentIndex + 1}番目のエピソードからです`);
                } else { navigateTo('podcast-list'); speechManager()!.speak('Podcast一覧に移動しました'); }
                break;
              case 'rss-article':
                navigateTo('rss-articles'); speechManager()!.speak(`RSSニュース「${progress.title}」の続きから再生します`);
                break;
              case '5ch-thread':
                if (progress.data?.url) {
                  setTimeout(() => { store.setCurrentPostIndex(progress.currentIndex); }, 100);
                  navigateTo('5ch-posts');
                  speechManager()!.speak(`スレッド「${progress.title}」の続きから再生します。${progress.currentIndex + 1}番目のレスからです`);
                } else { navigateTo('5ch-boards'); speechManager()!.speak('5ちゃんねる板一覧に移動しました'); }
                break;
              default:
                speechManager()!.speak(`${progress.title} の続きから再生できませんでした。対応していないコンテンツタイプです`);
            }
          }} /></main>
        </Match>
        <Match when={currentPage() === 'voice-memo'}>
          <main><VoiceMemoRecorder speech={speechManager()!} onBack={() => { navigateTo('main'); speechManager()!.speak('メインメニューに戻りました'); }} /></main>
        </Match>
        <Match when={currentPage() === 'timer'}>
          <main><TimerManager speech={speechManager()!} onBack={() => { navigateTo('main'); speechManager()!.speak('メインメニューに戻りました'); }} /></main>
        </Match>
        <Match when={currentPage() === 'tools'}>
          <main><GridSystem actions={toolsMenuActions()} speech={speechManager()!} /></main>
        </Match>
        <Match when={currentPage() === 'audio'}>
          <main><GridSystem actions={audioMenuActions()} speech={speechManager()!} /></main>
        </Match>
        <Match when={currentPage() === 'radio-stations'}>
          <main><RadioStationList speech={speechManager()!} onBack={() => { navigateTo('audio'); speechManager()!.speak('オーディオメニューに戻りました'); }} onSelectStation={(station: RadioStation) => { setSelectedRadioStation(station); navigateTo('radio-player'); }} /></main>
        </Match>
        <Match when={currentPage() === 'radio-player'}>
          <Show when={selectedRadioStation()} fallback={null}>
            <main><RadioPlayer station={selectedRadioStation()!} speech={speechManager()!} onBack={() => { navigateTo('radio-stations'); speechManager()!.speak('ラジオ局一覧に戻りました'); }} /></main>
          </Show>
        </Match>
        <Match when={currentPage() === 'autoplay-settings'}>
          <main><AutoplaySettings speech={speechManager()!} onBack={() => { navigateTo('tools'); speechManager()!.speak('ツールメニューに戻りました'); }} onStartAutoplay={() => { navigateTo('autoplay-player'); }} /></main>
        </Match>
        <Match when={currentPage() === 'autoplay-player'}>
          <main><AutoplayPlayer speech={speechManager()!} onBack={() => { navigateTo('autoplay-settings'); speechManager()!.speak('おまかせ設定に戻りました'); }} onNavigateToContent={(item: AutoplayItem) => {
            switch (item.type) {
              case 'novel': navigateTo('novel-list'); break;
              case 'podcast': navigateTo('podcast-list'); break;
              case 'radio': setSelectedRadioStation(item.data); navigateTo('radio-player'); break;
              case 'rss-news': navigateTo('rss-feeds'); break;
              case 'hatena': navigateTo('news'); store.setContentType('hatena-hot'); break;
            }
          }} /></main>
        </Match>
        <Match when={currentPage() === 'settings'}>
          <main><GridSystem actions={settingsActions()} speech={speechManager()!} /></main>
        </Match>
        <Match when={currentPage() === 'help'}>
          <main><GridSystem actions={helpActions()} speech={speechManager()!} /></main>
        </Match>
      </Switch>
    </Show>
  );
}
