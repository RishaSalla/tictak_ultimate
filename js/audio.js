/**
 * 🔊 AUDIO SYSTEM - SYNTHESIZER
 * نظام توليد الصوتيات بدون ملفات خارجية
 * Theme: Scientific / Clean UI
 */

const AudioContext = window.AudioContext || window.webkitAudioContext;
let ctx = null;
let isMuted = false;

// دوال مساعدة لتوليد النغمات
const playTone = (freq, type, duration, vol = 0.1) => {
    if (!ctx || isMuted) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type; // 'sine', 'square', 'triangle', 'sawtooth'
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
};

export const AudioSys = {
    // يجب استدعاء هذه الدالة عند أول نقرة للمستخدم (بسبب سياسات المتصفح)
    init() {
        if (!ctx) {
            ctx = new AudioContext();
        } else if (ctx.state === 'suspended') {
            ctx.resume();
        }
    },

    toggleMute() {
        isMuted = !isMuted;
        return isMuted;
    },

    // 1. نقرة خفيفة للأزرار (Soft Pop)
    click() {
        // موجة جيبية ناعمة جداً
        playTone(600, 'sine', 0.1, 0.05);
    },

    // 2. صوت الكتابة في الحاسبة (Mechanical Tick)
    type() {
        // موجة مثلثة قصيرة وحادة
        playTone(800, 'triangle', 0.05, 0.03);
    },

    // 3. إجابة صحيحة (Clean Chime)
    correct() {
        if (!ctx || isMuted) return;
        // نغمتين متتاليتين (تصاعدي)
        const now = ctx.currentTime;
        
        // Note 1
        const osc1 = ctx.createOscillator();
        const g1 = ctx.createGain();
        osc1.frequency.value = 523.25; // C5
        g1.gain.value = 0.1;
        g1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc1.connect(g1); g1.connect(ctx.destination);
        osc1.start(now); osc1.stop(now + 0.3);

        // Note 2
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.frequency.value = 659.25; // E5
        g2.gain.value = 0.1;
        g2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc2.connect(g2); g2.connect(ctx.destination);
        osc2.start(now + 0.1); osc2.stop(now + 0.4);
    },

    // 4. إجابة خاطئة (Error Buzz)
    error() {
        // موجة منشارية منخفضة (Sawtooth)
        playTone(150, 'sawtooth', 0.3, 0.08);
    },

    // 5. استخدام قدرة خاصة (Power Up)
    power() {
        if (!ctx || isMuted) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.3); // صوت متصاعد (Charging)
        
        gain.gain.value = 0.1;
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    },

    // 6. الفوز (Victory Fanfare)
    win() {
        if (!ctx || isMuted) return;
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major Arpeggio
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            gain.gain.value = 0.1;
            gain.gain.exponentialRampToValueAtTime(0.01, now + i*0.15 + 0.5);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i*0.15);
            osc.stop(now + i*0.15 + 0.5);
        });
    }
};
