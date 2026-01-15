/**
 * MATH MATRIX ENGINE - FIXED & FINAL
 */

const AudioController = {
    // نغمات مشفرة بسيطة
    sounds: {
        click: "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU",
        win: "data:audio/wav;base64,UklGRiQtT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YX"
    },
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
    currentPlayer: 'X',
    nextForcedGrid: null,
    gridStatus: Array(9).fill(null),
    names: { X: "Team X", O: "Team O" },
    scores: { X: 0, O: 0 },
    timerSetting: 0,
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
        this.names.X = document.getElementById('p1-name').value || "الفريق X";
        this.names.O = document.getElementById('p2-name').value || "الفريق O";
        
        const timerOptions = document.getElementsByName('timer');
        for(let t of timerOptions) { if(t.checked) this.timerSetting = parseInt(t.value); }

        document.getElementById('hud-name-x').textContent = this.names.X;
        document.getElementById('hud-name-o').textContent = this.names.O;
        document.getElementById('game-hud').classList.remove('hidden');
        this.updateHUD();

        this.hideSetup();
        document.querySelector('.levels-grid').classList.add('hidden');
        document.querySelector('.game-header').classList.add('hidden');
        document.querySelector('.action-area').classList.add('hidden');
        
        const arena = document.getElementById('game-arena');
        arena.classList.remove('hidden');
        
        this.currentPlayer = 'X';
        this.nextForcedGrid = null;
        this.gridStatus = Array(9).fill(null);
        
        this.buildBoard();
        this.highlightActiveGrid();
    },

    rematch: function() {
        document.getElementById('victory-modal').classList.add('hidden');
        this.startMatch();
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
        this.updateHUD();
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
        
        // إخفاء رسالة الانفجار إذا كانت موجودة
        document.getElementById('timeout-msg').classList.add('hidden');
        document.querySelector('.calc-screen').classList.remove('shake-screen');

        const n1 = Math.floor(Math.random() * 9) + 2;
        const n2 = Math.floor(Math.random() * 9) + 2;
        this.currentAnswer = n1 * n2;
        
        document.getElementById('calc-question').textContent = `${n1} × ${n2} = ?`;
        document.getElementById('calc-input').textContent = "_";
        document.getElementById('math-modal').classList.remove('hidden');

        this.startTimer();
    },

    startTimer: function() {
        const barContainer = document.getElementById('timer-bar-container');
        const barFill = document.getElementById('timer-bar-fill');
        
        clearInterval(this.timerInterval);
        barContainer.classList.add('hidden');
        
        if (this.timerSetting > 0) {
            barContainer.classList.remove('hidden');
            barFill.style.transition = 'none';
            barFill.style.width = '100%';
            
            setTimeout(() => {
                barFill.style.transition = `width ${this.timerSetting}s linear`;
                barFill.style.width = '0%';
            }, 50);

            this.timerInterval = setTimeout(() => {
                this.handleTimeout();
            }, this.timerSetting * 1000);
        }
    },

    handleTimeout: function() {
        // تأثيرات الانفجار
        AudioController.error();
        const modal = document.getElementById('math-modal');
        const msg = document.getElementById('timeout-msg');
        
        // 1. إظهار رسالة الانفجار
        msg.classList.remove('hidden');
        
        // 2. اهتزاز النافذة
        document.querySelector('.calculator-box').classList.add('shake-screen');
        
        // 3. الانتظار قليلاً ثم إغلاق النافذة وتغيير الدور
        setTimeout(() => {
            document.querySelector('.calculator-box').classList.remove('shake-screen');
            modal.classList.add('hidden');
            msg.classList.add('hidden');
            
            // عقوبة: انتقال الدور للخصم دون لعب
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this.highlightActiveGrid();
        }, 1500); // الانتظار ثانية ونصف لرؤية الرسالة
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
            if (this.checkGlobalWin()) return;

            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this.highlightActiveGrid();

        } else {
            AudioController.error();
            const screen = document.querySelector('.calc-screen');
            screen.style.border = "1px solid red";
            setTimeout(() => screen.style.border = "1px solid rgba(255,255,255,0.1)", 500);
            this.clearCalc();
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
                AudioController.win();
                return;
            }
        }
    },

    checkGlobalWin: function() {
        const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        for (let combo of wins) {
            const [a, b, c] = combo;
            if (this.gridStatus[a] && this.gridStatus[a] !== 'Tie' &&
                this.gridStatus[a] === this.gridStatus[b] &&
                this.gridStatus[a] === this.gridStatus[c]) {
                
                this.declareWinner(this.gridStatus[a]);
                return true;
            }
        }
        return false;
    },

    declareWinner: function(winnerSymbol) {
        AudioController.win();
        const winnerName = winnerSymbol === 'X' ? this.names.X : this.names.O;
        this.scores[winnerSymbol]++;
        
        document.getElementById('winner-name').textContent = winnerName;
        document.getElementById('victory-modal').classList.remove('hidden');
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
        }
        const style = document.createElement('style');
        style.innerHTML = `@keyframes fall { to { top: 100vh; transform: rotate(720deg); } }`;
        document.head.appendChild(style);
    },

    markCell: function(cell, player) {
        cell.classList.add(player === 'X' ? 'x-marked' : 'o-marked');
        cell.textContent = player;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
