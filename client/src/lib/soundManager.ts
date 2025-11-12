export type SoundName = 'pop' | 'buzz' | 'whoosh' | 'crunch' | 'splash' | 'squish' | 'laugh' | 'cry' | 'grunt' | 'yeah' | 'kiss' | 'sparkle';

class SoundManager {
  private audioContext: AudioContext | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private sounds: Record<SoundName, string> = {
    pop: '/sounds/pop.wav',
    buzz: '/sounds/buzz.wav',
    whoosh: '/sounds/whoosh.wav',
    crunch: '/sounds/pop.wav',
    splash: '/sounds/whoosh.wav',
    squish: '/sounds/pop.wav',
    laugh: '/sounds/pop.wav',
    cry: '/sounds/buzz.wav',
    grunt: '/sounds/buzz.wav',
    yeah: '/sounds/whoosh.wav',
    kiss: '/sounds/pop.wav',
    sparkle: '/sounds/whoosh.wav',
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
          } catch (error) {
            
          }
        })
      );

      this.initialized = true;
    } catch (error) {
      
    }
  }

  play(soundName: SoundName, volume: number = 0.3, pitchVariation: number = 0) {
    if (!this.audioContext || !this.initialized || this.isMuted) {
      return;
    }

    const soundPath = this.sounds[soundName];
    const baseSoundName = soundPath.split('/').pop()?.replace('.wav', '') || soundName;
    const buffer = this.buffers.get(baseSoundName);
    
    if (!buffer) {
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
      
      const pitchMap: Record<SoundName, number> = {
        pop: 1.0,
        buzz: 0.8,
        whoosh: 1.2,
        crunch: 0.85,
        splash: 1.15,
        squish: 0.95,
        laugh: 1.3,
        cry: 0.75,
        grunt: 0.7,
        yeah: 1.25,
        kiss: 1.1,
        sparkle: 1.4,
      };
      
      const basePitch = pitchMap[soundName] || 1.0;
      source.playbackRate.value = basePitch + pitchVariation;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start(0);
    } catch (error) {
      
    }
  }

  mute() {
    this.isMuted = true;
  }

  unmute() {
    this.isMuted = false;
  }

  setMasterVolume(volume: number) {
    
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

export const soundManager = new SoundManager();
