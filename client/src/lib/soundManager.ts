class SoundManager {
  private audioContext: AudioContext | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private sounds = {
    pop: '/sounds/pop.wav',
    buzz: '/sounds/buzz.wav',
    whoosh: '/sounds/whoosh.wav',
  };
  private initialized = false;
  private isMuted = false;

  async initialize() {
    if (this.initialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      await Promise.all(
        Object.entries(this.sounds).map(async ([name, url]) => {
          try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
            this.buffers.set(name, audioBuffer);
            console.log(`[Sound Manager] Loaded ${name} sound`);
          } catch (error) {
            console.warn(`[Sound Manager] Failed to load ${name}:`, error);
          }
        })
      );

      this.initialized = true;
      console.log('[Sound Manager] Web Audio API initialized successfully');
    } catch (error) {
      console.error('[Sound Manager] Failed to initialize Web Audio API:', error);
    }
  }

  play(soundName: 'pop' | 'buzz' | 'whoosh', volume: number = 0.3) {
    if (!this.audioContext || !this.initialized || this.isMuted) {
      return;
    }

    const buffer = this.buffers.get(soundName);
    if (!buffer) {
      console.warn(`[Sound Manager] Sound ${soundName} not loaded`);
      return;
    }

    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      gainNode.gain.value = volume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start(0);
    } catch (error) {
      console.error(`[Sound Manager] Error playing ${soundName}:`, error);
    }
  }

  mute() {
    this.isMuted = true;
  }

  unmute() {
    this.isMuted = false;
  }

  setMasterVolume(volume: number) {
    if (this.audioContext && this.audioContext.destination) {
      console.log(`[Sound Manager] Master volume set to ${volume}`);
    }
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

export const soundManager = new SoundManager();
