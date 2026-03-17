'use client'

import { useState, useEffect, useCallback, useId } from 'react'
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
  const gridId = useId()

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
        speech.stop()
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

  const activeDescendantId = selectedIndex !== null ? `${gridId}-cell-${selectedIndex}` : undefined

  return (
    <div
      className="grid-container"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="grid"
      aria-label="操作パネル（1〜9キーで直接選択、矢印キーで移動、Enterで実行、Escapeで停止）"
      aria-activedescendant={activeDescendantId}
    >
      {Array.from({ length: 9 }, (_, index) => {
        const action = actions[index]
        const isEmpty = !action || action.label === ''
        const isSelected = selectedIndex === index

        return (
          <div
            key={index}
            id={`${gridId}-cell-${index}`}
            className={`grid-item ${isSelected ? 'active' : ''} ${isEmpty ? 'opacity-50' : ''}`}
            onClick={() => {
              if (action && !isEmpty) {
                handleItemClick(action, index)
              }
            }}
            role="gridcell"
            tabIndex={-1}
            aria-label={!isEmpty ? `${index + 1}番、${action!.label}` : `空のセル ${index + 1}`}
            aria-disabled={isEmpty}
            aria-selected={isSelected}
          >
            {!isEmpty ? action!.label : ''}
          </div>
        )
      })}
    </div>
  )
}
