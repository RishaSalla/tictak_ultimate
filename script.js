/* =========================================
   1. المتغيرات العامة وحالة اللعبة
   ========================================= */
let turn = 'X', gameActive = false, activeBigIdx = null;
let bigBoardStatus = Array(9).fill(null);
let fullLogic = Array(9).fill(null).map(() => Array(9).fill(null));

let selectedLevel = 1, timerLimit, countdown, targetCell, correctAns;
let playerInput = "";

/* =========================================
   2. تفعيل واجهة اختيار المستويات (Cards)
   ========================================= */
document.querySelectorAll('.level-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.level-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedLevel = parseInt(card.dataset.level);
    });
});

/* =========================================
   3. محرك توليد الأسئلة (Logic Engine)
   ========================================= */
function generateMathTask() {
    let a, b, op, ans, display;
    
    // دالة لجلب رقم عشوائي بين 2 و 9 (لتجنب الرقم 1)
    const getNum = () => Math.floor(Math.random() * 8) + 2;

    const ops = ['+', '-', '*', '/'];
    const type = ops[Math.floor(Math.random() * ops.length)];

    // الحسابات الأساسية
    if (type === '+') { a = getNum(); b = getNum(); ans = a + b; op = '+'; }
    else if (type === '-') { a = getNum() + 5; b = getNum(); ans = a - b; op = '-'; }
    else if (type === '*') { a = getNum(); b = getNum(); ans = a * b; op = '×'; }
    else { ans = getNum(); b = getNum(); a = ans * b; op = '÷'; }

    // تشكيل السؤال حسب المستوى المختار
    switch(selectedLevel) {
        case 1: // مباشر
            display = `${a} ${op} ${b} = ?`;
            correctAns = ans;
            break;
        case 2: // مفقود
            if (Math.random() > 0.5) { display = `? ${op} ${b} = ${ans}`; correctAns = a; }
            else { display = `${a} ${op} ? = ${ans}`; correctAns = b; }
            break;
        case 3: // فراغ مزدوج (نطلب الطرف الأول كإجابة)
            display = `? ${op} ? = ${ans}`;
            correctAns = a;
            break;
        case 4: // ميزان
            let offset = Math.floor(Math.random() * 3) + 1;
            display = `${a} ${op} ${b} = ? + ${offset}`;
            correctAns = ans - offset;
            break;
    }

    document.getElementById('equation-view').textContent = display;
    document.getElementById('level-tag').textContent = `LEVEL 0${selectedLevel}`;
}

/* =========================================
   4. إدارة المباراة (Game Cycle)
   ========================================= */
function startGame() {
    timerLimit = parseInt(document.getElementById('timerVal').value);
    
    // إعادة تعيين اللوحة
    bigBoardStatus.fill(null);
    fullLogic = Array(9).fill(null).map(() => Array(9).fill(null));
    turn = 'X'; activeBigIdx = null; gameActive = true;

    const container = document.getElementById('grid-81-container');
    container.innerHTML = '';

    for (let i = 0; i < 9; i++) {
        let lb = document.createElement('div');
        lb.className = 'local-board';
        lb.dataset.board = i;
        for (let j = 0; j < 9; j++) {
            let c = document.createElement('div');
            c.className = 'cell';
            c.dataset.cell = j;
            c.onclick = () => handleCellSelection(c);
            lb.appendChild(c);
        }
        container.appendChild(lb);
    }

    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    syncArena();
}

function handleCellSelection(cell) {
    const bIdx = parseInt(cell.parentElement.dataset.board);
    if (!gameActive || cell.textContent || bigBoardStatus[bIdx]) return;
    if (activeBigIdx !== null && activeBigIdx !== bIdx) return;

    targetCell = cell;
    playerInput = "";
    document.getElementById('ans-preview-box').textContent = "_";
    document.getElementById('math-modal').classList.remove('hidden');
    
    generateMathTask();
    initCircularTimer();
}

function numIn(n) {
    playerInput += n;
    document.getElementById('ans-preview-box').textContent = playerInput;
    if (parseInt(playerInput) === correctAns) {
        clearInterval(countdown);
        setTimeout(executeFinalMove, 400);
    } else if (playerInput.length >= 4) { numClear(); }
}

function executeFinalMove() {
    document.getElementById('math-modal').classList.add('hidden');
    const bIdx = parseInt(targetCell.parentElement.dataset.board);
    const cIdx = parseInt(targetCell.dataset.cell);

    targetCell.textContent = turn;
    targetCell.classList.add(turn);
    fullLogic[bIdx][cIdx] = turn;

    activeBigIdx = (bigBoardStatus[cIdx] === null) ? cIdx : null;
    turn = (turn === 'X') ? 'O' : 'X';
    syncArena();
}

/* =========================================
   5. الوظائف المساعدة (UI Helpers)
   ========================================= */
function initCircularTimer() {
    if (timerLimit === 0) return;
    let time = timerLimit;
    const progressCircle = document.getElementById('timer-progress');
    const timerText = document.getElementById('timer-display');
    
    clearInterval(countdown);
    countdown = setInterval(() => {
        time--;
        timerText.textContent = time;
        
        // تحريك المؤقت الدائري
        let offset = 283 - (time / timerLimit * 283);
        progressCircle.style.strokeDashoffset = offset;

        if (time <= 0) {
            clearInterval(countdown);
            document.getElementById('math-modal').classList.add('hidden');
            activeBigIdx = null; 
            turn = (turn === 'X') ? 'O' : 'X';
            syncArena();
        }
    }, 1000);
}

function syncArena() {
    document.getElementById('card-X').classList.toggle('active', turn === 'X');
    document.getElementById('card-O').classList.toggle('active', turn === 'O');
    
    document.querySelectorAll('.local-board').forEach((lb, i) => {
        lb.style.opacity = (activeBigIdx === null || activeBigIdx === i) ? "1" : "0.2";
        lb.style.pointerEvents = (activeBigIdx === null || activeBigIdx === i) ? "all" : "none";
    });

    document.getElementById('free-play-status').classList.toggle('hidden', activeBigIdx !== null);
}

function toggleDisplayMode() { document.body.classList.toggle('dark-mode'); }
function openHelp() { document.getElementById('help-modal').classList.remove('hidden'); }
function closeHelp() { document.getElementById('help-modal').classList.add('hidden'); }
function numClear() { playerInput = ""; document.getElementById('ans-preview-box').textContent = "_"; }
function numDel() { playerInput = playerInput.slice(0, -1); document.getElementById('ans-preview-box').textContent = playerInput || "_"; }
