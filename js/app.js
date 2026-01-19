/**
 * 🚀 MAIN APP CONTROLLER (UPDATED)
 * إدارة الاختيارات الجديدة + المنطق
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
        try {
            const res = await fetch('config.json');
            const data = await res.json();
            this.config.pin = data.security.default_pin;
        } catch(e) { console.log('Config loaded'); }

        document.body.addEventListener('click', () => AudioSys.init(), { once: true });
        this.bindEvents();
        UI.showScreen('screen-login');
        
        const pinInput = document.getElementById('pin-input');
        if(pinInput) pinInput.addEventListener('input', () => AudioSys.typewriter());
    },

    bindEvents() {
        // 1. تسجيل الدخول
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

        // 2. تفعيل أزرار الاختيار (الأيقونات والمؤقت)
        const setupSelector = (containerId) => {
            const container = document.getElementById(containerId);
            if(!container) return;
            container.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;
                container.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                AudioSys.click();
            });
        };
        setupSelector('p1-icon-selector');
        setupSelector('p2-icon-selector');
        setupSelector('timer-selector');

        // تبديل وضع الفرق
        document.getElementById('team-mode-toggle').addEventListener('change', (e) => {
            document.querySelectorAll('.roster-box').forEach(r => 
                e.target.checked ? r.classList.remove('hidden') : r.classList.add('hidden')
            );
            AudioSys.click();
        });

        // 3. حفظ الإعدادات (قراءة البيانات من الأزرار المختارة)
        document.getElementById('btn-save-setup').addEventListener('click', () => {
            AudioSys.correct();
            
            // دالة لجلب القيمة من الزر المختار
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

        // 4. اختيار النمط
        document.querySelectorAll('.mode-card').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.mode = btn.dataset.mode;
                this.startGame();
            });
        });

        // 5. داخل اللعبة
        document.getElementById('btn-back').addEventListener('click', () => {
            if(confirm('إنهاء المباراة؟')) {
                this.stopTimer();
                UI.showScreen('screen-menu');
            }
        });

        document.querySelectorAll('.power-btn').forEach(btn => {
            btn.addEventListener('click', () => this.activatePower(btn));
        });

        // 6. النوافذ والحاسبة
        document.getElementById('global-help-btn').addEventListener('click', () => {
            document.getElementById('modal-instructions').classList.remove('hidden');
        });
        document.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => btn.closest('.modal-overlay').classList.add('hidden'));
        });
        
        // أزرار التبويب في التعليمات
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById('help-body').innerHTML = HelpData[e.target.dataset.tab];
            });
        });

        // أزرار الحاسبة
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
        this.startTurnTimer();
    },

    handleGridClick(g, c) {
        if (this.state.activePower) {
            if (GameLogic.usePower(this.state.activePower, g, c)) {
                AudioSys.glitch();
                this.state.activePower = null;
                document.querySelectorAll('.power-btn').forEach(b => b.classList.remove('active'));
                this.endTurn();
            } else {
                AudioSys.error();
            }
            return;
        }

        if (!GameLogic.isValidMove(g, c)) {
            AudioSys.error();
            return;
        }

        AudioSys.click();

        if (this.state.mode === 'classic') {
            this.executeMove(g, c);
        } else {
            this.state.pendingMove = { g, c };
            this.state.currentQ = MathGenerator.getQuestion(this.state.mode);
            this.state.calcBuffer = [];
            document.getElementById('calc-q').textContent = this.state.currentQ.q;
            document.getElementById('calc-inputs').textContent = '_';
            document.getElementById('modal-calc').classList.remove('hidden');
            this.pauseTimer();
        }
    },

    executeMove(g, c) {
        const result = GameLogic.makeMove(g, c);
        UI.updateGrid(GameLogic.state);
        
        if (result === 'GAME_OVER') {
            AudioSys.win();
            this.stopTimer();
            setTimeout(() => {
                alert(`الفائز: ${GameLogic.state.winner}`);
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
        if (GameLogic.state.turn !== pid) { AudioSys.error(); return; }
        this.state.activePower = type;
        document.querySelectorAll('.power-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    },

    // --- المؤقت ---
    startTurnTimer() {
        this.stopTimer();
        if (this.config.timer === 0) return;
        this.state.timeLeft = this.config.timer;
        UI.updateTimer(100);
        this.state.timerInterval = setInterval(() => {
            this.state.timeLeft--;
            const percent = (this.state.timeLeft / this.config.timer) * 100;
            UI.updateTimer(percent);
            if (this.state.timeLeft <= 0) {
                this.stopTimer();
                AudioSys.error();
                GameLogic.switchTurn();
                this.endTurn();
            }
        }, 1000);
    },
    stopTimer() { if (this.state.timerInterval) clearInterval(this.state.timerInterval); },
    pauseTimer() { this.stopTimer(); },

    // --- الحاسبة ---
    handleCalcInput(key) {
        AudioSys.typewriter();
        if (key === 'del') this.state.calcBuffer.pop();
        else if (key === 'ok') this.verifyMath();
        else if (this.state.calcBuffer.length < 5) this.state.calcBuffer.push(key);
        document.getElementById('calc-inputs').textContent = this.state.calcBuffer.join('') || '_';
    },

    verifyMath() {
        const input = parseInt(this.state.calcBuffer.join(''));
        let correct = false;
        if (this.state.currentQ.isDuality) correct = (input < this.state.currentQ.targetSum);
        else correct = (input === this.state.currentQ.a);

        if (correct) {
            AudioSys.correct();
            document.getElementById('modal-calc').classList.add('hidden');
            this.executeMove(this.state.pendingMove.g, this.state.pendingMove.c);
        } else {
            AudioSys.error();
            this.state.calcBuffer = [];
            document.getElementById('calc-inputs').textContent = 'Error';
        }
    }
};

window.addEventListener('DOMContentLoaded', () => App.init());
