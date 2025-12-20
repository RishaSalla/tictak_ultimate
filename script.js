let gameBoard = Array(9).fill(null).map(() => Array(9).fill(null));
let metaBoard = Array(9).fill(null);
let activeLocalBoard = null;
let currentTeam = 'X';
let gameActive = true;
let mathOp, timeLimit, countdown, targetCell, currentAns;
let playerAnswer = "";

// إعداد العمليات الذهبية للقسمة (بدون الرقم 1)
const goldDiv = [
    {a: 4, b: 2, ans: 2}, {a: 6, b: 2, ans: 3}, {a: 8, b: 2, ans: 4},
    {a: 6, b: 3, ans: 2}, {a: 9, b: 3, ans: 3}, {a: 8, b: 4, ans: 2}
];

document.getElementById('startGameButton').addEventListener('click', initGame);
document.getElementById('themeToggle').addEventListener('click', () => document.body.classList.toggle('light-mode'));

function initGame() {
    mathOp = document.getElementById('mathOperation').value;
    timeLimit = parseInt(document.getElementById('timerOption').value);
    document.getElementById('dispX').textContent = document.getElementById('teamXName').value || 'فريق X';
    document.getElementById('dispO').textContent = document.getElementById('teamOName').value || 'فريق O';
    
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    createBoard();
    updateUI();
}

function createBoard() {
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

// دالة ذكية لاختيار أرقام (تقليل الرقم 1)
function getSmartNum() {
    return (Math.random() < 0.15) ? 1 : Math.floor(Math.random() * 8) + 2;
}

function generateQuestion() {
    let a, b, op = mathOp === 'random' ? ['add', 'sub', 'mul', 'div'][Math.floor(Math.random()*4)] : mathOp;
    
    if (op === 'div') {
        if (Math.random() > 0.15) { // 85% من الوقت: قسمة ذهبية بدون 1
            const q = goldDiv[Math.floor(Math.random() * goldDiv.length)];
            a = q.a; b = q.b; currentAns = q.ans;
        } else { // ضيف خفيف: قسمة فيها رقم 1
            currentAns = Math.floor(Math.random() * 9) + 1;
            b = Math.random() > 0.5 ? 1 : currentAns;
            a = currentAns * b;
            if (a > 9) { a = 4; b = 2; currentAns = 2; } // أمان لعدم تجاوز 9
        }
    } else if (op === 'mul') {
        a = getSmartNum(); b = getSmartNum(); currentAns = a * b;
    } else if (op === 'add') {
        a = getSmartNum(); b = getSmartNum(); currentAns = a + b;
    } else { // طرح
        a = getSmartNum(); b = Math.floor(Math.random() * a) + 1; currentAns = a - b;
    }

    const sym = {add:'+', sub:'-', mul:'×', div:'÷'}[op];
    document.getElementById('math-question').textContent = `${a} ${sym} ${b}`;
    playerAnswer = "";
    document.getElementById('answer-display').textContent = "_";
}

function onCellClick(cell) {
    const bIdx = parseInt(cell.parentElement.dataset.board);
    if (!gameActive || cell.textContent !== "" || metaBoard[bIdx] !== null) return;
    if (activeLocalBoard !== null && activeLocalBoard !== bIdx) return;

    targetCell = cell;
    playerAnswer = "";
    document.getElementById('math-popup').classList.remove('hidden');
    generateQuestion();

    if (timeLimit > 0) {
        let left = timeLimit;
        countdown = setInterval(() => {
            left -= 0.1;
            document.getElementById('popup-timer-bar')?.style || (document.getElementById('popup-progress').style.width = (left/timeLimit)*100 + "%");
            if (left <= 0) { clearInterval(countdown); failMove(); }
        }, 100);
    }
}

function pressNum(n) {
    playerAnswer += n;
    document.getElementById('answer-display').textContent = playerAnswer;
    if (parseInt(playerAnswer) === currentAns) {
        clearInterval(countdown);
        successMove();
    } else if (playerAnswer.length >= currentAns.toString().length) {
        setTimeout(() => { playerAnswer = ""; document.getElementById('answer-display').textContent = "_"; }, 200);
    }
}

function successMove() {
    document.getElementById('math-popup').classList.add('hidden');
    const bIdx = parseInt(targetCell.parentElement.dataset.board);
    const cIdx = parseInt(targetCell.dataset.cell);
    
    gameBoard[bIdx][cIdx] = currentTeam;
    targetCell.textContent = currentTeam;
    targetCell.classList.add(currentTeam);
    document.getElementById('free-move-msg').classList.add('hidden');

    checkWin(bIdx, cIdx);
}

function failMove() {
    document.getElementById('math-popup').classList.add('hidden');
    activeLocalBoard = null; // لعب حر للخصم
    currentTeam = currentTeam === 'X' ? 'O' : 'X';
    document.getElementById('free-move-msg').classList.remove('hidden');
    updateUI();
}

function checkWin(bIdx, cIdx) {
    // منطق التحقق البسيط
    const check = (arr) => {
        const win = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        for (let w of win) if (arr[w[0]] && arr[w[0]] === arr[w[1]] && arr[w[0]] === arr[w[2]]) return arr[w[0]];
        return arr.includes(null) ? null : 'Tie';
    };

    const localWin = check(gameBoard[bIdx]);
    if (localWin && localWin !== 'Tie') {
        metaBoard[bIdx] = localWin;
        document.querySelector(`[data-board="${bIdx}"]`).style.background = localWin === 'X' ? 'var(--x-color)' : 'var(--o-color)';
    }

    const overWin = check(metaBoard);
    if (overWin && overWin !== 'Tie') {
        gameActive = false;
        alert("الفائز هو: " + overWin);
    }

    activeLocalBoard = metaBoard[cIdx] ? null : cIdx;
    currentTeam = currentTeam === 'X' ? 'O' : 'X';
    updateUI();
}

function updateUI() {
    document.getElementById('teamX-card').classList.toggle('active-turn', currentTeam === 'X');
    document.getElementById('teamO-card').classList.toggle('active-turn', currentTeam === 'O');
    document.querySelectorAll('.local-board').forEach((b, i) => {
        b.classList.toggle('active', activeLocalBoard === null || activeLocalBoard === i);
    });
    document.getElementById('scoreX').textContent = metaBoard.filter(v => v === 'X').length;
    document.getElementById('scoreO').textContent = metaBoard.filter(v => v === 'O').length;
}

function clearAns() { playerAnswer = ""; document.getElementById('answer-display').textContent = "_"; }
