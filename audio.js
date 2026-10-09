// ============================================================================
// SPOTIFY-GRADE ROMANTIC AUDIO ENGINE FOR ANKITA'S APOLOGY
// Supports: Noormahal & Rab Wangu playlist, continuous seeking/scrubbing slider,
// instant autoplay with user interaction unlocks, volume & mute, loop,
// and high-fidelity Web Audio sound effects (sparkles, heartbeats, fanfares).
// ============================================================================

const ROMANTIC_PLAYLIST = [
    {
        id: 1,
        title: "Noormahal",
        artist: "Special Track",
        src: "music/noormahal.mp3",
        fallback: "noormahal.mp3",
        cover: "images/photo3.jpg",
        accent: "#F2C6A0"
    },
    {
        id: 2,
        title: "Rab Wangu",
        artist: "Jass Manak",
        src: "music/rab-wangu.mp3",
        fallback: "rab-wangu.mp3",
        cover: "images/photo1.jpg",
        accent: "#D94F70"
    }
];

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
}

class RomanticAudio {
    constructor() {
        // --- Web Audio SFX Synthesizer ---
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.heartbeatTimer = null;
        this.isHeartbeatActive = false;
        this.heartbeatSpeed = 1000;

        // --- Spotify Audio Player State ---
        this.playlist = ROMANTIC_PLAYLIST;
        this.currentIndex = 0;
        this.audio = typeof Audio !== "undefined" ? new Audio() : null;
        this.isStarted = false;
        this.isMuted = false;
        this.volume = 0.85;
        this.isLooping = true;
        this.isDraggingSeek = false;
        this.dragRatio = 0;
        this._hasInteractionTrigger = false;
        this._uiBound = false;

        if (this.audio) {
            this.audio.preload = "auto";
            this.audio.volume = this.volume;
            this.setupAudioEvents();
            this.loadTrack(0, false);
        }

        // Initialize when DOM is available
        if (typeof document !== "undefined") {
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", () => this.initUI());
            } else {
                this.initUI();
            }
        }
    }

    // ==========================================
    // Web Audio Synthesizer (SFX)
    // ==========================================
    init() {
        if (this.ctx) {
            if (this.ctx.state === "suspended") {
                this.ctx.resume().catch(() => {});
            }
            return;
        }
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            this.ctx = new AudioCtx();

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
            this.musicGain.connect(this.masterGain);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
            this.sfxGain.connect(this.masterGain);
        } catch (e) {
            console.warn("Web Audio Context initialization warning:", e);
        }
    }

    // ==========================================
    // Spotify Audio Element Event Listeners
    // ==========================================
    setupAudioEvents() {
        if (!this.audio) return;

        this.audio.addEventListener("timeupdate", () => {
            if (!this.isDraggingSeek) {
                this.updateScrubUI();
            }
        });

        this.audio.addEventListener("loadedmetadata", () => {
            this.updateScrubUI();
            this.updateTrackInfoUI();
        });

        this.audio.addEventListener("durationchange", () => {
            this.updateScrubUI();
        });

        this.audio.addEventListener("play", () => {
            this.isStarted = true;
            this.updatePlayStateUI(true);
        });

        this.audio.addEventListener("pause", () => {
            this.updatePlayStateUI(false);
        });

        this.audio.addEventListener("volumechange", () => {
            this.volume = this.audio.volume;
            this.isMuted = this.audio.muted;
            this.updateVolumeUI();
        });

        this.audio.addEventListener("ended", () => {
            this.handleTrackEnded();
        });

        this.audio.addEventListener("error", (e) => {
            console.warn("Audio load error on", this.audio.src, e);
            const current = this.playlist[this.currentIndex];
            if (current && current.fallback && this.audio.src.indexOf(current.fallback) === -1) {
                console.log("Trying fallback audio path:", current.fallback);
                this.audio.src = current.fallback;
                this.audio.load();
                if (this.isStarted) {
                    this.audio.play().catch(() => {});
                }
            }
        });
    }

    // Load a track from playlist
    loadTrack(index, autoPlay = true) {
        if (!this.audio || index < 0 || index >= this.playlist.length) return;
        this.currentIndex = index;
        const track = this.playlist[index];
        this.audio.src = track.src;
        this.audio.currentTime = 0;
        this.updateTrackInfoUI();
        this.updateScrubUI();
        this.renderPlaylistDrawer();

        if (autoPlay) {
            this.audio.play().then(() => {
                this.isStarted = true;
                this.updatePlayStateUI(true);
                this.hideHintPill();
            }).catch((err) => {
                console.warn("Autoplay deferred until user interaction:", err);
                this.armFirstInteractionTrigger();
            });
        }
    }

    handleTrackEnded() {
        if (this.isLooping && this.playlist.length === 1) {
            this.audio.currentTime = 0;
            this.audio.play().catch(() => {});
            return;
        }
        const nextIdx = (this.currentIndex + 1) % this.playlist.length;
        if (this.isLooping || nextIdx > this.currentIndex) {
            this.loadTrack(nextIdx, true);
        } else {
            this.updatePlayStateUI(false);
        }
    }

    // Autoplay initiation
    async tryAutoplay() {
        if (!this.audio) return;
        this.init();

        try {
            if (!this.audio.src) {
                this.loadTrack(0, false);
            }
            await this.audio.play();
            this.isStarted = true;
            this.updatePlayStateUI(true);
            this.hideHintPill();
        } catch (err) {
            // Browser policy prevented autoplay with sound
            this.armFirstInteractionTrigger();
            this.showHintPill();
        }
    }

    // Global interaction unlock
    armFirstInteractionTrigger() {
        if (typeof window === "undefined" || this._hasInteractionTrigger) return;
        this._hasInteractionTrigger = true;

        const onGesture = async () => {
            this.init();
            if (this.ctx && this.ctx.state === "suspended") {
                this.ctx.resume().catch(() => {});
            }
            if (this.audio) {
                try {
                    if (!this.audio.src) {
                        this.loadTrack(0, false);
                    }
                    if (this.audio.paused) {
                        await this.audio.play();
                        this.isStarted = true;
                        this.updatePlayStateUI(true);
                        this.hideHintPill();
                    }
                    cleanup();
                } catch (err) {
                    console.warn("Gesture unlock pending another tap:", err);
                }
            }
        };

        const cleanup = () => {
            window.removeEventListener("click", onGesture, { capture: true });
            window.removeEventListener("pointerdown", onGesture, { capture: true });
            window.removeEventListener("touchstart", onGesture, { capture: true });
            window.removeEventListener("keydown", onGesture, { capture: true });
        };

        window.addEventListener("click", onGesture, { capture: true, once: true });
        window.addEventListener("pointerdown", onGesture, { capture: true, once: true });
        window.addEventListener("touchstart", onGesture, { capture: true, once: true });
        window.addEventListener("keydown", onGesture, { capture: true, once: true });
    }

    // Called when user clicks "Enter My Heart" button or starts journey
    startBGM() {
        this.init();
        if (this.audio) {
            if (!this.audio.src) {
                this.loadTrack(0, true);
            } else if (this.audio.paused) {
                this.audio.play().then(() => {
                    this.isStarted = true;
                    this.updatePlayStateUI(true);
                    this.hideHintPill();
                }).catch(() => {
                    this.armFirstInteractionTrigger();
                });
            }
        }
    }

    // Toggle Play/Pause
    togglePlay() {
        if (!this.audio) return;
        this.init();
        if (this.audio.paused) {
            if (!this.audio.src) {
                this.loadTrack(this.currentIndex, true);
                return;
            }
            this.audio.play().then(() => {
                this.isStarted = true;
                this.updatePlayStateUI(true);
                this.hideHintPill();
            }).catch(console.error);
        } else {
            this.audio.pause();
            this.updatePlayStateUI(false);
        }
    }

    nextTrack() {
        const nextIdx = (this.currentIndex + 1) % this.playlist.length;
        this.loadTrack(nextIdx, true);
    }

    prevTrack() {
        if (!this.audio) return;
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            this.audio.play().catch(console.error);
        } else {
            const prevIdx = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
            this.loadTrack(prevIdx, true);
        }
    }

    selectTrack(index) {
        if (index === this.currentIndex) {
            this.togglePlay();
        } else {
            this.loadTrack(index, true);
        }
    }

    seekTo(seconds) {
        if (!this.audio) return;
        const dur = this.audio.duration || 0;
        const target = Math.max(0, Math.min(seconds, dur));
        this.audio.currentTime = target;
        this.updateScrubUI();
    }

    seekRatio(ratio) {
        if (!this.audio) return;
        const dur = this.audio.duration || 0;
        if (dur > 0) {
            this.seekTo(ratio * dur);
        }
    }

    setVolume(level) {
        if (!this.audio) return;
        const clamped = Math.max(0, Math.min(1, level));
        this.volume = clamped;
        this.audio.volume = clamped;
        if (clamped > 0 && this.audio.muted) {
            this.audio.muted = false;
        }
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7 * clamped, this.ctx.currentTime);
        }
        this.updateVolumeUI();
    }

    toggleMute() {
        if (!this.audio) return !this.isMuted;
        if (this.audio.paused) {
            this.audio.play().then(() => {
                this.isStarted = true;
                this.isMuted = false;
                this.audio.muted = false;
                this.updatePlayStateUI(true);
                this.updateVolumeUI();
                this.updateSoundBtn();
            }).catch(() => {});
            return false;
        }
        this.isMuted = !this.isMuted;
        this.audio.muted = this.isMuted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7 * this.volume, this.ctx.currentTime);
        }
        this.updateVolumeUI();
        this.updateSoundBtn();
        return this.isMuted;
    }

    toggleLoop() {
        this.isLooping = !this.isLooping;
        const repeatBtn = document.getElementById("repeatBtn");
        if (repeatBtn) {
            if (this.isLooping) {
                repeatBtn.classList.add("active");
                repeatBtn.setAttribute("title", "Repeat All: ON");
            } else {
                repeatBtn.classList.remove("active");
                repeatBtn.setAttribute("title", "Repeat All: OFF");
            }
        }
    }

    // ==========================================
    // UI BINDINGS & RENDERING
    // ==========================================
    initUI() {
        if (this._uiBound) return;
        this._uiBound = true;

        this.bindPlayerElements();
        this.updateTrackInfoUI();
        this.updateScrubUI();
        this.updateVolumeUI();
        this.renderPlaylistDrawer();

        // Immediately try autoplay
        this.tryAutoplay();
    }

    bindPlayerElements() {
        const playBtn = document.getElementById("mainPlayBtn");
        const prevBtn = document.getElementById("prevTrackBtn");
        const nextBtn = document.getElementById("nextTrackBtn");
        const repeatBtn = document.getElementById("repeatBtn");
        const playlistToggle = document.getElementById("playlistToggleBtn");
        const playlistMobile = document.getElementById("playlistMobileBtn");
        const drawerClose = document.getElementById("drawerCloseBtn");
        const volIconBtn = document.getElementById("volumeIconBtn");
        const volSlider = document.getElementById("volumeSlider");
        const scrubBar = document.getElementById("seekProgressBar");
        const soundBtn = document.getElementById("soundBtn");

        if (playBtn) playBtn.addEventListener("click", () => this.togglePlay());
        if (prevBtn) prevBtn.addEventListener("click", () => this.prevTrack());
        if (nextBtn) nextBtn.addEventListener("click", () => this.nextTrack());
        if (repeatBtn) repeatBtn.addEventListener("click", () => this.toggleLoop());

        const toggleDrawer = () => {
            const drawer = document.getElementById("spotifyDrawer");
            if (drawer) {
                const isOpen = drawer.style.display !== "none";
                drawer.style.display = isOpen ? "none" : "block";
            }
        };

        if (playlistToggle) playlistToggle.addEventListener("click", toggleDrawer);
        if (playlistMobile) playlistMobile.addEventListener("click", toggleDrawer);
        if (drawerClose) drawerClose.addEventListener("click", () => {
            const drawer = document.getElementById("spotifyDrawer");
            if (drawer) drawer.style.display = "none";
        });

        if (volIconBtn) volIconBtn.addEventListener("click", () => this.toggleMute());
        if (volSlider) {
            volSlider.addEventListener("input", (e) => {
                this.setVolume(parseFloat(e.target.value));
            });
        }

        const minBtn = document.getElementById("playerMinimizeBtn");
        if (minBtn) {
            minBtn.addEventListener("click", () => {
                const player = document.getElementById("spotifyPlayer");
                if (player) {
                    player.classList.toggle("minimized");
                    const isMin = player.classList.contains("minimized");
                    minBtn.setAttribute("title", isMin ? "Expand Player" : "Minimize Player");
                }
            });
        }

        // Seek Bar (Mouse & Touch scrubbing)
        if (scrubBar) {
            const calculateRatio = (clientX) => {
                const rect = scrubBar.getBoundingClientRect();
                return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            };

            const onStart = (e) => {
                e.preventDefault();
                this.isDraggingSeek = true;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                this.dragRatio = calculateRatio(clientX);
                this.updateScrubUI();
            };

            const onMove = (e) => {
                if (!this.isDraggingSeek) return;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                this.dragRatio = calculateRatio(clientX);
                this.updateScrubUI();
            };

            const onEnd = () => {
                if (!this.isDraggingSeek) return;
                this.isDraggingSeek = false;
                const dur = this.audio ? this.audio.duration || 0 : 0;
                if (dur > 0) {
                    this.seekTo(this.dragRatio * dur);
                }
            };

            scrubBar.addEventListener("mousedown", onStart);
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onEnd);

            scrubBar.addEventListener("touchstart", onStart, { passive: false });
            window.addEventListener("touchmove", onMove, { passive: false });
            window.addEventListener("touchend", onEnd);

            // Direct click seek
            scrubBar.addEventListener("click", (e) => {
                if (this.isDraggingSeek) return;
                const ratio = calculateRatio(e.clientX);
                this.seekRatio(ratio);
            });
        }


        // Entrance screen tap listener
        const entranceScreen = document.getElementById("entranceScreen");
        if (entranceScreen) {
            entranceScreen.addEventListener("click", (e) => {
                // If they didn't click inside the player or startBtn, still start BGM smoothly
                if (!e.target.closest("#spotifyPlayer")) {
                    this.startBGM();
                }
            });
        }
    }

    updateTrackInfoUI() {
        const track = this.playlist[this.currentIndex] || this.playlist[0];
        const titleEl = document.getElementById("trackTitle");
        const artistEl = document.getElementById("trackArtist");
        const coverEl = document.getElementById("trackCover");

        if (titleEl) titleEl.textContent = track.title;
        if (artistEl) artistEl.textContent = track.artist;
        if (coverEl && track.cover) coverEl.src = track.cover;
    }

    updateScrubUI() {
        const fillEl = document.getElementById("progressBarFill");
        const thumbEl = document.getElementById("progressBarThumb");
        const currentLabel = document.getElementById("currentTimeLabel");
        const durationLabel = document.getElementById("durationLabel");

        const dur = this.audio && !isNaN(this.audio.duration) ? this.audio.duration : 0;
        const cur = this.audio && !isNaN(this.audio.currentTime) ? this.audio.currentTime : 0;

        const ratio = this.isDraggingSeek ? this.dragRatio : (dur > 0 ? cur / dur : 0);
        const displayCurTime = this.isDraggingSeek ? (this.dragRatio * dur) : cur;

        const clampedPct = Math.min(100, Math.max(0, ratio * 100));

        if (fillEl) fillEl.style.width = `${clampedPct}%`;
        if (thumbEl) thumbEl.style.left = `${clampedPct}%`;
        if (currentLabel) currentLabel.textContent = formatTime(displayCurTime);
        if (durationLabel) durationLabel.textContent = formatTime(dur);
    }

    updatePlayStateUI(isPlaying) {
        const playIcon = document.getElementById("playIconSvg");
        const pauseIcon = document.getElementById("pauseIconSvg");
        const vinylEl = document.getElementById("spotifyVinyl");

        if (playIcon) playIcon.style.display = isPlaying ? "none" : "block";
        if (pauseIcon) pauseIcon.style.display = isPlaying ? "block" : "none";

        if (vinylEl) {
            if (isPlaying) {
                vinylEl.classList.add("spinning");
            } else {
                vinylEl.classList.remove("spinning");
            }
        }

        this.updateSoundBtn();
        this.renderPlaylistDrawer();
    }

    updateVolumeUI() {
        const volSlider = document.getElementById("volumeSlider");
        const volIconBtn = document.getElementById("volumeIconBtn");

        if (volSlider) {
            volSlider.value = this.isMuted ? 0 : this.volume;
        }

        if (volIconBtn) {
            if (this.isMuted || this.volume === 0) {
                volIconBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D94F70" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
            } else if (this.volume < 0.5) {
                volIconBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
            } else {
                volIconBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
            }
        }
    }

    updateSoundBtn() {
        const soundBtn = document.getElementById("soundBtn");
        const soundText = document.getElementById("soundText");
        const isPlaying = this.audio ? (!this.audio.paused && !this.audio.muted) : false;

        if (soundBtn) {
            if (isPlaying) {
                soundBtn.classList.remove("muted");
            } else {
                soundBtn.classList.add("muted");
            }
        }
        if (soundText) {
            soundText.textContent = isPlaying ? "Music: ON" : "Music: OFF";
        }
    }

    renderPlaylistDrawer() {
        const listEl = document.getElementById("playlistList");
        if (!listEl) return;

        const isAudioPlaying = this.audio ? !this.audio.paused : false;

        listEl.innerHTML = this.playlist.map((track, idx) => {
            const isSelected = idx === this.currentIndex;
            return `
                <div class="spotify-drawer-item ${isSelected ? 'active-track' : ''}" data-index="${idx}">
                    <div class="drawer-item-left">
                        <div class="drawer-item-thumb">
                            <img src="${track.cover}" alt="${track.title}">
                            ${isSelected && isAudioPlaying ? `
                                <div class="drawer-equalizer-overlay">
                                    <span class="eq-bar"></span>
                                    <span class="eq-bar"></span>
                                    <span class="eq-bar"></span>
                                </div>
                            ` : ''}
                        </div>
                        <div class="drawer-item-info">
                            <div class="drawer-item-title">${track.title}</div>
                            <div class="drawer-item-artist">${track.artist}</div>
                        </div>
                    </div>
                    <div class="drawer-item-action">
                        <span class="drawer-item-status">${isSelected && isAudioPlaying ? 'Playing' : '0' + (idx + 1)}</span>
                        <button class="drawer-mini-play-btn" aria-label="Play song">
                            ${isSelected && isAudioPlaying ? '⏸' : '▶'}
                        </button>
                    </div>
                </div>
            `;
        }).join("");

        // Attach click handlers
        listEl.querySelectorAll(".spotify-drawer-item").forEach(item => {
            item.addEventListener("click", () => {
                const idx = parseInt(item.getAttribute("data-index"), 10);
                this.selectTrack(idx);
            });
        });
    }

    showHintPill() {
        let pill = document.getElementById("audioHintPill");
        if (!pill) {
            pill = document.createElement("div");
            pill.id = "audioHintPill";
            pill.className = "audio-hint-pill";
            pill.innerHTML = `<span class="hint-pulse">🎶</span> Tap anywhere to start Noormahal ❤️`;
            document.body.appendChild(pill);
        }
        pill.style.opacity = "1";
        pill.style.transform = "translate(-50%, 0)";
    }

    hideHintPill() {
        const pill = document.getElementById("audioHintPill");
        if (pill) {
            pill.style.opacity = "0";
            pill.style.transform = "translate(-50%, 15px)";
            setTimeout(() => {
                if (pill.parentNode) pill.parentNode.removeChild(pill);
            }, 600);
        }
    }

    // ==========================================
    // Web Audio Romantic SFX Synthesizers
    // ==========================================
    playClickSound() {
        this.init();
        if (!this.ctx || this.isMuted) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(1046.5, now);
            osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08);

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

                osc.type = "sine";
                osc.frequency.setValueAtTime(baseFreq, time);
                osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);

                gain.gain.setValueAtTime(vol, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

                osc.connect(gain);
                gain.connect(this.sfxGain);

                osc.start(time);
                osc.stop(time + 0.15);
            };

            thump(now, 75, 0.35);
            thump(now + 0.13, 65, 0.22);
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
            boomOsc.type = "sine";
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
                            osc.type = "triangle";
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
                            osc.type = "sine";
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
                            osc.type = "triangle";
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
}

// Global Romantic Audio Singleton
window.romanticAudio = new RomanticAudio();
