/**
 * 🚀 MAIN CONTROLLER - TEAM EDITION
 * نقطة التجميع: إدارة الفرق، التناوب، واللعب
 */

import { GameLevels } from './data.js';
import { GameLogic } from './logic.js';
import { UI } from './ui.js';
import { AudioSys } from './audio.js';

const App = {
    // حالة التطبيق المحلية
    state: {
        currentMode: null,
        pendingMove: null,
        currentQuestion: null,
        calcBuffer: [],
        activePower: null,
        configPin: '0000',
        
        // القوائم المؤقتة (أثناء التجهيز)
        tempRosters: {
            p1: [],
            p2: []
        }
    },

    // 1. نقطة الانطلاق
    init() {
        document.body.addEventListener('click', () => AudioSys.init(), { once: true });
        
        fetch('config.json')
            .then(res => res.json())
            .then(data => this.state.configPin = data.access_pin)
            .catch(() => console.log('Using default PIN: 0000'));

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

        // --- إدارة القوائم (Rosters Logic) - جديد ---
        
        // إضافة لاعب للفريق 1
        document.getElementById('btn-add-p1').addEventListener('click', () => {
            this.addPlayerToRoster('p1');
        });
        // إضافة لاعب للفريق 2
        document.getElementById('btn-add-p2').addEventListener('click', () => {
            this.addPlayerToRoster('p2');
        });

        // حذف لاعب (Delegation)
        ['p1', 'p2'].forEach(pid => {
            document.getElementById(`${pid}-roster-list`).addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-player')) {
                    AudioSys.click();
                    const idx = parseInt(e.target.dataset.idx);
                    this.state.tempRosters[pid].splice(idx, 1); // حذف من المصفوفة
                    UI.renderRoster(pid, this.state.tempRosters[pid]); // إعادة الرسم
                }
            });
        });

        // --- اختيار الأفاتار ---
        ['p1', 'p2'].forEach(pid => {
            document.getElementById(`${pid}-avatars`).addEventListener('click', (e) => {
                if (e.target.classList.contains('av-btn')) {
                    AudioSys.click();
                    const val = e.target.dataset.val;
                    UI.updateAvatarSelection(pid, val);
                    GameLogic.state[pid].avatar = val; 
                }
            });
        });

        // --- حفظ وانطلاق ---
        document.getElementById('btn-save-setup').addEventListener('click', () => {
            AudioSys.click();
            
            // نقل القوائم إلى المنطق
            GameLogic.state.p1.roster = [...this.state.tempRosters.p1];
            GameLogic.state.p2.roster = [...this.state.tempRosters.p2];

            // حماية: إذا كانت القائمة فارغة، أضف لاعباً افتراضياً
            if (GameLogic.state.p1.roster.length === 0) GameLogic.state.p1.roster.push('لاعب X');
            if (GameLogic.state.p2.roster.length === 0) GameLogic.state.p2.roster.push('لاعب O');

            // حفظ أسماء الفرق (ثابتة أو حسب الأفاتار)
            GameLogic.state.p1.name = `فريق (${GameLogic.state.p1.avatar || 'X'})`;
            GameLogic.state.p2.name = `فريق (${GameLogic.state.p2.avatar || 'O'})`;

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
        document.getElementById('btn-show-help-main').addEventListener('click', () => UI.openModal('modal-help'));

        // --- اللعبة ---
        document.getElementById('btn-exit-game').addEventListener('click', () => {
            AudioSys.click();
            UI.openModal('modal-exit-confirm');
        });
        
        document.getElementById('btn-confirm-exit').addEventListener('click', () => {
            UI.closeModal('modal-exit-confirm');
            UI.showScreen('screen-menu');
        });
        document.getElementById('btn-cancel-exit').addEventListener('click', () => {
            UI.closeModal('modal-exit-confirm');
        });

        document.getElementById('btn-help-game').addEventListener('click', () => UI.openModal('modal-help'));
        document.getElementById('btn-close-help').addEventListener('click', () => UI.closeModal('modal-help'));
        
        // أزرار القدرات
        document.querySelectorAll('.power-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const isP1Turn = GameLogic.state.turn === 'X';
                const isBtnP1 = btn.classList.contains('p1');
                
                if ((isP1Turn && !isBtnP1) || (!isP1Turn && isBtnP1)) {
                    AudioSys.error();
                    return;
                }
                
                this.handlePowerClick(btn.dataset.power, btn);
            });
        });

        // --- نوافذ النهاية ---
        document.getElementById('btn-rematch').addEventListener('click', () => {
            UI.closeModal('modal-win');
            this.startGame(this.state.currentMode);
        });
        document.getElementById('btn-home').addEventListener('click', () => {
            UI.closeModal('modal-win');
            UI.showScreen('screen-menu');
        });

        // --- الحاسبة ---
        document.querySelector('.numpad').addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                this.handleCalcInput(e.target.dataset.key);
            }
        });
    },

    // دالة مساعدة لإضافة لاعب
    addPlayerToRoster(pid) {
        const inputId = pid === 'p1' ? 'p1-input-name' : 'p2-input-name';
        const input = document.getElementById(inputId);
        const name = input.value.trim();

        if (name) {
            AudioSys.click();
            this.state.tempRosters[pid].push(name);
            input.value = ''; // مسح الحقل
            input.focus();
            UI.renderRoster(pid, this.state.tempRosters[pid]);
        } else {
            AudioSys.error(); // تنبيه إذا الحقل فارغ
        }
    },

    // 3. بدء اللعبة
    startGame(mode) {
        this.state.currentMode = mode;
        this.state.activePower = null;
        GameLogic.init();
        
        UI.createGrid((g, c) => this.handleGridClick(g, c));
        UI.updateGrid(GameLogic.state);
        UI.updateHUD(GameLogic.state);
        UI.showScreen('screen-game');
    },

    // 4. معالجة النقر على الرقعة
    handleGridClick(g, c) {
        if (this.state.activePower) {
            this.executePower(this.state.activePower, g, c);
            return;
        }

        if (!GameLogic.isValidMove(g, c)) {
            AudioSys.error();
            return;
        }

        AudioSys.click();

        if (this.state.currentMode === 'classic') {
            this.finalizeMove(g, c);
            return;
        }

        // الأنماط الحسابية
        this.state.pendingMove = { g, c };
        const levelData = GameLevels[this.state.currentMode];
        
        let question;
        if (this.state.currentMode === 'balance') {
            const pool = Math.random() < 0.9 ? levelData.hard : levelData.easy;
            question = pool[Math.floor(Math.random() * pool.length)];
        } else {
            question = levelData.pool[Math.floor(Math.random() * levelData.pool.length)];
        }

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
            const screen = document.querySelector('.calc-screen');
            screen.style.color = '#e74c3c';
            setTimeout(() => screen.style.color = 'var(--text-main)', 400);
            this.state.calcBuffer = [];
            UI.updateCalcInput(['']);
        }
    },

    // 6. تنفيذ الحركة
    finalizeMove(g, c) {
        const result = GameLogic.makeMove(g, c);
        
        UI.updateGrid(GameLogic.state);
        UI.updateHUD(GameLogic.state);

        if (result === 'GAME_OVER') {
            AudioSys.win();
            const winner = GameLogic.state.winner;
            const teamName = winner === 'X' ? GameLogic.state.p1.name : GameLogic.state.p2.name;
            UI.showWinScreen(teamName);
        }
    },

    // 7. التعامل مع القدرات
    handlePowerClick(type, btn) {
        if (btn.style.opacity === '0.4') return;

        AudioSys.power();

        if (this.state.activePower === type) {
            this.state.activePower = null;
            btn.classList.remove('active');
            UI.updateStatus('تم الإلغاء');
            return;
        }

        this.state.activePower = type;
        document.querySelectorAll('.power-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (type === 'freeze') {
            if (GameLogic.useFreeze()) {
                UI.updateHUD(GameLogic.state);
                UI.updateStatus('❄️ تجميد!');
                this.state.activePower = null;
                btn.classList.remove('active');
            }
        } else {
            UI.updateStatus(type === 'nuke' ? 'اختر مربعاً ☢️' : 'اختر خلية ✋');
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
            document.querySelectorAll('.power-btn').forEach(b => b.classList.remove('active'));
            UI.updateStatus('تم بنجاح!');
        } else {
            AudioSys.error();
            UI.updateStatus('حركة غير صالحة');
        }
    }
};

window.addEventListener('DOMContentLoaded', () => App.init());
