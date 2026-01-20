/**
 * 🚀 MAIN APP CONTROLLER (FINAL LOGIC)
 * إدارة الثنائيات + الربط الكامل
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
        activePower: null,
        // متغيرات خاصة لطور الثنائيات
        dualityStep: 0, 
        dualityVal1: null 
    },

    async init() {
        // محاولة تحميل الإعدادات أو استخدام الافتراضي
        try {
            const res = await fetch('config.json');
            const data = await res.json();
            this.config.pin = data.security.default_pin;
        } catch(e) { console.log('Config loaded default'); }

        // تفعيل الصوت عند أول نقرة
        document.body.addEventListener('click', () => AudioSys.init(), { once: true });
        
        this.bindEvents();
        UI.showScreen('screen-login');
        
        // صوت الآلة الكاتبة في حقل الباسورد
        const pinInput = document.getElementById('pin-input');
        if(pinInput) pinInput.addEventListener('input', () => AudioSys.typewriter());
    },

    bindEvents() {
        // 1. زر الدخول
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

        // 2. منطق أزرار الاختيار (الأيقونات والمؤقت)
        const setupSelector = (containerId) => {
            const container = document.getElementById(containerId);
            if(!container) return;
            container.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;
                // إزالة التحديد السابق
                container.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                AudioSys.click();
            });
        };
        setupSelector('p1-icon-selector');
        setupSelector('p2-icon-selector');
        setupSelector('timer-selector');

        // مفتاح تبديل الفرق
        document.getElementById('team-mode-toggle').addEventListener('change', (e) => {
            document.querySelectorAll('.roster-box').forEach(r => 
                e.target.checked ? r.classList.remove('hidden') : r.classList.add('hidden')
            );
            AudioSys.click();
        });

        // 3. حفظ الإعدادات وبدء اللعبة
        document.getElementById('btn-save-setup').addEventListener('click', () => {
            AudioSys.correct();
            
            // دالة مساعدة لجلب القيمة المختارة
            const getVal = (id) => {
                const sel = document.querySelector(`#${id} .selected`);
                return sel ? sel.dataset.val : (id.includes('p1') ? 'X' : 'O');
            };
            
            this.config.timer = parseInt(getVal('timer-selector')) || 0;
            
            const p1 = {
                name: document.getElementById('p1-name').value || 'الفريق 1',
                icon: getVal('p1-icon-selector')
            };
            const p2 = {
                name: document.getElementById('p2-name').value || 'الفريق 2',
                icon: getVal('p2-icon-selector')
            };
            
            GameLogic.init(p1, p2);
            UI.setAvatars(p1.icon, p2.icon);
            UI.showScreen('screen-menu');
        });

        // 4. اختيار نمط اللعب
        document.querySelectorAll('.mode-card').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.mode = btn.dataset.mode;
                this.startGame();
            });
        });

        // 5. التحكم داخل اللعبة
        document.getElementById('btn-back').addEventListener('click', () => {
            // نافذة تأكيد بسيطة
            if(confirm('هل أنت متأكد من الانسحاب؟')) {
                this.stopTimer();
                UI.showScreen('screen-menu');
            }
        });

        // تفعيل القوى
        document.querySelectorAll('.power-btn').forEach(btn => {
            btn.addEventListener('click', () => this.activatePower(btn));
        });

        // 6. النوافذ المنبثقة (التعليمات)
        document.getElementById('global-help-btn').addEventListener('click', () => {
            document.getElementById('modal-instructions').classList.remove('hidden');
        });
        document.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => btn.closest('.modal-overlay').classList.add('hidden'));
        });
        
        // تبويبات التعليمات
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById('help-body').innerHTML = HelpData[e.target.dataset.tab];
            });
        });

        // 7. لوحة أرقام الحاسبة
        const numpad = document.querySelector('.numpad-grid');
        if(numpad) {
            numpad.addEventListener('click', (e) => {
                if(e.target.tagName === 'BUTTON') this.handleCalcInput(e.target.dataset.key);
            });
        }
    },

    startGame() {
        UI.initGrid((g, c) => this.handleGridClick(g, c));
        UI.updateGrid(GameLogic.state);
        UI.updateHUD(GameLogic.state);
        UI.showScreen('screen-game');
        UI.log('المعركة بدأت! استعد.');
        AudioSys.win(); // نغمة البدء
        this.startTurnTimer();
    },

    handleGridClick(g, c) {
        // 1. معالجة القوى الخاصة
        if (this.state.activePower) {
            if (GameLogic.usePower(this.state.activePower, g, c)) {
                AudioSys.glitch();
                UI.log(`تم تفعيل: ${this.state.activePower.toUpperCase()}`);
                this.state.activePower = null;
                document.querySelectorAll('.power-btn').forEach(b => b.classList.remove('active'));
                this.endTurn();
            } else {
                AudioSys.error();
                UI.log('هدف غير صالح للقوة!');
            }
            return;
        }

        // 2. التحقق من صلاحية الحركة
        if (!GameLogic.isValidMove(g, c)) {
            AudioSys.error();
            return;
        }

        AudioSys.click();

        // 3. النمط الكلاسيكي (بدون رياضيات)
        if (this.state.mode === 'classic') {
            this.executeMove(g, c);
        } 
        // 4. الأنماط الرياضية
        else {
            this.state.pendingMove = { g, c };
            this.state.currentQ = MathGenerator.getQuestion(this.state.mode);
            this.state.calcBuffer = [];
            
            // إعدادات خاصة لنمط الثنائيات
            this.state.dualityStep = 0;
            this.state.dualityVal1 = null;

            // عرض السؤال وتصفير الشاشة
            document.getElementById('calc-q').textContent = this.state.currentQ.q;
            document.getElementById('calc-inputs').textContent = '_';
            document.getElementById('modal-calc').classList.remove('hidden');
            this.pauseTimer(); // إيقاف الوقت أثناء الحل
        }
    },

    executeMove(g, c) {
        const result = GameLogic.makeMove(g, c);
        UI.updateGrid(GameLogic.state);
        
        if (result === 'GAME_OVER') {
            AudioSys.win();
            this.stopTimer();
            setTimeout(() => {
                alert(`مبروك! الفائز هو ${GameLogic.state.winner}`);
                UI.showScreen('screen-menu');
            }, 500);
        } else {
            this.endTurn();
        }
    },

    endTurn() {
        UI.updateHUD(GameLogic.state);
        this.startTurnTimer();
    },

    activatePower(btn) {
        const type = btn.dataset.power;
        const pid = btn.classList.contains('p1') ? 'X' : 'O';
        
        if (GameLogic.state.turn !== pid) {
            AudioSys.error();
            UI.log('ليس دورك!');
            return;
        }

        // إلغاء التفعيل إذا ضغط مرة أخرى
        if (this.state.activePower === type) {
            this.state.activePower = null;
            btn.classList.remove('active');
            UI.log('تم إلغاء القوة.');
            return;
        }

        this.state.activePower = type;
        document.querySelectorAll('.power-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        UI.log(`اختر مربعاً لتطبيق ${type}`);
    },

    // --- نظام المؤقت ---
    startTurnTimer() {
        this.stopTimer();
        if (this.config.timer === 0) return;

        this.state.timeLeft = this.config.timer;
        UI.updateTimer(100);
        
        this.state.timerInterval = setInterval(() => {
            this.state.timeLeft--;
            const percent = (this.state.timeLeft / this.config.timer) * 100;
            UI.updateTimer(percent);
            
            if (this.state.timeLeft <= 3) AudioSys.tick(); // صوت تكتكة في النهاية

            if (this.state.timeLeft <= 0) {
                this.stopTimer();
                AudioSys.error();
                UI.log('انتهى الوقت!');
                GameLogic.switchTurn();
                this.endTurn();
            }
        }, 1000);
    },

    stopTimer() { if (this.state.timerInterval) clearInterval(this.state.timerInterval); },
    pauseTimer() { this.stopTimer(); },

    // --- نظام الحاسبة ومعالجة الإدخال ---
    handleCalcInput(key) {
        AudioSys.typewriter();

        if (key === 'del') {
            this.state.calcBuffer.pop();
        } 
        else if (key === 'ok') {
            // معالجة خاصة لنمط الثنائيات
            if (this.state.currentQ.isDuality) {
                this.handleDualitySubmit();
            } else {
                this.verifyMath();
            }
            return; // الخروج لمنع التحديث المزدوج
        } 
        else {
            if (this.state.calcBuffer.length < 5) this.state.calcBuffer.push(key);
        }
        
        // تحديث الشاشة
        this.updateCalcDisplay();
    },

    updateCalcDisplay() {
        const currentVal = this.state.calcBuffer.join('') || '_';
        
        // إذا كنا في الخطوة الثانية من الثنائيات، نعرض الرقم الأول + الحالي
        if (this.state.currentQ.isDuality && this.state.dualityStep === 1) {
            document.getElementById('calc-inputs').textContent = `${this.state.dualityVal1} + ${currentVal}`;
        } else {
            document.getElementById('calc-inputs').textContent = currentVal;
        }
    },

    // منطق خاص لزر "OK" في الثنائيات
    handleDualitySubmit() {
        const val = parseInt(this.state.calcBuffer.join(''));
        if (isNaN(val)) return; // منع إدخال فارغ

        // الخطوة 1: إدخال الرقم الأول
        if (this.state.dualityStep === 0) {
            this.state.dualityVal1 = val;
            this.state.dualityStep = 1;
            this.state.calcBuffer = []; // تفريغ للكتابة الثانية
            AudioSys.correct(); // صوت تأكيد بسيط
            this.updateCalcDisplay();
        } 
        // الخطوة 2: إدخال الرقم الثاني والتحقق
        else {
            const sum = this.state.dualityVal1 + val;
            if (sum === this.state.currentQ.targetSum) {
                this.onMathSuccess();
            } else {
                this.onMathFail();
            }
        }
    },

    verifyMath() {
        const input = parseInt(this.state.calcBuffer.join(''));
        
        // التحقق لباقي الأنماط (المواجهة، الميزان، المجهول)
        // كلهم يعتمدون على this.state.currentQ.a كإجابة صحيحة
        if (input === this.state.currentQ.a) {
            this.onMathSuccess();
        } else {
            this.onMathFail();
        }
    },

    onMathSuccess() {
        AudioSys.correct();
        document.getElementById('modal-calc').classList.add('hidden');
        this.executeMove(this.state.pendingMove.g, this.state.pendingMove.c);
    },

    onMathFail() {
        AudioSys.error();
        this.state.calcBuffer = [];
        document.getElementById('calc-inputs').textContent = 'خطأ ❌';
        // إعادة تعيين خطوات الثنائيات إذا أخطأ
        if(this.state.currentQ.isDuality) {
            this.state.dualityStep = 0;
            this.state.dualityVal1 = null;
            setTimeout(() => { document.getElementById('calc-inputs').textContent = '_'; }, 1000);
        }
    }
};

window.addEventListener('DOMContentLoaded', () => App.init());
