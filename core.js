/**
 * MATH MATRIX ENGINE - ULTIMATE EDITION
 * Includes: Audio, Timer, Global Win, HUD, Animations
 */

// 1. نظام الصوت (Base64 Encoded for Zero-Dependency)
const AudioController = {
    sounds: {
        click: new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"), // (مختصر)
        win: new Audio("data:audio/wav;base64,UklGRiQtT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YX"),   // (مختصر)
        error: new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU") // (مختصر)
    },
    // *ملاحظة: لاستخدام أصوات حقيقية، يمكن استبدال السلاسل أعلاه بروابط ملفات mp3 لاحقاً.
    // حالياً سأستخدم دالة لتوليد نغمة بسيطة باستخدام Web Audio API لتجنب مشاكل الملفات الطويلة
    
    ctx: null,
    init: function() {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
    },
    playTone: function(freq, type, duration) {
        if (!this.ctx) this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    click: function() { this.playTone(800, 'sine', 0.1); },
    error: function() { this.playTone(150, 'sawtooth', 0.3); },
    win: function() { 
        this.playTone(400, 'square', 0.1);
        setTimeout(() => this.playTone(600, 'square', 0.1), 100);
        setTimeout(() => this.playTone(800, 'square', 0.4), 200);
    }
};

let selectedLevelId = null;

function selectLevel(lvlId, cardElement) {
    AudioController.click();
    document.querySelectorAll('.plasma-card').forEach(c => c.classList.remove('active-card'));
    cardElement.classList.add('active-card');
    selectedLevelId = lvlId;
    const btn = document.getElementById('btn-start-game');
    if(btn) btn.classList.remove('hidden');
}

const App = {
    config: null,
    // حالة اللعب
    currentPlayer: 'X',
    nextForcedGrid: null,
    gridStatus: Array(9).fill(null),
    
    // بيانات الفرق والنتائج
    names: { X: "Team X", O: "Team O" },
    scores: { X: 0, O: 0 },
    timerSetting: 0, // 0 = لا يوجد

    // متغيرات الحاسبة والمؤقت
    currentActiveCell: null,
    currentInput: "",
    currentAnswer: 0,
    timerInterval: null,

    init: async function() {
        try {
            const response = await fetch('config.json');
            this.config = await response.json();
        } catch (e) {
            this.config = { accessCode: "00000000" };
        }
        this.setupLoginEvents();
    },

    setupLoginEvents: function() {
        const btn = document.getElementById('btn-verify');
        const input = document.getElementById('access-code');
        if(btn) btn.onclick = () => this.verifyAccess();
        if(input) input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.verifyAccess();
        });
    },

    verifyAccess: function() {
        const input = document.getElementById('access-code');
        const msg = document.getElementById('login-msg');
        msg.style.color = "#00C9FF";
        msg.textContent = "جاري التحقق...";
        
        setTimeout(() => {
            if (input.value === this.config.accessCode) {
                AudioController.win();
                document.getElementById('login-gate').classList.add('hidden');
                document.getElementById('app-content').classList.remove('hidden');
            } else {
                AudioController.error();
                msg.style.color = "#FF4D4D";
                msg.textContent = "شفرة خاطئة";
                input.style.border = "1px solid #FF4D4D";
            }
        }, 500);
    },

    launchGame: function() {
        if(!selectedLevelId) return;
        AudioController.click();
        document.getElementById('battle-setup').classList.remove('hidden');
    },

    hideSetup: function() {
        AudioController.click();
        document.getElementById('battle-setup').classList.add('hidden');
    },

    startMatch: function() {
        AudioController.win();
        
        // 1. قراءة الأسماء والإعدادات
        this.names.X = document.getElementById('p1-name').value || "الفريق X";
        this.names.O = document.getElementById('p2-name').value || "الفريق O";
        
        const timerOptions = document.getElementsByName('timer');
        for(let t of timerOptions) { if(t.checked) this.timerSetting = parseInt(t.value); }

        // تحديث HUD
        document.getElementById('hud-name-x').textContent = this.names.X;
        document.getElementById('hud-name-o').textContent = this.names.O;
        document.getElementById('game-hud').classList.remove('hidden');
        this.updateHUD();

        // إخفاء القوائم
        this.hideSetup();
        document.querySelector('.levels-grid').classList.add('hidden');
        document.querySelector('.game-header').classList.add('hidden');
        document.querySelector('.action-area').classList.add('hidden');
        
        const arena = document.getElementById('game-arena');
        arena.classList.remove('hidden');
        
        // إعادة تهيئة المتغيرات للجولة
        this.currentPlayer = 'X';
        this.nextForcedGrid = null;
        this.gridStatus = Array(9).fill(null);
        
        this.buildBoard();
        this.highlightActiveGrid();
    },

    rematch: function() {
        // إعادة لعب نفس الجولة بنفس الأسماء
        document.getElementById('victory-modal').classList.add('hidden');
        this.startMatch(); // سيعيد القراءة من الحقول الموجودة أصلاً
    },

    buildBoard: function() {
        const arena = document.getElementById('game-arena');
        arena.innerHTML = ''; 
        for(let i=0; i<9; i++) {
            const subGrid = document.createElement('div');
            subGrid.className = 'sub-grid';
            subGrid.id = `grid-${i}`;
            for(let j=0; j<9; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.grid = i; 
                cell.dataset.cell = j; 
                cell.onclick = () => this.openCalculator(cell);
                subGrid.appendChild(cell);
            }
            arena.appendChild(subGrid);
        }
    },

    updateHUD: function() {
        document.getElementById('score-board').textContent = `${this.scores.X} - ${this.scores.O}`;
        
        // تظليل اللاعب الحالي
        const xEl = document.getElementById('hud-x');
        const oEl = document.getElementById('hud-o');
        if(this.currentPlayer === 'X') {
            xEl.classList.add('active-turn');
            oEl.classList.remove('active-turn');
        } else {
            oEl.classList.add('active-turn');
            xEl.classList.remove('active-turn');
        }
    },

    highlightActiveGrid: function() {
        this.updateHUD(); // تحديث الدور في الأعلى
        for(let i=0; i<9; i++) {
            const grid = document.getElementById(`grid-${i}`);
            grid.classList.remove('active-zone');
            if (this.gridStatus[i] === null) {
                if (this.nextForcedGrid === null || this.nextForcedGrid === i) {
                    grid.classList.add('active-zone');
                }
            }
        }
    },

    openCalculator: function(cell) {
        if(cell.classList.contains('x-marked') || cell.classList.contains('o-marked')) return;

        const gridIdx = parseInt(cell.dataset.grid);
        // التحقق من الإجبار
        if (this.nextForcedGrid !== null && this.nextForcedGrid !== gridIdx) {
            AudioController.error();
            const forcedGrid = document.getElementById(`grid-${this.nextForcedGrid}`);
            forcedGrid.style.transform = "translateX(5px)";
            setTimeout(() => forcedGrid.style.transform = "translateX(0)", 100);
            return; 
        }
        if (this.gridStatus[gridIdx] !== null) return;

        AudioController.click();
        this.currentActiveCell = cell;
        this.currentInput = "";
        
        const n1 = Math.floor(Math.random() * 9) + 2;
        const n2 = Math.floor(Math.random() * 9) + 2;
        this.currentAnswer = n1 * n2;
        
        document.getElementById('calc-question').textContent = `${n1} × ${n2} = ?`;
        document.getElementById('calc-input').textContent = "_";
        document.getElementById('math-modal').classList.remove('hidden');

        // بدء المؤقت إذا كان مفعلاً
        this.startTimer();
    },

    startTimer: function() {
        const barContainer = document.getElementById('timer-bar-container');
        const barFill = document.getElementById('timer-bar-fill');
        
        // تصفير أي مؤقت سابق
        clearInterval(this.timerInterval);
        barContainer.classList.add('hidden');
        
        if (this.timerSetting > 0) {
            barContainer.classList.remove('hidden');
            barFill.style.transition = 'none';
            barFill.style.width = '100%';
            
            // بدء العد التنازلي
            setTimeout(() => {
                barFill.style.transition = `width ${this.timerSetting}s linear`;
                barFill.style.width = '0%';
            }, 50);

            this.timerInterval = setTimeout(() => {
                // انتهى الوقت!
                this.handleTimeout();
            }, this.timerSetting * 1000);
        }
    },

    handleTimeout: function() {
        AudioController.error();
        // خسارة الدور فقط (إغلاق النافذة وتبديل الدور)
        document.getElementById('math-modal').classList.add('hidden');
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.highlightActiveGrid();
    },

    typeNum: function(num) {
        AudioController.click();
        if(this.currentInput.length < 3) {
            this.currentInput += num;
            document.getElementById('calc-input').textContent = this.currentInput;
        }
    },

    clearCalc: function() {
        AudioController.click();
        this.currentInput = "";
        document.getElementById('calc-input').textContent = "_";
    },

    submitAnswer: function() {
        // إيقاف المؤقت فوراً
        clearInterval(this.timerInterval);

        if(parseInt(this.currentInput) === this.currentAnswer) {
            AudioController.win();
            const cell = this.currentActiveCell;
            this.markCell(cell, this.currentPlayer);
            
            const gridIdx = parseInt(cell.dataset.grid);
            const cellIdx = parseInt(cell.dataset.cell);

            this.checkSubGridWin(gridIdx);
            
            this.nextForcedGrid = cellIdx;
            if (this.gridStatus[this.nextForcedGrid] !== null) {
                this.nextForcedGrid = null; 
            } else {
                const targetGrid = document.getElementById(`grid-${this.nextForcedGrid}`);
                const filledCells = targetGrid.querySelectorAll('.x-marked, .o-marked').length;
                if (filledCells === 9) {
                    this.gridStatus[this.nextForcedGrid] = 'Tie'; 
                    this.nextForcedGrid = null;
                }
            }

            document.getElementById('math-modal').classList.add('hidden');
            
            // فحص الفوز الكبير (النهائي)
            if (this.checkGlobalWin()) {
                return; // انتهت اللعبة
            }

            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this.highlightActiveGrid();

        } else {
            AudioController.error();
            const screen = document.querySelector('.calc-screen');
            screen.style.border = "1px solid red";
            setTimeout(() => screen.style.border = "1px solid rgba(255,255,255,0.1)", 500);
            this.clearCalc();
            // *خيار إضافي*: هل تريد إغلاق النافذة عند الخطأ أيضاً؟ حالياً نسمح بالمحاولة مرة أخرى.
        }
    },

    checkSubGridWin: function(gridIdx) {
        if (this.gridStatus[gridIdx] !== null) return;
        const grid = document.getElementById(`grid-${gridIdx}`);
        const cells = Array.from(grid.children);
        const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

        for (let combo of wins) {
            const [a, b, c] = combo;
            if (cells[a].textContent === this.currentPlayer &&
                cells[b].textContent === this.currentPlayer &&
                cells[c].textContent === this.currentPlayer) {
                
                this.gridStatus[gridIdx] = this.currentPlayer;
                grid.classList.add(this.currentPlayer === 'X' ? 'won-x' : 'won-o');
                AudioController.win(); // صوت فوز إضافي
                return;
            }
        }
    },

    checkGlobalWin: function() {
        const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        for (let combo of wins) {
            const [a, b, c] = combo;
            // التحقق من مصفوفة gridStatus
            if (this.gridStatus[a] && this.gridStatus[a] !== 'Tie' &&
                this.gridStatus[a] === this.gridStatus[b] &&
                this.gridStatus[a] === this.gridStatus[c]) {
                
                // لدينا فائز!
                this.declareWinner(this.gridStatus[a]);
                return true;
            }
        }
        return false;
    },

    declareWinner: function(winnerSymbol) {
        AudioController.win();
        const winnerName = winnerSymbol === 'X' ? this.names.X : this.names.O;
        
        // تحديث نتيجة السلسلة
        this.scores[winnerSymbol]++;
        
        // عرض شاشة التتويج
        document.getElementById('winner-name').textContent = winnerName;
        document.getElementById('victory-modal').classList.remove('hidden');
        
        // قصاصات الورق (بسيطة)
        this.spawnConfetti();
    },

    spawnConfetti: function() {
        const container = document.getElementById('confetti-container');
        container.innerHTML = '';
        for(let i=0; i<50; i++) {
            const conf = document.createElement('div');
            conf.style.position = 'absolute';
            conf.style.left = Math.random() * 100 + '%';
            conf.style.top = -10 + 'px';
            conf.style.width = '10px';
            conf.style.height = '10px';
            conf.style.backgroundColor = ['#f00', '#0f0', '#00f', '#ff0'][Math.floor(Math.random()*4)];
            conf.style.animation = `fall ${Math.random()*2+2}s linear infinite`;
            container.appendChild(conf);
            
            // CSS Animation for fall needs to be injected if not present, but simple gravity works via CSS usually
        }
    },

    markCell: function(cell, player) {
        cell.classList.add(player === 'X' ? 'x-marked' : 'o-marked');
        cell.textContent = player;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
