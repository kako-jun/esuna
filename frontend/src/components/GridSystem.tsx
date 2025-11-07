'use client'

import { useState, useEffect, useCallback } from 'react'
import { SpeechManager } from '@/lib/speech'

interface GridAction {
  label: string
  action: () => void
}

interface GridSystemProps {
  actions: GridAction[]
  speech: SpeechManager
  onInit?: () => void
}

export default function GridSystem({ actions, speech, onInit }: GridSystemProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isKeyboardMode, setIsKeyboardMode] = useState(false)

  useEffect(() => {
    if (onInit) {
      onInit()
    }
  }, [onInit])

  const handleItemClick = useCallback((action: GridAction, index: number) => {
    setSelectedIndex(index)
    speech.speak(`${index + 1}番、${action.label}`)
    action.action()
  }, [speech])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isKeyboardMode) {
      setIsKeyboardMode(true)
      setSelectedIndex(0)
      speech.speak('キーボードモードに切り替えました。矢印キーで移動、Enterで選択、Escapeで音声読み上げ停止')
      return
    }

    const currentIndex = selectedIndex ?? 0

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        if (currentIndex % 3 < 2 && currentIndex + 1 < actions.length) {
          const newIndex = currentIndex + 1
          setSelectedIndex(newIndex)
          speech.speak(`${newIndex + 1}番、${actions[newIndex].label}`)
        }
        break
      case 'ArrowLeft':
        event.preventDefault()
        if (currentIndex % 3 > 0) {
          const newIndex = currentIndex - 1
          setSelectedIndex(newIndex)
          speech.speak(`${newIndex + 1}番、${actions[newIndex].label}`)
        }
        break
      case 'ArrowDown':
        event.preventDefault()
        if (currentIndex < 6) {
          const newIndex = currentIndex + 3
          if (newIndex < 9 && newIndex < actions.length) {
            setSelectedIndex(newIndex)
            speech.speak(`${newIndex + 1}番、${actions[newIndex].label}`)
          }
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (currentIndex >= 3) {
          const newIndex = currentIndex - 3
          setSelectedIndex(newIndex)
          speech.speak(`${newIndex + 1}番、${actions[newIndex].label}`)
        }
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (selectedIndex !== null && actions[selectedIndex]) {
          handleItemClick(actions[selectedIndex], selectedIndex)
        }
        break
      case 'Escape':
        event.preventDefault()
        speech.speak('操作を停止しました')
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
        if (actions[numIndex]) {
          setSelectedIndex(numIndex)
          handleItemClick(actions[numIndex], numIndex)
        }
        break
    }
  }, [selectedIndex, isKeyboardMode, actions, speech, handleItemClick])

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
        const action = actions[index]
        const isEmpty = !action

        return (
          <div
            key={index}
            className={`grid-item ${selectedIndex === index ? 'active' : ''} ${isEmpty ? 'opacity-50' : ''}`}
            onClick={() => {
              if (action) {
                handleItemClick(action, index)
              }
            }}
            role="button"
            tabIndex={-1}
            aria-label={action ? `${index + 1}番、${action.label}` : `空のセル ${index + 1}`}
            aria-disabled={isEmpty}
          >
            {action ? action.label : ''}
            <span className="sr-only">
              {selectedIndex === index ? '選択中' : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}
