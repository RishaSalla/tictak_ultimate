/**
 * 🚀 MAIN APP CONTROLLER
 * المتحكم الرئيسي: المؤقت، الأحداث، والربط
 */

import { MathGenerator, HelpData } from './data.js';
import { GameLogic } from './logic.js';
import { UI } from './ui.js';
import { AudioSys } from './audio.js';

const App = {
    config: { pin: '12345678', timer: 0 },
    state: {
        mode: 'classic',
        timerInterval: null,
        timeLeft: 0,
        pendingMove: null,
        currentQ: null,
        calcBuffer: [],
        activePower: null
    },

    async init() {
        // تحميل الإعدادات
        try {
            const res = await fetch('config.json');
            const data = await res.json();
            this.config.pin = data.security.default_pin;
        } catch(e) { console.log('Config default used'); }

        // تهيئة الصوت
        document.body.addEventListener('click', () => AudioSys.init(), { once: true });
        
        this.bindEvents();
        UI.showScreen('screen-login');
        
        // تأثير الآلة الكاتبة في حقل الرمز
        document.getElementById('pin-input').addEventListener('input', () => AudioSys.typewriter());
    },

    bindEvents() {
        // 1. الدخول
        document.getElementById('btn-login').addEventListener('click', () => {
            const input = document.getElementById('pin-input').value;
            if (input === this.config.pin) {
                AudioSys.correct();
                UI.showScreen('screen-setup');
            } else {
                AudioSys.error();
                document.getElementById('login-msg').textContent = 'رمز مرفوض ⛔';
            }
        });

        // 2. تبديل وضع الفرق
        document.getElementById('team-mode-toggle').addEventListener('change', (e) => {
            const rosters = document.querySelectorAll('.roster-box');
            rosters.forEach(r => e.target.checked ? r.classList.remove('hidden') : r.classList.add('hidden'));
            AudioSys.click();
        });

        // 3. حفظ الإعدادات وبدء اللعبة
        document.getElementById('btn-save-setup').addEventListener('click', () => {
            AudioSys.correct();
            this.config.timer = parseInt(document.getElementById('timer-select').value);
            
            // حفظ بيانات اللاعبين
            const p1 = {
                name: document.getElementById('p1-name').value || 'الفريق 1',
                icon: document.getElementById('p1-icon').value
            };
            const p2 = {
                name: document.getElementById('p2-name').value || 'الفريق 2',
                icon: document.getElementById('p2-icon').value
            };
            
            GameLogic.init(p1, p2);
            UI.setAvatars(p1.icon, p2.icon);
            UI.showScreen('screen-menu');
        });

        // 4. اختيار النمط
        document.querySelectorAll('.mode-card').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.mode = btn.dataset.mode;
                this.startGame();
            });
        });

        // 5. التحكم داخل اللعبة
        document.getElementById('btn-back').addEventListener('click', () => {
            if(confirm('هل تريد إنهاء المباراة والعودة للقائمة؟')) {
                this.stopTimer();
                UI.showScreen('screen-menu');
            }
        });

        // القوى الخاصة
        document.querySelectorAll('.power-btn').forEach(btn => {
            btn.addEventListener('click', () => this.activatePower(btn));
        });

        // 6. التعليمات والحاسبة
        document.getElementById('global-help-btn').addEventListener('click', () => {
            document.getElementById('help-body').innerHTML = HelpData.rules; // افتراضي
            document.getElementById('modal-instructions').classList.remove('hidden');
        });
        
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById('help-body').innerHTML = HelpData[e.target.dataset.tab];
            });
        });

        document.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal-overlay').classList.add('hidden');
            });
        });

        // أزرار الحاسبة
        document.querySelector('.numpad-grid').addEventListener('click', (e) => {
            if(e.target.tagName === 'BUTTON') this.handleCalcInput(e.target.dataset.key);
        });
    },

    startGame() {
        UI.initGrid((g, c) => this.handleGridClick(g, c));
        UI.updateGrid(GameLogic.state);
        UI.updateHUD(GameLogic.state);
        UI.showScreen('screen-game');
        UI.log('بدأت المباراة! حظاً موفقاً.');
        AudioSys.win(); // نغمة البدء
        this.startTurnTimer();
    },

    handleGridClick(g, c) {
        // إذا كان هناك قوة مفعلة
        if (this.state.activePower) {
            if (GameLogic.usePower(this.state.activePower, g, c)) {
                AudioSys.glitch();
                UI.log(`تم استخدام القوة: ${this.state.activePower.toUpperCase()}`);
                this.state.activePower = null;
                document.querySelectorAll('.power-btn').forEach(b => b.classList.remove('active'));
                this.endTurn();
            } else {
                AudioSys.error();
                UI.log('لا يمكن استخدام القوة هنا!');
            }
            return;
        }

        if (!GameLogic.isValidMove(g, c)) {
            AudioSys.error();
            UI.log('حركة غير مسموحة!');
            return;
        }

        AudioSys.click();

        // النمط الكلاسيكي
        if (this.state.mode === 'classic') {
            this.executeMove(g, c);
            return;
        }

        // الأنماط الرياضية
        this.state.pendingMove = { g, c };
        this.state.currentQ = MathGenerator.getQuestion(this.state.mode);
        this.state.calcBuffer = [];
        
        document.getElementById('calc-q').textContent = this.state.currentQ.q;
        document.getElementById('calc-inputs').textContent = '_';
        document.getElementById('modal-calc').classList.remove('hidden');
        this.pauseTimer(); // إيقاف المؤقت أثناء الحل
    },

    executeMove(g, c) {
        const result = GameLogic.makeMove(g, c);
        UI.updateGrid(GameLogic.state);
        
        if (result === 'GAME_OVER') {
            AudioSys.win();
            this.stopTimer();
            setTimeout(() => alert(`مبروك! الفائز هو ${GameLogic.state.winner}`), 100);
            UI.showScreen('screen-menu');
        } else {
            this.endTurn();
        }
    },

    endTurn() {
        UI.updateHUD(GameLogic.state);
        this.startTurnTimer();
    },

    // --- منطق المؤقت ---
    startTurnTimer() {
        this.stopTimer();
        if (this.config.timer === 0) return; // بدون مؤقت

        this.state.timeLeft = this.config.timer;
        UI.updateTimer(100);
        
        this.state.timerInterval = setInterval(() => {
            this.state.timeLeft--;
            const percent = (this.state.timeLeft / this.config.timer) * 100;
            UI.updateTimer(percent);
            
            if (this.state.timeLeft <= 3) AudioSys.tick();

            if (this.state.timeLeft <= 0) {
                this.stopTimer();
                AudioSys.error();
                UI.log('انتهى الوقت! انتقل الدور.');
                GameLogic.switchTurn();
                this.endTurn();
            }
        }, 1000);
    },

    stopTimer() {
        if (this.state.timerInterval) clearInterval(this.state.timerInterval);
    },
    
    pauseTimer() { this.stopTimer(); },
    resumeTimer() { if (this.config.timer > 0) this.startTurnTimer(); }, // إعادة تشغيل بسيط

    // --- منطق القوى ---
    activatePower(btn) {
        const type = btn.dataset.power;
        const pid = btn.classList.contains('p1') ? 'X' : 'O';
        
        if (GameLogic.state.turn !== pid) {
            AudioSys.error();
            UI.log('ليس دورك لاستخدام القوة!');
            return;
        }

        this.state.activePower = type;
        document.querySelectorAll('.power-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        UI.log(`اختر هدفاً لقوة: ${type}`);
    },

    // --- منطق الحاسبة ---
    handleCalcInput(key) {
        AudioSys.typewriter();
        if (key === 'del') {
            this.state.calcBuffer.pop();
        } else if (key === 'ok') {
            this.verifyMath();
            return;
        } else {
            if (this.state.calcBuffer.length < 5) this.state.calcBuffer.push(key);
        }
        document.getElementById('calc-inputs').textContent = this.state.calcBuffer.join('') || '_';
    },

    verifyMath() {
        const input = parseInt(this.state.calcBuffer.join(''));
        let correct = false;
        
        if (this.state.currentQ.isDuality) {
             correct = (input < this.state.currentQ.targetSum); // منطق مبسط للثنائيات
        } else {
            correct = (input === this.state.currentQ.a);
        }

        if (correct) {
            AudioSys.correct();
            document.getElementById('modal-calc').classList.add('hidden');
            this.executeMove(this.state.pendingMove.g, this.state.pendingMove.c);
        } else {
            AudioSys.error();
            UI.log('إجابة خاطئة! حاول مرة أخرى.');
            this.state.calcBuffer = [];
            document.getElementById('calc-inputs').textContent = 'Error';
        }
    }
};

window.addEventListener('DOMContentLoaded', () => App.init());
