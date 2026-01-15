/**
 * MATH MATRIX ENGINE - FINAL BUILD
 */

let selectedLevelId = null;

function selectLevel(lvlId, cardElement) {
    document.querySelectorAll('.plasma-card').forEach(c => c.classList.remove('active-card'));
    cardElement.classList.add('active-card');
    selectedLevelId = lvlId;
    const btn = document.getElementById('btn-start-game');
    if(btn) btn.classList.remove('hidden');
}

const App = {
    config: null,
    currentActiveCell: null,
    currentInput: "",
    currentAnswer: 0,
    currentPlayer: 'X', // الدور الحالي

    init: async function() {
        try {
            const response = await fetch('config.json');
            this.config = await response.json();
        } catch (e) {
            this.config = { accessCode: "00000000" }; // كود احتياطي
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
                document.getElementById('login-gate').classList.add('hidden');
                document.getElementById('app-content').classList.remove('hidden');
            } else {
                msg.style.color = "#FF4D4D";
                msg.textContent = "شفرة خاطئة";
                input.style.border = "1px solid #FF4D4D";
            }
        }, 500);
    },

    launchGame: function() {
        if(!selectedLevelId) return;
        document.getElementById('battle-setup').classList.remove('hidden');
    },

    hideSetup: function() {
        document.getElementById('battle-setup').classList.add('hidden');
    },

    startMatch: function() {
        // إخفاء كل واجهات الإعداد والقوائم
        this.hideSetup();
        document.querySelector('.levels-grid').classList.add('hidden');
        document.querySelector('.game-header').classList.add('hidden');
        document.querySelector('.action-area').classList.add('hidden');
        
        // إظهار وبناء الساحة
        const arena = document.getElementById('game-arena');
        arena.classList.remove('hidden');
        this.buildBoard();
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

    openCalculator: function(cell) {
        if(cell.classList.contains('x-marked') || cell.classList.contains('o-marked')) return;
        this.currentActiveCell = cell;
        this.currentInput = "";
        
        // سؤال عشوائي بسيط للتجربة
        const n1 = Math.floor(Math.random() * 9) + 2;
        const n2 = Math.floor(Math.random() * 9) + 2;
        this.currentAnswer = n1 * n2;
        
        document.getElementById('calc-question').textContent = `${n1} × ${n2} = ?`;
        document.getElementById('calc-input').textContent = "_";
        document.getElementById('math-modal').classList.remove('hidden');
    },

    typeNum: function(num) {
        if(this.currentInput.length < 3) {
            this.currentInput += num;
            document.getElementById('calc-input').textContent = this.currentInput;
        }
    },

    clearCalc: function() {
        this.currentInput = "";
        document.getElementById('calc-input').textContent = "_";
    },

    submitAnswer: function() {
        if(parseInt(this.currentInput) === this.currentAnswer) {
            this.markCell(this.currentActiveCell, this.currentPlayer);
            // تبديل الدور
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            document.getElementById('math-modal').classList.add('hidden');
        } else {
            const screen = document.querySelector('.calc-screen');
            screen.style.border = "1px solid red";
            setTimeout(() => screen.style.border = "1px solid rgba(255,255,255,0.1)", 500);
            this.clearCalc();
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
