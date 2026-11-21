const AUDIO = {
    ctx: null,

    init() {
        // Audio context created on first user interaction
        window.addEventListener('click', () => {
            if (!this.ctx) {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            }
        }, { once: true });
    },

    playTone(freq, type, duration, vol = 0.1) {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            // Ignore audio errors
        }
    },

    coinToss() {
        this.playTone(880, 'sine', 0.15, 0.08);
        setTimeout(() => this.playTone(1200, 'sine', 0.2, 0.08), 100);
    },

    coinLand() {
        this.playTone(440, 'triangle', 0.1, 0.1);
    },

    collectArtifact() {
        this.playTone(523.25, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(659.25, 'sine', 0.1, 0.1), 100);
        setTimeout(() => this.playTone(783.99, 'sine', 0.2, 0.15), 200);
    },

    alarm() {
        this.playTone(300, 'sawtooth', 0.3, 0.15);
        setTimeout(() => this.playTone(200, 'sawtooth', 0.3, 0.15), 300);
    },

    win() {
        this.playTone(523.25, 'sine', 0.15, 0.15);
        setTimeout(() => this.playTone(659.25, 'sine', 0.15, 0.15), 150);
        setTimeout(() => this.playTone(783.99, 'sine', 0.15, 0.15), 300);
        setTimeout(() => this.playTone(1046.50, 'sine', 0.4, 0.2), 450);
    }
};
AUDIO.init();
