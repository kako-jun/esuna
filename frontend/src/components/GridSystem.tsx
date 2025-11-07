'use client'

import { useState, useEffect, useCallback } from 'react'
import { SpeechManager } from '@/lib/speech'

interface GridItem {
  id?: number
  label: string
  action: () => void
  ariaLabel?: string
}

interface GridAction {
  label: string
  action: () => void
}

interface GridSystemProps {
  items?: GridItem[]
  onSpeak?: (text: string) => void
  actions?: GridAction[]
  speech?: SpeechManager
  onInit?: () => void
}

export default function GridSystem({ items, onSpeak, actions, speech, onInit }: GridSystemProps) {
  // actionsが渡された場合はitemsに変換
  const gridItems: GridItem[] = items || (actions || []).map((action, index) => ({
    id: index + 1,
    label: action.label,
    action: action.action,
    ariaLabel: `${index + 1}番、${action.label}`,
  }))

  const speakFn = onSpeak || ((text: string) => speech?.speak(text))

  useEffect(() => {
    if (onInit) {
      onInit()
    }
  }, [onInit])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isKeyboardMode, setIsKeyboardMode] = useState(false)

  const handleItemClick = useCallback((item: GridItem, index: number) => {
    setSelectedIndex(index)
    if (item.ariaLabel) {
      speakFn(item.ariaLabel)
    }
    item.action()
  }, [speakFn])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isKeyboardMode) {
      setIsKeyboardMode(true)
      setSelectedIndex(0)
      speakFn('キーボードモードに切り替えました。矢印キーで移動、Enterで選択、Escapeで音声読み上げ停止')
      return
    }

    const currentIndex = selectedIndex ?? 0

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        if (currentIndex % 3 < 2) {
          const newIndex = currentIndex + 1
          setSelectedIndex(newIndex)
          if (gridItems[newIndex] && gridItems[newIndex].ariaLabel) {
            speakFn(gridItems[newIndex].ariaLabel!)
          }
        }
        break
      case 'ArrowLeft':
        event.preventDefault()
        if (currentIndex % 3 > 0) {
          const newIndex = currentIndex - 1
          setSelectedIndex(newIndex)
          if (gridItems[newIndex] && gridItems[newIndex].ariaLabel) {
            speakFn(gridItems[newIndex].ariaLabel!)
          }
        }
        break
      case 'ArrowDown':
        event.preventDefault()
        if (currentIndex < 6) {
          const newIndex = currentIndex + 3
          if (newIndex < 9 && gridItems[newIndex] && gridItems[newIndex].ariaLabel) {
            setSelectedIndex(newIndex)
            speakFn(gridItems[newIndex].ariaLabel!)
          }
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (currentIndex >= 3) {
          const newIndex = currentIndex - 3
          setSelectedIndex(newIndex)
          if (gridItems[newIndex] && gridItems[newIndex].ariaLabel) {
            speakFn(gridItems[newIndex].ariaLabel!)
          }
        }
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (selectedIndex !== null && gridItems[selectedIndex]) {
          handleItemClick(gridItems[selectedIndex], selectedIndex)
        }
        break
      case 'Escape':
        event.preventDefault()
        speakFn('操作を停止しました')
        window.speechSynthesis.cancel()
        break
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        event.preventDefault()
        const numIndex = parseInt(event.key) - 1
        if (gridItems[numIndex]) {
          setSelectedIndex(numIndex)
          handleItemClick(gridItems[numIndex], numIndex)
        }
        break
    }
  }, [selectedIndex, isKeyboardMode, gridItems, speakFn, handleItemClick])

  useEffect(() => {
    const handleTouchStart = () => {
      setIsKeyboardMode(false)
      setSelectedIndex(null)
    }

    document.addEventListener('touchstart', handleTouchStart)
    return () => document.removeEventListener('touchstart', handleTouchStart)
  }, [])

  return (
    <div
      className="grid-container"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="9分割グリッド操作パネル"
    >
      {Array.from({ length: 9 }, (_, index) => {
        const item = gridItems[index]
        const isEmpty = !item

        return (
          <div
            key={index}
            className={`grid-item ${selectedIndex === index ? 'active' : ''} ${isEmpty ? 'opacity-50' : ''}`}
            onClick={() => {
              if (item) {
                handleItemClick(item, index)
              }
            }}
            role="button"
            tabIndex={-1}
            aria-label={item ? item.ariaLabel : `空のセル ${index + 1}`}
            aria-disabled={isEmpty}
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