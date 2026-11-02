/**
 * Maya Chen Portfolio — Premium Sound System
 * Noticeable cinematic ambient music + Generative Web Audio API drone & sound effects
 */

class SoundManager {
  constructor() {
    this.audioContext = null;
    this.ambientAudio = null;
    this.isMuted = true;
    this.targetVolume = 0.55; // Noticeable, immersive ambient volume
    this.lastHoverTime = 0;
    this.hoverThrottleMs = 85;

    // Generative Web Audio ambient drone nodes
    this.droneGain = null;
    this.droneOscillators = [];
    this.droneFilter = null;
    this.isDroneActive = false;

    // Pentatonic scale frequencies for harmonic chimes (C Major Pentatonic: C5, D5, E5, G5, A5, C6)
    this.scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    this.scaleIndex = 0;

    this.initAmbientAudio();
  }

  initAmbientAudio() {
    try {
      this.ambientAudio = new Audio();
      this.ambientAudio.loop = true;
      this.ambientAudio.volume = 0;
      this.ambientAudio.preload = 'auto';

      // Primary local asset with fallback
      this.ambientAudio.src = '/audio/ambient.mp3';

      // Fallback if local MP3 can't be decoded
      this.ambientAudio.onerror = () => {
        console.warn('Falling back to OGG ambient audio');
        this.ambientAudio.src = '/audio/ambient.ogg';
        if (!this.isMuted) {
          this.ambientAudio.play().catch(() => {});
        }
      };
    } catch (err) {
      console.warn('Ambient audio init error:', err);
    }
  }

  ensureAudioContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
  }

  // Starts noticeable ambient soundscape (Audio stream + gentle generative harmonic pad)
  enterWithSound() {
    this.isMuted = false;
    this.ensureAudioContext();

    // 1. Play the ambient music stream
    if (this.ambientAudio) {
      this.ambientAudio.play().then(() => {
        this.fadeAudioVolume(this.ambientAudio, this.targetVolume, 1000);
      }).catch((err) => {
        console.warn('Browser audio policy blocked direct playback, starting WebAudio fallback:', err);
        this.startAmbientDrone();
      });
    }

    // 2. Start generative background harmonic pad for spatial depth
    this.startAmbientDrone();

    // 3. Play entry chime
    this.playChimeSuccess();
    this.updateSoundToggles();
  }

  enterMuted() {
    this.isMuted = true;
    if (this.fadeAnimationId) {
      cancelAnimationFrame(this.fadeAnimationId);
      this.fadeAnimationId = null;
    }
    if (this.ambientAudio) {
      this.ambientAudio.pause();
      try {
        this.ambientAudio.volume = 0;
      } catch (_) {}
    }
    this.stopAmbientDrone();
    this.updateSoundToggles();
  }

  toggleSound() {
    this.isMuted = !this.isMuted;
    this.ensureAudioContext();

    if (this.isMuted) {
      // Mute ambient audio & drone
      if (this.ambientAudio) {
        this.fadeAudioVolume(this.ambientAudio, 0, 350, () => {
          this.ambientAudio.pause();
        });
      }
      this.stopAmbientDrone();
    } else {
      // Unmute & play noticeable ambient music & drone
      if (this.ambientAudio) {
        this.ambientAudio.play().then(() => {
          this.fadeAudioVolume(this.ambientAudio, this.targetVolume, 700);
        }).catch(() => {
          this.startAmbientDrone();
        });
      }
      this.startAmbientDrone();
      this.playChime(659.25, 0.15); // soft harmonic chime
    }

    this.updateSoundToggles();
    return !this.isMuted;
  }

  fadeAudioVolume(audio, targetVolume, durationMs, onComplete) {
    if (!audio) return;

    if (this.fadeAnimationId) {
      cancelAnimationFrame(this.fadeAnimationId);
      this.fadeAnimationId = null;
    }

    const startVolume = Math.max(0, Math.min(1, Number.isFinite(audio.volume) ? audio.volume : 0));
    const clampedTarget = Math.max(0, Math.min(1, Number.isFinite(targetVolume) ? targetVolume : 0));
    const startTime = performance.now();
    const duration = Math.max(durationMs || 300, 1);

    const ramp = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(Math.max(elapsed / duration, 0), 1);
      const rawVolume = startVolume + (clampedTarget - startVolume) * progress;
      const safeVolume = Math.max(0, Math.min(1, rawVolume));

      try {
        audio.volume = safeVolume;
      } catch (err) {
        console.warn('Volume set failed safely:', err);
      }

      if (progress < 1) {
        this.fadeAnimationId = requestAnimationFrame(ramp);
      } else {
        try {
          audio.volume = clampedTarget;
        } catch (_) {}
        this.fadeAnimationId = null;
        if (onComplete) onComplete();
      }
    };

    this.fadeAnimationId = requestAnimationFrame(ramp);
  }

  // Generative warm analog ambient drone in Web Audio API
  startAmbientDrone() {
    if (this.isDroneActive || this.isMuted || !this.audioContext) return;

    try {
      const ctx = this.audioContext;
      this.droneGain = ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.001, ctx.currentTime);
      // Gentle ramp for warm drone
      this.droneGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 2.0);

      this.droneFilter = ctx.createBiquadFilter();
      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.setValueAtTime(320, ctx.currentTime);

      // Low Frequency Oscillator for subtle breathing motion
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // 12.5s breath cycle
      lfoGain.gain.setValueAtTime(140, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(this.droneFilter.frequency);
      lfo.start();

      // Deep harmonic chord: A1 (55Hz), E2 (82.4Hz), A2 (110Hz), C#3 (138.6Hz)
      const droneNotes = [55.0, 82.41, 110.0, 138.59];
      this.droneOscillators = [];

      droneNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        // Subtle analog detune
        const detuneCents = (idx - 1.5) * 3.5;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.detune.setValueAtTime(detuneCents, ctx.currentTime);

        osc.connect(this.droneFilter);
        osc.start();
        this.droneOscillators.push(osc);
      });

      this.droneFilter.connect(this.droneGain);
      this.droneGain.connect(ctx.destination);
      this.isDroneActive = true;
    } catch (e) {
      console.warn('Could not start ambient drone:', e);
    }
  }

  stopAmbientDrone() {
    if (!this.isDroneActive || !this.droneGain || !this.audioContext) return;

    try {
      const ctx = this.audioContext;
      this.droneGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      setTimeout(() => {
        this.droneOscillators.forEach((osc) => {
          try { osc.stop(); osc.disconnect(); } catch (_) {}
        });
        this.droneOscillators = [];
        this.isDroneActive = false;
      }, 450);
    } catch (_) {
      this.isDroneActive = false;
    }
  }

  // Interactive Hover: delicate cinematic harmonic chime
  playHover() {
    if (this.isMuted) return;
    const now = performance.now();
    if (now - this.lastHoverTime < this.hoverThrottleMs) return;
    this.lastHoverTime = now;

    this.ensureAudioContext();
    if (!this.audioContext) return;

    const freq = this.scale[this.scaleIndex % this.scale.length];
    this.scaleIndex++;

    this.playChime(freq, 0.06, 0.18);
  }

  // Interactive Click: crisp tactile micro-click chime
  playClick() {
    if (this.isMuted) return;
    this.ensureAudioContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(920, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(460, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  // Harmonic Chime generator
  playChime(freq, volume = 0.08, duration = 0.35) {
    if (this.isMuted || !this.audioContext) return;

    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, ctx.currentTime);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  // Success arpeggio sequence
  playChimeSuccess() {
    if (this.isMuted) return;
    const chords = [523.25, 659.25, 783.99, 1046.50];
    chords.forEach((note, index) => {
      setTimeout(() => {
        this.playChime(note, 0.12, 0.5);
      }, index * 100);
    });
  }

  updateSoundToggles() {
    const toggleBtns = document.querySelectorAll('.sound-toggle-btn');
    toggleBtns.forEach((btn) => {
      const icon = btn.querySelector('i');
      const text = btn.querySelector('.sound-toggle-text');
      const wave = btn.querySelector('.sound-wave-indicator');

      if (this.isMuted) {
        if (icon) icon.className = 'fa-solid fa-volume-xmark';
        if (text) text.textContent = 'Muted';
        if (wave) wave.classList.remove('playing');
        btn.classList.remove('is-active');
        btn.setAttribute('aria-label', 'Sound is muted. Click to turn on ambient music.');
      } else {
        if (icon) icon.className = 'fa-solid fa-volume-high';
        if (text) text.textContent = 'Ambient Music';
        if (wave) wave.classList.add('playing');
        btn.classList.add('is-active');
        btn.setAttribute('aria-label', 'Ambient music is playing. Click to mute.');
      }
    });
  }
}

export const soundManager = new SoundManager();
