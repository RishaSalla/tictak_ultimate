/* =========================================
   1. المتغيرات والبيانات الأساسية
   ========================================= */
let currentTurn = 'X';
let isGameActive = false;
let activeBigSquare = null; 
let bigBoardStatus = Array(9).fill(null); 
let internalLogic = Array(9).fill(null).map(() => Array(9).fill(null));

let selectedLevel = 1;
let timeLimit, timerInterval, targetCell, mathAnswer;
let currentInputStr = "";

/* =========================================
   2. تفعيل بطاقات اختيار المستويات
   ========================================= */
document.querySelectorAll('.lvl-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.lvl-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedLevel = parseInt(card.dataset.lvl);
    });
});

/* =========================================
   3. محرك توليد الأسئلة (Logic Engine)
   ========================================= */
function generateMathProblem() {
    let a, b, op, ans, display;
    
    // دالة الأرقام (تجنب 1 في الضرب والقسمة)
    const getNum = (allowOne = false) => {
        if (allowOne && Math.random() < 0.01) return 1;
        return Math.floor(Math.random() * 8) + 2; 
    };

    const ops = ['+', '-', '*', '/'];
    const type = ops[Math.floor(Math.random() * ops.length)];

    if (type === '+') { a = getNum(true); b = getNum(true); ans = a + b; op = '+'; }
    else if (type === '-') { a = getNum() + 5; b = getNum(); ans = a - b; op = '-'; }
    else if (type === '*') { a = getNum(); b = getNum(); ans = a * b; op = '×'; }
    else { ans = getNum(); b = getNum(); a = ans * b; op = '÷'; }

    // تشكيل السؤال حسب المستوى
    switch(selectedLevel) {
        case 1: display = `${a} ${op} ${b} = ?`; mathAnswer = ans; break;
        case 2: 
            if (Math.random() > 0.5) { display = `? ${op} ${b} = ${ans}`; mathAnswer = a; }
            else { display = `${a} ${op} ? = ${ans}`; mathAnswer = b; }
            break;
        case 3: display = `? ${op} ? = ${ans}`; mathAnswer = a; break;
        case 4: 
            let off = Math.floor(Math.random() * 3) + 1;
            display = `${a} ${op} ${b} = ? + ${off}`;
            mathAnswer = ans - off;
            break;
    }

    document.getElementById('math-eq').textContent = display;
    document.getElementById('math-lvl-label').textContent = `المستوى ${selectedLevel}`;
}

/* =========================================
   4. إدارة اللعب (Gameplay Logic)
   ========================================= */
function launchGame() {
    timeLimit = parseInt(document.getElementById('gameTimer').value);
    
    // تصفير الحالة
    bigBoardStatus.fill(null);
    internalLogic = Array(9).fill(null).map(() => Array(9).fill(null));
    currentTurn = 'X'; activeBigSquare = null; isGameActive = true;

    const grid = document.getElementById('main-grid-81');
    grid.innerHTML = '';

    for (let i = 0; i < 9; i++) {
        let lb = document.createElement('div');
        lb.className = 'local-board';
        lb.dataset.board = i;
        for (let j = 0; j < 9; j++) {
            let c = document.createElement('div');
            c.className = 'cell';
            c.dataset.cell = j;
            c.onclick = () => onCellSelection(c);
            lb.appendChild(c);
        }
        grid.appendChild(lb);
    }

    document.getElementById('setup-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    refreshArenaUI();
}

function onCellSelection(cell) {
    const bIdx = parseInt(cell.parentElement.dataset.board);
    if (!isGameActive || cell.textContent || bigBoardStatus[bIdx]) return;
    if (activeBigSquare !== null && activeBigSquare !== bIdx) return;

    targetCell = cell;
    currentInputStr = "";
    document.getElementById('math-input').textContent = "_";
    
    // إظهار النافذة
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('math-pane').classList.remove('hidden');
    
    generateMathProblem();
    startCircularTimer();
}

function keyPress(n) {
    currentInputStr += n;
    document.getElementById('math-input').textContent = currentInputStr;
    if (parseInt(currentInputStr) === mathAnswer) {
        clearInterval(timerInterval);
        setTimeout(finishMove, 300);
    } else if (currentInputStr.length >= 4) { keyClear(); }
}

function finishMove() {
    closeModal();
    const bIdx = parseInt(targetCell.parentElement.dataset.board);
    const cIdx = parseInt(targetCell.dataset.cell);

    targetCell.textContent = currentTurn;
    targetCell.classList.add(currentTurn);
    internalLogic[bIdx][cIdx] = currentTurn;

    // توجيه الخصم
    activeBigSquare = (bigBoardStatus[cIdx] === null) ? cIdx : null;
    currentTurn = (currentTurn === 'X') ? 'O' : 'X';
    refreshArenaUI();
}

/* =========================================
   5. المؤقت والواجهة (UI Helpers)
   ========================================= */
function startCircularTimer() {
    if (timeLimit === 0) return;
    let sec = timeLimit;
    const prog = document.getElementById('t-progress');
    const txt = document.getElementById('t-count');
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        sec--;
        txt.textContent = sec;
        let offset = 283 - (sec / timeLimit * 283);
        prog.style.strokeDashoffset = offset;

        if (sec <= 0) {
            clearInterval(timerInterval);
            closeModal();
            activeBigSquare = null; 
            currentTurn = (currentTurn === 'X') ? 'O' : 'X';
            refreshArenaUI();
        }
    }, 1000);
}

function refreshArenaUI() {
    document.getElementById('p-card-X').style.opacity = (currentTurn === 'X') ? "1" : "0.4";
    document.getElementById('p-card-O').style.opacity = (currentTurn === 'O') ? "1" : "0.4";
    
    document.querySelectorAll('.local-board').forEach((lb, i) => {
        lb.style.opacity = (activeBigSquare === null || activeBigSquare === i) ? "1" : "0.15";
    });

    document.getElementById('move-status-msg').classList.toggle('hidden', activeBigSquare !== null);
    
    // تحديث أسماء اللاعبين
    document.getElementById('disp-nameX').textContent = document.getElementById('nameX').value || "TEAM X";
    document.getElementById('disp-nameO').textContent = document.getElementById('nameO').value || "TEAM O";
}

function toggleTheme() { document.body.classList.toggle('dark-mode'); }
function openInstruction() { 
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('help-pane').classList.remove('hidden');
}
function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('help-pane').classList.add('hidden');
    document.getElementById('math-pane').classList.add('hidden');
}
function keyClear() { currentInputStr = ""; document.getElementById('math-input').textContent = "_"; }
function keyDel() { currentInputStr = currentInputStr.slice(0,-1); document.getElementById('math-input').textContent = currentInputStr || "_"; }
