// Premium Web Audio API synthesizer for high-fidelity mobile app sounds
class AudioEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (browser security autoplays blocking)
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Soft futuristic click/tap sound
  playClick() {
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("Audio Context blocked or unsupported:", e);
    }
  }

  // Satisfying chime for registration / profit locking
  playSaleSuccess() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      
      // Multi-note arpeggio chord (fá sustenido, lá, dó sustenido) -> E-major/A-major premium tone
      const notes = [440, 554, 659, 880]; // A4, C#5, E5, A5
      notes.forEach((freq, index) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + index * 0.06);
        
        gain.gain.setValueAtTime(0, now + index * 0.06);
        gain.gain.linearRampToValueAtTime(0.1, now + index * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.06 + 0.4);
        
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + index * 0.06);
        osc.stop(now + index * 0.06 + 0.5);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  // Futuristic level-up / Goal Accomplished fanfare sound
  playGoalReached() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Synthesize a sci-fi cyber beam ascending chime
      const baseFreqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Bright C Major)
      
      baseFreqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + idx * 0.08 + 0.3);
        
        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.55);
        
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.6);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  // Caution warning chime
  playStagnationAlert() {
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(330, this.ctx.currentTime); // E4
      osc.frequency.setValueAtTime(300, this.ctx.currentTime + 0.15); // Eb4
      
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      
      // Lowpass filter for warble
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1000;
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn(e);
    }
  }
}

export const revendaxAudio = new AudioEngine();
