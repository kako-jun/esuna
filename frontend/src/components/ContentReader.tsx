import { createSignal, onMount, For, Show } from 'solid-js';
import { RSSReader, RSSItem } from '../lib/rss';
import { ContentScraper, ScrapedContent } from '../lib/content-scraper';

interface ContentReaderProps {
  onSpeak: (text: string) => void;
  onBack: () => void;
  type: 'news' | 'sns';
}

export default function ContentReader(props: ContentReaderProps) {
  const [items, setItems] = createSignal<(RSSItem | ScrapedContent)[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [selectedIndex, setSelectedIndex] = createSignal<number | null>(null);

  onMount(() => { loadContent(); });

  const loadContent = async () => {
    setLoading(true);
    try {
      if (props.type === 'news') {
        const rssReader = new RSSReader();
        const feeds = rssReader.getDefaultFeeds();
        const allItems: RSSItem[] = [];
        for (const feed of feeds.slice(0, 3)) {
          try {
            const feedData = await rssReader.fetchRSS(feed.url);
            allItems.push(...feedData.items.slice(0, 5));
          } catch (error) {
            console.error(`Failed to load feed ${feed.name}:`, error);
          }
        }
        setItems(allItems);
        if (allItems.length > 0) {
          props.onSpeak(`${allItems.length}件のニュースを読み込みました。1番から9番のキーで記事を選択するか、矢印キーで移動してください。`);
        }
      } else {
        const scraper = new ContentScraper();
        const socialPosts = scraper.generateSampleSocialPosts();
        try {
          const hatenaEntries = await scraper.getHatenaPopularEntries();
          setItems([...socialPosts, ...hatenaEntries]);
        } catch {
          setItems(socialPosts);
        }
        props.onSpeak(`${socialPosts.length}件の投稿を読み込みました。1番から9番のキーで投稿を選択するか、矢印キーで移動してください。`);
      }
    } catch (error) {
      console.error('Content loading error:', error);
      props.onSpeak('コンテンツの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const getGridItems = () => {
    const gridItems: { id: number; label: string; ariaLabel: string; action: () => void }[] = [];
    gridItems.push({ id: 1, label: '戻る', ariaLabel: '1番、前のページに戻る', action: () => { props.onBack(); } });
    for (let i = 0; i < 8 && i < items().length; i++) {
      const item = items()[currentIndex() + i];
      if (item) {
        const title = item.title;
        const shortTitle = title.length > 20 ? title.substring(0, 20) + '...' : title;
        gridItems.push({ id: i + 2, label: shortTitle.replace(/\n/g, ' '), ariaLabel: `${i + 2}番、${title}`, action: () => { readFullContent(item); } });
      }
    }
    if (currentIndex() + 8 < items().length) {
      gridItems[8] = { id: 9, label: '次の\nページ', ariaLabel: '9番、次のページを表示', action: () => { setCurrentIndex(prev => prev + 8); props.onSpeak('次のページに移動しました'); } };
    }
    if (currentIndex() > 0) {
      gridItems[7] = { id: 8, label: '前の\nページ', ariaLabel: '8番、前のページを表示', action: () => { setCurrentIndex(prev => Math.max(0, prev - 8)); props.onSpeak('前のページに移動しました'); } };
    }
    return gridItems;
  };

  const readFullContent = (item: RSSItem | ScrapedContent) => {
    let content = '';
    if ('description' in item) {
      content = `${item.title}。${item.description}`;
      if ((item as RSSItem).content && (item as RSSItem).content !== (item as RSSItem).description) {
        content += `。詳細：${(item as RSSItem).content}`;
      }
    } else {
      content = `${item.title}。${item.content}`;
    }
    if (content.length > 1000) { content = content.substring(0, 1000) + '。以下省略します。'; }
    props.onSpeak(content);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const gridItems = getGridItems();
    const curIdx = selectedIndex() ?? 0;

    switch (event.key) {
      case 'ArrowRight': event.preventDefault(); if (curIdx % 3 < 2 && gridItems[curIdx + 1]) { setSelectedIndex(curIdx + 1); props.onSpeak(gridItems[curIdx + 1].ariaLabel); } break;
      case 'ArrowLeft': event.preventDefault(); if (curIdx % 3 > 0 && gridItems[curIdx - 1]) { setSelectedIndex(curIdx - 1); props.onSpeak(gridItems[curIdx - 1].ariaLabel); } break;
      case 'ArrowDown': event.preventDefault(); if (curIdx < 6 && gridItems[curIdx + 3]) { setSelectedIndex(curIdx + 3); props.onSpeak(gridItems[curIdx + 3].ariaLabel); } break;
      case 'ArrowUp': event.preventDefault(); if (curIdx >= 3 && gridItems[curIdx - 3]) { setSelectedIndex(curIdx - 3); props.onSpeak(gridItems[curIdx - 3].ariaLabel); } break;
      case 'Enter': case ' ': event.preventDefault(); { const sel = selectedIndex(); if (sel !== null && gridItems[sel]) { gridItems[sel].action(); } } break;
      case 'Escape': event.preventDefault(); props.onSpeak('読み上げを停止しました'); window.speechSynthesis.cancel(); break;
      default: {
        const num = parseInt(event.key);
        if (num >= 1 && num <= 9 && gridItems[num - 1]) { event.preventDefault(); setSelectedIndex(num - 1); gridItems[num - 1].action(); }
        break;
      }
    }
  };

  return (
    <Show when={!loading()} fallback={
      <div class="grid-container" role="status" aria-live="polite">
        <div class="grid-item" style={{ "grid-column": '1 / -1', "grid-row": '1 / -1' }}>読み込み中...</div>
      </div>
    }>
      <div class="grid-container" onKeyDown={handleKeyDown} tabIndex={0} role="application" aria-label={`${props.type === 'news' ? 'ニュース' : 'SNS'}コンテンツリーダー`}>
        <For each={Array.from({ length: 9 }, (_, i) => i)}>
          {(index) => {
            const gridItems = getGridItems();
            const item = () => gridItems[index];
            return (
              <div
                class={`grid-item ${selectedIndex() === index ? 'active' : ''} ${!item() ? 'opacity-50' : ''}`}
                onClick={() => { const it = item(); if (it) { setSelectedIndex(index); it.action(); } }}
                role="button"
                tabIndex={-1}
                aria-label={item() ? item()!.ariaLabel : `空のセル ${index + 1}`}
                aria-disabled={!item()}
              >
                {item() ? item()!.label : ''}
                <span class="sr-only">{selectedIndex() === index ? '選択中' : ''}</span>
              </div>
            );
          }}
        </For>
      </div>
    </Show>
  );
}
