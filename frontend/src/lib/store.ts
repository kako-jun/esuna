/**
 * SolidJS ストア
 * アプリケーションの状態管理（Zustand → SolidJS createStore）
 */
import { createRoot } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { HatenaEntry, HatenaComment, FivechBoard, FivechThread, FivechPost, SNSPost, NovelContent, NovelSection, PodcastEpisode } from './api-client';
import type { Novel } from './novels';
import type { Podcast } from './podcasts';

// コンテンツタイプ
export type ContentType = 'hatena-hot' | 'hatena-latest' | '5ch' | 'sns' | 'news' | 'novel' | 'podcast';

// ページタイプ
export type PageType = 'home' | 'content-list' | 'content-detail' | 'comment-list' | 'comment-detail' | '5ch-boards' | '5ch-threads' | '5ch-posts' | 'novel-list' | 'novel-content' | 'podcast-list' | 'podcast-episodes';

interface AppState {
  // 現在のページ
  currentPage: PageType;
  parentPage: PageType | null;

  // コンテンツタイプ
  contentType: ContentType | null;

  // はてなブックマーク
  hatenaEntries: HatenaEntry[];
  currentEntryIndex: number;
  hatenaComments: HatenaComment[];
  currentCommentIndex: number;

  // 5ch
  fivechBoards: FivechBoard[];
  currentBoardIndex: number;
  fivechThreads: FivechThread[];
  currentThreadIndex: number;
  fivechPosts: FivechPost[];
  currentPostIndex: number;

  // SNS
  snsPosts: SNSPost[];
  currentSNSPostIndex: number;

  // 小説
  selectedNovel: Novel | null;
  novelContent: NovelContent | null;
  currentSectionIndex: number;

  // Podcast
  selectedPodcast: Podcast | null;
  podcastEpisodes: PodcastEpisode[];
  currentEpisodeIndex: number;

  // 自動ナビゲーション
  autoNavigationEnabled: boolean;
}

const initialState: AppState = {
  currentPage: 'home',
  parentPage: null,
  contentType: null,

  hatenaEntries: [],
  currentEntryIndex: 0,
  hatenaComments: [],
  currentCommentIndex: 0,

  fivechBoards: [],
  currentBoardIndex: 0,
  fivechThreads: [],
  currentThreadIndex: 0,
  fivechPosts: [],
  currentPostIndex: 0,

  snsPosts: [],
  currentSNSPostIndex: 0,

  selectedNovel: null,
  novelContent: null,
  currentSectionIndex: 0,

  selectedPodcast: null,
  podcastEpisodes: [],
  currentEpisodeIndex: 0,

  autoNavigationEnabled: false,
};

// createRoot で reactive context を作る（コンポーネント外からもアクセス可能にする）
function createAppStore() {
  const [state, setState] = createStore<AppState>({ ...initialState });

  const actions = {
    // ページ管理
    setPage(page: PageType, parentPage?: PageType) {
      setState('currentPage', page);
      if (parentPage !== undefined) setState('parentPage', parentPage);
    },
    setContentType(type: ContentType) {
      setState('contentType', type);
    },

    // はてなブックマーク
    setHatenaEntries(entries: HatenaEntry[]) {
      setState({ hatenaEntries: entries, currentEntryIndex: 0 });
    },
    setCurrentEntryIndex(index: number) {
      setState('currentEntryIndex', index);
    },
    nextEntry() {
      if (state.currentEntryIndex < state.hatenaEntries.length - 1) {
        setState('currentEntryIndex', state.currentEntryIndex + 1);
      }
    },
    prevEntry() {
      if (state.currentEntryIndex > 0) {
        setState('currentEntryIndex', state.currentEntryIndex - 1);
      }
    },
    getCurrentEntry(): HatenaEntry | null {
      return state.hatenaEntries[state.currentEntryIndex] || null;
    },

    setHatenaComments(comments: HatenaComment[]) {
      setState({ hatenaComments: comments, currentCommentIndex: 0 });
    },
    setCurrentCommentIndex(index: number) {
      setState('currentCommentIndex', index);
    },
    nextComment() {
      if (state.currentCommentIndex < state.hatenaComments.length - 1) {
        setState('currentCommentIndex', state.currentCommentIndex + 1);
      }
    },
    prevComment() {
      if (state.currentCommentIndex > 0) {
        setState('currentCommentIndex', state.currentCommentIndex - 1);
      }
    },
    getCurrentComment(): HatenaComment | null {
      return state.hatenaComments[state.currentCommentIndex] || null;
    },

    // 5ch
    set5chBoards(boards: FivechBoard[]) {
      setState({ fivechBoards: boards, currentBoardIndex: 0 });
    },
    setCurrentBoardIndex(index: number) {
      setState('currentBoardIndex', index);
    },
    nextBoard() {
      if (state.currentBoardIndex < state.fivechBoards.length - 1) {
        setState('currentBoardIndex', state.currentBoardIndex + 1);
      }
    },
    prevBoard() {
      if (state.currentBoardIndex > 0) {
        setState('currentBoardIndex', state.currentBoardIndex - 1);
      }
    },
    getCurrentBoard(): FivechBoard | null {
      return state.fivechBoards[state.currentBoardIndex] || null;
    },

    set5chThreads(threads: FivechThread[]) {
      setState({ fivechThreads: threads, currentThreadIndex: 0 });
    },
    setCurrentThreadIndex(index: number) {
      setState('currentThreadIndex', index);
    },
    nextThread() {
      if (state.currentThreadIndex < state.fivechThreads.length - 1) {
        setState('currentThreadIndex', state.currentThreadIndex + 1);
      }
    },
    prevThread() {
      if (state.currentThreadIndex > 0) {
        setState('currentThreadIndex', state.currentThreadIndex - 1);
      }
    },
    getCurrentThread(): FivechThread | null {
      return state.fivechThreads[state.currentThreadIndex] || null;
    },

    set5chPosts(posts: FivechPost[]) {
      setState({ fivechPosts: posts, currentPostIndex: 0 });
    },
    setCurrentPostIndex(index: number) {
      setState('currentPostIndex', index);
    },
    nextPost() {
      if (state.currentPostIndex < state.fivechPosts.length - 1) {
        setState('currentPostIndex', state.currentPostIndex + 1);
      }
    },
    prevPost() {
      if (state.currentPostIndex > 0) {
        setState('currentPostIndex', state.currentPostIndex - 1);
      }
    },
    getCurrentPost(): FivechPost | null {
      return state.fivechPosts[state.currentPostIndex] || null;
    },

    // SNS
    setSNSPosts(posts: SNSPost[]) {
      setState({ snsPosts: posts, currentSNSPostIndex: 0 });
    },
    setCurrentSNSPostIndex(index: number) {
      setState('currentSNSPostIndex', index);
    },
    nextSNSPost() {
      if (state.currentSNSPostIndex < state.snsPosts.length - 1) {
        setState('currentSNSPostIndex', state.currentSNSPostIndex + 1);
      }
    },
    prevSNSPost() {
      if (state.currentSNSPostIndex > 0) {
        setState('currentSNSPostIndex', state.currentSNSPostIndex - 1);
      }
    },
    getCurrentSNSPost(): SNSPost | null {
      return state.snsPosts[state.currentSNSPostIndex] || null;
    },

    // 小説
    setSelectedNovel(novel: Novel | null) {
      setState('selectedNovel', novel);
    },
    setNovelContent(content: NovelContent | null) {
      setState({ novelContent: content, currentSectionIndex: 0 });
    },
    setCurrentSectionIndex(index: number) {
      setState('currentSectionIndex', index);
    },
    nextSection() {
      if (state.novelContent && state.currentSectionIndex < state.novelContent.sections.length - 1) {
        setState('currentSectionIndex', state.currentSectionIndex + 1);
      }
    },
    prevSection() {
      if (state.currentSectionIndex > 0) {
        setState('currentSectionIndex', state.currentSectionIndex - 1);
      }
    },
    getCurrentSection(): NovelSection | null {
      return state.novelContent?.sections[state.currentSectionIndex] || null;
    },

    // Podcast
    setSelectedPodcast(podcast: Podcast | null) {
      setState('selectedPodcast', podcast);
    },
    setPodcastEpisodes(episodes: PodcastEpisode[]) {
      setState({ podcastEpisodes: episodes, currentEpisodeIndex: 0 });
    },
    setCurrentEpisodeIndex(index: number) {
      setState('currentEpisodeIndex', index);
    },
    nextEpisode() {
      if (state.currentEpisodeIndex < state.podcastEpisodes.length - 1) {
        setState('currentEpisodeIndex', state.currentEpisodeIndex + 1);
      }
    },
    prevEpisode() {
      if (state.currentEpisodeIndex > 0) {
        setState('currentEpisodeIndex', state.currentEpisodeIndex - 1);
      }
    },
    getCurrentEpisode(): PodcastEpisode | null {
      return state.podcastEpisodes[state.currentEpisodeIndex] || null;
    },

    // 自動ナビゲーション
    setAutoNavigation(enabled: boolean) {
      setState('autoNavigationEnabled', enabled);
    },

    // リセット
    reset() {
      setState({ ...initialState });
    },
  };

  return { state, ...actions };
}

// Singleton store wrapped in createRoot to provide reactive context
let _store: ReturnType<typeof createAppStore> | null = null;

function getStore() {
  if (!_store) {
    createRoot(() => {
      _store = createAppStore();
    });
  }
  return _store!;
}

export function useAppStore() {
  return getStore();
}
