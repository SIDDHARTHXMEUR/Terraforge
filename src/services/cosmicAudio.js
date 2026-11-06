// Cinematic film audio synthesizer using Web Audio API
// Generates deep cosmic low-frequency ambience, solar rumble, and spatial transitions
// without any external copyright audio files.

class CosmicAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.subDroneGain = null;
    this.solarRumbleGain = null;
    this.shimmerGain = null;
    this.initialized = false;
    this.muted = true; // muted by default until user toggles or enables
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.45, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // 1. Deep Sub-Bass Cosmic Drone (40Hz - 65Hz)
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

      const subFilter = this.ctx.createBiquadFilter();
      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(110, this.ctx.currentTime);

      this.subDroneGain = this.ctx.createGain();
      this.subDroneGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

      subOsc.connect(subFilter);
      subFilter.connect(this.subDroneGain);
      this.subDroneGain.connect(this.masterGain);
      subOsc.start();

      // 2. Solar Plasma Wind & Rumble (Filtered Brownian/Pink Noise)
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(120, this.ctx.currentTime);
      noiseFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      this.solarRumbleGain = this.ctx.createGain();
      this.solarRumbleGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(this.solarRumbleGain);
      this.solarRumbleGain.connect(this.masterGain);
      noiseSource.start();

      // 3. Ethereal High Shimmer (Ring resonance / ice giants)
      const shimmerOsc = this.ctx.createOscillator();
      shimmerOsc.type = 'triangle';
      shimmerOsc.frequency.setValueAtTime(280, this.ctx.currentTime);

      const shimmerFilter = this.ctx.createBiquadFilter();
      shimmerFilter.type = 'highpass';
      shimmerFilter.frequency.setValueAtTime(450, this.ctx.currentTime);

      this.shimmerGain = this.ctx.createGain();
      this.shimmerGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

      shimmerOsc.connect(shimmerFilter);
      shimmerFilter.connect(this.shimmerGain);
      this.shimmerGain.connect(this.masterGain);
      shimmerOsc.start();

      this.initialized = true;
    } catch {
      // AudioContext policy: will activate upon user gesture
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (!this.initialized && !muted) {
      this.init();
    }
    if (this.ctx && this.masterGain) {
      if (this.ctx.state === 'suspended' && !muted) {
        this.ctx.resume();
      }
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.45, t + 0.6);
    }
  }

  // Modulate sound design according to active cinematic scene
  setSceneAudio(sceneId) {
    if (!this.initialized || !this.ctx || this.muted) return;
    const t = this.ctx.currentTime;

    if (sceneId === 'sun') {
      // Powerful roaring plasma solar rumble
      this.solarRumbleGain?.gain.linearRampToValueAtTime(0.35, t + 1.2);
      this.subDroneGain?.gain.linearRampToValueAtTime(0.40, t + 1.2);
      this.shimmerGain?.gain.linearRampToValueAtTime(0.01, t + 1.2);
    } else if (sceneId === 'saturn' || sceneId === 'uranus' || sceneId === 'neptune') {
      // Ethereal ice shimmer and vast ring resonance
      this.solarRumbleGain?.gain.linearRampToValueAtTime(0.03, t + 1.2);
      this.subDroneGain?.gain.linearRampToValueAtTime(0.25, t + 1.2);
      this.shimmerGain?.gain.linearRampToValueAtTime(0.12, t + 1.2);
    } else if (sceneId === 'void') {
      // Extreme near-silence, sub-bass pulse only
      this.solarRumbleGain?.gain.linearRampToValueAtTime(0.01, t + 2.0);
      this.subDroneGain?.gain.linearRampToValueAtTime(0.15, t + 2.0);
      this.shimmerGain?.gain.linearRampToValueAtTime(0.01, t + 2.0);
    } else {
      // Standard deep space ambience
      this.solarRumbleGain?.gain.linearRampToValueAtTime(0.06, t + 1.0);
      this.subDroneGain?.gain.linearRampToValueAtTime(0.30, t + 1.0);
      this.shimmerGain?.gain.linearRampToValueAtTime(0.04, t + 1.0);
    }
  }
}

export const cosmicAudio = new CosmicAudioEngine();

