/**
 * AUDIO EFFECTS MANAGER
 * Web Audio API for sound effects with fallback and memory safety.
 */

class AudioEffectsManager {
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      volume: config.volume ?? 0.5,
      sounds: config.sounds || {}
    };

    this._ctx = null;
    this._buffers = {};
    this._sources = new Set();
    this._isDestroyed = false;

    // Initialize Web Audio API
    if (this.config.enabled && ('AudioContext' in window || 'webkitAudioContext' in window)) {
      try {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        this._gainNode = this._ctx.createGain();
        this._gainNode.gain.value = this.config.volume;
        this._gainNode.connect(this._ctx.destination);
      } catch (e) {
        window.debugEffects && window.debugEffects('audio_init_failed', { error: e.message });
        this.config.enabled = false;
      }
    }
  }

  /**
   * Load sound from URL (returns promise)
   */
  async loadSound(name, url) {
    if (!this._ctx || this._isDestroyed) return null;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this._ctx.decodeAudioData(arrayBuffer);
      this._buffers[name] = audioBuffer;
      window.debugEffects && window.debugEffects('audio_loaded', { name, url });
      return audioBuffer;
    } catch (e) {
      window.debugEffects && window.debugEffects('audio_load_failed', { name, error: e.message });
      return null;
    }
  }

  /**
   * Play sound by name
   */
  play(name) {
    if (!this._ctx || !this.config.enabled || this._isDestroyed) return;

    const buffer = this._buffers[name];
    if (!buffer) {
      window.debugEffects && window.debugEffects('audio_not_loaded', { name });
      return;
    }

    try {
      const source = this._ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this._gainNode);
      
      this._sources.add(source);
      source.onended = () => this._sources.delete(source);
      
      source.start(0);
      window.debugEffects && window.debugEffects('audio_played', { name });
    } catch (e) {
      window.debugEffects && window.debugEffects('audio_play_failed', { name, error: e.message });
    }
  }

  /**
   * Set volume (0.0 - 1.0)
   */
  setVolume(value) {
    if (this._gainNode) {
      this._gainNode.gain.value = Math.max(0, Math.min(1, value));
      this.config.volume = value;
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this._isDestroyed = true;

    // Stop all playing sources
    this._sources.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
    });
    this._sources.clear();

    // Close audio context
    if (this._ctx && this._ctx.state !== 'closed') {
      this._ctx.close();
    }

    window.debugEffects && window.debugEffects('audio_destroyed');
  }
}
