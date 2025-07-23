export class SpeechManager {
  private synthesis: SpeechSynthesis
  private voices: SpeechSynthesisVoice[] = []
  private currentVoice: SpeechSynthesisVoice | null = null

  constructor() {
    this.synthesis = window.speechSynthesis
    this.loadVoices()
  }

  private loadVoices() {
    const loadVoicesWhenAvailable = () => {
      this.voices = this.synthesis.getVoices()
      
      this.currentVoice = this.voices.find(voice => 
        voice.lang.includes('ja') || voice.name.includes('Japanese')
      ) || this.voices[0] || null

      if (this.voices.length === 0) {
        setTimeout(loadVoicesWhenAvailable, 100)
      }
    }

    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = loadVoicesWhenAvailable
    }
    
    loadVoicesWhenAvailable()
  }

  speak(text: string, options?: {
    rate?: number
    pitch?: number
    volume?: number
    interrupt?: boolean
  }) {
    const {
      rate = 1.0,
      pitch = 1.0,
      volume = 1.0,
      interrupt = true
    } = options || {}

    if (interrupt) {
      this.synthesis.cancel()
    }

    const utterance = new SpeechSynthesisUtterance(text)
    
    if (this.currentVoice) {
      utterance.voice = this.currentVoice
    }
    
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume
    utterance.lang = 'ja-JP'

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error)
    }

    this.synthesis.speak(utterance)
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
}