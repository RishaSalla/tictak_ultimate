/**
 * 🚀 MAIN APP CONTROLLER - RETRO MECHANICAL EDITION
 * المنسق الرئيسي لجميع ملفات النظام والمنطق الرياضي
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
        configPin: '0000' // يمكن تغييره من config.json
    },

    init() {
        // تفعيل الصوت عند أول نقرة للمستخدم
        document.body.addEventListener('click', () => AudioSys.init(), { once: true });
        
        this.bindEvents();
        GameLogic.init();
        console.log("Risha Games: System Loaded...");
    },

    bindEvents() {
        // 1. نظام الدخول
        document.getElementById('btn-login').addEventListener('click', () => {
            const pin = document.getElementById('pin-input').value;
            if (pin === this.state.configPin) {
                AudioSys.click();
                UI.showScreen('screen-setup');
            } else {
                AudioSys.error();
                document.getElementById('login-msg').textContent = 'رمز غير صحيح';
            }
        });

        // 2. إعداد الفرق والأسماء
        document.getElementById('btn-add-p1').addEventListener('click', () => this.addToRoster('p1'));
        document.getElementById('btn-add-p2').addEventListener('click', () => this.addToRoster('p2'));

        document.getElementById('btn-save-setup').addEventListener('click', () => {
            AudioSys.click();
            GameLogic.state.p1.name = document.getElementById('p1-main-name').value || 'الفريق البرتقالي';
            GameLogic.state.p2.name = document.getElementById('p2-main-name').value || 'الفريق الأزرق';
            UI.showScreen('screen-menu');
        });

        // 3. اختيار نمط اللعب
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => {
                AudioSys.power();
                this.startGame(card.dataset.mode);
            });
        });

        // 4. أزرار المساعدة (؟) في كل الصفحات
        document.querySelectorAll('.help-trigger').forEach(btn => {
            btn.addEventListener('click', () => {
                AudioSys.click();
                UI.openModal('modal-help', btn.dataset.help);
            });
        });
        document.getElementById('btn-close-help').addEventListener('click', () => UI.closeModal('modal-help'));

        // 5. الحاسبة الميكانيكية
        document.querySelector('.numpad').addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') this.handleCalcInput(e.target.dataset.key);
        });

        // 6. القوى والانسحاب
        document.getElementById('btn-exit-game').addEventListener('click', () => {
            if(confirm("هل تريد العودة للقائمة؟")) UI.showScreen('screen-menu');
        });

        document.querySelectorAll('.power-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handlePowerActivation(btn));
        });
    },

    addToRoster(pid) {
        const input = document.getElementById(`${pid}-roster-input`);
        const name = input.value.trim();
        if (name) {
            AudioSys.click();
            GameLogic.state[pid].roster.push(name);
            const li = document.createElement('li');
            li.textContent = name;
            document.getElementById(`${pid}-roster-list`).appendChild(li);
            input.value = '';
        }
    },

    startGame(mode) {
        this.state.currentMode = mode;
        GameLogic.init();
        UI.createGrid((g, c) => this.handleGridClick(g, c));
        UI.updateGrid(GameLogic.state);
        UI.updateHUD(GameLogic.state);
        UI.showScreen('screen-game');
    },

    handleGridClick(g, c) {
        if (this.state.activePower) { this.executePower(g, c); return; }
        if (!GameLogic.isValidMove(g, c)) { AudioSys.error(); return; }

        AudioSys.click();

        // النمط الكلاسيكي لا يحتاج حاسبة
        if (this.state.currentMode === 'classic') {
            this.finalizeMove(g, c);
            return;
        }

        // الأنماط الرياضية: توليد سؤال
        this.state.pendingMove = { g, c };
        const question = MathGenerator.getQuestion(this.state.currentMode);
        this.state.currentQuestion = question;
        this.state.calcBuffer = [];
        
        UI.setupCalculator(question);
        UI.openModal('modal-calc');
    },

    handleCalcInput(key) {
        if (key === 'del') {
            this.state.calcBuffer.pop();
        } else if (key === 'ok') {
            this.verifyAnswer();
        } else {
            if (this.state.calcBuffer.length < 3) this.state.calcBuffer.push(key);
        }
        UI.updateCalcDisplay(this.state.calcBuffer);
        AudioSys.click();
    },

    verifyAnswer() {
        const input = parseInt(this.state.calcBuffer.join(''));
        let isCorrect = false;

        // التحقق من الإجابة (دعم نمط الثنائيات المفتوح)
        if (this.state.currentQuestion.isDuality) {
            // في الثنائيات يقبل أي رقمين ناتجهما صحيح
            // للتبسيط هنا نتحقق من الرقم المدخل كأحد الطرفين
            isCorrect = (input < this.state.currentQuestion.targetSum); 
        } else {
            isCorrect = (input === this.state.currentQuestion.a);
        }

        if (isCorrect) {
            AudioSys.correct();
            UI.closeModal('modal-calc');
            this.finalizeMove(this.state.pendingMove.g, this.state.pendingMove.c);
        } else {
            AudioSys.error();
            this.state.calcBuffer = [];
            UI.updateCalcDisplay(['خطأ!']);
        }
    },

    finalizeMove(g, c) {
        const result = GameLogic.makeMove(g, c);
        UI.updateGrid(GameLogic.state);
        UI.updateHUD(GameLogic.state);

        if (result === 'GAME_OVER') {
            AudioSys.win();
            alert(`مبروك! فاز ${GameLogic.state.winner === 'X' ? GameLogic.state.p1.name : GameLogic.state.p2.name}`);
            UI.showScreen('screen-menu');
        }
    },

    handlePowerActivation(btn) {
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
