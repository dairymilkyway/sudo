export class SoundFX {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Keyboard typing click
  public playKeyClick(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400 + Math.random() * 600, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  }

  // Mechanical drive insert / dock latch sound
  public playDriveInsert(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  }

  // Tactile industrial mechanical switch click (Dry-run safe)
  public playEmptyClick(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    // 1. Sharp mechanical leaf spring snap
    const snap = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snap.type = 'triangle';
    snap.frequency.setValueAtTime(2400, ctx.currentTime);
    snap.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.025);
    snapGain.gain.setValueAtTime(0.4, ctx.currentTime);
    snapGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);
    snap.connect(snapGain);
    snapGain.connect(ctx.destination);
    snap.start();
    snap.stop(ctx.currentTime + 0.025);

    // 2. Heavy switch bottom-out thud
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'square';
    thud.frequency.setValueAtTime(140, ctx.currentTime);
    thud.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.06);
    thudGain.gain.setValueAtTime(0.35, ctx.currentTime);
    thudGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.start();
    thud.stop(ctx.currentTime + 0.06);
  }

  // Stepper motor rotary dial ratcheting sound
  public playSpin(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const steps = 10;
    for (let i = 0; i < steps; i++) {
      setTimeout(() => {
        const c = this.getContext();
        if (!c) return;
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800 + i * 40, c.currentTime);
        g.gain.setValueAtTime(0.06, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.02);
        osc.connect(g);
        g.connect(c.destination);
        osc.start();
        osc.stop(c.currentTime + 0.02);
      }, i * 65);
    }
  }

  // High-voltage electrical arc explosion & capacitor blowout
  public playBang(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    // High voltage arc noise burst
    const bufferSize = ctx.sampleRate * 0.45;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.45);
    filter.Q.setValueAtTime(3.0, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.9, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 0.45);

    // Deep destructive sub-bass blowout
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.frequency.setValueAtTime(110, ctx.currentTime);
    sub.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.4);
    subGain.gain.setValueAtTime(0.85, ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start();
    sub.stop(ctx.currentTime + 0.4);
  }

  // Glitch crackle during death wipe
  public playGlitchCrackle(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80 + Math.random() * 500, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  // Infamous Windows BSOD audio buffer freeze loop ("BRRRRRRR")
  public playBSODAudioFreeze(durationMs = 1600): void {
    const ctx = this.getContext();
    if (!ctx) return;

    // Distorted buzzy pulse wave at ~110Hz (repeating DMA audio block)
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const waveShaper = ctx.createWaveShaper();

    // Generate distortion curve
    const nSamples = 256;
    const curve = new Float32Array(nSamples);
    for (let i = 0; i < nSamples; i++) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + 20) * x * 20 * (Math.PI / 180)) / (Math.PI + 20 * Math.abs(x));
    }
    waveShaper.curve = curve;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(112, ctx.currentTime);

    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.setValueAtTime(0.4, ctx.currentTime + durationMs / 1000 - 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

    osc.connect(waveShaper);
    osc2.connect(waveShaper);
    waveShaper.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc2.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
    osc2.stop(ctx.currentTime + durationMs / 1000);
  }

  // Analog CRT raster failure: sync squeal, high-voltage coil pop, and vacuum tube collapse
  public playCRTRasterCollapse(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    // 1. Resonant horizontal deflection coil squeal dropping in pitch
    const squeal = ctx.createOscillator();
    const squealGain = ctx.createGain();
    squeal.type = 'sawtooth';
    squeal.frequency.setValueAtTime(12000, ctx.currentTime);
    squeal.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.85);

    squealGain.gain.setValueAtTime(0.3, ctx.currentTime);
    squealGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);

    squeal.connect(squealGain);
    squealGain.connect(ctx.destination);
    squeal.start();
    squeal.stop(ctx.currentTime + 0.85);

    // 2. High-voltage arc crackle / discharge
    const bufferSize = ctx.sampleRate * 0.35;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.09));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.35);

    // 3. Low hum power transformer collapse
    const hum = ctx.createOscillator();
    const humGain = ctx.createGain();
    hum.type = 'sine';
    hum.frequency.setValueAtTime(60, ctx.currentTime);
    humGain.gain.setValueAtTime(0.5, ctx.currentTime);
    humGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    hum.connect(humGain);
    humGain.connect(ctx.destination);
    hum.start();
    hum.stop(ctx.currentTime + 0.9);
  }

  // Heavy physical desk / keyboard impact when opponent slumps forward
  public playOpponentDeskSlap(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    // Heavy wooden desk thud
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(95, ctx.currentTime);
    thud.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.16);

    thudGain.gain.setValueAtTime(0.7, ctx.currentTime);
    thudGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.start();
    thud.stop(ctx.currentTime + 0.16);

    // Keyboard clatter noise
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, ctx.currentTime);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.25, ctx.currentTime);
    nGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.08);
  }

  // Crisp mechanical relay click for hardware UI interactions
  public playRelayClick(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.015);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.015);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.015);
  }
}
