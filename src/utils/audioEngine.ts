class AudioEngine {
  private ctx: AudioContext | null = null;
  private isBinauralPlaying = false;
  private isMelodyPlaying = false;
  private melodyIntervalId: any = null;

  // Binaural nodes
  private oscL: OscillatorNode | null = null;
  private oscR: OscillatorNode | null = null;
  private gainL: GainNode | null = null;
  private gainR: GainNode | null = null;
  private masterGain: GainNode | null = null;

  // Sound channels (Wind, Waves, Rain, Campfire)
  private channels: { [id: string]: { node: AudioNode | null; gain: GainNode | null; timer?: any } } = {};

  // Settings
  private currentInstrument: 'harp' | 'bell' | 'bowl' | 'piano' = 'bowl';
  private currentPurpose: 'sleep' | 'focus' | 'rest' | 'energy' | 'wuyin' = 'rest';
  
  // Custom melody parameters
  private pentatonic = [220.00, 246.94, 277.18, 329.63, 392.00, 440.00, 493.88, 554.37, 659.25, 783.99, 880.00];

  init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.error('Failed to initialize AudioContext', e);
    }
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- BRAINWAVE SIMULATOR (Binaural Beats) ---
  // Sleep -> Delta/Theta (4Hz or 6Hz)
  // Focus -> Alpha/Beta (10Hz or 15Hz)
  // Rest -> Theta (7Hz)
  // Energy -> Gamma (30Hz)
  // Wuyin -> Traditional Harmonic tuning (5.28Hz)
  updateBrainwave(purpose: 'sleep' | 'focus' | 'rest' | 'energy' | 'wuyin', volume = 0.3) {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    this.currentPurpose = purpose;

    // Determine frequencies
    const baseFreq = 180; // Soothing low frequency
    let offset = 6; // Rest/Relaxation
    if (purpose === 'sleep') offset = 4; // Delta
    else if (purpose === 'focus') offset = 10; // Alpha
    else if (purpose === 'energy') offset = 14; // Beta
    else if (purpose === 'wuyin') offset = 5.28; // Traditional Chinese healing frequency


    if (this.isBinauralPlaying) {
      if (this.oscL && this.oscR) {
        this.oscL.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        this.oscR.frequency.setValueAtTime(baseFreq + offset, this.ctx.currentTime);
      }
      if (this.gainL && this.gainR) {
        // Subtle volume
        const targetVol = volume * 0.15;
        this.gainL.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + 1);
        this.gainR.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + 1);
      }
    } else {
      // Start Binaural
      const merger = this.ctx.createChannelMerger(2);

      this.oscL = this.ctx.createOscillator();
      this.oscR = this.ctx.createOscillator();
      
      this.oscL.type = 'sine';
      this.oscR.type = 'sine';

      this.oscL.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      this.oscR.frequency.setValueAtTime(baseFreq + offset, this.ctx.currentTime);

      this.gainL = this.ctx.createGain();
      this.gainR = this.ctx.createGain();

      const targetVol = volume * 0.15;
      this.gainL.gain.setValueAtTime(0, this.ctx.currentTime);
      this.gainL.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + 1);

      this.gainR.gain.setValueAtTime(0, this.ctx.currentTime);
      this.gainR.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + 1);

      // Connect L/R to merger
      this.oscL.connect(this.gainL);
      this.oscR.connect(this.gainR);

      this.gainL.connect(merger, 0, 0);
      this.gainR.connect(merger, 0, 1);

      merger.connect(this.masterGain);

      this.oscL.start();
      this.oscR.start();

      this.isBinauralPlaying = true;
    }
  }

  stopBrainwave() {
    if (this.oscL) {
      try { this.oscL.stop(); } catch (e) {}
      this.oscL = null;
    }
    if (this.oscR) {
      try { this.oscR.stop(); } catch (e) {}
      this.oscR = null;
    }
    this.isBinauralPlaying = false;
  }

  // --- WHITE NOISE GENERATORS ---
  // Programmatic generation of Rain, Wind, Sea Waves, and Bonfire.
  // This means zero media resource loading, fully offline, highly responsive.
  setNoiseVolume(noiseId: string, isActive: boolean, volume: number) {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    if (!isActive || volume === 0) {
      // Stop channel
      this.stopNoise(noiseId);
      return;
    }

    const targetGainVal = (volume / 100) * 1.6;

    if (this.channels[noiseId]) {
      // Channel exists, ramp volume
      const chan = this.channels[noiseId];
      if (chan.gain) {
        chan.gain.gain.linearRampToValueAtTime(targetGainVal, this.ctx.currentTime + 0.5);
      }
      return;
    }

    // Create custom synthesizer nodes for specific white noise
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(targetGainVal, this.ctx.currentTime + 1);
    gainNode.connect(this.masterGain);

    let noiseNode: AudioNode | null = null;

    if (noiseId === 'waves') {
      // Sea Waves: simulated using band-passed pink noise modulated by a very low LFO
      noiseNode = this.createWavesNode(gainNode);
    } else if (noiseId === 'rain') {
      // Rain: light white noise with high-pass filter
      noiseNode = this.createRainNode(gainNode);
    } else if (noiseId === 'wind') {
      // Wind: filtered pink noise with moving bandpass filter frequency
      noiseNode = this.createWindNode(gainNode);
    } else if (noiseId === 'campfire') {
      // Campfire: low rumble + crackle transients
      noiseNode = this.createCampfireNode(gainNode);
    } else {
      // Fallback simple white noise
      noiseNode = this.createWhiteNoiseNode(gainNode);
    }

    this.channels[noiseId] = {
      node: noiseNode,
      gain: gainNode
    };
  }

  private stopNoise(id: string) {
    const chan = this.channels[id];
    if (chan) {
      if (chan.gain && this.ctx) {
        const currentGain = chan.gain.gain.value;
        chan.gain.gain.setValueAtTime(currentGain, this.ctx.currentTime);
        chan.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
      }
      
      setTimeout(() => {
        if (id === 'waves' && chan.timer) {
          clearInterval(chan.timer);
        }
        // Cleanup nodes
        try {
          if (chan.node && (chan.node as any).stop) {
            (chan.node as any).stop();
          }
        } catch (e) {}
        delete this.channels[id];
      }, 600);
    }
  }

  // --- AUDIO SYNTHS ---
  private createWhiteBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('Uninit');
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  }

  private createPinkBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('Uninit');
    const bufferSize = 2 * this.ctx.sampleRate;
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
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.45; // estimate
      b6 = white * 0.115926;
    }
    return noiseBuffer;
  }

  private createWhiteNoiseNode(target: AudioNode): AudioNode {
    if (!this.ctx) throw new Error('Uninit');
    const source = this.ctx.createBufferSource();
    source.buffer = this.createWhiteBuffer();
    source.loop = true;
    source.connect(target);
    source.start();
    return source;
  }

  private createRainNode(target: AudioNode): AudioNode {
    if (!this.ctx) throw new Error('Uninit');
    const source = this.ctx.createBufferSource();
    source.buffer = this.createPinkBuffer();
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.4, this.ctx.currentTime);

    const filterHigh = this.ctx.createBiquadFilter();
    filterHigh.type = 'highpass';
    filterHigh.frequency.setValueAtTime(800, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(filterHigh);
    filterHigh.connect(target);

    source.start();
    return source;
  }

  private createWindNode(target: AudioNode): AudioNode {
    if (!this.ctx) throw new Error('Uninit');
    const source = this.ctx.createBufferSource();
    source.buffer = this.createPinkBuffer();
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    // Dynamic wind swelling LFO simulation
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // very slow sweep
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(180, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    source.connect(filter);
    filter.connect(target);

    lfo.start();
    source.start();
    return source;
  }

  private createWavesNode(target: AudioNode): AudioNode {
    if (!this.ctx) throw new Error('Uninit');
    const source = this.ctx.createBufferSource();
    source.buffer = this.createPinkBuffer();
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);

    const gainModulator = this.ctx.createGain();
    gainModulator.gain.setValueAtTime(0.1, this.ctx.currentTime);

    // Wave tide lfo: rise and fall every 6 seconds
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime); // 6.6 sec wave period
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(gainModulator.gain);

    source.connect(filter);
    filter.connect(gainModulator);
    gainModulator.connect(target);

    lfo.start();
    source.start();
    return source;
  }

  private createCampfireNode(target: AudioNode): AudioNode {
    if (!this.ctx) throw new Error('Uninit');
    const source = this.ctx.createBufferSource();
    source.buffer = this.createPinkBuffer();
    source.loop = true;

    // Fire low rumble
    const filterLow = this.ctx.createBiquadFilter();
    filterLow.type = 'lowpass';
    filterLow.frequency.setValueAtTime(120, this.ctx.currentTime);

    // Crackle node generator
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2.5, this.ctx.currentTime); // crackle cadence
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createWhiteBuffer();
    noise.loop = true;

    const gate = this.ctx.createGain();
    gate.gain.setValueAtTime(0, this.ctx.currentTime);

    // Modulate crackles
    const crackleFilter = this.ctx.createBiquadFilter();
    crackleFilter.type = 'bandpass';
    crackleFilter.frequency.setValueAtTime(2200, this.ctx.currentTime);
    crackleFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    source.connect(filterLow);
    filterLow.connect(target);

    noise.connect(gate);
    gate.connect(crackleFilter);
    crackleFilter.connect(target);

    // Quick randomized trigger simulation
    const interval = setInterval(() => {
      if (this.ctx && Math.random() > 0.4) {
        const time = this.ctx.currentTime;
        gate.gain.setValueAtTime(0.06 * Math.random(), time);
        gate.gain.exponentialRampToValueAtTime(0.0001, time + 0.05 + Math.random() * 0.1);
      }
    }, 150);

    // Save timer on channel to clear
    const campfireChannel: any = source;
    campfireChannel.timer = interval;

    source.start();
    noise.start();
    return source;
  }

  // --- MELODY SYNTHESIZER ---
  // Periodically plays soothing notes from pentatonic scale with selected instrument
  playMelody(instrument: 'harp' | 'bell' | 'bowl' | 'piano', intervalMs = 2800) {
    this.ensureContext();
    this.currentInstrument = instrument;
    
    if (this.isMelodyPlaying) {
      clearInterval(this.melodyIntervalId);
    }

    this.isMelodyPlaying = true;
    
    const triggerNote = () => {
      if (!this.ctx || !this.isMelodyPlaying) return;
      
      // select random note
      const index = Math.floor(Math.random() * this.pentatonic.length);
      const freq = this.pentatonic[index];
      
      this.playInstrumentNote(this.currentInstrument, freq);
    };

    triggerNote();
    this.melodyIntervalId = setInterval(triggerNote, intervalMs);
  }

  stopMelody() {
    this.isMelodyPlaying = false;
    if (this.melodyIntervalId) {
      clearInterval(this.melodyIntervalId);
      this.melodyIntervalId = null;
    }
  }

  updateInstrument(instrument: 'harp' | 'bell' | 'bowl' | 'piano') {
    this.currentInstrument = instrument;
    if (this.isMelodyPlaying) {
      this.playMelody(instrument);
    }
  }

  playInstrumentNote(instrument: string, freq: number) {
    if (!this.ctx || !this.masterGain) return;
    
    const now = this.ctx.currentTime;
    
    if (instrument === 'bowl') {
      // Singing bowl sound: fundamental + overtones + long fading beats
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const osc3 = this.ctx.createOscillator();
      
      const gain1 = this.ctx.createGain();
      const gain2 = this.ctx.createGain();
      const gain3 = this.ctx.createGain();
      
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 1.5, now); // perfect fifth overtone
      osc3.frequency.setValueAtTime(freq * 2.01, now); // octave + subtle beat frequency
      
      // Long Tibetan amplitude swell & decay
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.08, now + 0.5);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 5.0);

      gain2.gain.setValueAtTime(0, now);
      gain2.gain.linearRampToValueAtTime(0.04, now + 0.8);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 4.0);

      gain3.gain.setValueAtTime(0, now);
      gain3.gain.linearRampToValueAtTime(0.02, now + 0.4);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

      // Simple vibrato (LFO)
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(1.5, now); // 1.5Hz pitch wiggle
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(1.2, now);

      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);

      osc1.connect(gain1);
      osc2.connect(gain2);
      osc3.connect(gain3);

      gain1.connect(this.masterGain);
      gain2.connect(this.masterGain);
      gain3.connect(this.masterGain);

      lfo.start();
      osc1.start();
      osc2.start();
      osc3.start();

      osc1.stop(now + 5.2);
      osc2.stop(now + 5.2);
      osc3.stop(now + 5.2);
      try { lfo.stop(now + 5.2); } catch(e) {}
    } 
    else if (instrument === 'harp') {
      // Harp pluck: fast attack, medium ring, decay echo delay
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.8);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02); // rapid pluck
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

      // Feedback delay loop
      const delay = this.ctx.createDelay();
      delay.delayTime.setValueAtTime(0.35, now); // 350ms echo
      const delayGain = this.ctx.createGain();
      delayGain.gain.setValueAtTime(0.4, now); // 40% feedback

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      // Delay wiring
      gain.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(delay); // feedback loop
      delayGain.connect(this.masterGain); // echo output

      osc.start();
      osc.stop(now + 2.8);
    } 
    else if (instrument === 'bell') {
      // Celestial Bells: high pitch, quick chime attack, metallic sound
      const osc = this.ctx.createOscillator();
      const overtone = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const gainOver = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 2.0, now); // pitch octaves higher
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(freq * 3.33, now); // metallic chord

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

      gainOver.gain.setValueAtTime(0, now);
      gainOver.gain.linearRampToValueAtTime(0.03, now + 0.01);
      gainOver.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

      osc.connect(gain);
      overtone.connect(gainOver);

      gain.connect(this.masterGain);
      gainOver.connect(this.masterGain);

      osc.start();
      overtone.start();

      osc.stop(now + 3.2);
      overtone.stop(now + 3.2);
    }
    else {
      // Calm ambient piano
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.08); // softer attack
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(now + 2.2);
    }
  }

  // --- SPECIAL INTERACTIVE TOOLS ---
  
  // 1. ELECTRONIC WOODEN FISH (电子木鱼)
  // Sharp structural pitch smack (decaying instantly)
  strikeWoodenFish() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    // Mid pitch resonance of real hollow mahogany fish block
    osc.frequency.setValueAtTime(175, now); // 175 Hz base thud

    // High frequency knock transient to make it mechanical and satisfying
    const transientOsc = this.ctx.createOscillator();
    const transientGain = this.ctx.createGain();
    transientOsc.type = 'triangle';
    transientOsc.frequency.setValueAtTime(650, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);

    // Quick thud envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.40, now + 0.002); // immediate hit
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28); // hollow wood block fast slam

    // Transient envelope (extremely short click, 20ms)
    transientGain.gain.setValueAtTime(0, now);
    transientGain.gain.linearRampToValueAtTime(0.15, now + 0.001);
    transientGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    transientOsc.connect(transientGain);
    transientGain.connect(this.masterGain);

    osc.start();
    transientOsc.start();

    osc.stop(now + 0.35);
    transientOsc.stop(now + 0.35);
  }

  // 2. TIBETAN SINGING BOWL (磬/钵)
  // Real-time brass bowl tap: deep 4-7 second shimmering wash of overtones
  strikeSingingBowl() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    
    // Combining 4 overtones for a deep rich acoustic harmony
    const frequencies = [160, 240, 320, 640]; // Solfeggio 160Hz healing bar
    const volumes = [0.28, 0.14, 0.09, 0.04];
    const decays = [7.0, 5.5, 4.0, 2.5];

    frequencies.forEach((f, idx) => {
      if (!this.ctx || !this.masterGain) return;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      // Subtle frequency tremor (vibrato) for organic beat effect
      const tremor = this.ctx.createOscillator();
      tremor.frequency.setValueAtTime(1.1 + idx * 0.4, now); // beats of phase alignment
      const tremorGain = this.ctx.createGain();
      tremorGain.gain.setValueAtTime(0.8, now);

      tremor.connect(tremorGain);
      tremorGain.connect(osc.frequency);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volumes[idx], now + 0.05); // slight rise
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decays[idx]);

      osc.connect(gain);
      gain.connect(this.masterGain);

      tremor.start();
      osc.start();

      tremor.stop(now + decays[idx] + 0.2);
      osc.stop(now + decays[idx] + 0.2);
    });
  }

  // Shut down all generators
  stopAll() {
    this.stopBrainwave();
    this.stopMelody();
    Object.keys(this.channels).forEach(id => this.stopNoise(id));
  }
}

export const audioEngine = new AudioEngine();
