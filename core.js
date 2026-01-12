/**
 * CORE ENGINE - ULTIMATE MATH X-O
 * نظام الربط المركزي وإدارة الحالة
 */

const Game = {
    // 1. حالة اللعبة المركزية
    state: {
        level: 'level1',
        currentPlayer: 'X',
        forcedGrid: null,
        bigBoard: Array(9).fill(null),
        data: [],
        activeCell: null,
        input: ["", ""]
    },

    // 2. تشغيل اللعبة (Initialization)
    init: async function() {
        // تحديد المستوى المختار
        const activeBtn = document.querySelector('.lvl-card.active');
        this.state.level = activeBtn.dataset.lvl;

        try {
            const resp = await fetch(`data/${this.state.level}.json`);
            const json = await resp.json();
            
            // استدعاء المعالج الخاص بالمستوى
            const processor = window[`${this.state.level.charAt(0).toUpperCase() + this.state.level.slice(1)}Processor`];
            this.state.data = processor.prepareData(json.pool);

            this.buildBoard();
            document.getElementById('setup-screen').classList.add('hidden');
            document.getElementById('game-screen').classList.remove('hidden');
        } catch (e) {
            console.error("فشل في تحميل البيانات:", e);
        }
    },

    // 3. بناء لوحة الـ 9x9 بدقة هندسية
    buildBoard: function() {
        const container = document.getElementById('game-container');
        container.innerHTML = '<div class="ultimate-grid"></div>';
        const grid = container.querySelector('.ultimate-grid');

        for (let i = 0; i < 9; i++) {
            const subGrid = document.createElement('div');
            subGrid.className = 'sub-grid';
            subGrid.id = `sub-${i}`;
            for (let j = 0; j < 9; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.onclick = () => this.openTask(i, j, cell);
                subGrid.appendChild(cell);
            }
            grid.appendChild(subGrid);
        }
    },

    // 4. إدارة الحاسبة والتحقق
    openTask: function(gIdx, cIdx, cell) {
        // التحقق من قانون الإجبار
        if (this.state.forcedGrid !== null && this.state.forcedGrid !== gIdx) return;
        if (cell.textContent !== "" || this.state.bigBoard[gIdx]) return;

        const item = this.state.data[(gIdx * 9 + cIdx) % this.state.data.length];
        const processor = window[`${this.state.level.charAt(0).toUpperCase() + this.state.level.slice(1)}Processor`];
        const ui = processor.renderUI(item);

        this.state.activeCell = { gIdx, cIdx, cell, item, processor };
        this.renderCalculator(ui);
    },

    renderCalculator: function(ui) {
        document.getElementById('question-area').innerHTML = ui.questionHtml;
        const slots = document.getElementById('answer-slots');
        slots.innerHTML = '';
        this.state.input = ["", ""];

        for (let i = 0; i < ui.requiredSlots; i++) {
            const s = document.createElement('div');
            s.className = `ans-slot ${i===0?'active':''}`;
            s.id = `slot-${i}`;
            s.textContent = '?';
            slots.appendChild(s);
        }

        this.buildNumpad();
        document.getElementById('math-overlay').classList.remove('hidden');
    },

    buildNumpad: function() {
        const pad = document.getElementById('numpad-grid');
        pad.innerHTML = '';
        [1,2,3,4,5,6,7,8,9,0].forEach(n => {
            const b = document.createElement('button');
            b.textContent = n;
            b.className = 'btn-info';
            b.onclick = () => this.handleType(n);
            pad.appendChild(b);
        });
    },

    handleType: function(n) {
        let activeIdx = this.state.input[0] === "" || (document.getElementById('slot-1') && this.state.input[0] !== "" && this.state.input[1] === "" && this.state.activeSlot === 1) ? 0 : 0;
        // منطق بسيط للتنقل بين الخانات في المستويات المزدوجة
        if (document.getElementById('slot-1') && this.state.input[0] !== "") {
            this.state.input[1] += n;
            document.getElementById('slot-1').textContent = this.state.input[1];
        } else {
            this.state.input[0] += n;
            document.getElementById('slot-0').textContent = this.state.input[0];
        }
    },

    checkAnswer: function() {
        const { item, cell, processor, gIdx, cIdx } = this.state.activeCell;
        if (processor.verify(item, this.state.input)) {
            cell.textContent = this.state.currentPlayer;
            cell.classList.add(this.state.currentPlayer.toLowerCase());
            this.state.forcedGrid = (this.state.bigBoard[cIdx]) ? null : cIdx;
            this.state.currentPlayer = this.state.currentPlayer === 'X' ? 'O' : 'X';
            document.getElementById('math-overlay').classList.add('hidden');
            // هنا تضاف وظيفة فحص الفوز لاحقاً
        } else {
            alert("إجابة خاطئة، ركز جيداً!");
            this.state.input = ["", ""];
            document.querySelectorAll('.ans-slot').forEach(s => s.textContent = '?');
        }
    }
};

// ربط أزرار الواجهة بالمحرك
document.getElementById('start-game').onclick = () => Game.init();
document.getElementById('confirm-ans').onclick = () => Game.checkAnswer();
document.getElementById('clear-ans').onclick = () => {
    Game.state.input = ["", ""];
    document.querySelectorAll('.ans-slot').forEach(s => s.textContent = '?');
};

// تبديل اختيار المستوى بصرياً
document.querySelectorAll('.lvl-card').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.lvl-card').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    };
});

function toggleManual(show) {
    document.getElementById('manual-overlay').classList.toggle('hidden', !show);
}

checkWin: function(board) {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // أفقي
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // عمودي
        [0, 4, 8], [2, 4, 6]             // قطري
    ];
    for (let line of lines) {
        if (board[line[0]] && board[line[0]] === board[line[1]] && board[line[0]] === board[line[2]]) {
            return board[line[0]];
        }
    }
    return null;
}
