/* =========================================
   1. الحالة العامة والمتغيرات (State Management)
   ========================================= */
let turn = 'X', gameActive = false, activeBoardIdx = null;
let bigBoardWins = Array(9).fill(null); 
let logicMatrix = Array(9).fill(null).map(() => Array(9).fill(null));

let selectedLevel = 1, timerLimit = 10, countdown, mathCorrectAnswer;
let targetCellRef, playerInputStr = "";
let questionsHistory = new Set(); // الذاكرة لمنع التكرار نهائياً

// ربط العناصر الحيوية
const vSetup = document.getElementById('setup-view');
const vGame = document.getElementById('game-view');
const mHelp = document.getElementById('modal-help');
const mMath = document.getElementById('modal-math');
const mEnd = document.getElementById('modal-end');

/* =========================================
   2. التهيئة وضوابط البدء
   ========================================= */
document.querySelectorAll('.lvl-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.lvl-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedLevel = parseInt(card.dataset.lvl);
    });
});

document.getElementById('btnStart').onclick = initMatch;
document.getElementById('btnRestart').onclick = () => { mEnd.style.display = "none"; initMatch(); };

function initMatch() {
    // إعداد الأسماء والبيانات
    timerLimit = parseInt(document.getElementById('timerOption').value);
    document.getElementById('nameXDisplay').textContent = document.getElementById('inputX').value || "فريق X";
    document.getElementById('nameODisplay').textContent = document.getElementById('inputO').value || "فريق O";

    // تصفير شامل
    bigBoardWins.fill(null);
    logicMatrix = Array(9).fill(null).map(() => Array(9).fill(null));
    questionsHistory.clear();
    turn = 'X'; activeBoardIdx = null; gameActive = true;
    document.getElementById('scoreX').textContent = "0";
    document.getElementById('scoreO').textContent = "0";

    // بناء اللوحة الهندسية (81 خلية ثابتة)
    const gridContainer = document.getElementById('main-board-81');
    gridContainer.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const lb = document.createElement('div');
        lb.className = 'local-board';
        lb.id = `lb-${i}`;
        for (let j = 0; j < 9; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.b = i; cell.dataset.c = j;
            cell.onclick = () => handleCellSelection(cell);
            lb.appendChild(cell);
        }
        gridContainer.appendChild(lb);
    }

    vSetup.classList.remove('active');
    vGame.classList.add('active');
    refreshUI();
}

/* =========================================
   3. محرك الرياضيات (منطق 1-9 ومنع التكرار)
   ========================================= */
function generateUniqueTask() {
    let a, b, op, ans, taskTxt, hintTxt;
    const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 500) {
        if (selectedLevel === 1) {
            const types = ['+', '-', '*', '/'];
            const opType = types[rnd(0, 3)];

            if (opType === '+') { a = rnd(1, 9); b = rnd(1, 9); ans = a + b; op = '+'; }
            else if (opType === '-') { a = rnd(1, 9); b = rnd(1, a); ans = a - b; op = '-'; }
            else if (opType === '*') { a = rnd(1, 9); b = rnd(1, 9); ans = a * b; op = '×'; }
            else { 
                // منطق القسمة الكلاسيكي (1-9)
                b = rnd(1, 9); 
                ans = rnd(1, 9); 
                a = b * ans;
                // حماية: إذا كان المقسوم > 9 نعيد المحاولة فوراً
                if (a > 9) { attempts++; continue; }
                op = '÷';
            }
        } else if (selectedLevel === 2) {
            a = rnd(2, 9); b = rnd(2, 9); ans = a + b; op = '+'; a = '?'; // نمط المجهول
        } else if (selectedLevel === 3) {
            a = rnd(2, 9); b = rnd(2, 9); ans = a * b; op = '×'; // نمط الفراغ المزدوج
        } else {
            // الميزان
            a = rnd(2, 5); b = rnd(4, 9); let c = rnd(2, 5);
            while((a * b) % c !== 0) { a = rnd(2, 5); b = rnd(4, 9); c = rnd(2, 5); }
            ans = (a * b) / c; op = 'balance';
        }

        const qKey = selectedLevel === 1 ? `${a}${op}${b}` : `${a}${op}${b}${rnd(1,1000)}`;
        if (!questionsHistory.has(qKey)) {
            questionsHistory.add(qKey);
            isUnique = true;
            if (selectedLevel === 1) {
                taskTxt = `${a} ${op} ${b} = ?`; mathCorrectAnswer = ans;
                hintTxt = "المستوى 1: أوجد الناتج";
            } else if (selectedLevel === 2) {
                taskTxt = `? + ${b-ans?ans-b:b} = ${ans+b}`; mathCorrectAnswer = ans;
                hintTxt = "المستوى 2: المجهول";
            } else if (selectedLevel === 3) {
                taskTxt = `? × ? = ${ans}`; mathCorrectAnswer = a; 
                hintTxt = "المستوى 3: الفراغ المزدوج (يمنع الرقم 1)";
            } else {
                taskTxt = `${a} × ${b} = ${c} × ?`; mathCorrectAnswer = ans;
                hintTxt = "المستوى 4: الميزان الرقمي";
            }
        }
        attempts++;
    }

    document.getElementById('math-question').textContent = taskTxt;
    document.getElementById('math-type-hint').textContent = hintTxt;
}

/* =========================================
   4. منطق اللعب (التوجيه، الفوز، التعادل)
   ========================================= */
function handleCellSelection(cell) {
    const bIdx = parseInt(cell.dataset.b);
    if (!gameActive || cell.textContent || bigBoardWins[bIdx]) return;
    if (activeBoardIdx !== null && activeBoardIdx !== bIdx) return;

    targetCellRef = cell;
    playerInputStr = "";
    document.getElementById('math-input-view').textContent = "_";
    mMath.style.display = "flex";
    generateUniqueTask();
    startMatchTimer();
}

function pressKey(n) {
    playerInputStr += n;
    document.getElementById('math-input-view').textContent = playerInputStr;
    if (parseInt(playerInputStr) === mathCorrectAnswer) {
        clearInterval(countdown);
        setTimeout(processSuccess, 200);
    }
}

function processSuccess() {
    mMath.style.display = "none";
    const bIdx = parseInt(targetCellRef.dataset.b);
    const cIdx = parseInt(targetCellRef.dataset.c);

    targetCellRef.textContent = turn;
    targetCellRef.classList.add(turn);
    logicMatrix[bIdx][cIdx] = turn;

    if (checkSmallWin(logicMatrix[bIdx])) {
        bigBoardWins[bIdx] = turn;
        applyWinOverlay(bIdx, turn);
        updateBigScores();
    }

    // فحص نهاية المباراة (فوز أو تعادل)
    if (checkUltimateWin()) {
        endGame("win");
    } else if (bigBoardWins.every(s => s !== null) || isAllCellsFilled()) {
        endGame("draw");
    } else {
        activeBoardIdx = (bigBoardWins[cIdx] === null) ? cIdx : null;
        turn = (turn === 'X') ? 'O' : 'X';
        refreshUI();
    }
}

function applyWinOverlay(idx, winner) {
    const lb = document.getElementById(`lb-${idx}`);
    const over = document.createElement('div');
    over.className = 'win-layer';
    over.textContent = winner;
    over.style.color = (winner === 'X') ? 'var(--accent-x)' : 'var(--accent-o)';
    lb.appendChild(over);
}

function checkSmallWin(board) {
    const w = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return w.some(l => board[l[0]] && board[l[0]] === board[l[1]] && board[l[0]] === board[l[2]]);
}

function checkUltimateWin() {
    const w = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return w.some(l => bigBoardWins[l[0]] && bigBoardWins[l[0]] === bigBoardWins[l[1]] && bigBoardWins[l[0]] === bigBoardWins[l[2]]);
}

function endGame(result) {
    gameActive = false;
    mEnd.style.display = "flex";
    if (result === "win") {
        document.getElementById('end-title').textContent = "تم حسم المباراة!";
        document.getElementById('end-msg').textContent = `تهانينا لفريق ${turn}، السيطرة كانت استراتيجية!`;
    } else {
        document.getElementById('end-title').textContent = "انتهت بالتعادل!";
        document.getElementById('end-msg').textContent = "لقد كانت معركة متكافئة حتى المربع الأخير.";
    }
}

/* =========================================
   5. المساعدات والواجهة
   ========================================= */
function refreshUI() {
    document.getElementById('tagX').style.opacity = (turn === 'X') ? "1" : "0.2";
    document.getElementById('tagO').style.opacity = (turn === 'O') ? "1" : "0.2";
    
    document.querySelectorAll('.local-board').forEach((lb, i) => {
        lb.classList.remove('smart-glow');
        if (activeBoardIdx === i) lb.classList.add('smart-glow');
        lb.style.opacity = (activeBoardIdx === null || activeBoardIdx === i) ? "1" : "0.15";
    });
    document.getElementById('free-badge').classList.toggle('hidden', activeBoardIdx !== null);
}

function startMatchTimer() {
    if (timerLimit === 0) return;
    let s = timerLimit;
    const bar = document.getElementById('t-progress');
    clearInterval(countdown);
    countdown = setInterval(() => {
        s--;
        document.getElementById('t-counter').textContent = s;
        bar.style.strokeDashoffset = 283 - (s / timerLimit * 283);
        if (s <= 0) {
            clearInterval(countdown); mMath.style.display = "none";
            activeBoardIdx = null; turn = (turn === 'X') ? 'O' : 'X';
            refreshUI();
        }
    }, 1000);
}

function updateBigScores() {
    document.getElementById('scoreX').textContent = bigBoardWins.filter(v => v === 'X').length;
    document.getElementById('scoreO').textContent = bigBoardWins.filter(v => v === 'O').length;
}

function isAllCellsFilled() {
    return logicMatrix.every(lb => lb.every(c => c !== null));
}

function toggleHelpModal(s) { mHelp.style.display = s ? "flex" : "none"; }
function clearKey() { playerInputStr = ""; document.getElementById('math-input-view').textContent = "_"; }
function delKey() { playerInputStr = playerInputStr.slice(0,-1); document.getElementById('math-input-view').textContent = playerInputStr || "_"; }
