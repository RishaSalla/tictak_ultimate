/**
 * 🔊 AUDIO SYSTEM - ADVANCED
 * أصوات ميكانيكية، آلة كاتبة، ومؤقت
 */

const AudioContext = window.AudioContext || window.webkitAudioContext;
let ctx = null;

const playTone = (freq, type, duration, vol = 0.1) => {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
};

export const AudioSys = {
    init: () => { if(!ctx) ctx = new AudioContext(); },

    // صوت النقر العادي
    click: () => playTone(800, 'square', 0.05, 0.05),
    
    // صوت الآلة الكاتبة (سريع جداً)
    typewriter: () => playTone(1200, 'sawtooth', 0.03, 0.03),

    // صوت الخطأ
    error: () => {
        playTone(150, 'sawtooth', 0.1, 0.2);
        setTimeout(() => playTone(100, 'sawtooth', 0.2, 0.2), 100);
    },

    // صوت النجاح/الحل الصحيح
    correct: () => {
        playTone(600, 'sine', 0.1);
        setTimeout(() => playTone(1200, 'sine', 0.2), 100);
    },

    // صوت المؤقت (تيك توك)
    tick: () => playTone(2000, 'triangle', 0.05, 0.02),

    // صوت الهاك/التشويش
    glitch: () => {
        for(let i=0; i<5; i++) {
            setTimeout(() => playTone(100 + Math.random()*500, 'sawtooth', 0.05, 0.1), i*50);
        }
    },

    // صوت الفوز
    win: () => {
        [400, 500, 600, 800].forEach((f, i) => setTimeout(() => playTone(f, 'square', 0.2, 0.1), i*150));
    }
};
