/* =========================================
   1. المتغيرات والبيانات الأساسية
   ========================================= */
let currentTurn = 'X';
let gameActive = false;
let activeBigIdx = null; 
let bigBoardStatus = Array(9).fill(null); 
let internalLogic = Array(9).fill(null).map(() => Array(9).fill(null));

let selectedLvl = 1, timerLimit = 10, countdown, targetCell, correctAns;
let playerInput = "";

// ربط العناصر الرئيسية
const setupView = document.getElementById('setup-view');
const gameView = document.getElementById('game-view');
const modalLayer = document.getElementById('modal-layer');
const mathPane = document.getElementById('math-pane');
const helpPane = document.getElementById('help-pane');

/* =========================================
   2. التهيئة وضوابط البداية
   ========================================= */
document.querySelectorAll('.lvl-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.lvl-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedLvl = parseInt(card.dataset.lvl);
    });
});

document.getElementById('btnLaunchGame').addEventListener('click', startGame);

function startGame() {
    timerLimit = parseInt(document.getElementById('configTimer').value);
    document.getElementById('viewNameX').textContent = document.getElementById('nameInputX').value || "TEAM X";
    document.getElementById('viewNameO').textContent = document.getElementById('nameInputO').value || "TEAM O";

    // تصفير شامل
    bigBoardStatus.fill(null);
    internalLogic = Array(9).fill(null).map(() => Array(9).fill(null));
    currentTurn = 'X'; activeBigIdx = null; gameActive = true;

    // بناء اللوحة برمجياً لضمان سلامة الروابط
    const grid = document.getElementById('main-grid-ultimate');
    grid.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const lb = document.createElement('div');
        lb.className = 'local-board';
        lb.id = `big-${i}`;
        for (let j = 0; j < 9; j++) {
            const c = document.createElement('div');
            c.className = 'cell';
            c.dataset.b = i; c.dataset.c = j;
            c.onclick = () => onCellSelection(c);
            lb.appendChild(c);
        }
        grid.appendChild(lb);
    }

    setupView.classList.remove('active');
    gameView.classList.add('active');
    updateArenaUI();
}

/* =========================================
   3. محرك التحدي الرياضي الذكي
   ========================================= */
function generateMath() {
    let a, b, op, ans, display;
    const getR = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const type = ['+', '-', '*', '/'][Math.floor(Math.random() * 4)];

    if (type === '+') { a = getR(2, 9); b = getR(2, 9); ans = a + b; op = '+'; }
    else if (type === '-') { a = getR(10, 18); b = getR(2, 9); ans = a - b; op = '-'; }
    else if (type === '*') { a = getR(2, 9); b = getR(2, 9); ans = a * b; op = '×'; }
    else { ans = getR(2, 9); b = getR(2, 9); a = ans * b; op = '÷'; }

    switch(selectedLvl) {
        case 1: display = `${a} ${op} ${b} = ?`; correctAns = ans; break;
        case 2: display = `? ${op} ${b} = ${ans}`; correctAns = a; break;
        case 3: display = `? ${op} ? = ${ans}`; correctAns = a; break; 
        case 4: let off = getR(1, 4); display = `${a} ${op} ${b} = ? + ${off}`; correctAns = ans - off; break;
    }
    document.getElementById('mathEq').textContent = display;
    document.getElementById('mathTag').textContent = `تحدي المستوى 0${selectedLvl}`;
}

/* =========================================
   4. إدارة الحركة ومنع الانهيار
   ========================================= */
function onCellSelection(cell) {
    const bIdx = parseInt(cell.dataset.b);
    if (!gameActive || cell.textContent || bigBoardStatus[bIdx]) return;
    if (activeBigIdx !== null && activeBigIdx !== bIdx) return;

    targetCell = cell;
    playerInput = "";
    document.getElementById('mathInput').textContent = "_";
    
    modalLayer.style.display = "flex";
    mathPane.style.display = "block";
    helpPane.style.display = "none";
    
    generateMath();
    startTimer();
}

function nPress(n) {
    playerInput += n;
    document.getElementById('mathInput').textContent = playerInput;
    if (parseInt(playerInput) === correctAns) {
        clearInterval(countdown);
        setTimeout(processSuccess, 200);
    } else if (playerInput.length >= 4) { nClear(); }
}

function processSuccess() {
    hideAllModals();
    if (!targetCell) return; // حماية ضد الانهيار

    const bIdx = parseInt(targetCell.dataset.b);
    const cIdx = parseInt(targetCell.dataset.c);

    // تسجيل الحركة في المنطق والواجهة
    targetCell.textContent = currentTurn;
    targetCell.classList.add(currentTurn);
    internalLogic[bIdx][cIdx] = currentTurn;

    // التحقق من فوز المربع الكبير (بدون مسح المكونات)
    if (checkSmallWin(internalLogic[bIdx])) {
        bigBoardStatus[bIdx] = currentTurn;
        applyWinOverlay(bIdx, currentTurn);
    }

    // تحديد التوجيه القادم (قوة اللعب الحر)
    activeBigIdx = (bigBoardStatus[cIdx] === null) ? cIdx : null;
    currentTurn = (currentTurn === 'X') ? 'O' : 'X';
    updateArenaUI();
}

function applyWinOverlay(bIdx, winner) {
    const bigBox = document.getElementById(`big-${bIdx}`);
    const overlay = document.createElement('div');
    overlay.className = 'board-win-overlay';
    overlay.textContent = winner;
    overlay.style.color = (winner === 'X') ? 'var(--accent-x)' : 'var(--accent-o)';
    bigBox.appendChild(overlay);
}

/* =========================================
   5. المساعدات والتحقق
   ========================================= */
function checkSmallWin(board) {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return lines.some(l => board[l[0]] && board[l[0]] === board[l[1]] && board[l[0]] === board[l[2]]);
}

function startTimer() {
    if (timerLimit === 0) return;
    let s = timerLimit;
    const prog = document.getElementById('orb-prog');
    const txt = document.getElementById('orb-text');
    clearInterval(countdown);
    countdown = setInterval(() => {
        s--;
        txt.textContent = s;
        prog.style.strokeDashoffset = 283 - (s / timerLimit * 283);
        if (s <= 0) {
            clearInterval(countdown); hideAllModals();
            activeBigIdx = null; currentTurn = (currentTurn === 'X') ? 'O' : 'X';
            updateArenaUI();
        }
    }, 1000);
}

function updateArenaUI() {
    document.getElementById('card-X').style.opacity = (currentTurn === 'X') ? "1" : "0.3";
    document.getElementById('card-O').style.opacity = (currentTurn === 'O') ? "1" : "0.3";
    document.querySelectorAll('.local-board').forEach((lb, i) => {
        lb.style.opacity = (activeBigIdx === null || activeBigIdx === i) ? "1" : "0.1";
        lb.style.pointerEvents = (activeBigIdx === null || activeBigIdx === i) ? "all" : "none";
    });
    document.getElementById('logicBanner').classList.toggle('hidden', activeBigIdx !== null);
}

function showHelpModal() { modalLayer.style.display = "flex"; helpPane.style.display = "block"; mathPane.style.display = "none"; }
function hideAllModals() { modalLayer.style.display = "none"; }
function nClear() { playerInput = ""; document.getElementById('mathInput').textContent = "_"; }
function nDel() { playerInput = playerInput.slice(0,-1); document.getElementById('mathInput').textContent = playerInput || "_"; }
function toggleTheme() { document.body.classList.toggle('dark-mode'); }
