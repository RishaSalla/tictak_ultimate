/* =========================================
   1. الإعدادات العامة والذاكرة (Core Engine)
   ========================================= */
let turn = 'X', gameActive = false, activeBlockIdx = null;
let bigWins = Array(9).fill(null);
let matrix81 = Array(9).fill(null).map(() => Array(9).fill(null));

let currentLvl = 1, timerVal = 10, countdown, mathSolution = { a: 0, b: 0 };
let targetCell = null, inputStage = 1, playerInputA = "", playerInputB = "";
let usedQuestions = new Set(); // حصر شامل لمنع التكرار

// ربط العناصر
const setupSc = document.getElementById('setup-screen');
const gameSc = document.getElementById('game-screen');
const mathMod = document.getElementById('math-modal');
const helpMod = document.getElementById('help-modal');

/* =========================================
   2. إدارة الواجهة والبداية (Pro UI Management)
   ========================================= */
document.querySelectorAll('.lvl-item').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.lvl-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentLvl = parseInt(btn.dataset.lvl);
    };
});

function startGame() {
    timerVal = parseInt(document.querySelector('input[name="timer"]:checked').value);
    document.getElementById('labelX').textContent = document.getElementById('nameX').value || "لاعب X";
    document.getElementById('labelO').textContent = document.getElementById('nameO').value || "لاعب O";

    // إعادة ضبط البيانات
    bigWins.fill(null);
    matrix81 = Array(9).fill(null).map(() => Array(9).fill(null));
    usedQuestions.clear();
    turn = 'X'; activeBlockIdx = null; gameActive = true;

    buildProBoard();
    setupSc.classList.remove('active');
    gameSc.classList.add('active');
    updateGlobalUI();
}

function buildProBoard() {
    const holder = document.getElementById('board-holder');
    holder.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const block = document.createElement('div');
        block.className = 'board-block';
        block.id = `block-${i}`;
        for (let j = 0; j < 9; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.b = i; cell.dataset.c = j;
            cell.onclick = () => onCellClick(cell);
            block.appendChild(cell);
        }
        holder.appendChild(block);
    }
}

/* =========================================
   3. المحرك الرياضي (المنطق المحصور)
   ========================================= */
function generateChallenge() {
    let qTxt = "", hint = "", type = "";
    const r = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // تصفير المدخلات المزدوجة
    inputStage = 1; playerInputA = ""; playerInputB = "";
    document.getElementById('input-wrap-2').classList.add('hidden');
    document.getElementById('input-wrap-1').classList.add('active');
    document.getElementById('input-wrap-1').textContent = "_";
    document.getElementById('input-wrap-2').textContent = "_";

    if (currentLvl === 1) {
        // حصر العمليات الأربع (1-9)
        const ops = ['+', '-', '*', '/'];
        type = ops[r(0, 3)];
        let a, b, ans;
        if (type === '+') { a = r(1, 9); b = r(1, 9); ans = a + b; qTxt = `${a} + ${b} = ?`; }
        else if (type === '-') { a = r(1, 9); b = r(1, a); ans = a - b; qTxt = `${a} - ${b} = ?`; }
        else if (type === '*') { a = r(1, 9); b = r(1, 9); ans = a * b; qTxt = `${a} × ${b} = ?`; }
        else { b = r(1, 9); ans = r(1, 9); a = b * ans; 
               while(a > 9) { b = r(1, 9); ans = r(1, 9); a = b * ans; }
               qTxt = `${a} ÷ ${b} = ?`; 
        }
        mathSolution = { a: ans };
        hint = "المستوى 1: كلاسيك";
    } 
    else if (currentLvl === 2) {
        // المجهول (1-9)
        let a = r(1, 9), b = r(1, 9), ans = a + b;
        qTxt = `? + ${a} = ${ans}`;
        mathSolution = { a: b };
        hint = "المستوى 2: أوجد المجهول";
    }
    else if (currentLvl === 3) {
        // المزدوج (مدخلين) - ممنوع رقم 1
        let a = r(2, 9), b = r(2, 9), ans = a * b;
        qTxt = `? × ? = ${ans}`;
        mathSolution = { a: a, b: b }; // يقبل أي رقمين ناتجهما صحيح
        hint = "المستوى 3: أدخل الرقمين (ممنوع 1)";
        document.getElementById('input-wrap-2').classList.remove('hidden');
    }
    else {
        // الميزان - قائمة ذهبية محصورة لمنع التعليق
        const scales = [
            {q: "2 × 6 = 3 × ?", ans: 4}, {q: "4 × 2 = 8 × ?", ans: 1},
            {q: "3 × 4 = 2 × ?", ans: 6}, {q: "9 × 2 = 6 × ?", ans: 3},
            {q: "5 × 4 = 2 × ?", ans: 10}, {q: "8 × 3 = 6 × ?", ans: 4}
        ];
        let pick = scales[r(0, scales.length - 1)];
        qTxt = pick.q; mathSolution = { a: pick.ans };
        hint = "المستوى 4: الميزان الرقمي";
    }

    document.getElementById('equation-display').textContent = qTxt;
    document.getElementById('math-header').textContent = hint;
}

/* =========================================
   4. منطق الإدخال والتحقق (The Controller)
   ========================================= */
function inputDigit(n) {
    if (currentLvl === 3) {
        if (inputStage === 1) {
            playerInputA += n;
            document.getElementById('input-wrap-1').textContent = playerInputA;
            if (playerInputA.length >= 1 && parseInt(playerInputA) > 1) {
                inputStage = 2;
                document.getElementById('input-wrap-1').classList.remove('active');
                document.getElementById('input-wrap-2').classList.add('active');
            }
        } else {
            playerInputB += n;
            document.getElementById('input-wrap-2').textContent = playerInputB;
            checkFinalMath();
        }
    } else {
        playerInputA += n;
        document.getElementById('input-wrap-1').textContent = playerInputA;
        checkFinalMath();
    }
}

function checkFinalMath() {
    let isCorrect = false;
    const valA = parseInt(playerInputA);
    const valB = parseInt(playerInputB);

    if (currentLvl === 3) {
        if (valA * valB === (mathSolution.a * mathSolution.b)) isCorrect = true;
    } else {
        if (valA === mathSolution.a) isCorrect = true;
    }

    if (isCorrect) {
        clearInterval(countdown);
        setTimeout(executeFinalMove, 300);
    }
}

function executeFinalMove() {
    mathMod.style.display = "none";
    const bIdx = parseInt(targetCell.dataset.b);
    const cIdx = parseInt(targetCell.dataset.c);

    targetCell.textContent = turn;
    targetCell.classList.add(turn);
    matrix81[bIdx][cIdx] = turn;

    if (checkSmallGrid(matrix81[bIdx])) {
        bigWins[bIdx] = turn;
        markBigWin(bIdx, turn);
    }

    // فحص الفوز النهائي أو التعادل
    if (checkUltimateWin()) {
        announceWinner(turn);
    } else if (bigWins.every(w => w !== null) || isFull()) {
        announceWinner("draw");
    } else {
        activeBlockIdx = (bigWins[cIdx] === null) ? cIdx : null;
        turn = (turn === 'X') ? 'O' : 'X';
        updateGlobalUI();
    }
}

/* =========================================
   5. الوظائف المساعدة (Helpers)
   ========================================= */
function onCellClick(cell) {
    const bIdx = parseInt(cell.dataset.b);
    if (!gameActive || cell.textContent || bigWins[bIdx]) return;
    if (activeBlockIdx !== null && activeBlockIdx !== bIdx) return;

    targetCell = cell;
    mathMod.style.display = "flex";
    generateChallenge();
    startProTimer();
}

function startProTimer() {
    if (timerVal === 0) return;
    let s = timerVal;
    const circle = document.querySelector('.timer-ring circle');
    clearInterval(countdown);
    countdown = setInterval(() => {
        s--;
        document.getElementById('timer-num').textContent = s;
        circle.style.strokeDashoffset = 201 - (s / timerVal * 201);
        if (s <= 0) {
            clearInterval(countdown);
            mathMod.style.display = "none";
            activeBlockIdx = null; // عقوبة اللعب الحر
            turn = (turn === 'X') ? 'O' : 'X';
            updateGlobalUI();
        }
    }, 1000);
}

function checkSmallGrid(b) {
    const winPatterns = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return winPatterns.some(p => b[p[0]] && b[p[0]] === b[p[1]] && b[p[0]] === b[p[2]]);
}

function checkUltimateWin() {
    const winPatterns = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return winPatterns.some(p => bigWins[p[0]] && bigWins[p[0]] === bigWins[p[1]] && bigWins[p[0]] === bigWins[p[2]]);
}

function markBigWin(idx, winner) {
    const block = document.getElementById(`block-${idx}`);
    const overlay = document.createElement('div');
    overlay.className = 'win-layer'; // معرفة في CSS
    overlay.style = `position:absolute; inset:0; background:var(--bg-deep); display:flex; align-items:center; 
                     justify-content:center; font-size:5rem; font-weight:900; color:${winner==='X'?'var(--accent-x)':'var(--accent-o)'};`;
    overlay.textContent = winner;
    block.appendChild(overlay);
    document.getElementById(`score${winner}`).textContent = bigWins.filter(w => w === winner).length;
}

function updateGlobalUI() {
    document.getElementById('p-card-x').style.opacity = (turn === 'X') ? "1" : "0.3";
    document.getElementById('p-card-o').style.opacity = (turn === 'O') ? "1" : "0.3";
    
    document.querySelectorAll('.board-block').forEach((b, i) => {
        b.classList.remove('active-guide');
        if (activeBlockIdx === i) b.classList.add('active-guide');
        b.style.opacity = (activeBlockIdx === null || activeBlockIdx === i) ? "1" : "0.2";
    });
    document.getElementById('status-update').textContent = (activeBlockIdx === null) ? "وضع اللعب الحر!" : `العب في المربع ${activeBlockIdx + 1}`;
}

function announceWinner(res) {
    gameActive = false;
    const msg = (res === "draw") ? "تعادل مشرف للطرفين!" : `الفوز حليف فريق ${res}!`;
    alert(msg); // يمكن استبدالها بـ Modal احترافي
    location.reload();
}

function showHelp() { helpMod.style.display = "flex"; }
function hideHelp() { helpMod.style.display = "none"; }
function clearInput() { playerInputA = ""; playerInputB = ""; inputStage = 1; document.getElementById('input-wrap-1').textContent = "_"; document.getElementById('input-wrap-2').textContent = "_"; }
function delDigit() { if(inputStage===1) playerInputA = playerInputA.slice(0,-1); else playerInputB = playerInputB.slice(0,-1); }
function isFull() { return matrix81.every(row => row.every(cell => cell !== null)); }
