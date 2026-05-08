import { createSignal, onMount, onCleanup } from 'solid-js'
import Hls from 'hls.js'
import { RadioStation, getStreamUrl } from '../lib/radio'
import { SpeechManager } from '../lib/speech'
import GridSystem, { GridAction } from './GridSystem'
import { createGuideAction } from '../lib/grid-guide'

interface RadioPlayerProps {
  station: RadioStation
  speech: SpeechManager
  onBack: () => void
}

export default function RadioPlayer(props: RadioPlayerProps) {
  const [isPlaying, setIsPlaying] = createSignal(false)
  const [isLoading, setIsLoading] = createSignal(true)
  const [error, setError] = createSignal<string | null>(null)
  const [volume, setVolume] = createSignal(1.0)
  let audioRef: HTMLAudioElement | null = null
  let hlsRef: Hls | null = null
  let mounted = true

  onMount(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const streamUrl = await getStreamUrl(props.station.id)
      if (!mounted) return
      const audio = new Audio()
      audio.volume = volume()
      audioRef = audio

      let isHls = false
      try {
        isHls = new URL(streamUrl).pathname.endsWith('.m3u8')
      } catch {
        isHls = streamUrl.includes('.m3u8')
      }

      if (isHls && Hls.isSupported()) {
        // Chrome / Firefox / Edge: hls.js で再生（MSE ベース）
        const hls = new Hls()
        hlsRef = hls
        hls.loadSource(streamUrl)
        hls.attachMedia(audio)
        let mediaErrorRecovered = false
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return
          if (!mediaErrorRecovered && data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            mediaErrorRecovered = true
            hls.recoverMediaError()
            return
          }
          if (!mounted) return
          setIsLoading(false)
          // NHK ラジオ第2 等は時間帯によって放送休止する。
          // hls.js が media playlist 取得で 4xx を受けた場合は壊れているのではなく
          // オフエア中の可能性が高いので、そう案内する。
          const httpCode = (data as { response?: { code?: number } }).response?.code
          if (httpCode && httpCode >= 400 && httpCode < 500) {
            setError(
              `${props.station.name} は現在放送休止中の可能性があります。時間帯によっては聴けない番組があります。`,
            )
            props.speech.speak(
              `${props.station.name} は現在放送休止中の可能性があります。時間帯によっては聴けない番組があります。少し時間を置いて試すか、1番で戻って別の局を選んでください。`,
            )
          } else {
            setError(
              'HLS ストリーミングの読み込みに失敗しました。この局は現在利用できないか、ネットワークの問題かもしれません。',
            )
            props.speech.speak(
              'ストリーミングの読み込みに失敗しました。1番で戻って別の局を試してください。',
            )
          }
        })
        // hls.js では MANIFEST_PARSED 後に canplay が発火しない場合があるため
        // MANIFEST_PARSED でも再生開始を試みる
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (playStarted || !mounted) return
          playStarted = true
          setIsLoading(false)
          props.speech.speak(`${props.station.name} の再生を開始します`)
          audio
            .play()
            .then(() => {
              setIsPlaying(true)
            })
            .catch((err) => {
              console.error('Play error:', err)
              setError(
                '音声の再生に失敗しました。ブラウザの設定で自動再生が制限されている可能性があります。',
              )
              props.speech.speak(
                '音声の再生に失敗しました。ブラウザの設定で自動再生が制限されている可能性があります。6番で再生を試みるか、1番で戻ってください。',
              )
            })
        })
      } else {
        // Safari（ネイティブ HLS: canPlayType 'application/vnd.apple.mpegurl'）または非 HLS URL
        audio.src = streamUrl
      }

      let playStarted = false
      audio.addEventListener('canplay', () => {
        if (playStarted || !mounted) return
        playStarted = true
        setIsLoading(false)
        props.speech.speak(`${props.station.name} の再生を開始します`)
        audio
          .play()
          .then(() => {
            setIsPlaying(true)
          })
          .catch((err) => {
            console.error('Play error:', err)
            setError(
              '音声の再生に失敗しました。ブラウザの設定で自動再生が制限されている可能性があります。',
            )
            props.speech.speak(
              '音声の再生に失敗しました。ブラウザの設定で自動再生が制限されている可能性があります。6番で再生を試みるか、1番で戻ってください。',
            )
          })
      })
      audio.addEventListener('error', () => {
        if (!mounted) return
        setIsLoading(false)
        setError(
          'ストリーミングの読み込みに失敗しました。この局は現在利用できないか、ブラウザが対応していません。',
        )
        props.speech.speak(
          'ストリーミングの読み込みに失敗しました。この局は現在利用できないか、ブラウザが対応していません。1番で戻って別の局を試してください。',
        )
      })
      audio.addEventListener('ended', () => {
        setIsPlaying(false)
      })
    } catch (err) {
      console.error('Init error:', err)
      setIsLoading(false)
      setError(
        'ラジオ局への接続に失敗しました。ブラウザや取得先の都合で再生できない場合があります。',
      )
      props.speech.speak(
        'ラジオ局への接続に失敗しました。ブラウザや取得先の都合で再生できない場合があります。1番で戻って別の局を試してください。',
      )
    }
  })

  onCleanup(() => {
    mounted = false
    props.speech.stop()
    if (hlsRef) {
      hlsRef.destroy()
      hlsRef = null
    }
    if (audioRef) {
      audioRef.pause()
      audioRef.src = ''
      try {
        audioRef.load()
      } catch {}
      audioRef = null
    }
  })

  const togglePlay = () => {
    if (!audioRef) return
    if (isPlaying()) {
      audioRef.pause()
      setIsPlaying(false)
      props.speech.speak('一時停止しました')
    } else {
      audioRef
        .play()
        .then(() => {
          setIsPlaying(true)
          props.speech.speak('再生を再開しました')
        })
        .catch(() => {
          props.speech.speak(
            '再生に失敗しました。ブラウザの設定を確認するか、1番で戻って別の局を試してください。',
          )
        })
    }
  }

  const changeVolume = (newVolume: number) => {
    setVolume(newVolume)
    if (audioRef) {
      audioRef.volume = newVolume
    }
    props.speech.speak(`音量を${Math.round(newVolume * 100)}パーセントに設定しました`)
  }

  const centerCell = (): GridAction => {
    if (isLoading()) {
      return {
        label: `準備中…\n${props.station.name}`,
        action: () =>
          props.speech.speak(
            `${props.station.name} のストリーミングを準備しています。ブラウザや局の都合で失敗する場合があります。しばらく待っても始まらない場合は、1番で戻って別の局を試してください。`,
          ),
      }
    }
    if (error()) {
      return {
        label: `再生不可\n${props.station.name}`,
        action: () =>
          props.speech.speak(
            `${props.station.name} を再生できません。${error()!} 1番で戻って別の局を試してください。「radiko」と書かれた局はまだ未対応です。`,
          ),
      }
    }
    return {
      label: `${props.station.name}\n${isPlaying() ? '再生中' : '一時停止中'}`,
      action: () => {
        props.speech.speak(`${props.station.name}。${isPlaying() ? '再生中' : '一時停止中'}`)
      },
    }
  }

  const actions = () => {
    const actionList: GridAction[] = [
      {
        label: '戻る',
        action: () => {
          if (audioRef) {
            audioRef.pause()
          }
          props.speech.stop()
          props.onBack()
        },
      },
      { label: '', action: () => {} },
      { label: '', action: () => {} },
      {
        label: '局情報',
        action: () => {
          props.speech.speak(
            `現在再生中：${props.station.name}。${props.station.description}。状態：${isPlaying() ? '再生中' : '一時停止中'}`,
          )
        },
      },
      centerCell(),
      { label: isPlaying() ? '一時停止' : '再生', action: togglePlay },
      {
        label: `${props.station.name}`,
        action: () => {
          props.speech.speak(`${props.station.name}。${props.station.description}`)
        },
      },
      {
        label: '停止',
        action: () => {
          props.speech.stop()
        },
      },
      createGuideAction('ラジオ再生画面', props.speech, () => actionList),
    ]

    return actionList
  }

  return <GridSystem actions={actions()} speech={props.speech} />
}
