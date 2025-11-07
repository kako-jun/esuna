export interface ScrapedContent {
  title: string
  content: string
  url: string
  timestamp: string
}

export class ContentScraper {
  private corsProxy = 'https://api.allorigins.win/get?url='

  async scrapeWebsite(url: string): Promise<ScrapedContent> {
    try {
      const proxyUrl = `${this.corsProxy}${encodeURIComponent(url)}`
      const response = await fetch(proxyUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const htmlContent = data.contents
      
      return this.parseHtmlContent(htmlContent, url)
    } catch (error) {
      console.error('Web scraping error:', error)
      throw new Error('Webサイトの取得に失敗しました')
    }
  }

  private parseHtmlContent(html: string, url: string): ScrapedContent {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // タイトルを取得
    const title = doc.querySelector('title')?.textContent?.trim() || 
                  doc.querySelector('h1')?.textContent?.trim() || 
                  'タイトルなし'
    
    // メインコンテンツを取得（複数のセレクターを試行）
    const contentSelectors = [
      'article',
      '.article',
      '.content',
      '.post-content',
      '.entry-content',
      'main',
      '.main',
      '#content',
      '#main'
    ]
    
    let content = ''
    for (const selector of contentSelectors) {
      const element = doc.querySelector(selector)
      if (element) {
        content = this.extractTextContent(element)
        if (content.length > 100) break
      }
    }
    
    // コンテンツが見つからない場合はbody全体から抽出
    if (!content || content.length < 100) {
      const bodyElement = doc.querySelector('body')
      if (bodyElement) {
        content = this.extractTextContent(bodyElement)
      }
    }
    
    return {
      title: this.cleanText(title),
      content: this.cleanText(content).substring(0, 2000), // 2000文字に制限
      url,
      timestamp: new Date().toISOString()
    }
  }

  private extractTextContent(element: Element): string {
    // スクリプトタグとスタイルタグを除去
    const scripts = element.querySelectorAll('script, style, nav, header, footer, aside')
    scripts.forEach(script => script.remove())
    
    // テキストコンテンツを抽出
    const textContent = element.textContent || ''
    
    // 段落に分けて処理
    const paragraphs = textContent
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 20) // 短すぎる段落は除外
      .slice(0, 10) // 最大10段落
    
    return paragraphs.join('\n\n')
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // 複数の空白を1つに
      .replace(/\n\s*\n/g, '\n') // 複数の改行を1つに
      .trim()
  }

  // はてなブックマークの人気エントリーを取得
  async getHatenaPopularEntries(): Promise<ScrapedContent[]> {
    try {
      const rssUrl = 'https://b.hatena.ne.jp/hotentry.rss'
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`
      const response = await fetch(proxyUrl)
      const xmlText = await response.text()
      
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
      
      const items = Array.from(xmlDoc.querySelectorAll('item')).slice(0, 10).map(item => {
        const title = item.querySelector('title')?.textContent || 'タイトルなし'
        const description = item.querySelector('description')?.textContent || ''
        const link = item.querySelector('link')?.textContent || ''
        const pubDate = item.querySelector('pubDate')?.textContent || ''
        
        return {
          title: this.cleanText(title),
          content: this.cleanText(this.stripHtml(description)),
          url: link,
          timestamp: pubDate
        }
      })
      
      return items
    } catch (error) {
      console.error('Hatena scraping error:', error)
      return []
    }
  }

  private stripHtml(html: string): string {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || div.innerText || ''
  }

  // Twitter風のダミーデータ生成（実際のTwitter APIは有料のため）
  generateSampleSocialPosts(): ScrapedContent[] {
    const samplePosts = [
      {
        title: 'テクノロジーニュース',
        content: '新しいAI技術が発表されました。これにより、より自然な対話が可能になりそうです。',
        url: '#',
        timestamp: new Date().toISOString()
      },
      {
        title: '天気情報',
        content: '今日は全国的に晴れの予報です。気温は平年並みとなるでしょう。',
        url: '#',
        timestamp: new Date().toISOString()
      },
      {
        title: 'プログラミング関連',
        content: 'JavaScriptの新しいフレームワークがリリースされました。パフォーマンスが大幅に向上しているとのことです。',
        url: '#',
        timestamp: new Date().toISOString()
      },
      {
        title: 'アクセシビリティ',
        content: 'Webアクセシビリティの重要性について改めて考えさせられる記事を読みました。誰もが使いやすいWebを作っていきたいです。',
        url: '#',
        timestamp: new Date().toISOString()
      },
      {
        title: '読書記録',
        content: '今日読んだ本はとても面白かったです。特にユーザーエクスペリエンスに関する章が参考になりました。',
        url: '#',
        timestamp: new Date().toISOString()
      }
    ]
    
    return samplePosts
  }
}