/**
 * Zustand ストア
 * アプリケーションの状態管理
 */
import { create } from 'zustand';
import type { HatenaEntry, HatenaComment, FivechBoard, FivechThread, FivechPost, SNSPost } from './api-client';

// コンテンツタイプ
export type ContentType = 'hatena-hot' | 'hatena-latest' | '5ch' | 'sns' | 'news';

// ページタイプ
export type PageType = 'home' | 'content-list' | 'content-detail' | 'comment-list' | 'comment-detail' | '5ch-boards' | '5ch-threads' | '5ch-posts';

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

  // 自動ナビゲーション
  autoNavigationEnabled: boolean;

  // アクション
  setPage: (page: PageType, parentPage?: PageType) => void;
  setContentType: (type: ContentType) => void;

  // はてなブックマーク
  setHatenaEntries: (entries: HatenaEntry[]) => void;
  setCurrentEntryIndex: (index: number) => void;
  nextEntry: () => void;
  prevEntry: () => void;
  getCurrentEntry: () => HatenaEntry | null;

  setHatenaComments: (comments: HatenaComment[]) => void;
  setCurrentCommentIndex: (index: number) => void;
  nextComment: () => void;
  prevComment: () => void;
  getCurrentComment: () => HatenaComment | null;

  // 5ch
  set5chBoards: (boards: FivechBoard[]) => void;
  setCurrentBoardIndex: (index: number) => void;
  nextBoard: () => void;
  prevBoard: () => void;
  getCurrentBoard: () => FivechBoard | null;

  set5chThreads: (threads: FivechThread[]) => void;
  setCurrentThreadIndex: (index: number) => void;
  nextThread: () => void;
  prevThread: () => void;
  getCurrentThread: () => FivechThread | null;

  set5chPosts: (posts: FivechPost[]) => void;
  setCurrentPostIndex: (index: number) => void;
  nextPost: () => void;
  prevPost: () => void;
  getCurrentPost: () => FivechPost | null;

  // SNS
  setSNSPosts: (posts: SNSPost[]) => void;
  setCurrentSNSPostIndex: (index: number) => void;
  nextSNSPost: () => void;
  prevSNSPost: () => void;
  getCurrentSNSPost: () => SNSPost | null;

  // 自動ナビゲーション
  setAutoNavigation: (enabled: boolean) => void;

  // リセット
  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // 初期状態
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

  autoNavigationEnabled: false,

  // ページ管理
  setPage: (page, parentPage) => set({ currentPage: page, parentPage: parentPage || get().parentPage }),
  setContentType: (type) => set({ contentType: type }),

  // はてなブックマーク
  setHatenaEntries: (entries) => set({ hatenaEntries: entries, currentEntryIndex: 0 }),
  setCurrentEntryIndex: (index) => set({ currentEntryIndex: index }),
  nextEntry: () => {
    const { hatenaEntries, currentEntryIndex } = get();
    if (currentEntryIndex < hatenaEntries.length - 1) {
      set({ currentEntryIndex: currentEntryIndex + 1 });
    }
  },
  prevEntry: () => {
    const { currentEntryIndex } = get();
    if (currentEntryIndex > 0) {
      set({ currentEntryIndex: currentEntryIndex - 1 });
    }
  },
  getCurrentEntry: () => {
    const { hatenaEntries, currentEntryIndex } = get();
    return hatenaEntries[currentEntryIndex] || null;
  },

  setHatenaComments: (comments) => set({ hatenaComments: comments, currentCommentIndex: 0 }),
  setCurrentCommentIndex: (index) => set({ currentCommentIndex: index }),
  nextComment: () => {
    const { hatenaComments, currentCommentIndex } = get();
    if (currentCommentIndex < hatenaComments.length - 1) {
      set({ currentCommentIndex: currentCommentIndex + 1 });
    }
  },
  prevComment: () => {
    const { currentCommentIndex } = get();
    if (currentCommentIndex > 0) {
      set({ currentCommentIndex: currentCommentIndex - 1 });
    }
  },
  getCurrentComment: () => {
    const { hatenaComments, currentCommentIndex } = get();
    return hatenaComments[currentCommentIndex] || null;
  },

  // 5ch
  set5chBoards: (boards) => set({ fivechBoards: boards, currentBoardIndex: 0 }),
  setCurrentBoardIndex: (index) => set({ currentBoardIndex: index }),
  nextBoard: () => {
    const { fivechBoards, currentBoardIndex } = get();
    if (currentBoardIndex < fivechBoards.length - 1) {
      set({ currentBoardIndex: currentBoardIndex + 1 });
    }
  },
  prevBoard: () => {
    const { currentBoardIndex } = get();
    if (currentBoardIndex > 0) {
      set({ currentBoardIndex: currentBoardIndex - 1 });
    }
  },
  getCurrentBoard: () => {
    const { fivechBoards, currentBoardIndex } = get();
    return fivechBoards[currentBoardIndex] || null;
  },

  set5chThreads: (threads) => set({ fivechThreads: threads, currentThreadIndex: 0 }),
  setCurrentThreadIndex: (index) => set({ currentThreadIndex: index }),
  nextThread: () => {
    const { fivechThreads, currentThreadIndex } = get();
    if (currentThreadIndex < fivechThreads.length - 1) {
      set({ currentThreadIndex: currentThreadIndex + 1 });
    }
  },
  prevThread: () => {
    const { currentThreadIndex } = get();
    if (currentThreadIndex > 0) {
      set({ currentThreadIndex: currentThreadIndex - 1 });
    }
  },
  getCurrentThread: () => {
    const { fivechThreads, currentThreadIndex } = get();
    return fivechThreads[currentThreadIndex] || null;
  },

  set5chPosts: (posts) => set({ fivechPosts: posts, currentPostIndex: 0 }),
  setCurrentPostIndex: (index) => set({ currentPostIndex: index }),
  nextPost: () => {
    const { fivechPosts, currentPostIndex } = get();
    if (currentPostIndex < fivechPosts.length - 1) {
      set({ currentPostIndex: currentPostIndex + 1 });
    }
  },
  prevPost: () => {
    const { currentPostIndex } = get();
    if (currentPostIndex > 0) {
      set({ currentPostIndex: currentPostIndex - 1 });
    }
  },
  getCurrentPost: () => {
    const { fivechPosts, currentPostIndex } = get();
    return fivechPosts[currentPostIndex] || null;
  },

  // SNS
  setSNSPosts: (posts) => set({ snsPosts: posts, currentSNSPostIndex: 0 }),
  setCurrentSNSPostIndex: (index) => set({ currentSNSPostIndex: index }),
  nextSNSPost: () => {
    const { snsPosts, currentSNSPostIndex } = get();
    if (currentSNSPostIndex < snsPosts.length - 1) {
      set({ currentSNSPostIndex: currentSNSPostIndex + 1 });
    }
  },
  prevSNSPost: () => {
    const { currentSNSPostIndex } = get();
    if (currentSNSPostIndex > 0) {
      set({ currentSNSPostIndex: currentSNSPostIndex - 1 });
    }
  },
  getCurrentSNSPost: () => {
    const { snsPosts, currentSNSPostIndex } = get();
    return snsPosts[currentSNSPostIndex] || null;
  },

  // 自動ナビゲーション
  setAutoNavigation: (enabled) => set({ autoNavigationEnabled: enabled }),

  // リセット
  reset: () => set({
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
  }),
}));
