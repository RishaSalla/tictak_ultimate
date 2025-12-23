/**
 * ULTIMATE X-O MATH ENGINE
 * المحرك النهائي: خلايا مخفية، حاسبة منبثقة، ومنطق فوز مزدوج
 */

let gameState = {
    levelData: null,
    currentPlayer: 'X', // X يبدأ دائماً
    scores: { X: 0, O: 0 },
    bigBoard: Array(9).fill(null), // تتبع المربعات الـ 9 الكبرى
    activeCell: null,
    timer: null,
    seconds: 0
};

// 1. بدء اللعبة وتحميل البيانات
document.getElementById('launch-btn').addEventListener('click', async () => {
    const level = document.getElementById('level-select').value;
    const teamA = document.getElementById('team-a').value.trim() || "فريق X";
    const teamB = document.getElementById('team-b').value.trim() || "فريق O";

    try {
        const response = await fetch(`data/${level}.json`);
        const data = await response.json();
        gameState.levelData = preparePool(data.pool, level);
        
        document.getElementById('name-a').textContent = teamA;
        document.getElementById('name-b').textContent = teamB;
        document.getElementById('current-turn-display').textContent = teamA;

        initUltimateBoard();
        startTimer();
        
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
    } catch (e) {
        alert("خطأ في تحميل ملف المستوى!");
    }
});

// 2. تجهيز مصفوفة العمليات (81 عملية عشوائية)
function preparePool(pool, level) {
    let easy = [], hard = [];
    if (level === 'level4') {
        easy = pool.ones_group_10_percent;
        hard = pool.strict_challenges_90_percent;
    } else if (level === 'level3') {
        easy = pool.only_ones_group;
        hard = pool.strict_challenges_2_to_9;
    } else {
        easy = pool.ones_group || [];
        hard = pool.core_challenges || pool.all_challenges || [];
    }
    return [...shuffle(easy).slice(0, 8), ...shuffle(hard).slice(0, 73)].sort(() => Math.random() - 0.5);
}

// 3. بناء اللوحة الكبرى (9 مربعات كبرى)
function initUltimateBoard() {
    const board = document.getElementById('ultimate-board');
    board.innerHTML = '';
    
    for (let i = 0; i < 9; i++) {
        const subGrid = document.createElement('div');
        subGrid.className = 'sub-grid';
        subGrid.id = `grid-${i}`;
        
        // بناء 9 خلايا داخل كل مربع كبير
        for (let j = 0; j < 9; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.grid = i;
            cell.dataset.index = j;
            cell.onclick = () => openMathModal(i, j);
            subGrid.appendChild(cell);
        }
        board.appendChild(subGrid);
    }
    initModalNumpad();
}

// 4. نظام الـ Modal (الحاسبة المنبثقة)
function openMathModal(gridIdx, cellIdx) {
    const subGrid = document.getElementById(`grid-${gridIdx}`);
    if (subGrid.classList.contains('won-x') || subGrid.classList.contains('won-o')) return;
    
    const cell = subGrid.children[cellIdx];
    if (cell.textContent !== '') return;

    gameState.activeCell = { gridIdx, cellIdx, cell };
    const op = gameState.levelData[(gridIdx * 9) + cellIdx];
    
    // تصحيح العلامات برمجياً للعرض فقط
    let displayQ = op.q.replace(/\*/g, '×').replace(/\//g, '÷');
    document.getElementById('modal-op-display').textContent = displayQ;
    document.getElementById('modal-input-display').textContent = '';
    document.getElementById('math-modal').classList.remove('hidden');
}

function initModalNumpad() {
    const pad = document.querySelector('.modal-numpad');
    pad.innerHTML = '';
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].forEach(n => {
        const btn = document.createElement('button');
        btn.className = 'numpad-btn';
        btn.textContent = n;
        btn.onclick = () => document.getElementById('modal-input-display').textContent += n;
        pad.appendChild(btn);
    });
}

// 5. التحقق من الإجابة والسيطرة
document.getElementById('confirm-ans').onclick = () => {
    const input = document.getElementById('modal-input-display').textContent;
    const op = gameState.levelData[(gameState.activeCell.gridIdx * 9) + gameState.activeCell.cellIdx];
    
    if (parseInt(input) === op.a) {
        applyMark();
        document.getElementById('math-modal').classList.add('hidden');
    } else {
        alert("إجابة خاطئة! حاول مجدداً.");
        document.getElementById('modal-input-display').textContent = '';
    }
};

function applyMark() {
    const { cell, gridIdx } = gameState.activeCell;
    const mark = gameState.currentPlayer;
    cell.textContent = mark;
    cell.classList.add(mark === 'X' ? 'x-mark' : 'o-mark');

    // فحص فوز المربع الصغير
    if (checkWinner(Array.from(cell.parentElement.children).map(c => c.textContent))) {
        const subGrid = cell.parentElement;
        subGrid.classList.add(mark === 'X' ? 'won-x' : 'won-o');
        subGrid.setAttribute('data-winner', mark);
        gameState.bigBoard[gridIdx] = mark;
        
        // فحص فوز اللوحة الكبرى
        if (checkWinner(gameState.bigBoard)) {
            alert(`مبروك! فاز الفريق ${mark === 'X' ? gameState.currentPlayer : gameState.currentPlayer} بالبطولة!`);
            location.reload(); 
        }
    }
    
    // تبديل الدور
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
    document.getElementById('current-turn-display').textContent = 
        gameState.currentPlayer === 'X' ? document.getElementById('name-a').textContent : document.getElementById('name-b').textContent;
}

// 6. منطق الفوز (XO التقليدي)
function checkWinner(board) {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // أفقي
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // عمودي
        [0, 4, 8], [2, 4, 6]             // قطري
    ];
    return lines.some(line => board[line[0]] && board[line[0]] === board[line[1]] && board[line[0]] === board[line[2]]);
}

function shuffle(array) { return array.sort(() => Math.random() - 0.5); }

function startTimer() {
    gameState.timer = setInterval(() => {
        gameState.seconds++;
        let m = Math.floor(gameState.seconds / 60).toString().padStart(2, '0');
        let s = (gameState.seconds % 60).toString().padStart(2, '0');
        document.getElementById('game-timer').textContent = `${m}:${s}`;
    }, 1000);
}

document.getElementById('close-modal').onclick = () => document.getElementById('math-modal').classList.add('hidden');
document.getElementById('restart-game').onclick = () => location.reload();
