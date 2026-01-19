/**
 * 🔊 AUDIO SYSTEM - RETRO MECHANICAL EDITION
 * أصوات ميكانيكية حادة للطقطقة والتنبيهات
 */

const AudioContext = window.AudioContext || window.webkitAudioContext;
let ctx = null;

const playTone = (freq, type, duration, volume = 0.1) => {
    try {
        if (!ctx) ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) {
        console.warn("Audio error:", e);
    }
};

export const AudioSys = {
    // تفعيل النظام عند أول ضغطة
    init: () => { 
        try { 
            if(!ctx) ctx = new AudioContext(); 
        } catch(e){} 
    },

    // طقطقة أزرار لوحة المفاتيح الميكانيكية
    click: () => playTone(800, 'square', 0.05, 0.05),

    // تنبيه الخطأ (تردد منخفض)
    error: () => playTone(120, 'sawtooth', 0.3, 0.15),

    // نغمة النجاح (تردد مزدوج)
    correct: () => { 
        playTone(600, 'sine', 0.1, 0.1); 
        setTimeout(() => playTone(900, 'sine', 0.2, 0.1), 80); 
    },

    // صوت تفعيل القوى الخاصة أو الأنماط
    power: () => playTone(400, 'triangle', 0.4, 0.1),

    // نغمة الفوز الكبيرة
    win: () => {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((f, i) => {
            setTimeout(() => playTone(f, 'square', 0.4, 0.1), i * 150);
        });
    }
};
