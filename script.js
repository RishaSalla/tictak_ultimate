// =========================================
// 1. الإعدادات والمتغيرات العالمية
// =========================================
let gameBoard = Array(9).fill(null).map(() => Array(9).fill(null));
let metaBoard = Array(9).fill(null);
let activeLocalBoard = null;
let currentTeam = 'X';
let gameActive = false;
let mathOp, timeLimit, countdown, targetCell, currentAns;
let playerAnswer = "";

// نظام منع التكرار: مخزن الأسئلة
let questionPool = [];

// القسمة الذهبية (بدون رقم 1)
const goldDiv = [
    {a: 4, b: 2, ans: 2}, {a: 6, b: 2, ans: 3}, {a: 8, b: 2, ans: 4},
    {a: 6, b: 3, ans: 2}, {a: 9, b: 3, ans: 3}, {a: 8, b: 4, ans: 2}
];

// =========================================
// 2. تشغيل الخلفية المتحركة (Matrix Numbers)
// =========================================
function initMatrixBackground() {
    const container = document.getElementById('bg-animation-container');
    const columnCount = Math.floor(window.innerWidth / 20);
    
    for (let i = 0; i < columnCount; i++) {
        const span = document.createElement('span');
        span.className = 'matrix-column';
        span.style.left = (i * 20) + 'px';
        span.style.animationDuration = (Math.random() * 3 + 2) + 's';
        span.style.animationDelay = (Math.random() * 5) + 's';
        span.innerText = Math.floor(Math.random() * 9);
        container.appendChild(span);
        
        // تحديث الأرقام أثناء السقوط
        setInterval(() => {
            span.innerText = Math.floor(Math.random() * 9);
        }, 100);
    }
}

// =========================================
// 3. منطق توليد الأسئلة المطور (تنوع + منع تكرار)
// =========================================
function getSmartNum() {
    // 15% احتمال لظهور الرقم 1 (الضيف الخفيف)
    return (Math.random() < 0.15) ? 1 : Math.floor(Math.random() * 8) + 2;
}

function generateUniqueQuestion() {
    let q;
    let attempts = 0;
    
    do {
        let a, b, ans, opName;
        let op = mathOp === 'random' ? ['add', 'sub', 'mul', 'div'][Math.floor(Math.random()*4)] : mathOp;
        
        if (op === 'div') {
            const item = (Math.random() > 0.15) ? goldDiv[Math.floor(Math.random()*goldDiv.length)] : {a:7, b:7, ans:1};
            a = item.a; b = item.b; ans = item.ans; opName = '÷';
        } else if (op === 'mul') {
            a = getSmartNum(); b = getSmartNum(); ans = a * b; opName = '×';
        } else if (op === 'add') {
            a = getSmartNum(); b = getSmartNum(); ans = a + b; opName = '+';
        } else {
            a = getSmartNum(); b = Math.floor(Math.random() * a) + 1; ans = a - b; opName = '-';
        }
        
        q = { text: `${a} ${opName} ${b}`, ans: ans };
        attempts++;
    } while (questionPool.includes(q.text) && attempts < 10); // محاولة التغيير إذا كان مكرراً

    questionPool.push(q.text);
    if (questionPool.length > 20) questionPool.shift(); // الحفاظ على آخر 20 سؤال فقط لمنع التكرار القريب
    
    currentAns = q.ans;
    document.getElementById('math-question-text').textContent = q.text;
}

// =========================================
// 4. إدارة اللعب والبوب آب
// =========================================
function onCellClick(cell) {
    const bIdx = parseInt(cell.parentElement.dataset.board);
    if (!gameActive || cell.textContent !== "" || metaBoard[bIdx] !== null) return;
    if (activeLocalBoard !== null && activeLocalBoard !== bIdx) return;

    targetCell = cell;
    playerAnswer = "";
    document.getElementById('answer-input-display').textContent = "_";
    document.getElementById('answer-input-display').classList.remove('feedback-success');
    document.getElementById('math-popup').classList.remove('hidden');
    generateUniqueQuestion();

    if (timeLimit > 0) startPopupTimer();
}

function startPopupTimer() {
    let left = timeLimit;
    const bar = document.getElementById('math-progress-bar');
    countdown = setInterval(() => {
        left -= 0.1;
        bar.style.width = (left / timeLimit * 100) + "%";
        if (left <= 0) { clearInterval(countdown); handleFail(); }
    }, 100);
}

// إدخال الأرقام (التعامل مع الإجابة الصحيحة)
function pressNum(n) {
    playerAnswer += n;
    const display = document.getElementById('answer-input-display');
    display.textContent = playerAnswer;

    if (parseInt(playerAnswer) === currentAns) {
        clearInterval(countdown);
        display.classList.add('feedback-success'); // تلوين بالأخضر
        
        // تأخير بسيط (نصف ثانية) لتثبيت الإجابة قبل الإغلاق
        setTimeout(() => {
            document.getElementById('math-popup').classList.add('hidden');
            executeMove();
        }, 600);
    } else if (playerAnswer.length >= currentAns.toString().length) {
        // إجابة خاطئة: مسح تلقائي للمحاولة مرة أخرى
        setTimeout(() => {
            playerAnswer = "";
            display.textContent = "_";
        }, 300);
    }
}

// =========================================
// 5. تنفيذ الحركة وتأثير الفوز الضخم
// =========================================
function executeMove() {
    const bIdx = parseInt(targetCell.parentElement.dataset.board);
    const cIdx = parseInt(targetCell.dataset.cell);
    
    gameBoard[bIdx][cIdx] = currentTeam;
    targetCell.textContent = currentTeam;
    targetCell.classList.add(currentTeam);
    document.getElementById('free-move-banner').classList.add('hidden');

    checkLocalAndGlobalWin(bIdx, cIdx);
}

function checkLocalAndGlobalWin(bIdx, cIdx) {
    const winCombos = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    
    // فحص الفوز المحلي
    let localWinner = null;
    for (let combo of winCombos) {
        if (gameBoard[bIdx][combo[0]] && gameBoard[bIdx][combo[0]] === gameBoard[bIdx][combo[1]] && gameBoard[bIdx][combo[0]] === gameBoard[bIdx][combo[2]]) {
            localWinner = gameBoard[bIdx][combo[0]];
            break;
        }
    }

    if (localWinner) {
        metaBoard[bIdx] = localWinner;
        showBigMark(bIdx, localWinner); // تأثير الفوز الضخم
    }

    // فحص الفوز الكلي
    let globalWinner = null;
    for (let combo of winCombos) {
        if (metaBoard[combo[0]] && metaBoard[combo[0]] === metaBoard[combo[1]] && metaBoard[combo[0]] === metaBoard[combo[2]]) {
            globalWinner = metaBoard[combo[0]];
            break;
        }
    }

    if (globalWinner) {
        gameActive = false;
        setTimeout(() => alert(`🎉 تهانينا! الفائز بالمعركة هو: ${globalWinner}`), 500);
    }

    // تحديد المربع التالي
    activeLocalBoard = metaBoard[cIdx] ? null : cIdx;
    currentTeam = currentTeam === 'X' ? 'O' : 'X';
    updateGameState();
}

function showBigMark(bIdx, winner) {
    const board = document.querySelector(`[data-board="${bIdx}"]`);
    const mark = document.createElement('div');
    mark.className = 'big-winner-mark';
    mark.style.color = winner === 'X' ? 'var(--accent-x)' : 'var(--accent-o)';
    mark.innerText = winner;
    board.appendChild(mark);
}

// =========================================
// 6. دوال مساعدة وتحكم
// =========================================
function handleFail() {
    document.getElementById('math-popup').classList.add('hidden');
    activeLocalBoard = null; // لعب حر للخصم
    currentTeam = currentTeam === 'X' ? 'O' : 'X';
    document.getElementById('free-move-banner').classList.remove('hidden');
    updateGameState();
}

function updateGameState() {
    document.getElementById('teamX-card').classList.toggle('active-turn', currentTeam === 'X');
    document.getElementById('teamO-card').classList.toggle('active-turn', currentTeam === 'O');
    document.querySelectorAll('.local-board').forEach((b, i) => {
        b.classList.toggle('active', activeLocalBoard === null || activeLocalBoard === i);
    });
    document.getElementById('scoreX').textContent = metaBoard.filter(v => v === 'X').length;
    document.getElementById('scoreO').textContent = metaBoard.filter(v => v === 'O').length;
}

// أحداث الأزرار
document.querySelectorAll('.num-btn[data-val]').forEach(btn => {
    btn.onclick = () => pressNum(btn.dataset.val);
});
document.getElementById('clear-ans').onclick = () => { playerAnswer = ""; document.getElementById('answer-input-display').textContent = "_"; };
document.getElementById('backspace-ans').onclick = () => { 
    playerAnswer = playerAnswer.slice(0, -1); 
    document.getElementById('answer-input-display').textContent = playerAnswer || "_"; 
};

document.getElementById('startGameButton').onclick = () => {
    mathOp = document.getElementById('mathOperation').value;
    timeLimit = parseInt(document.getElementById('timerOption').value);
    document.getElementById('dispXName').textContent = document.getElementById('teamXName').value || 'فريق X';
    document.getElementById('dispOName').textContent = document.getElementById('teamOName').value || 'فريق O';
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    initGameBoard();
    gameActive = true;
    updateGameState();
};

function initGameBoard() {
    const meta = document.getElementById('meta-board');
    meta.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const lb = document.createElement('div');
        lb.className = 'local-board';
        lb.dataset.board = i;
        for (let j = 0; j < 9; j++) {
            const c = document.createElement('div');
            c.className = 'cell';
            c.dataset.cell = j;
            c.onclick = (e) => onCellClick(e.target);
            lb.appendChild(c);
        }
        meta.appendChild(lb);
    }
}

// تشغيل الخلفية عند التحميل
window.onload = initMatrixBackground;
