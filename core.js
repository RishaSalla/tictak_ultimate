/**
 * CORE ENGINE - ULTIMATE MATH X-O
 * المسؤول عن منطق اللعبة، التحجيم، والربط بين المستويات
 */

const GameCore = {
    state: {
        currentLevel: 'level1',
        dataPool: [],
        currentPlayer: 'X',
        bigBoard: Array(9).fill(null),
        forcedGrid: null,
        activeCell: null,
        inputBuffer: ["", ""],
        activeSlot: 0,
        gameActive: false
    },

    // 1. التحجيم الديناميكي لضمان ملاءمة كافة الشاشات (Mobile Responsive)
    resizeBoard: function() {
        const board = document.querySelector('.ultimate-grid');
        if (!board) return;

        const screenWidth = window.innerWidth * 0.95;
        const screenHeight = window.innerHeight * 0.70;
        const boardBaseSize = 520; // الحجم الافتراضي للوحة

        const scale = Math.min(screenWidth / boardBaseSize, screenHeight / boardBaseSize, 1);
        board.style.transform = `scale(${scale})`;
    },

    // 2. بدء اللعبة وجلب البيانات
    init: async function() {
        const level = document.querySelector('.lvl-card.active').dataset.lvl;
        this.state.currentLevel = level;

        try {
            const response = await fetch(`data/${level}.json`);
            const json = await response.json();
            
            // استدعاء "مفسر المستوى" المناسب
            const processor = window[`${level.charAt(0).toUpperCase() + level.slice(1)}Processor`];
            this.state.dataPool = processor.prepareData(json.pool);
            
            this.buildBoard();
            this.setupUI();
            this.state.gameActive = true;
            this.resizeBoard();
        } catch (e) {
            console.error("Data Load Error:", e);
            alert("خطأ في تحميل ملف البيانات لهذا المستوى.");
        }
    },

    // 3. بناء لوحة اللعب (9x9)
    buildBoard: function() {
        const arena = document.getElementById('game-screen');
        arena.innerHTML = `
            <div id="game-container">
                <div class="hud-top">
                    <div class="p-tag x-side" id="p1-display">X</div>
                    <div id="game-timer">00:00</div>
                    <div class="p-tag o-side" id="p2-display">O</div>
                </div>
                <div class="ultimate-grid"></div>
                <div class="hud-bottom">
                    <div class="turn-status">دور: <span id="active-p-name">-</span></div>
                    <button onclick="location.reload()" class="btn-reset">↻</button>
                </div>
            </div>
        `;

        const grid = arena.querySelector('.ultimate-grid');
        for (let i = 0; i < 9; i++) {
            const subGrid = document.createElement('div');
            subGrid.className = 'sub-grid';
            subGrid.id = `grid-${i}`;
            for (let j = 0; j < 9; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.onclick = () => this.handleAction(i, j, cell);
                subGrid.appendChild(cell);
            }
            grid.appendChild(subGrid);
        }
        this.updateForcedGridUI();
    },

    // 4. منطق النقر وتفعيل الحاسبة المنبثقة
    handleAction: function(gIdx, cIdx, cell) {
        if (this.state.forcedGrid !== null && this.state.forcedGrid !== gIdx) return;
        if (this.state.bigBoard[gIdx] || cell.textContent !== '') return;

        const item = this.state.dataPool[(gIdx * 9 + cIdx) % this.state.dataPool.length];
        const processor = window[`${this.state.currentLevel.charAt(0).toUpperCase() + this.state.currentLevel.slice(1)}Processor`];
        const uiData = processor.renderUI(item);

        this.state.activeCell = { gIdx, cIdx, cell, item, processor };
        this.showCalculator(uiData);
    },

    // 5. إدارة الحاسبة (Pop-up)
    showCalculator: function(ui) {
        const overlay = document.getElementById('math-overlay');
        const calc = overlay.querySelector('.modal-calculator');
        this.state.inputBuffer = ["", ""];
        this.state.activeSlot = 0;

        calc.innerHTML = `
            <div class="math-q">${ui.questionHtml}</div>
            <div class="slots-box">
                <div class="ans-slot active" id="s0">?</div>
                ${ui.requiredSlots > 1 ? '<div class="ans-slot" id="s1">?</div>' : ''}
            </div>
            <div class="numpad" id="calc-pad"></div>
            <div class="calc-footer">
                <button id="btn-confirm" class="btn-ok">تأكيد</button>
                <button id="btn-close" class="btn-no">إلغاء</button>
            </div>
        `;

        this.renderNumpad();
        overlay.classList.remove('hidden');
    },

    renderNumpad: function() {
        const pad = document.getElementById('calc-pad');
        [1,2,3,4,5,6,7,8,9,0].forEach(n => {
            const b = document.createElement('button');
            b.textContent = n;
            b.onclick = () => this.handleInput(n);
            pad.appendChild(b);
        });
        const c = document.createElement('button');
        c.textContent = 'C';
        c.className = 'btn-clear';
        c.onclick = () => this.clearInput();
        pad.appendChild(c);
        
        document.getElementById('btn-confirm').onclick = () => this.verifyAnswer();
        document.getElementById('btn-close').onclick = () => document.getElementById('math-overlay').classList.add('hidden');
    },

    handleInput: function(num) {
        this.state.inputBuffer[this.state.activeSlot] += num;
        this.updateSlotsUI();
        // الانتقال التلقائي للخ خانة الثانية إذا كان المستوى يتطلب ذلك
        if (this.state.activeSlot === 0 && this.state.inputBuffer[0].length >= 1 && document.getElementById('s1')) {
            this.state.activeSlot = 1;
            this.updateSlotsUI();
        }
    },

    verifyAnswer: function() {
        const { item, cell, gIdx, cIdx, processor } = this.state.activeCell;
        if (processor.verify(item, this.state.inputBuffer)) {
            cell.textContent = this.state.currentPlayer;
            cell.classList.add(this.state.currentPlayer === 'X' ? 'x-mark' : 'o-mark');
            this.processWin(gIdx, cIdx);
            document.getElementById('math-overlay').classList.add('hidden');
        } else {
            alert("إجابة خاطئة!");
            this.clearInput();
        }
    },

    // 6. منطق الـ Ultimate X-O (الإجبار والفوز الكبير)
    processWin: function(gIdx, cIdx) {
        const subCells = Array.from(document.querySelectorAll(`#grid-${gIdx} .cell`)).map(c => c.textContent);
        if (this.checkLine(subCells)) {
            this.state.bigBoard[gIdx] = this.state.currentPlayer;
            document.getElementById(`grid-${gIdx}`).classList.add(this.state.currentPlayer === 'X' ? 'won-x' : 'won-o');
            if (this.checkLine(this.state.bigBoard)) alert("مبروك فوز الفريق " + this.state.currentPlayer);
        }
        // قانون الإجبار: المربع التالي هو رقم الخلية التي لُعب فيها
        this.state.forcedGrid = (this.state.bigBoard[cIdx] === null) ? cIdx : null;
        this.state.currentPlayer = (this.state.currentPlayer === 'X') ? 'O' : 'X';
        this.updateForcedGridUI();
    },

    checkLine: function(b) {
        const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        return wins.some(l => b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]);
    },

    updateForcedGridUI: function() {
        document.querySelectorAll('.sub-grid').forEach((g, i) => {
            g.classList.remove('active-target');
            if (this.state.forcedGrid === i || (this.state.forcedGrid === null && !this.state.bigBoard[i])) {
                g.classList.add('active-target');
            }
        });
    },

    updateSlotsUI: function() {
        document.querySelectorAll('.ans-slot').forEach((s, i) => {
            s.textContent = this.state.inputBuffer[i] || '?';
            s.classList.toggle('active', i === this.state.activeSlot);
        });
    },

    clearInput: function() {
        this.state.inputBuffer = ["", ""];
        this.state.activeSlot = 0;
        this.updateSlotsUI();
    },

    setupUI: function() {
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
    }
};

// تشغيل المحرك عند الضغط على البدء
document.getElementById('start-game').onclick = () => GameCore.init();
window.addEventListener('resize', () => GameCore.resizeBoard());
