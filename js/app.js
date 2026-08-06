/**
 * 🚀 MAIN APP CONTROLLER (FINAL LOGIC)
 * إدارة الثنائيات + الربط الكامل + إصلاح بوابة القوى + المحرك الديناميكي
 */

import { MathGenerator, HelpData } from './data.js';
import { GameLogic } from './logic.js';
import { UI } from './ui.js';
import { AudioSys } from './audio.js';

const App = {
    config: { pin: '12345678', timer: 0 },
    state: {
        mode: 'classic',
        mathConfig: { min: 1, max: 12, ops: ['+'] }, // تخزين إعدادات الرياضيات
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

        // 4. اختيار نمط اللعب ونافذة الإعدادات الرياضية
        document.querySelectorAll('.mode-card').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.mode = btn.dataset.mode;
                AudioSys.click();
                
                if (this.state.mode === 'classic') {
                    // الكلاسيكي لا يحتاج رياضيات، يبدأ فوراً
                    this.startGame();
                } else {
                    // إظهار نافذة الرياضيات لباقي الأطوار
                    document.getElementById('modal-math-setup').classList.remove('hidden');
                }
            });
        });

        // --- منطق نافذة إعدادات الرياضيات الديناميكية ---
        const mathSetupModal = document.getElementById('modal-math-setup');
        if (mathSetupModal) {
            // إغلاق النافذة والعودة
            document.getElementById('btn-close-math-setup').addEventListener('click', () => {
                mathSetupModal.classList.add('hidden');
                AudioSys.click();
            });

            // اختيار العمليات (السماح باختيار متعدد)
            document.querySelectorAll('.op-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.target.classList.toggle('selected');
                    AudioSys.click();
                });
            });

            // زر عشوائي (الكل)
            document.getElementById('btn-math-random').addEventListener('click', () => {
                document.querySelectorAll('.op-btn').forEach(btn => btn.classList.add('selected'));
                AudioSys.click();
            });

            // تأكيد بدء المعركة بعد حفظ الإعدادات
            document.getElementById('btn-confirm-math-setup').addEventListener('click', () => {
                let min = parseInt(document.getElementById('math-range-min').value) || 1;
                let max = parseInt(document.getElementById('math-range-max').value) || 12;
                
                let selectedOps = [];
                document.querySelectorAll('.op-btn.selected').forEach(btn => {
                    selectedOps.push(btn.dataset.op);
                });

                // حماية: إذا نسي اللاعب تحديد عملية، نجبره على الجمع كافتراضي
                if (selectedOps.length === 0) selectedOps = ['+'];

                // حفظ الإعدادات في ذاكرة اللعبة
                this.state.mathConfig = { min, max, ops: selectedOps };
                
                mathSetupModal.classList.add('hidden');
                AudioSys.correct();
                this.startGame();
            });
        }

        // 5. التحكم داخل اللعبة
        document.getElementById('btn-back').addEventListener('click', () => {
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
        let isPowerMove = false;
        let powerType = null;

        // 1. معالجة القوى الخاصة (تحقق مبدئي فقط)
        if (this.state.activePower) {
            isPowerMove = true;
            powerType = this.state.activePower;
            
            const state = GameLogic.state;
            let validTarget = false;
            
            // التحقق من صحة الهدف برمجياً قبل إظهار السؤال الرياضي
            if (powerType === 'nuke' && state.metaGrid[g] === null) validTarget = true;
            if (powerType === 'freeze') validTarget = true;
            if (powerType === 'hack' && state.grid[g][c] !== null && state.grid[g][c] !== state.turn) validTarget = true;

            if (!validTarget) {
                AudioSys.error();
                UI.log('هدف غير صالح للقوة!');
                return;
            }
        } 
        // 2. التحقق من صلاحية الحركة العادية
        else {
            if (!GameLogic.isValidMove(g, c)) {
                AudioSys.error();
                return;
            }
        }

        AudioSys.click();

        // 3. النمط الكلاسيكي (بدون رياضيات ينفذ فوراً)
        if (this.state.mode === 'classic') {
            if (isPowerMove) {
                this.executePower(powerType, g, c);
            } else {
                this.executeMove(g, c);
            }
        } 
        // 4. الأنماط الرياضية (توجيه للنافذة المنبثقة)
        else {
            this.state.pendingMove = { g, c, isPowerMove, powerType };
            // نمرر إعدادات الرياضيات التي اختارها اللاعب للمحرك
            this.state.currentQ = MathGenerator.getQuestion(this.state.mode, this.state.mathConfig);
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

    executePower(type, g, c) {
        if (GameLogic.usePower(type, g, c)) {
            AudioSys.glitch();
            UI.log(`تم تفعيل: ${type.toUpperCase()}`);
            
            // تحديث الواجهة فوراً لعكس تغييرات القوى
            UI.updateGrid(GameLogic.state);

            this.state.activePower = null;
            document.querySelectorAll('.power-btn').forEach(b => b.classList.remove('active'));
            this.endTurn();
        } else {
            AudioSys.error();
            UI.log('فشل تفعيل القوة!');
            this.startTurnTimer();
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
            
            if (this.state.timeLeft <= 3) AudioSys.tick();

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
            if (this.state.currentQ.isDuality) {
                this.handleDualitySubmit();
            } else {
                this.verifyMath();
            }
            return; 
        } 
        else {
            if (this.state.calcBuffer.length < 5) this.state.calcBuffer.push(key);
        }
        
        this.updateCalcDisplay();
    },

    updateCalcDisplay() {
        const currentVal = this.state.calcBuffer.join('') || '_';
        
        if (this.state.currentQ.isDuality && this.state.dualityStep === 1) {
            // جلب رمز العملية الفعلي بدلاً من تثبيت علامة الجمع (+)
            const op = this.state.currentQ.dualityOp || '+';
            document.getElementById('calc-inputs').textContent = `${this.state.dualityVal1} ${op} ${currentVal}`;
        } else {
            document.getElementById('calc-inputs').textContent = currentVal;
        }
    },

    // منطق خاص لزر "OK" في الثنائيات (يدعم جميع العمليات الآن)
    handleDualitySubmit() {
        const val = parseInt(this.state.calcBuffer.join(''));
        if (isNaN(val)) return; 

        if (this.state.dualityStep === 0) {
            this.state.dualityVal1 = val;
            this.state.dualityStep = 1;
            this.state.calcBuffer = []; 
            AudioSys.correct(); 
            this.updateCalcDisplay();
        } 
        else {
            // تنفيذ العملية الحسابية الصحيحة بناءً على ما ولده المحرك
            const op = this.state.currentQ.dualityOp;
            let result = 0;
            
            if (op === '+') result = this.state.dualityVal1 + val;
            else if (op === '-') result = this.state.dualityVal1 - val;
            else if (op === '*') result = this.state.dualityVal1 * val;
            else if (op === '/') result = val !== 0 ? this.state.dualityVal1 / val : 0; // منع القسمة على صفر
            
            if (result === this.state.currentQ.targetSum) {
                this.onMathSuccess();
            } else {
                this.onMathFail();
            }
        }
    },

    verifyMath() {
        const input = parseInt(this.state.calcBuffer.join(''));
        
        if (input === this.state.currentQ.a) {
            this.onMathSuccess();
        } else {
            this.onMathFail();
        }
    },

    onMathSuccess() {
        AudioSys.correct();
        document.getElementById('modal-calc').classList.add('hidden');
        
        if (this.state.pendingMove.isPowerMove) {
            this.executePower(this.state.pendingMove.powerType, this.state.pendingMove.g, this.state.pendingMove.c);
        } else {
            this.executeMove(this.state.pendingMove.g, this.state.pendingMove.c);
        }
    },

    onMathFail() {
        AudioSys.error();
        this.state.calcBuffer = [];
        document.getElementById('calc-inputs').textContent = 'خطأ ❌';
        
        if(this.state.currentQ.isDuality) {
            this.state.dualityStep = 0;
            this.state.dualityVal1 = null;
            setTimeout(() => { document.getElementById('calc-inputs').textContent = '_'; }, 1000);
        }
    }
};

window.addEventListener('DOMContentLoaded', () => App.init());
