const AudioContext = window.AudioContext || window.webkitAudioContext;
let ctx = null;

// تشغيل نغمة آمنة لا توقف اللعبة
const playToneSafe = (freq, type, duration) => {
    try {
        if (!ctx) ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) {}
};

export const AudioSys = {
    init: () => { try { if(!ctx) ctx = new AudioContext(); if(ctx.state==='suspended') ctx.resume(); } catch(e){} },
    click: () => playToneSafe(600, 'sine', 0.1),
    error: () => playToneSafe(150, 'sawtooth', 0.2),
    correct: () => { playToneSafe(523, 'sine', 0.1); setTimeout(()=>playToneSafe(659,'sine',0.2),100); },
    power: () => playToneSafe(300, 'square', 0.3),
    win: () => playToneSafe(523, 'triangle', 0.5)
};
