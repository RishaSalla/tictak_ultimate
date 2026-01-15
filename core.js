/**
 * MATH MATRIX ENGINE - LOGIC UPDATE (Forced Moves & Active Zones)
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
    // حالة اللعب
    currentPlayer: 'X',
    nextForcedGrid: null, // أي مربع كبير يجب اللعب فيه؟ (null = حر)
    gridStatus: Array(9).fill(null), // حالة كل مربع كبير (null, 'X', 'O')
    
    // الحاسبة
    currentActiveCell: null,
    currentInput: "",
    currentAnswer: 0,

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
        this.hideSetup();
        document.querySelector('.levels-grid').classList.add('hidden');
        document.querySelector('.game-header').classList.add('hidden');
        document.querySelector('.action-area').classList.add('hidden');
        
        const arena = document.getElementById('game-arena');
        arena.classList.remove('hidden');
        
        // إعادة تعيين الحالة
        this.currentPlayer = 'X';
        this.nextForcedGrid = null;
        this.gridStatus = Array(9).fill(null);
        
        this.buildBoard();
        this.highlightActiveGrid(); // إضاءة البداية
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

    // ----------------------------------------------------
    // LOGIC CORE (المنطق والإجبار)
    // ----------------------------------------------------
    
    // دالة تحديث الإضاءة بناءً على الدور
    highlightActiveGrid: function() {
        for(let i=0; i<9; i++) {
            const grid = document.getElementById(`grid-${i}`);
            
            // إزالة الكلاس النشط من الجميع أولاً
            grid.classList.remove('active-zone');
            
            // شروط التنشيط:
            // 1. المربع الكبير لم ينتهِ بعد (ليس X ولا O)
            // 2. إما أن اللعب حر (nextForcedGrid == null) أو هذا هو المربع المطلوب
            if (this.gridStatus[i] === null) {
                if (this.nextForcedGrid === null || this.nextForcedGrid === i) {
                    grid.classList.add('active-zone');
                }
            }
        }
    },

    openCalculator: function(cell) {
        // منع اللعب في الخلايا المحجوزة
        if(cell.classList.contains('x-marked') || cell.classList.contains('o-marked')) return;

        const gridIdx = parseInt(cell.dataset.grid);
        const cellIdx = parseInt(cell.dataset.cell);

        // التحقق من قانون الإجبار
        // إذا كان هناك إجبار، وهذا المربع ليس هو المطلوب -> ارفض
        if (this.nextForcedGrid !== null && this.nextForcedGrid !== gridIdx) {
            // اهتزاز المربع المطلوب لتنبيه اللاعب
            const forcedGrid = document.getElementById(`grid-${this.nextForcedGrid}`);
            forcedGrid.style.transform = "translateX(5px)";
            setTimeout(() => forcedGrid.style.transform = "translateX(0)", 100);
            return; 
        }

        // إذا المربع الكبير منتهي أصلاً، لا يمكن اللعب فيه
        if (this.gridStatus[gridIdx] !== null) return;

        this.currentActiveCell = cell;
        this.currentInput = "";
        
        // توليد سؤال عشوائي
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
            // 1. تسجيل الحركة
            const cell = this.currentActiveCell;
            this.markCell(cell, this.currentPlayer);
            
            const gridIdx = parseInt(cell.dataset.grid);
            const cellIdx = parseInt(cell.dataset.cell);

            // 2. فحص هل فاز اللاعب بهذا المربع الكبير؟ (الكود الجديد)
            this.checkSubGridWin(gridIdx);
            
            // 3. تحديد الوجهة القادمة (Forced Move)
            this.nextForcedGrid = cellIdx;

            // 4. قاعدة الإفلات (Free Move):
            // إذا كانت الوجهة القادمة محجوزة (فاز بها أحد أو ممتلئة)، يصبح اللعب حراً
            if (this.gridStatus[this.nextForcedGrid] !== null) {
                this.nextForcedGrid = null; // حر
            } else {
                // فحص الامتلاء (التعادل) في الوجهة القادمة
                const targetGrid = document.getElementById(`grid-${this.nextForcedGrid}`);
                const filledCells = targetGrid.querySelectorAll('.x-marked, .o-marked').length;
                if (filledCells === 9) {
                    this.gridStatus[this.nextForcedGrid] = 'Tie'; // إغلاق بالتعادل
                    this.nextForcedGrid = null; // حر
                }
            }

            // 5. تبديل الدور وتحديث الواجهة
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            document.getElementById('math-modal').classList.add('hidden');
            this.highlightActiveGrid(); 

            // فحص الفوز باللعبة كاملة (اختياري للمستقبل)
            // this.checkGlobalWin(); 

        } else {
            // إجابة خاطئة
            const screen = document.querySelector('.calc-screen');
            screen.style.border = "1px solid red";
            setTimeout(() => screen.style.border = "1px solid rgba(255,255,255,0.1)", 500);
            this.clearCalc();
        }
    },

    // دالة فحص فوز المربع الصغير (الجديدة كلياً)
    checkSubGridWin: function(gridIdx) {
        // إذا كان المربع منتهياً مسبقاً، اخرج
        if (this.gridStatus[gridIdx] !== null) return;

        const grid = document.getElementById(`grid-${gridIdx}`);
        const cells = Array.from(grid.children); // تحويل الخلايا لمصفوفة
        
        // جميع احتمالات الفوز (صفوف، أعمدة، أقطار)
        const wins = [
            [0,1,2], [3,4,5], [6,7,8], // أفقي
            [0,3,6], [1,4,7], [2,5,8], // عمودي
            [0,4,8], [2,4,6]           // قطري
        ];

        for (let combo of wins) {
            const [a, b, c] = combo;
            // هل الخلايا الثلاثة تحمل نفس علامة اللاعب الحالي؟
            if (cells[a].textContent === this.currentPlayer &&
                cells[b].textContent === this.currentPlayer &&
                cells[c].textContent === this.currentPlayer) {
                
                // تم الفوز!
                this.gridStatus[gridIdx] = this.currentPlayer; // تحديث الحالة في الذاكرة
                grid.classList.add(this.currentPlayer === 'X' ? 'won-x' : 'won-o'); // إضافة الختم البصري
                
                console.log(`Grid ${gridIdx} won by ${this.currentPlayer}`);
                return;
            }
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
