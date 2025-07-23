'use client'

import { useState, useEffect } from 'react'
import { RSSReader, RSSItem } from '@/lib/rss'
import { ContentScraper, ScrapedContent } from '@/lib/content-scraper'

interface ContentReaderProps {
  onSpeak: (text: string) => void
  onBack: () => void
  type: 'news' | 'sns'
}

export default function ContentReader({ onSpeak, onBack, type }: ContentReaderProps) {
  const [items, setItems] = useState<(RSSItem | ScrapedContent)[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useEffect(() => {
    loadContent()
  }, [type])

  const loadContent = async () => {
    setLoading(true)
    try {
      if (type === 'news') {
        const rssReader = new RSSReader()
        const feeds = rssReader.getDefaultFeeds()
        
        // 複数のフィードから記事を取得
        const allItems: RSSItem[] = []
        for (const feed of feeds.slice(0, 3)) { // 最初の3つのフィードのみ
          try {
            const feedData = await rssReader.fetchRSS(feed.url)
            allItems.push(...feedData.items.slice(0, 5)) // 各フィードから5記事
          } catch (error) {
            console.error(`Failed to load feed ${feed.name}:`, error)
          }
        }
        
        setItems(allItems)
        if (allItems.length > 0) {
          onSpeak(`${allItems.length}件のニュースを読み込みました。1番から9番のキーで記事を選択するか、矢印キーで移動してください。`)
        }
      } else {
        const scraper = new ContentScraper()
        const socialPosts = scraper.generateSampleSocialPosts()
        
        // はてなブックマークからも取得を試行
        try {
          const hatenaEntries = await scraper.getHatenaPopularEntries()
          setItems([...socialPosts, ...hatenaEntries])
        } catch {
          setItems(socialPosts)
        }
        
        onSpeak(`${socialPosts.length}件の投稿を読み込みました。1番から9番のキーで投稿を選択するか、矢印キーで移動してください。`)
      }
    } catch (error) {
      console.error('Content loading error:', error)
      onSpeak('コンテンツの読み込みに失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  const getGridItems = () => {
    const gridItems = []
    
    // 戻るボタン（常に1番）
    gridItems.push({
      id: 1,
      label: '戻る',
      ariaLabel: '1番、前のページに戻る',
      action: () => {
        onBack()
      }
    })

    // コンテンツアイテム（2-9番）
    for (let i = 0; i < 8 && i < items.length; i++) {
      const item = items[currentIndex + i]
      if (item) {
        const title = item.title
        const shortTitle = title.length > 20 ? title.substring(0, 20) + '...' : title
        
        gridItems.push({
          id: i + 2,
          label: shortTitle.replace(/\n/g, ' '),
          ariaLabel: `${i + 2}番、${title}`,
          action: () => {
            readFullContent(item)
          }
        })
      }
    }

    // 次のページボタン（9番、アイテムがもっとある場合）
    if (currentIndex + 8 < items.length) {
      gridItems[8] = {
        id: 9,
        label: '次の\nページ',
        ariaLabel: '9番、次のページを表示',
        action: () => {
          setCurrentIndex(prev => prev + 8)
          onSpeak('次のページに移動しました')
        }
      }
    }

    // 前のページボタン（現在のページが最初でない場合）
    if (currentIndex > 0) {
      gridItems[7] = {
        id: 8,
        label: '前の\nページ',
        ariaLabel: '8番、前のページを表示',
        action: () => {
          setCurrentIndex(prev => Math.max(0, prev - 8))
          onSpeak('前のページに移動しました')
        }
      }
    }

    return gridItems
  }

  const readFullContent = (item: RSSItem | ScrapedContent) => {
    let content = ''
    
    if ('description' in item) {
      // RSSItem
      content = `${item.title}。${item.description}`
      if (item.content && item.content !== item.description) {
        content += `。詳細：${item.content}`
      }
    } else {
      // ScrapedContent
      content = `${item.title}。${item.content}`
    }
    
    // 長すぎる場合は最初の1000文字のみ
    if (content.length > 1000) {
      content = content.substring(0, 1000) + '。以下省略します。'
    }
    
    onSpeak(content)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const items = getGridItems()
    const currentIndex = selectedIndex ?? 0

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        if (currentIndex % 3 < 2) {
          const newIndex = currentIndex + 1
          if (items[newIndex]) {
            setSelectedIndex(newIndex)
            onSpeak(items[newIndex].ariaLabel)
          }
        }
        break
      case 'ArrowLeft':
        event.preventDefault()
        if (currentIndex % 3 > 0) {
          const newIndex = currentIndex - 1
          if (items[newIndex]) {
            setSelectedIndex(newIndex)
            onSpeak(items[newIndex].ariaLabel)
          }
        }
        break
      case 'ArrowDown':
        event.preventDefault()
        if (currentIndex < 6) {
          const newIndex = currentIndex + 3
          if (items[newIndex]) {
            setSelectedIndex(newIndex)
            onSpeak(items[newIndex].ariaLabel)
          }
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (currentIndex >= 3) {
          const newIndex = currentIndex - 3
          if (items[newIndex]) {
            setSelectedIndex(newIndex)
            onSpeak(items[newIndex].ariaLabel)
          }
        }
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (selectedIndex !== null && items[selectedIndex]) {
          items[selectedIndex].action()
        }
        break
      case 'Escape':
        event.preventDefault()
        onSpeak('読み上げを停止しました')
        window.speechSynthesis.cancel()
        break
      default:
        // 数字キー 1-9
        const num = parseInt(event.key)
        if (num >= 1 && num <= 9 && items[num - 1]) {
          event.preventDefault()
          setSelectedIndex(num - 1)
          items[num - 1].action()
        }
        break
    }
  }

  if (loading) {
    return (
      <div className="grid-container">
        <div className="grid-item">
          読み込み中...
        </div>
      </div>
    )
  }

  const gridItems = getGridItems()

  return (
    <div 
      className="grid-container"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label={`${type === 'news' ? 'ニュース' : 'SNS'}コンテンツリーダー`}
    >
      {Array.from({ length: 9 }, (_, index) => {
        const item = gridItems[index]
        
        return (
          <div
            key={index}
            className={`grid-item ${selectedIndex === index ? 'active' : ''} ${!item ? 'opacity-50' : ''}`}
            onClick={() => {
              if (item) {
                setSelectedIndex(index)
                item.action()
              }
            }}
            role="button"
            tabIndex={-1}
            aria-label={item ? item.ariaLabel : `空のセル ${index + 1}`}
            aria-disabled={!item}
          >
            {item ? item.label : ''}
            <span className="sr-only">
              {selectedIndex === index ? '選択中' : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}