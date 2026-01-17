/**
 * 🔊 AUDIO SYSTEM - SAFE MODE
 * نظام صوتي لا يعطل اللعبة (Fire & Forget)
 */

const AudioContext = window.AudioContext || window.webkitAudioContext;
let ctx = null;
let isMuted = false;

// دالة مساعدة لتشغيل نغمة بأمان تام
const playToneSafe = (freq, type, duration, vol = 0.1) => {
    try {
        if (!ctx || isMuted || ctx.state === 'suspended') return;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) {
        // تجاهل أي خطأ صوتي بصمت تام للحفاظ على استقرار اللعبة
    }
};

export const AudioSys = {
    // تهيئة الصوت (يجب استدعاؤها بضغطة مستخدم)
    init() {
        try {
            if (!ctx) ctx = new AudioContext();
            if (ctx.state === 'suspended') ctx.resume();
        } catch (e) { console.warn('Audio init failed', e); }
    },

    // 1. نقرة خفيفة (Pop)
    click() {
        playToneSafe(600, 'sine', 0.1, 0.05);
    },

    // 2. خطأ (Buzz)
    error() {
        playToneSafe(150, 'sawtooth', 0.2, 0.08);
    },

    // 3. إجابة صحيحة (Ding)
    correct() {
        // نغمة مزدوجة سريعة
        playToneSafe(523.25, 'sine', 0.2, 0.1); // C5
        setTimeout(() => playToneSafe(659.25, 'sine', 0.3, 0.1), 100); // E5
    },

    // 4. استخدام قدرة (Power)
    power() {
        playToneSafe(300, 'square', 0.3, 0.05);
    },

    // 5. الفوز (Victory)
    win() {
        // تتابع نغمات بسيط (Arpeggio)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            setTimeout(() => playToneSafe(freq, 'triangle', 0.4, 0.1), i * 150);
        });
    }
};
