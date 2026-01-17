/**
 * 🚀 MAIN CONTROLLER
 * نقطة التجميع: تربط الواجهة بالمنطق بالبيانات
 */

import { GameLevels } from './data.js';
import { GameLogic } from './logic.js';
import { UI } from './ui.js';
import { AudioSys } from './audio.js';

const App = {
    // حالة التطبيق المحلية
    state: {
        currentMode: null,  // classic, clash, code, balance
        pendingMove: null,  // {g, c} الحركة المعلقة
        currentQuestion: null,
        calcBuffer: [],     // مخزن أرقام الحاسبة
        activePower: null,  // القدرة المفعلة حالياً
        configPin: '0000'
    },

    // 1. نقطة الانطلاق
    init() {
        // تهيئة الصوت عند أول نقرة (لتجاوز حظر المتصفحات)
        document.body.addEventListener('click', () => AudioSys.init(), { once: true });
        
        // جلب الإعدادات (اختياري)
        fetch('config.json')
            .then(res => res.json())
            .then(data => this.state.configPin = data.access_pin)
            .catch(() => console.log('Using default PIN'));

        this.bindEvents();
    },

    // 2. ربط الأحداث
    bindEvents() {
        // --- الدخول ---
        document.getElementById('btn-login').addEventListener('click', () => {
            const pin = document.getElementById('pin-input').value;
            if (pin === this.state.configPin) {
                AudioSys.click();
                UI.showScreen('screen-setup');
            } else {
                AudioSys.error();
                document.getElementById('login-msg').textContent = 'الرمز غير صحيح';
            }
        });

        // --- الإعدادات ---
        ['p1', 'p2'].forEach(pid => {
            document.getElementById(`${pid}-avatars`).addEventListener('click', (e) => {
                if (e.target.classList.contains('av-btn')) {
                    AudioSys.click();
                    const val = e.target.dataset.val;
                    UI.updateAvatarSelection(pid, val);
                    // تخزين مؤقت في المنطق
                    GameLogic.state[pid].tempAvatar = val; 
                }
            });
        });

        document.getElementById('btn-save-setup').addEventListener('click', () => {
            AudioSys.click();
            // حفظ الأسماء
            GameLogic.state.p1.name = document.getElementById('p1-name').value || 'اللاعب 1';
            GameLogic.state.p2.name = document.getElementById('p2-name').value || 'اللاعب 2';
            UI.showScreen('screen-menu');
        });

        document.getElementById('btn-help-setup').addEventListener('click', () => UI.openModal('modal-help'));

        // --- القائمة الرئيسية ---
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => {
                AudioSys.power();
                const mode = card.dataset.mode;
                this.startGame(mode);
            });
        });

        document.getElementById('btn-back-settings').addEventListener('click', () => UI.showScreen('screen-setup'));

        // --- اللعبة ---
        document.getElementById('btn-exit-game').addEventListener('click', () => {
            if (confirm('هل تود الخروج؟')) UI.showScreen('screen-menu');
        });

        document.getElementById('btn-help-game').addEventListener('click', () => UI.openModal('modal-help'));
        
        // أزرار القدرات
        document.querySelectorAll('.power-fab').forEach(btn => {
            btn.addEventListener('click', () => this.handlePowerClick(btn.dataset.power, btn));
        });

        // --- النوافذ ---
        document.querySelector('.close-modal').addEventListener('click', () => UI.closeModal('modal-help'));
        document.getElementById('btn-rematch').addEventListener('click', () => {
            UI.closeModal('modal-win');
            this.startGame(this.state.currentMode);
        });
        document.getElementById('btn-home').addEventListener('click', () => {
            UI.closeModal('modal-win');
            UI.showScreen('screen-menu');
        });

        // --- الحاسبة ---
        const numpad = document.querySelector('.numpad');
        numpad.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                this.handleCalcInput(e.target.dataset.key);
            }
        });
    },

    // 3. بدء اللعبة
    startGame(mode) {
        this.state.currentMode = mode;
        this.state.activePower = null;
        GameLogic.init();
        
        // بناء الرقعة وتمرير دالة النقر
        UI.createGrid((g, c) => this.handleGridClick(g, c));
        
        UI.updateGrid(GameLogic.state);
        UI.updateHUD(GameLogic.state);
        UI.showScreen('screen-game');
    },

    // 4. معالجة النقر على الرقعة
    handleGridClick(g, c) {
        // أ. هل هناك قدرة مفعلة؟
        if (this.state.activePower) {
            this.executePower(this.state.activePower, g, c);
            return;
        }

        // ب. هل الحركة صالحة؟
        if (!GameLogic.isValidMove(g, c)) {
            AudioSys.error();
            return;
        }

        AudioSys.click();

        // ج. النمط الكلاسيكي (بدون رياضيات)
        if (this.state.currentMode === 'classic') {
            this.finalizeMove(g, c);
            return;
        }

        // د. الأنماط الحسابية
        this.state.pendingMove = { g, c };
        const levelData = GameLevels[this.state.currentMode];
        
        // اختيار سؤال
        let question;
        if (this.state.currentMode === 'balance') {
            const pool = Math.random() < 0.9 ? levelData.hard : levelData.easy;
            question = pool[Math.floor(Math.random() * pool.length)];
        } else {
            question = levelData.pool[Math.floor(Math.random() * levelData.pool.length)];
        }

        // إذا كانت المصفوفة فارغة (احتياط)، العب كلاسيكي
        if (!question) {
            this.finalizeMove(g, c);
            return;
        }

        this.state.currentQuestion = question;
        this.state.calcBuffer = [];
        
        UI.setupCalculator(question);
        UI.openModal('modal-calc');
    },

    // 5. الحاسبة
    handleCalcInput(key) {
        if (key === 'del') {
            AudioSys.click();
            this.state.calcBuffer.pop();
        } else if (key === 'ok') {
            this.verifyAnswer();
            return;
        } else {
            // إضافة رقم (بحد أقصى 3 خانات)
            const current = this.state.calcBuffer.join('');
            if (current.length < 3) {
                AudioSys.click();
                this.state.calcBuffer.push(key);
            }
        }
        UI.updateCalcInput([this.state.calcBuffer.join('')]);
    },

    verifyAnswer() {
        const inputVal = parseInt(this.state.calcBuffer.join(''));
        const correctVal = this.state.currentQuestion.a;

        if (inputVal === correctVal) {
            AudioSys.correct();
            UI.closeModal('modal-calc');
            const { g, c } = this.state.pendingMove;
            this.finalizeMove(g, c);
        } else {
            AudioSys.error();
            // اهتزاز وتصفير
            const screen = document.querySelector('.calc-screen');
            screen.style.color = 'red';
            setTimeout(() => screen.style.color = 'var(--text-main)', 400);
            this.state.calcBuffer = [];
            UI.updateCalcInput(['']);
        }
    },

    // 6. تنفيذ الحركة وتحديث الشاشة
    finalizeMove(g, c) {
        const result = GameLogic.makeMove(g, c);
        
        UI.updateGrid(GameLogic.state);
        UI.updateHUD(GameLogic.state);

        if (result === 'GAME_OVER') {
            AudioSys.win();
            const winner = GameLogic.state.winner;
            const name = winner === 'X' ? GameLogic.state.p1.name : GameLogic.state.p2.name;
            UI.showWinScreen(name);
        }
    },

    // 7. القدرات
    handlePowerClick(type, btn) {
        if (btn.style.opacity === '0.3') return;

        AudioSys.power();

        // إلغاء التفعيل إذا ضغطت مرة أخرى
        if (this.state.activePower === type) {
            this.state.activePower = null;
            btn.classList.remove('active');
            UI.updateStatus('تم إلغاء القدرة');
            return;
        }

        // تفعيل القدرة
        this.state.activePower = type;
        document.querySelectorAll('.power-fab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // تنفيذ فوري للتجميد (لأنه لا يحتاج لاختيار خلية)
        if (type === 'freeze') {
            if (GameLogic.useFreeze()) {
                UI.updateHUD(GameLogic.state);
                UI.updateStatus('❄️ تم تجميد الخصم!');
                this.state.activePower = null;
                btn.classList.remove('active');
            }
        } else {
            UI.updateStatus(type === 'nuke' ? 'اختر مربعاً لتدميره' : 'اختر خلية لسرقتها');
        }
    },

    executePower(type, g, c) {
        let success = false;
        if (type === 'nuke') success = GameLogic.useNuke(g);
        if (type === 'hack') success = GameLogic.useHack(g, c);

        if (success) {
            AudioSys.power();
            UI.updateGrid(GameLogic.state);
            UI.updateHUD(GameLogic.state);
            this.state.activePower = null;
            document.querySelectorAll('.power-fab').forEach(b => b.classList.remove('active'));
            UI.updateStatus('تم بنجاح!');
        } else {
            AudioSys.error();
            UI.updateStatus('حركة غير صالحة');
        }
    }
};

window.addEventListener('DOMContentLoaded', () => App.init());
