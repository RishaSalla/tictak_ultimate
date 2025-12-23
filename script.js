/* =========================================
   1. الحالة العامة والمخازن (Global State)
   ========================================= */
let turn = 'X', gameActive = false, activeBigIdx = null;
let bigBoardStatus = Array(9).fill(null); 
let logicGrid = Array(9).fill(null).map(() => Array(9).fill(null));

let selectedLvl = 1, timeLimit = 10, countdown, targetCell, mathAnswer;
let inputStr = "";
let usedQuestions = new Set(); // مخزن لمنع تكرار الأسئلة نهائياً

// ربط العناصر الحيوية
const vSetup = document.getElementById('view-setup');
const vGame = document.getElementById('view-game');
const mHelp = document.getElementById('modal-help');
const mMath = document.getElementById('modal-math');

/* =========================================
   2. التهيئة وضوابط الواجهة
   ========================================= */
document.querySelectorAll('.lvl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.lvl-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedLvl = parseInt(btn.dataset.lvl);
    });
});

document.getElementById('startBtn').addEventListener('click', launchGame);

function launchGame() {
    // جلب الإعدادات
    timeLimit = parseInt(document.getElementById('timerSet').value);
    document.getElementById('txtX').textContent = document.getElementById('nameX').value || "فريق X";
    document.getElementById('txtO').textContent = document.getElementById('nameO').value || "فريق O";

    // تصفير البيانات للبدء من جديد
    bigBoardStatus.fill(null);
    logicGrid = Array(9).fill(null).map(() => Array(9).fill(null));
    usedQuestions.clear();
    turn = 'X'; activeBigIdx = null; gameActive = true;

    // بناء اللوحة برمجياً لضمان استقرار الأبعاد
    const gridContainer = document.getElementById('board-81');
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
   3. محرك الرياضيات (العشوائية المطلقة والمستويات)
   ========================================= */
function generateTask() {
    let a, b, op, ans, taskText;
    const getRandom = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // توليد سؤال فريد لم يسبق ظهوره
    let unique = false;
    while (!unique) {
        const ops = ['+', '-', '*', '/'];
        const type = ops[getRandom(0, 3)];

        if (type === '+') { a = getRandom(1, 9); b = getRandom(1, 9); ans = a + b; op = '+'; }
        else if (type === '-') { a = getRandom(10, 18); b = getRandom(1, 9); ans = a - b; op = '-'; }
        else if (type === '*') { a = getRandom(1, 9); b = getRandom(1, 9); ans = a * b; op = '×'; }
        else { ans = getRandom(1, 9); b = getRandom(1, 9); a = ans * b; op = '÷'; }

        const qKey = `${a}${type}${b}`;
        if (!usedQuestions.has(qKey)) {
            usedQuestions.add(qKey);
            unique = true;
        }
        // في حال استنفاد الاحتمالات (نظرياً صعب)، نقوم بتصفير المخزن
        if (usedQuestions.size > 200) usedQuestions.clear();
    }

    // تشكيل السؤال حسب مستوى اللعب
    switch(selectedLvl) {
        case 1: taskText = `${a} ${op} ${b} = ?`; mathAnswer = ans; break;
        case 2: taskText = `? ${op} ${b} = ${ans}`; mathAnswer = a; break;
        case 3: taskText = `? ${op} ? = ${ans}`; mathAnswer = a; break; // سيجد المستخدم (أ) الذي يحقق (ب)
        case 4: 
            let off = getRandom(1, 4);
            taskText = `${a} ${op} ${b} = ? + ${off}`;
            mathAnswer = ans - off;
            break;
    }

    document.getElementById('m-eq-text').textContent = taskText;
    document.getElementById('m-lvl-tag').textContent = `المستوى ${selectedLvl}`;
}

/* =========================================
   4. إدارة اللعب والوميض (Logic & Guidance)
   ========================================= */
function handleCellSelection(cell) {
    const bIdx = parseInt(cell.dataset.b);
    // التحقق من صلاحية الضغط (قانون التوجيه)
    if (!gameActive || cell.textContent || bigBoardStatus[bIdx]) return;
    if (activeBigIdx !== null && activeBigIdx !== bIdx) return;

    targetCell = cell;
    inputStr = "";
    document.getElementById('m-view').textContent = "_";
    
    mMath.style.display = "flex";
    generateTask();
    runTimer();
}

function key(n) {
    inputStr += n;
    document.getElementById('m-view').textContent = inputStr;
    if (parseInt(inputStr) === mathAnswer) {
        clearInterval(countdown);
        setTimeout(confirmMove, 200);
    } else if (inputStr.length >= 4) { keyC(); }
}

function confirmMove() {
    mMath.style.display = "none";
    const bIdx = parseInt(targetCell.dataset.b);
    const cIdx = parseInt(targetCell.dataset.c);

    targetCell.textContent = turn;
    targetCell.classList.add(turn);
    logicGrid[bIdx][cIdx] = turn;

    // فحص الفوز بالمربع الكبير (نظام الطبقة المتراكبة لمنع الانهيار)
    if (checkSmallBoard(logicGrid[bIdx])) {
        bigBoardStatus[bIdx] = turn;
        const lb = document.getElementById(`lb-${bIdx}`);
        const overlay = document.createElement('div');
        overlay.className = 'win-overlay';
        overlay.textContent = turn;
        overlay.style.color = (turn === 'X') ? 'var(--accent-x)' : 'var(--accent-o)';
        lb.appendChild(overlay);
    }

    // تحديد التوجيه القادم (قوة اللعب الحر)
    activeBigIdx = (bigBoardStatus[cIdx] === null) ? cIdx : null;
    turn = (turn === 'X') ? 'O' : 'X';
    refreshUI();
}

function refreshUI() {
    // تحديث بطاقات الأسماء (التركيز)
    document.getElementById('cardX').style.opacity = (turn === 'X') ? "1" : "0.3";
    document.getElementById('cardO').style.opacity = (turn === 'O') ? "1" : "0.3";
    
    // إدارة الوميض والتعتيم (Guidance)
    document.querySelectorAll('.local-board').forEach((lb, i) => {
        lb.classList.remove('guided');
        if (activeBigIdx === i) lb.classList.add('guided'); // تفعيل الوميض للمربع المطلوب
        
        lb.style.opacity = (activeBigIdx === null || activeBigIdx === i) ? "1" : "0.15";
    });

    document.getElementById('free-msg').classList.toggle('hidden', activeBigIdx !== null);
}

/* =========================================
   5. المساعدات (المؤقت والتحقق)
   ========================================= */
function runTimer() {
    if (timeLimit === 0) return;
    let sec = timeLimit;
    const prog = document.getElementById('t-fill');
    const txt = document.getElementById('t-num');
    clearInterval(countdown);
    countdown = setInterval(() => {
        sec--;
        txt.textContent = sec;
        prog.style.strokeDashoffset = 283 - (sec / timeLimit * 283);
        if (sec <= 0) {
            clearInterval(countdown);
            mMath.style.display = "none";
            activeBigIdx = null; // عقوبة: لعب حر للخصم
            turn = (turn === 'X') ? 'O' : 'X';
            refreshUI();
        }
    }, 1000);
}

function checkSmallBoard(b) {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return wins.some(w => b[w[0]] && b[w[0]] === b[w[1]] && b[w[0]] === b[w[2]]);
}

function openHelp() { mHelp.style.display = "flex"; }
function closeHelp() { mHelp.style.display = "none"; }
function keyC() { inputStr = ""; document.getElementById('m-view').textContent = "_"; }
function keyD() { inputStr = inputStr.slice(0, -1); document.getElementById('m-view').textContent = inputStr || "_"; }
