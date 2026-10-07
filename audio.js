// Romantic Web Audio Synthesizer for Ankita's Apology
// 100% self-contained, no external MP3 dependencies, works offline & reliably

class RomanticAudio {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.isMuted = false;
        this.isPlaying = false;
        this.bgmTimer = null;
        this.heartbeatTimer = null;
        this.isHeartbeatActive = false;
        this.heartbeatSpeed = 1000; // ms
    }

    init() {
        if (this.ctx) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            this.ctx = new AudioCtx();

            // Master Gain
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            // Music Gain
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
            this.musicGain.connect(this.masterGain);

            // SFX Gain
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
            this.sfxGain.connect(this.masterGain);
        } catch (e) {
            console.warn("Web Audio not available:", e);
        }
    }

    startBGM() {
        try {
            this.init();
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
            if (this.isPlaying || !this.ctx) return;
            this.isPlaying = true;
            this.playChordSequence();
        } catch (e) {
            console.warn("startBGM error:", e);
        }
    }

    playChordSequence() {
        if (!this.isPlaying || !this.ctx) return;

        // Romantic progressions (frequencies in Hz: F3, A3, C4, E4 -> C3, E3, G3, B3 -> D3, F3, A3, C4 -> Bb2, D3, F3, A3)
        const chords = [
            { pad: [174.61, 220.00, 261.63, 329.63], melody: [329.63, 349.23, 261.63, 220.00] }, // Fmaj7
            { pad: [130.81, 164.81, 196.00, 246.94], melody: [246.94, 261.63, 196.00, 164.81] }, // Cmaj7
            { pad: [146.83, 174.61, 220.00, 261.63], melody: [261.63, 293.66, 220.00, 174.61] }, // Dm7
            { pad: [116.54, 146.83, 174.61, 220.00], melody: [220.00, 246.94, 174.61, 146.83] }  // Bbmaj7
        ];

        let chordIndex = 0;

        const nextChord = () => {
            if (!this.isPlaying) return;
            const currentChord = chords[chordIndex % chords.length];
            this.playWarmPad(currentChord.pad, 4.0);

            // Play delicate piano melody notes spaced out
            currentChord.melody.forEach((freq, i) => {
                setTimeout(() => {
                    if (this.isPlaying) {
                        this.playPianoNote(freq, 0.25, 2.0);
                    }
                }, i * 900 + Math.random() * 200);
            });

            chordIndex++;
            this.bgmTimer = setTimeout(nextChord, 3800);
        };

        nextChord();
    }

    playWarmPad(freqs, duration) {
        if (!this.ctx || this.isMuted) return;
        try {
            const now = this.ctx.currentTime;

            freqs.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);

                osc.detune.setValueAtTime((Math.random() - 0.5) * 8, now);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(600, now);
                filter.frequency.exponentialRampToValueAtTime(1000, now + duration * 0.5);
                filter.frequency.exponentialRampToValueAtTime(500, now + duration);

                gain.gain.setValueAtTime(0.001, now);
                gain.gain.linearRampToValueAtTime(0.06, now + 1.2);
                gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.musicGain);

                osc.start(now);
                osc.stop(now + duration);
            });
        } catch (e) {}
    }

    playPianoNote(freq, velocity = 0.3, decay = 2.0) {
        if (!this.ctx || this.isMuted) return;
        try {
            const now = this.ctx.currentTime;

            const osc = this.ctx.createOscillator();
            const oscHarmonic = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            oscHarmonic.type = 'sine';
            oscHarmonic.frequency.setValueAtTime(freq * 2, now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1800, now);
            filter.frequency.exponentialRampToValueAtTime(400, now + decay);

            const harmGain = this.ctx.createGain();
            harmGain.gain.setValueAtTime(0.2, now);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(velocity * 0.15, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

            osc.connect(filter);
            oscHarmonic.connect(harmGain);
            harmGain.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            osc.start(now);
            oscHarmonic.start(now);
            osc.stop(now + decay);
            oscHarmonic.stop(now + decay);
        } catch (e) {}
    }

    playClickSound() {
        this.init();
        if (!this.ctx || this.isMuted) return;
        try {
            const now = this.ctx.currentTime;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1046.5, now); // C6
            osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now);
            osc.stop(now + 0.15);
        } catch (e) {}
    }

    playHeartbeat(isFast = false) {
        this.init();
        if (!this.ctx || this.isMuted) return;
        try {
            const now = this.ctx.currentTime;

            const thump = (time, baseFreq, vol) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(baseFreq, time);
                osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);

                gain.gain.setValueAtTime(vol, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

                osc.connect(gain);
                gain.connect(this.sfxGain);

                osc.start(time);
                osc.stop(time + 0.15);
            };

            thump(now, 75, 0.4);
            thump(now + 0.13, 65, 0.25);
        } catch (e) {}
    }

    startHeartbeatLoop(fast = false) {
        this.stopHeartbeatLoop();
        this.isHeartbeatActive = true;
        this.heartbeatSpeed = fast ? 450 : 1100;

        const beat = () => {
            if (!this.isHeartbeatActive) return;
            this.playHeartbeat(fast);
            this.heartbeatTimer = setTimeout(beat, this.heartbeatSpeed);
        };
        beat();
    }

    stopHeartbeatLoop() {
        this.isHeartbeatActive = false;
        if (this.heartbeatTimer) {
            clearTimeout(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    playExplosionSound() {
        this.init();
        if (!this.ctx || this.isMuted) return;
        try {
            const now = this.ctx.currentTime;

            const boomOsc = this.ctx.createOscillator();
            const boomGain = this.ctx.createGain();
            boomOsc.type = 'sine';
            boomOsc.frequency.setValueAtTime(140, now);
            boomOsc.frequency.exponentialRampToValueAtTime(30, now + 0.8);
            boomGain.gain.setValueAtTime(0.4, now);
            boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            boomOsc.connect(boomGain);
            boomGain.connect(this.sfxGain);
            boomOsc.start(now);
            boomOsc.stop(now + 0.8);

            const chimeNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
            chimeNotes.forEach((f, i) => {
                setTimeout(() => {
                    if (this.ctx && !this.isMuted) {
                        try {
                            const cNow = this.ctx.currentTime;
                            const osc = this.ctx.createOscillator();
                            const g = this.ctx.createGain();
                            osc.type = 'triangle';
                            osc.frequency.setValueAtTime(f, cNow);
                            g.gain.setValueAtTime(0.15, cNow);
                            g.gain.exponentialRampToValueAtTime(0.001, cNow + 0.8);
                            osc.connect(g);
                            g.connect(this.sfxGain);
                            osc.start(cNow);
                            osc.stop(cNow + 0.8);
                        } catch (e) {}
                    }
                }, i * 65);
            });
        } catch (e) {}
    }

    playSparkleChime() {
        this.init();
        if (!this.ctx || this.isMuted) return;
        try {
            const notes = [783.99, 987.77, 1174.66, 1567.98, 1975.53];
            notes.forEach((f, i) => {
                setTimeout(() => {
                    if (this.ctx && !this.isMuted) {
                        try {
                            const now = this.ctx.currentTime;
                            const osc = this.ctx.createOscillator();
                            const gain = this.ctx.createGain();
                            osc.type = 'sine';
                            osc.frequency.setValueAtTime(f, now);
                            gain.gain.setValueAtTime(0.08, now);
                            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                            osc.connect(gain);
                            gain.connect(this.sfxGain);
                            osc.start(now);
                            osc.stop(now + 0.5);
                        } catch (e) {}
                    }
                }, i * 80);
            });
        } catch (e) {}
    }

    playCelebrationFanfare() {
        this.init();
        if (!this.ctx || this.isMuted) return;
        try {
            const fanfare = [
                { f: 523.25, t: 0 },
                { f: 659.25, t: 150 },
                { f: 783.99, t: 300 },
                { f: 1046.50, t: 450 },
                { f: 1318.51, t: 600 },
                { f: 1567.98, t: 800 }
            ];
            fanfare.forEach(item => {
                setTimeout(() => {
                    if (this.ctx && !this.isMuted) {
                        try {
                            const now = this.ctx.currentTime;
                            const osc = this.ctx.createOscillator();
                            const gain = this.ctx.createGain();
                            osc.type = 'triangle';
                            osc.frequency.setValueAtTime(item.f, now);
                            gain.gain.setValueAtTime(0.18, now);
                            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
                            osc.connect(gain);
                            gain.connect(this.sfxGain);
                            osc.start(now);
                            osc.stop(now + 1.2);
                        } catch (e) {}
                    }
                }, item.t);
            });
        } catch (e) {}
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            try {
                this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
            } catch (e) {}
        }
        return this.isMuted;
    }
}

// Global instance
window.romanticAudio = new RomanticAudio();
