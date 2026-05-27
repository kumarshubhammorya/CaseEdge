export class SoundSystem {
  context: AudioContext | null = null;
  enabled: boolean = localStorage.getItem('caseedge_sounds_enabled') !== 'false';

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('caseedge_sounds_enabled', this.enabled.toString());
    return this.enabled;
  }

  getRandomOffset(range: number = 30) {
    return (Math.random() - 0.5) * range;
  }

  createWarmChain(osc: OscillatorNode, gainNode: GainNode, cutoffFreq: number = 1800) {
    if (!this.context) return;
    try {
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(cutoffFreq, this.context.currentTime);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.context.destination);
    } catch (e) {
      // Fallback in case filter node fails
      osc.connect(gainNode);
      gainNode.connect(this.context.destination);
    }
  }

  init() {
    if (!this.enabled) return;
    try {
      if (!this.context) {
        this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.context.state === 'suspended') {
        this.context.resume();
      }
    } catch (e) {
      console.warn("AudioContext not supported or blocked", e);
      this.enabled = false;
    }
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.context) return;
    
    try {
      const osc = this.context.createOscillator();
      const gainNode = this.context.createGain();

      const offset = this.getRandomOffset(40);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(550 + offset, this.context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120 + offset / 5, this.context.currentTime + 0.05);

      gainNode.gain.setValueAtTime(0.18, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.005, this.context.currentTime + 0.05);

      this.createWarmChain(osc, gainNode, 1500);

      osc.start();
      osc.stop(this.context.currentTime + 0.05);
    } catch (e) {
      // ignore
    }
  }

  playHover() {
    if (!this.enabled) return;
    this.init();
    if (!this.context) return;
    
    try {
      const osc = this.context.createOscillator();
      const gainNode = this.context.createGain();

      const offset = this.getRandomOffset(20);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1100 + offset, this.context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(950 + offset, this.context.currentTime + 0.03);

      gainNode.gain.setValueAtTime(0.04, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.03);

      this.createWarmChain(osc, gainNode, 1600);

      osc.start();
      osc.stop(this.context.currentTime + 0.03);
    } catch (e) { /* ignore */ }
  }

  playTransition() {
    if (!this.enabled) return;
    this.init();
    if (!this.context) return;
    
    try {
      const osc = this.context.createOscillator();
      const gainNode = this.context.createGain();

      const offset = this.getRandomOffset(30);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180 + offset, this.context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(750 + offset, this.context.currentTime + 0.15);

      gainNode.gain.setValueAtTime(0.08, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.008, this.context.currentTime + 0.15);

      this.createWarmChain(osc, gainNode, 1400);

      osc.start();
      osc.stop(this.context.currentTime + 0.15);
    } catch (e) { /* ignore */ }
  }

  playAdd() {
    if (!this.enabled) return;
    this.init();
    if (!this.context) return;
    
    try {
      const osc = this.context.createOscillator();
      const gainNode = this.context.createGain();

      const offset = this.getRandomOffset(30);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380 + offset, this.context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1150 + offset, this.context.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.12, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.1);

      this.createWarmChain(osc, gainNode, 1800);

      osc.start();
      osc.stop(this.context.currentTime + 0.1);
    } catch (e) { /* ignore */ }
  }

  playRemove() {
    if (!this.enabled) return;
    this.init();
    if (!this.context) return;
    
    try {
      const osc = this.context.createOscillator();
      const gainNode = this.context.createGain();

      const offset = this.getRandomOffset(40);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750 + offset, this.context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180 + offset / 4, this.context.currentTime + 0.15);

      gainNode.gain.setValueAtTime(0.12, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.15);

      this.createWarmChain(osc, gainNode, 1400);

      osc.start();
      osc.stop(this.context.currentTime + 0.15);
    } catch (e) { /* ignore */ }
  }

  playError() {
    if (!this.enabled) return;
    this.init();
    if (!this.context) return;
    
    try {
      const osc = this.context.createOscillator();
      const gainNode = this.context.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, this.context.currentTime);
      osc.frequency.linearRampToValueAtTime(90, this.context.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.12, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.2);

      this.createWarmChain(osc, gainNode, 800);

      osc.start();
      osc.stop(this.context.currentTime + 0.2);
    } catch (e) { /* ignore */ }
  }

  playSuccess() {
    if (!this.enabled) return;
    this.init();
    if (!this.context) return;

    try {
      const osc = this.context.createOscillator();
      const gainNode = this.context.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, this.context.currentTime);
      osc.frequency.setValueAtTime(580, this.context.currentTime + 0.1);
      osc.frequency.exponentialRampToValueAtTime(950, this.context.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.08, this.context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, this.context.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.008, this.context.currentTime + 0.3);

      this.createWarmChain(osc, gainNode, 1600);

      osc.start();
      osc.stop(this.context.currentTime + 0.3);
    } catch (e) {
      // ignore
    }
  }

  playLaunch() {
    if (!this.enabled) return;
    this.init();
    if (!this.context) return;

    try {
      // First rising tone
      const osc1 = this.context.createOscillator();
      const gain1 = this.context.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(280, this.context.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(750, this.context.currentTime + 0.3);
      gain1.gain.setValueAtTime(0.0, this.context.currentTime);
      gain1.gain.linearRampToValueAtTime(0.15, this.context.currentTime + 0.1);
      gain1.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.4);
      
      this.createWarmChain(osc1, gain1, 1500);
      
      osc1.start(this.context.currentTime);
      osc1.stop(this.context.currentTime + 0.4);

      // Second harmonic tone
      const osc2 = this.context.createOscillator();
      const gain2 = this.context.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(580, this.context.currentTime + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(1150, this.context.currentTime + 0.4);
      gain2.gain.setValueAtTime(0.0, this.context.currentTime + 0.15);
      gain2.gain.linearRampToValueAtTime(0.1, this.context.currentTime + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.6);
      
      this.createWarmChain(osc2, gain2, 1800);
      
      osc2.start(this.context.currentTime + 0.15);
      osc2.stop(this.context.currentTime + 0.6);
    } catch (e) {
      // ignore
    }
  }
}

export const sounds = new SoundSystem();
