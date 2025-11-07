export interface RSSItem {
  title: string
  description: string
  link: string
  pubDate: string
  content?: string
}

export interface RSSFeed {
  title: string
  description: string
  items: RSSItem[]
}

export class RSSReader {
  private corsProxy = 'https://api.allorigins.win/raw?url='

  async fetchRSS(url: string): Promise<RSSFeed> {
    try {
      const proxyUrl = `${this.corsProxy}${encodeURIComponent(url)}`
      const response = await fetch(proxyUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const xmlText = await response.text()
      return this.parseRSS(xmlText)
    } catch (error) {
      console.error('RSS fetch error:', error)
      throw new Error('RSSフィードの取得に失敗しました')
    }
  }

  private parseRSS(xmlText: string): RSSFeed {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
    
    const feedTitle = this.getTextContent(xmlDoc, 'channel > title') || 'Unknown Feed'
    const feedDescription = this.getTextContent(xmlDoc, 'channel > description') || ''
    
    const items = Array.from(xmlDoc.querySelectorAll('item')).map(item => ({
      title: this.getTextContent(item, 'title') || 'No Title',
      description: this.stripHtml(this.getTextContent(item, 'description') || ''),
      link: this.getTextContent(item, 'link') || '',
      pubDate: this.formatDate(this.getTextContent(item, 'pubDate') || ''),
      content: this.stripHtml(this.getTextContent(item, 'content:encoded') || this.getTextContent(item, 'description') || '')
    }))

    return {
      title: feedTitle,
      description: feedDescription,
      items: items.slice(0, 20) // 최대 20개 항목
    }
  }

  private getTextContent(element: Element | Document, selector: string): string | null {
    const selected = element.querySelector(selector)
    return selected?.textContent?.trim() || null
  }

  private stripHtml(html: string): string {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || div.innerText || ''
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  // 日本の主要ニュースサイトのRSSフィード
  getDefaultFeeds(): { name: string; url: string }[] {
    return [
      {
        name: 'NHKニュース',
        url: 'https://www3.nhk.or.jp/rss/news/cat0.xml'
      },
      {
        name: 'Yahoo!ニュース - 主要',
        url: 'https://news.yahoo.co.jp/rss/topics/top-picks.xml'
      },
      {
        name: 'ITmedia News',
        url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml'
      },
      {
        name: 'TechCrunch Japan',
        url: 'https://jp.techcrunch.com/feed/'
      },
      {
        name: 'Gigazine',
        url: 'https://gigazine.net/news/rss_2.0/'
      },
      {
        name: 'はてなブックマーク - 人気エントリー',
        url: 'https://b.hatena.ne.jp/hotentry.rss'
      }
    ]
  }
}