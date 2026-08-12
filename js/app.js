/**
 * 🚀 MAIN APP CONTROLLER (FINAL LOGIC)
 * تفعيل المعلق الآلي + استشعار نهايات اللعبة الجديدة + إدارة حذف اللاعبين
 */

import { MathGenerator, HelpData } from './data.js';
import { GameLogic } from './logic.js';
import { UI } from './ui.js';
import { AudioSys } from './audio.js';

const App = {
    config: { pin: '12345678', timer: 0 },
    state: {
        mode: 'classic',
        mathConfig: { min: 1, max: 12, ops: ['+'] }, 
        timerInterval: null,
        timeLeft: 0,
        pendingMove: null, 
        currentQ: null,
        calcBuffer: [],
        activePower: null,
        p1: null,
        p2: null,
        dualityStep: 0, 
        dualityVal1: null,
        tempRosterP1: [],
        tempRosterP2: []
    },

    async init() {
        try {
            const res = await fetch('config.json');
            const data = await res.json();
            this.config.pin = data.security.default_pin;
        } catch(e) { console.log('Config loaded default'); }

        document.body.addEventListener('click', () => AudioSys.init(), { once: true });
        
        this.bindEvents();
        UI.showScreen('screen-login');
        
        const pinInput = document.getElementById('pin-input');
        if(pinInput) pinInput.addEventListener('input', () => AudioSys.typewriter());
    },

    bindEvents() {
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

        document.getElementById('team-mode-toggle').addEventListener('change', (e) => {
            document.querySelectorAll('.roster-box').forEach(r => 
                e.target.checked ? r.classList.remove('hidden') : r.classList.add('hidden')
            );
            AudioSys.click();
        });

        // تم التعديل هنا: إضافة زر الحذف التفاعلي مع كل اسم
        const handleAddMember = (teamId) => {
            const inputField = document.getElementById(`${teamId}-member`);
            const name = inputField.value.trim();
            if(name === '') return;
            
            const rosterArray = teamId === 'p1' ? this.state.tempRosterP1 : this.state.tempRosterP2;
            rosterArray.push(name);

            const list = document.getElementById(`${teamId}-list`);
            const li = document.createElement('li');
            
            // تنسيق السطر ليحتوي الاسم وزر الحذف
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.style.marginBottom = '5px';
            li.style.background = 'rgba(255,255,255,0.05)';
            li.style.padding = '5px 10px';
            li.style.borderRadius = '6px';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = name;

            // إنشاء زر الحذف بنفس ستايل زر الإضافة
            const delBtn = document.createElement('button');
            delBtn.textContent = '✖';
            delBtn.className = 'mech-btn small';
            delBtn.style.padding = '2px 8px';
            delBtn.style.fontSize = '0.7rem';

            // برمجة عملية الحذف
            delBtn.addEventListener('click', () => {
                const index = rosterArray.indexOf(name);
                if (index > -1) {
                    rosterArray.splice(index, 1); // حذف الاسم من الذاكرة
                }
                li.remove(); // حذف العنصر من الشاشة
                AudioSys.click();
            });

            li.appendChild(nameSpan);
            li.appendChild(delBtn);
            list.appendChild(li);

            inputField.value = '';
            AudioSys.typewriter();
        };

        document.getElementById('btn-add-p1').addEventListener('click', () => handleAddMember('p1'));
        document.getElementById('btn-add-p2').addEventListener('click', () => handleAddMember('p2'));

        document.getElementById('btn-save-setup').addEventListener('click', () => {
            AudioSys.correct();
            
            const getVal = (id) => {
                const sel = document.querySelector(`#${id} .selected`);
                return sel ? sel.dataset.val : (id.includes('p1') ? 'X' : 'O');
            };
            
            this.config.timer = parseInt(getVal('timer-selector')) || 0;
            
            const p1 = {
                name: document.getElementById('p1-name').value || 'الفريق البرتقالي',
                icon: getVal('p1-icon-selector'),
                roster: [...this.state.tempRosterP1], 
                score: 0 
            };
            const p2 = {
                name: document.getElementById('p2-name').value || 'الفريق الأزرق',
                icon: getVal('p2-icon-selector'),
                roster: [...this.state.tempRosterP2],
                score: 0 
            };
            
            this.state.p1 = p1;
            this.state.p2 = p2;

            GameLogic.init(p1, p2);
            UI.setAvatars(p1.icon, p2.icon);
            UI.showScreen('screen-menu');
        });

        document.querySelectorAll('.mode-card').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.mode = btn.dataset.mode;
                AudioSys.click();
                
                if (this.state.mode === 'classic') {
                    this.startGame();
                } else {
                    document.getElementById('modal-math-setup').classList.remove('hidden');
                }
            });
        });

        const mathSetupModal = document.getElementById('modal-math-setup');
        if (mathSetupModal) {
            document.getElementById('btn-close-math-setup').addEventListener('click', () => {
                mathSetupModal.classList.add('hidden');
                AudioSys.click();
            });

            document.querySelectorAll('.op-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.target.classList.toggle('selected');
                    AudioSys.click();
                });
            });

            document.getElementById('btn-math-random').addEventListener('click', () => {
                document.querySelectorAll('.op-btn').forEach(btn => btn.classList.add('selected'));
                AudioSys.click();
            });

            document.getElementById('btn-confirm-math-setup').addEventListener('click', () => {
                let min = parseInt(document.getElementById('math-range-min').value) || 1;
                let max = parseInt(document.getElementById('math-range-max').value) || 12;
                let selectedOps = [];
                document.querySelectorAll('.op-btn.selected').forEach(btn => selectedOps.push(btn.dataset.op));
                if (selectedOps.length === 0) selectedOps = ['+'];

                this.state.mathConfig = { min, max, ops: selectedOps };
                mathSetupModal.classList.add('hidden');
                AudioSys.correct();
                this.startGame();
            });
        }

        const modalExit = document.getElementById('modal-exit');
        
        document.getElementById('btn-back').addEventListener('click', () => {
            modalExit.classList.remove('hidden');
            AudioSys.click();
        });

        document.getElementById('btn-cancel-exit').addEventListener('click', () => {
            modalExit.classList.add('hidden');
            AudioSys.click();
        });

        document.getElementById('btn-close-exit').addEventListener('click', () => {
            modalExit.classList.add('hidden');
            AudioSys.click();
        });

        document.getElementById('btn-confirm-exit').addEventListener('click', () => {
            modalExit.classList.add('hidden');
            this.stopTimer();
            AudioSys.click();
            this.fullReset(); 
        });

        document.getElementById('btn-victory-menu').addEventListener('click', () => {
            document.getElementById('modal-victory').classList.add('hidden');
            AudioSys.click();
            this.fullReset();
        });

        document.getElementById('btn-rematch').addEventListener('click', () => {
            document.getElementById('modal-victory').classList.add('hidden');
            AudioSys.click();
            
            GameLogic.init(GameLogic.state.p1, GameLogic.state.p2);
            this.state.activePower = null;
            document.querySelectorAll('.power-btn').forEach(b => b.classList.remove('active'));
            
            this.startGame(); 
        });

        document.querySelectorAll('.power-btn').forEach(btn => {
            btn.addEventListener('click', () => this.activatePower(btn));
        });

        document.getElementById('global-help-btn').addEventListener('click', () => {
            document.getElementById('modal-instructions').classList.remove('hidden');
        });
        document.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => btn.closest('.modal-overlay').classList.add('hidden'));
        });
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById('help-body').innerHTML = HelpData[e.target.dataset.tab];
            });
        });

        const numpad = document.querySelector('.numpad-grid');
        if(numpad) {
            numpad.addEventListener('click', (e) => {
                if(e.target.tagName === 'BUTTON') this.handleCalcInput(e.target.dataset.key);
            });
        }
    },

    fullReset() {
        this.state.p1 = null;
        this.state.p2 = null;
        this.state.tempRosterP1 = [];
        this.state.tempRosterP2 = [];
        document.getElementById('p1-list').innerHTML = '';
        document.getElementById('p2-list').innerHTML = '';
        document.getElementById('p1-name').value = '';
        document.getElementById('p2-name').value = '';
        
        GameLogic.init(null, null);
        
        this.state.activePower = null;
        document.querySelectorAll('.power-btn').forEach(b => b.classList.remove('active'));
        UI.updateGrid(GameLogic.state);
        UI.updateHUD(GameLogic.state);
        
        UI.showScreen('screen-setup');
    },

    startGame() {
        UI.initGrid((g, c) => this.handleGridClick(g, c));
        UI.updateGrid(GameLogic.state);
        UI.updateHUD(GameLogic.state);
        UI.showScreen('screen-game');
        UI.log('اللعبة بدأت! التحدي ينطلق الآن 🚀');
        AudioSys.win(); 
        this.startTurnTimer();
    },

    handleGridClick(g, c) {
        let isPowerMove = false;
        let powerType = null;

        if (this.state.activePower) {
            isPowerMove = true;
            powerType = this.state.activePower;
            const state = GameLogic.state;
            let validTarget = false;
            
            if (powerType === 'nuke' && state.metaGrid[g] === null) validTarget = true;
            if (powerType === 'freeze') validTarget = true;
            if (powerType === 'hack' && state.grid[g][c] !== null && state.grid[g][c] !== state.turn) validTarget = true;

            if (!validTarget) {
                AudioSys.error();
                UI.log('هدف غير صالح للقوة!');
                return;
            }
        } 
        else {
            if (!GameLogic.isValidMove(g, c)) {
                AudioSys.error();
                return;
            }
        }

        AudioSys.click();

        if (this.state.mode === 'classic') {
            if (isPowerMove) {
                this.executePower(powerType, g, c);
            } else {
                this.executeMove(g, c);
            }
        } 
        else {
            this.state.pendingMove = { g, c, isPowerMove, powerType };
            this.state.currentQ = MathGenerator.getQuestion(this.state.mode, this.state.mathConfig);
            this.state.calcBuffer = [];
            this.state.dualityStep = 0;
            this.state.dualityVal1 = null;

            document.getElementById('calc-q').textContent = this.state.currentQ.q;
            document.getElementById('calc-inputs').textContent = '_';
            document.getElementById('modal-calc').classList.remove('hidden');
            this.pauseTimer(); 
        }
    },

    executeMove(g, c) {
        const currentPlayer = GameLogic.getCurrentMemberName();
        const prevMeta = [...GameLogic.state.metaGrid]; // لحفظ حالة الساحة قبل النقلة
        
        const result = GameLogic.makeMove(g, c);
        UI.updateGrid(GameLogic.state);
        
        // التحقق من كافة نهايات اللعبة الممكنة
        if (result === 'GAME_OVER' || result === 'GAME_OVER_POINTS' || result === 'GAME_OVER_TIE') {
            AudioSys.win();
            this.stopTimer();
            setTimeout(() => {
                UI.showVictory(GameLogic.state, result); // نرسل نوع النتيجة للواجهة
            }, 500);
        } else if (result === 'TRAP_TRIGGERED') {
            AudioSys.error(); 
            UI.log('فخ التجميد ❄️! خصمك يقع في الفخ ويفقد دوره.');
            this.endTurn(); 
        } else {
            // المعلق الآلي يقرأ الحدث
            if (GameLogic.state.metaGrid[g] !== prevMeta[g]) {
                UI.log(`اللاعب (${currentPlayer}) يسيطر على مربع بالكامل! 🔥`);
            } else {
                UI.log(`اللاعب (${currentPlayer}) يثبت رمزه بنجاح.`);
            }
            this.endTurn();
        }
    },

    executePower(type, g, c) {
        const currentPlayer = GameLogic.getCurrentMemberName();
        const result = GameLogic.usePower(type, g, c);
        
        if (result) {
            AudioSys.glitch();
            let powerName = type === 'nuke' ? 'النووي ☢️' : type === 'freeze' ? 'التجميد ❄️' : 'الهاك 👾';
            UI.log(`اللاعب (${currentPlayer}) فعّل قوة ${powerName}!`);
            
            UI.updateGrid(GameLogic.state);
            this.state.activePower = null;
            document.querySelectorAll('.power-btn').forEach(b => b.classList.remove('active'));
            
            if (result === 'GAME_OVER' || result === 'GAME_OVER_POINTS' || result === 'GAME_OVER_TIE') {
                AudioSys.win();
                this.stopTimer();
                setTimeout(() => {
                    UI.showVictory(GameLogic.state, result);
                }, 500);
            } else {
                this.endTurn();
            }
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
                const currentPlayer = GameLogic.getCurrentMemberName();
                UI.log(`انتهى الوقت! اللاعب (${currentPlayer}) يفقد دوره ⏱️.`);
                
                GameLogic.switchTurn();
                this.endTurn();
            }
        }, 1000);
    },

    stopTimer() { if (this.state.timerInterval) clearInterval(this.state.timerInterval); },
    pauseTimer() { this.stopTimer(); },

    handleCalcInput(key) {
        AudioSys.typewriter();

        if (key === 'del') {
            this.state.calcBuffer.pop();
        } 
        else if (key === 'ok') {
            if (this.state.calcBuffer.length === 0) {
                AudioSys.error();
                return;
            }
            if (this.state.currentQ.isDuality) this.handleDualitySubmit();
            else this.verifyMath();
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
            const op = this.state.currentQ.dualityOp || '+';
            document.getElementById('calc-inputs').textContent = `${this.state.dualityVal1} ${op} ${currentVal}`;
        } else {
            document.getElementById('calc-inputs').textContent = currentVal;
        }
    },

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
            const op = this.state.currentQ.dualityOp;
            let result = 0;
            if (op === '+') result = this.state.dualityVal1 + val;
            else if (op === '-') result = this.state.dualityVal1 - val;
            else if (op === '*') result = this.state.dualityVal1 * val;
            else if (op === '/') result = val !== 0 ? this.state.dualityVal1 / val : 0;
            
            if (result === this.state.currentQ.targetSum) this.onMathSuccess();
            else this.onMathFail();
        }
    },

    verifyMath() {
        const input = parseInt(this.state.calcBuffer.join(''));
        if (input === this.state.currentQ.a) this.onMathSuccess();
        else this.onMathFail();
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
        const currentPlayer = GameLogic.getCurrentMemberName();
        this.state.calcBuffer = [];
        document.getElementById('calc-inputs').textContent = 'خطأ ❌';
        
        setTimeout(() => {
            document.getElementById('modal-calc').classList.add('hidden');
            UI.log(`إجابة خاطئة! اللاعب (${currentPlayer}) يخسر النقلة ❌.`);
            
            this.state.activePower = null;
            document.querySelectorAll('.power-btn').forEach(b => b.classList.remove('active'));

            GameLogic.skipTurn(); 
            this.endTurn();
        }, 1000);
    }
};

window.addEventListener('DOMContentLoaded', () => App.init());
