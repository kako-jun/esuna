'use client'

import { useEffect, useState } from 'react'
import { SpeechManager } from '../lib/speech'
import { getFavorites, removeFavorite, Favorite, FavoriteType } from '../lib/favorites'
import GridSystem from './GridSystem'

interface FavoritesListProps {
  speech: SpeechManager
  onBack: () => void
  onSelectFavorite: (favorite: Favorite) => void
}

export default function FavoritesList({ speech, onBack, onSelectFavorite }: FavoritesListProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  // お気に入りを読み込み
  useEffect(() => {
    const loadFavorites = () => {
      const allFavorites = getFavorites()
      setFavorites(allFavorites)

      setTimeout(() => {
        if (allFavorites.length === 0) {
          speech.speak('お気に入りはまだ登録されていません。コンテンツを閲覧中にお気に入りに追加できます')
        } else {
          speech.speak(`お気に入り、${allFavorites.length}件が登録されています`)
          setTimeout(() => speakFavorite(), 2000)
        }
      }, 500)
    }

    loadFavorites()
  }, [])

  const currentFavorite = favorites[currentIndex]

  // お気に入りを読み上げ
  const speakFavorite = () => {
    if (!currentFavorite) return

    const typeText = getTypeText(currentFavorite.type)
    speech.speak(
      `${typeText}、${currentFavorite.title}。${currentFavorite.description || ''}`,
      { interrupt: true }
    )
  }

  // タイプを日本語に変換
  const getTypeText = (type: FavoriteType): string => {
    switch (type) {
      case 'podcast':
        return 'Podcast'
      case 'novel':
        return '小説'
      case 'rss-feed':
        return 'RSSフィード'
      case '5ch-board':
        return '5ちゃんねる 板'
      case '5ch-thread':
        return '5ちゃんねる スレッド'
      default:
        return 'コンテンツ'
    }
  }

  // 次のお気に入り
  const nextFavorite = () => {
    if (currentIndex < favorites.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setTimeout(speakFavorite, 100)
    } else {
      speech.speak('最後のお気に入りです')
    }
  }

  // 前のお気に入り
  const prevFavorite = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setTimeout(speakFavorite, 100)
    } else {
      speech.speak('最初のお気に入りです')
    }
  }

  // お気に入りを開く
  const openFavorite = () => {
    if (!currentFavorite) {
      speech.speak('お気に入りがありません')
      return
    }

    speech.speak(`${currentFavorite.title} を開きます`)
    onSelectFavorite(currentFavorite)
  }

  // お気に入りから削除
  const deleteFavorite = () => {
    if (!currentFavorite) {
      speech.speak('お気に入りがありません')
      return
    }

    removeFavorite(currentFavorite.id)
    speech.speak(`${currentFavorite.title} をお気に入りから削除しました`)

    // リストを更新
    const updated = getFavorites()
    setFavorites(updated)

    // インデックスを調整
    if (currentIndex >= updated.length && updated.length > 0) {
      setCurrentIndex(updated.length - 1)
    } else if (updated.length === 0) {
      setCurrentIndex(0)
      setTimeout(() => {
        speech.speak('お気に入りがすべて削除されました')
      }, 1500)
    }
  }

  // グリッドアクション
  const actions = [
    {
      label: '戻る',
      action: () => {
        speech.stop()
        onBack()
      },
    },
    {
      label: '前',
      action: prevFavorite,
    },
    {
      label: '次',
      action: nextFavorite,
    },
    {
      label: '読み上げ',
      action: speakFavorite,
    },
    {
      label: '開く',
      action: openFavorite,
    },
    {
      label: '削除',
      action: deleteFavorite,
    },
    {
      label: '件数',
      action: () => {
        if (favorites.length === 0) {
          speech.speak('お気に入りはまだ登録されていません')
        } else {
          speech.speak(`全${favorites.length}件中、${currentIndex + 1}番目のお気に入りです`)
        }
      },
    },
    {
      label: '停止',
      action: () => {
        speech.stop()
      },
    },
    {
      label: '先頭',
      action: () => {
        if (favorites.length > 0) {
          setCurrentIndex(0)
          setTimeout(speakFavorite, 100)
        } else {
          speech.speak('お気に入りがありません')
        }
      },
    },
  ]

  return <GridSystem actions={actions} speech={speech} />
}
