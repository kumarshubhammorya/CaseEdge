export class SoundSystem {
  context: AudioContext | null = null;
  enabled: boolean = true;

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

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.05);

      gainNode.gain.setValueAtTime(0.2, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);

      osc.connect(gainNode);
      gainNode.connect(this.context.destination);

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

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, this.context.currentTime + 0.03);

      gainNode.gain.setValueAtTime(0.05, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.03);

      osc.connect(gainNode);
      gainNode.connect(this.context.destination);

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

      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, this.context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.context.currentTime + 0.15);

      gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);

      osc.connect(gainNode);
      gainNode.connect(this.context.destination);

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

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.context.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.15, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.1);

      osc.connect(gainNode);
      gainNode.connect(this.context.destination);

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

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.15);

      gainNode.gain.setValueAtTime(0.15, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.15);

      osc.connect(gainNode);
      gainNode.connect(this.context.destination);

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

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.context.currentTime);
      osc.frequency.linearRampToValueAtTime(100, this.context.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.2);

      osc.connect(gainNode);
      gainNode.connect(this.context.destination);

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
      osc.frequency.setValueAtTime(400, this.context.currentTime);
      osc.frequency.setValueAtTime(600, this.context.currentTime + 0.1);
      osc.frequency.exponentialRampToValueAtTime(1000, this.context.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, this.context.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);

      osc.connect(gainNode);
      gainNode.connect(this.context.destination);

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
      osc1.frequency.setValueAtTime(300, this.context.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(800, this.context.currentTime + 0.3);
      gain1.gain.setValueAtTime(0.0, this.context.currentTime);
      gain1.gain.linearRampToValueAtTime(0.2, this.context.currentTime + 0.1);
      gain1.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.4);
      osc1.connect(gain1);
      gain1.connect(this.context.destination);
      osc1.start(this.context.currentTime);
      osc1.stop(this.context.currentTime + 0.4);

      // Second harmonic tone
      const osc2 = this.context.createOscillator();
      const gain2 = this.context.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(600, this.context.currentTime + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(1200, this.context.currentTime + 0.4);
      gain2.gain.setValueAtTime(0.0, this.context.currentTime + 0.15);
      gain2.gain.linearRampToValueAtTime(0.15, this.context.currentTime + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.6);
      osc2.connect(gain2);
      gain2.connect(this.context.destination);
      osc2.start(this.context.currentTime + 0.15);
      osc2.stop(this.context.currentTime + 0.6);
    } catch (e) {
      // ignore
    }
  }
}

export const sounds = new SoundSystem();
