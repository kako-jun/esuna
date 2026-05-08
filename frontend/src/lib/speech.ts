export class SpeechManager {
  private synthesis: SpeechSynthesis
  private voices: SpeechSynthesisVoice[] = []
  private currentVoice: SpeechSynthesisVoice | null = null
  private defaultRate = 1.0
  private defaultPitch = 1.0
  private defaultVolume = 1.0
  // Queue of pending setVoiceByName calls that arrived before voices loaded
  private pendingVoiceName: string | null = null
  // Session ID to discard stale onend callbacks after cancel()
  private queueSessionId = 0

  constructor() {
    this.synthesis = window.speechSynthesis
    this.loadVoices()
  }

  private loadVoices() {
    const applyVoices = () => {
      this.voices = this.synthesis.getVoices()
      if (this.voices.length === 0) return

      this.currentVoice = this.voices.find(voice =>
        voice.lang.includes('ja') || voice.name.includes('Japanese')
      ) || this.voices[0] || null

      // Apply any pending voice selection that arrived before voices were ready
      if (this.pendingVoiceName) {
        const found = this.voices.find(v => v.name === this.pendingVoiceName)
        if (found) this.currentVoice = found
        this.pendingVoiceName = null
      }
    }

    // Chrome fires onvoiceschanged; Firefox/Safari have them synchronously
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = applyVoices
    }

    // Always attempt synchronous load (works in Firefox/Safari and on repeat calls)
    applyVoices()

    // Fallback polling in case onvoiceschanged is not fired
    if (this.voices.length === 0) {
      const poll = setInterval(() => {
        applyVoices()
        if (this.voices.length > 0) clearInterval(poll)
      }, 100)
    }
  }

  private createUtterance(text: string, rate: number, pitch: number, volume: number): SpeechSynthesisUtterance {
    const utterance = new SpeechSynthesisUtterance(text)
    if (this.currentVoice) utterance.voice = this.currentVoice
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume
    utterance.lang = 'ja-JP'
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error)
    }
    return utterance
  }

  speak(text: string, options?: {
    rate?: number
    pitch?: number
    volume?: number
    interrupt?: boolean
  }) {
    const {
      rate = this.defaultRate,
      pitch = this.defaultPitch,
      volume = this.defaultVolume,
      interrupt = true
    } = options || {}

    if (interrupt) {
      this.synthesis.cancel()
    }

    const utterance = this.createUtterance(text, rate, pitch, volume)
    this.synthesis.speak(utterance)
  }

  speakQueue(texts: string[], options?: {
    rate?: number
    pitch?: number
    volume?: number
  }) {
    if (texts.length === 0) return
    const { rate = this.defaultRate, pitch = this.defaultPitch, volume = this.defaultVolume } = options || {}
    const sessionId = ++this.queueSessionId
    this.synthesis.cancel()

    const speakNext = (index: number) => {
      if (this.queueSessionId !== sessionId) return // stale chain after cancel()
      if (index >= texts.length) return
      const utterance = this.createUtterance(texts[index], rate, pitch, volume)
      utterance.onend = () => speakNext(index + 1)
      this.synthesis.speak(utterance)
    }

    speakNext(0)
  }

  stop() {
    this.synthesis.cancel()
  }

  pause() {
    this.synthesis.pause()
  }

  resume() {
    this.synthesis.resume()
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices
  }

  setVoice(voiceIndex: number) {
    if (voiceIndex >= 0 && voiceIndex < this.voices.length) {
      this.currentVoice = this.voices[voiceIndex]
    }
  }

  setVoiceByName(voiceName: string) {
    const voice = this.voices.find(v => v.name === voiceName)
    if (voice) {
      this.currentVoice = voice
    } else {
      // Voices may not be loaded yet; store the name and apply once ready
      this.pendingVoiceName = voiceName
    }
  }

  setDefaults(options: { rate?: number; pitch?: number; volume?: number }) {
    if (options.rate !== undefined) this.defaultRate = options.rate
    if (options.pitch !== undefined) this.defaultPitch = options.pitch
    if (options.volume !== undefined) this.defaultVolume = options.volume
  }

  isSpeaking(): boolean {
    return this.synthesis.speaking
  }

  isPaused(): boolean {
    return this.synthesis.paused
  }
}
