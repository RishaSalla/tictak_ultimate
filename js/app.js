/**
 * 🚀 MAIN APP CONTROLLER - RETRO EDITION
 * المنسق الرئيسي لعملية الربط الجماعي الشامل
 */

import { MathGenerator, HelpData } from './data.js';
import { GameLogic } from './logic.js';
import { UI } from './ui.js';
import { AudioSys } from './audio.js';

const App = {
    state: {
        currentMode: 'classic',
        pendingMove: null,
        currentQuestion: null,
        calcBuffer: [],
        activePower: null,
        configPin: '0000'
    },

    init() {
        // تفعيل النظام الصوتي
        document.body.addEventListener('click', () => AudioSys.init(), { once: true });
        
        this.bindEvents();
        GameLogic.init();
        
        // التأكد من أن الشاشة الأولى متمركزة وصحيحة
        UI.showScreen('screen-login');
        console.log("Risha Games: Unified System Connected.");
    },

    bindEvents() {
        // 1. نظام الدخول والتحقق
        document.getElementById('btn-login').addEventListener('click', () => {
            const pin = document.getElementById('pin-input').value;
            if (pin === this.state.configPin) {
                AudioSys.click();
                UI.showScreen('screen-setup');
            } else {
                AudioSys.error();
                const msg = document.getElementById('login-msg');
                msg.textContent = 'رمز الوصول غير صحيح';
                msg.classList.add('shake'); // إضافة اهتزاز ميكانيكي عند الخطأ
                setTimeout(() => msg.classList.remove('shake'), 400);
            }
        });

        // 2. تخصيص الفرق
        document.getElementById('btn-add-p1').addEventListener('click', () => this.handleRoster('p1'));
        document.getElementById('btn-add-p2').addEventListener('click', () => this.handleRoster('p2'));

        document.getElementById('btn-save-setup').addEventListener('click', () => {
            AudioSys.click();
            GameLogic.state.p1.name = document.getElementById('p1-main-name').value || 'فريق البرتقالي';
            GameLogic.state.p2.name = document.getElementById('p2-main-name').value || 'فريق الأزرق';
            UI.showScreen('screen-menu');
        });

        // 3. اختيار الأنماط
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => {
                AudioSys.power();
                this.runGame(card.dataset.mode);
            });
        });

        // 4. تفعيل المساعدة الشاملة (؟)
        document.querySelectorAll('.help-trigger').forEach(btn => {
            btn.addEventListener('click', () => {
                AudioSys.click();
                UI.openModal('modal-help', btn.dataset.help);
            });
        });
        document.getElementById('btn-close-help').addEventListener('click', () => UI.closeModal('modal-help'));

        // 5. التحكم في الحاسبة
        document.querySelector('.numpad').addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') this.processCalc(e.target.dataset.key);
        });

        // 6. القوى والانسحاب
        document.getElementById('btn-exit-game').addEventListener('click', () => {
            if(confirm("هل تريد العودة للقائمة؟")) UI.showScreen('screen-menu');
        });

        document.querySelectorAll('.power-btn').forEach(btn => {
            btn.addEventListener('click', () => this.triggerPower(btn));
        });
    },

    handleRoster(pid) {
        const input = document.getElementById(`${pid}-roster-input`);
        const name = input.value.trim();
        if (name) {
            GameLogic.state[pid].roster.push(name);
            const li = document.createElement('li');
            li.textContent = name;
            document.getElementById(`${pid}-roster-list`).appendChild(li);
            input.value = '';
            AudioSys.click();
        }
    },

    runGame(mode) {
        this.state.currentMode = mode;
        GameLogic.init();
        UI.createGrid((g, c) => this.onCellClick(g, c));
        UI.updateGrid(GameLogic.state);
        UI.updateHUD(GameLogic.state);
        UI.showScreen('screen-game');
    },

    onCellClick(g, c) {
        if (this.state.activePower) { this.usePowerOnGrid(g, c); return; }
        if (!GameLogic.isValidMove(g, c)) { AudioSys.error(); return; }

        AudioSys.click();

        if (this.state.currentMode === 'classic') {
            this.confirmMove(g, c);
            return;
        }

        this.state.pendingMove = { g, c };
        this.state.currentQuestion = MathGenerator.getQuestion(this.state.currentMode);
        this.state.calcBuffer = [];
        UI.setupCalculator(this.state.currentQuestion);
        UI.openModal('modal-calc');
    },

    processCalc(key) {
        if (key === 'del') {
            this.state.calcBuffer.pop();
        } else if (key === 'ok') {
            this.checkAnswer();
        } else {
            if (this.state.calcBuffer.length < 3) this.state.calcBuffer.push(key);
        }
        UI.updateCalcDisplay(this.state.calcBuffer);
        AudioSys.click();
    },

    checkAnswer() {
        const input = parseInt(this.state.calcBuffer.join(''));
        let correct = false;

        if (this.state.currentQuestion.isDuality) {
            // نمط الثنائيات: أي رقمين ناتجهما صحيح
            correct = (input < this.state.currentQuestion.targetSum); 
        } else {
            correct = (input === this.state.currentQuestion.a);
        }

        if (correct) {
            AudioSys.correct();
            UI.closeModal('modal-calc');
            this.confirmMove(this.state.pendingMove.g, this.state.pendingMove.c);
        } else {
            AudioSys.error();
            this.state.calcBuffer = [];
            UI.updateCalcDisplay(['ERROR']);
            document.getElementById('modal-calc').classList.add('shake');
            setTimeout(() => document.getElementById('modal-calc').classList.remove('shake'), 400);
        }
    },

    confirmMove(g, c) {
        const res = GameLogic.makeMove(g, c);
        UI.updateGrid(GameLogic.state);
        UI.updateHUD(GameLogic.state);

        if (res === 'GAME_OVER') {
            AudioSys.win();
            alert(`نهاية اللعبة! الفائز: ${GameLogic.state.winner === 'X' ? GameLogic.state.p1.name : GameLogic.state.p2.name}`);
            UI.showScreen('screen-menu');
        }
    },

    triggerPower(btn) {
        const type = btn.dataset.power;
        const pid = btn.classList.contains('p1') ? 'X' : 'O';
        if (GameLogic.state.turn !== pid) { AudioSys.error(); return; }
        
        AudioSys.power();
        if (type === 'freeze') {
            if (GameLogic.useFreeze()) UI.updateHUD(GameLogic.state);
        } else {
            this.state.activePower = type;
            btn.classList.add('glow');
        }
    }
};

window.addEventListener('DOMContentLoaded', () => App.init());
