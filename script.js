/**
 * ULTIMATE MATH X-O ENGINE - RECONSTRUCTED
 * تم إصلاح منطق المستويات (2، 3، 4) ونظام الإجبار
 */

let state = {
    level: 'level1',
    data: [],
    currentPlayer: 'X',
    bigBoard: Array(9).fill(null),
    forcedGrid: null,
    activeCell: null,
    inputs: ["", ""],
    activeSlot: 0,
    timer: null,
    seconds: 0
};

// 1. إدارة المستويات وبدء اللعبة
document.querySelectorAll('.lvl-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.lvl-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.level = btn.dataset.lvl;
    };
});

document.getElementById('start-btn').onclick = async () => {
    try {
        const response = await fetch(`data/${state.level}.json`);
        const json = await response.json();
        
        // معالجة البيانات حسب هيكلية ملفاتك الأصلية
        state.data = parseLevelData(json.pool, state.level);
        
        renderBoard();
        startTimer();
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        updateTurnDisplay();
    } catch (e) {
        alert("خطأ: تأكد من وجود ملف " + state.level + ".json داخل مجلد data");
    }
};

function parseLevelData(pool, lvl) {
    let items = [];
    if (lvl === 'level1') items = [...pool.ones_group, ...pool.core_challenges];
    else if (lvl === 'level2') items = [...pool.addition_unknowns, ...pool.subtraction_unknowns];
    else if (lvl === 'level3') items = pool.strict_challenges_2_to_9;
    else if (lvl === 'level4') items = [...pool.strict_challenges_90_percent, ...pool.ones_group_10_percent];
    return items.sort(() => Math.random() - 0.5);
}

// 2. بناء اللوحة ومنطق الإجبار (Forced Move)
function renderBoard() {
    const board = document.getElementById('main-board');
    board.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const subGrid = document.createElement('div');
        subGrid.className = 'sub-grid';
        subGrid.id = `grid-${i}`;
        for (let j = 0; j < 9; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.onclick = () => handleCellClick(i, j, cell);
            subGrid.appendChild(cell);
        }
        board.appendChild(subGrid);
    }
    highlightTarget();
}

function handleCellClick(gIdx, cIdx, cell) {
    if (state.forcedGrid !== null && state.forcedGrid !== gIdx) {
        alert("يجب اللعب في المربع المضيء!");
        return;
    }
    if (state.bigBoard[gIdx] || cell.textContent !== '') return;
    openPopup(gIdx, cIdx, cell);
}

// 3. الحاسبة المنبثقة (Pop-up Control)
function openPopup(gIdx, cIdx, cell) {
    const item = state.data[(gIdx * 9 + cIdx) % state.data.length];
    state.activeCell = { gIdx, cIdx, cell, item };
    state.inputs = ["", ""];
    state.activeSlot = 0;

    const qText = document.getElementById('question-text');
    const slot2 = document.getElementById('slot-2');
    slot2.classList.add('hidden');

    // تخصيص السؤال حسب المستوى
    if (state.level === 'level2') {
        qText.textContent = `? ${item.op} ? = ${item.target}`;
        slot2.classList.remove('hidden');
    } else if (state.level === 'level3') {
        qText.textContent = `أوجد رقمين ناتجهما: ${item.target}`;
        slot2.classList.remove('hidden');
    } else {
        qText.textContent = item.q.replace('*', '×').replace('/', '÷');
    }

    renderNumpad();
    updateSlots();
    document.getElementById('math-popup').classList.remove('hidden');
}

function renderNumpad() {
    const pad = document.getElementById('numpad');
    pad.innerHTML = '';
    [1,2,3,4,5,6,7,8,9,0].forEach(num => {
        const btn = document.createElement('button');
        btn.textContent = num;
        btn.onclick = () => {
            state.inputs[state.activeSlot] += num;
            if (state.level === 'level2' || state.level === 'level3') {
                if (state.inputs[state.activeSlot].length >= 1 && state.activeSlot === 0) {
                    state.activeSlot = 1; // انتقال تلقائي للخ خانة الثانية
                }
            }
            updateSlots();
        };
        pad.appendChild(btn);
    });

    const cBtn = document.createElement('button');
    cBtn.textContent = 'C';
    cBtn.className = 'clear-btn';
    cBtn.onclick = () => { 
        state.inputs = ["", ""]; 
        state.activeSlot = 0; 
        updateSlots(); 
    };
    pad.appendChild(cBtn);
}

function updateSlots() {
    document.getElementById('slot-1').textContent = state.inputs[0] || '?';
    document.getElementById('slot-2').textContent = state.inputs[1] || '?';
    document.getElementById('slot-1').classList.toggle('active', state.activeSlot === 0);
    document.getElementById('slot-2').classList.toggle('active', state.activeSlot === 1);
}

// 4. التحقق من الإجابة (Logic Verification)
document.getElementById('submit-ans').onclick = () => {
    const { item, cell, gIdx, cIdx } = state.activeCell;
    const v1 = parseInt(state.inputs[0]);
    const v2 = parseInt(state.inputs[1]);
    let correct = false;

    if (state.level === 'level2') {
        correct = (item.op === '+' ? v1 + v2 : v1 - v2) === item.target;
    } else if (state.level === 'level3') {
        correct = item.pairs.some(p => (p[0] === v1 && p[1] === v2) || (p[0] === v2 && p[1] === v1));
    } else {
        correct = v1 === (item.a || item.target);
    }

    if (correct) {
        cell.textContent = state.currentPlayer;
        cell.classList.add(state.currentPlayer === 'X' ? 'x-mark' : 'o-mark');
        checkWin(gIdx);
        state.forcedGrid = (state.bigBoard[cIdx] === null) ? cIdx : null;
        state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
        updateTurnDisplay();
        highlightTarget();
        document.getElementById('math-popup').classList.add('hidden');
    } else {
        alert("إجابة خاطئة!");
        state.inputs = ["", ""];
        state.activeSlot = 0;
        updateSlots();
    }
};

function checkWin(gIdx) {
    const cells = Array.from(document.querySelectorAll(`#grid-${gIdx} .cell`)).map(c => c.textContent);
    if (isWin(cells)) {
        state.bigBoard[gIdx] = state.currentPlayer;
        document.getElementById(`grid-${gIdx}`).classList.add(state.currentPlayer === 'X' ? 'won-x' : 'won-o');
        if (isWin(state.bigBoard)) alert("مبروك فوز الفريق " + state.currentPlayer);
    }
}

function isWin(b) {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return lines.some(l => b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]);
}

function highlightTarget() {
    document.querySelectorAll('.sub-grid').forEach((g, i) => {
        g.classList.remove('active-target');
        if (state.forcedGrid === i || (state.forcedGrid === null && !state.bigBoard[i])) g.classList.add('active-target');
    });
}

function updateTurnDisplay() {
    document.getElementById('current-player').textContent = state.currentPlayer;
}

function startTimer() {
    state.timer = setInterval(() => {
        state.seconds++;
        const m = Math.floor(state.seconds/60).toString().padStart(2,'0');
        const s = (state.seconds%60).toString().padStart(2,'0');
        document.getElementById('timer').textContent = `${m}:${s}`;
    }, 1000);
}

document.getElementById('cancel-ans').onclick = () => document.getElementById('math-popup').classList.add('hidden');
