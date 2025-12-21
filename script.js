let gameBoard = Array(9).fill(null).map(() => Array(9).fill(null));
let metaBoard = Array(9).fill(null);
let activeLocalBoard = null;
let currentTeam = 'X';
let gameActive = false;
let mathOp, timeLimit, countdown, targetCell, currentAns;
let playerAnswer = "";
let questionHistory = [];

const goldDiv = [
    {a:4, b:2, ans:2}, {a:6, b:2, ans:3}, {a:8, b:2, ans:4},
    {a:6, b:3, ans:2}, {a:9, b:3, ans:3}, {a:8, b:4, ans:2}
];

// 1. إدارة الخلفية الهادئة
function initMatrix() {
    const container = document.getElementById('matrix-bg');
    const cols = Math.floor(window.innerWidth / 40);
    container.innerHTML = '';
    for(let i=0; i<cols; i++) {
        let span = document.createElement('span');
        span.style.position = 'absolute';
        span.style.left = (i*40) + 'px';
        span.style.top = Math.random() * -100 + 'vh';
        span.style.transition = 'top 15s linear'; // سرعة هادئة جداً
        span.style.fontSize = '12px';
        span.style.color = '#1e293b';
        span.innerText = Math.floor(Math.random()*9);
        container.appendChild(span);
        
        setInterval(() => {
            let top = parseFloat(span.style.top);
            if (top > 100) span.style.top = '-10vh';
            else span.style.top = (top + 0.5) + 'vh';
        }, 100);
    }
}

// 2. توليد أسئلة بدون تكرار
function getNewQuestion() {
    let qText, ans;
    do {
        let a, b, op, type = mathOp === 'random' ? ['add','sub','mul','div'][Math.floor(Math.random()*4)] : mathOp;
        if(type === 'div') {
            let item = goldDiv[Math.floor(Math.random()*goldDiv.length)];
            a = item.a; b = item.b; ans = item.ans; op = '÷';
        } else if(type === 'mul') {
            a = Math.floor(Math.random()*8)+2; b = Math.floor(Math.random()*8)+2;
            ans = a*b; op = '×';
        } else if(type === 'add') {
            a = Math.floor(Math.random()*10)+2; b = Math.floor(Math.random()*10)+2;
            ans = a+b; op = '+';
        } else {
            a = Math.floor(Math.random()*15)+5; b = Math.floor(Math.random()*(a-2))+1;
            ans = a-b; op = '-';
        }
        qText = `${a} ${op} ${b}`;
    } while(questionHistory.includes(qText));

    questionHistory.push(qText);
    if(questionHistory.length > 20) questionHistory.shift();
    currentAns = ans;
    document.getElementById('question-text').textContent = qText;
}

// 3. إدارة الإدخال والتثبيت البصري
function keyIn(n) {
    playerAnswer += n;
    const box = document.getElementById('answer-input');
    box.textContent = playerAnswer;

    if (parseInt(playerAnswer) === currentAns) {
        clearInterval(countdown);
        box.style.color = "var(--green)";
        document.getElementById('success-feedback').classList.remove('hidden');
        
        // تثبيت الإجابة لمدة ثانية كاملة قبل الإغلاق كما اتفقنا
        setTimeout(() => {
            document.getElementById('math-popup').classList.add('hidden');
            finishMove();
        }, 1000);
    } else if (playerAnswer.length >= currentAns.toString().length) {
        setTimeout(() => { playerAnswer = ""; box.textContent = "_"; }, 300);
    }
}

function finishMove() {
    const bIdx = parseInt(targetCell.parentElement.dataset.board);
    const cIdx = parseInt(targetCell.dataset.cell);
    gameBoard[bIdx][cIdx] = currentTeam;
    targetCell.textContent = currentTeam;
    targetCell.classList.add(currentTeam);
    checkGameState(bIdx, cIdx);
}

function checkGameState(bIdx, cIdx) {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    
    // فحص الفوز المحلي
    if (wins.some(w => gameBoard[bIdx][w[0]] && gameBoard[bIdx][w[0]] === gameBoard[bIdx][w[1]] && gameBoard[bIdx][w[0]] === gameBoard[bIdx][w[2]])) {
        metaBoard[bIdx] = currentTeam;
        const bDiv = document.querySelector(`[data-board="${bIdx}"]`);
        const m = document.createElement('div'); m.className = 'win-mark';
        m.style.color = currentTeam === 'X' ? 'var(--x-color)' : 'var(--o-color)';
        m.innerText = currentTeam; bDiv.appendChild(m);
    }

    // فحص الفوز الكلي
    if (wins.some(w => metaBoard[w[0]] && metaBoard[w[0]] === metaBoard[w[1]] && metaBoard[w[0]] === metaBoard[w[2]])) {
        gameActive = false; alert("الفوز لـ " + (currentTeam==='X'?'فريق X':'فريق O'));
    }

    activeLocalBoard = metaBoard[cIdx] ? null : cIdx;
    currentTeam = currentTeam === 'X' ? 'O' : 'X';
    updateView();
}

function onCellClick(el) {
    const bIdx = parseInt(el.parentElement.dataset.board);
    if(!gameActive || el.textContent !== "" || metaBoard[bIdx]) return;
    if(activeLocalBoard !== null && activeLocalBoard !== bIdx) return;
    
    targetCell = el; playerAnswer = "";
    document.getElementById('answer-input').textContent = "_";
    document.getElementById('answer-input').style.color = "var(--green)";
    document.getElementById('success-feedback').classList.add('hidden');
    document.getElementById('math-popup').classList.remove('hidden');
    getNewQuestion();
    if(timeLimit > 0) startTimer();
}

function startTimer() {
    let l = timeLimit;
    document.getElementById('timer-num').textContent = l;
    countdown = setInterval(() => {
        l--; document.getElementById('timer-num').textContent = l;
        if(l <= 0) {
            clearInterval(countdown);
            document.getElementById('math-popup').classList.add('hidden');
            activeLocalBoard = null; currentTeam = currentTeam==='X'?'O':'X';
            updateView();
        }
    }, 1000);
}

function updateView() {
    document.getElementById('cardX').classList.toggle('active-turn', currentTeam === 'X');
    document.getElementById('cardO').classList.toggle('active-turn', currentTeam === 'O');
    document.querySelectorAll('.local-board').forEach((b, i) => b.classList.toggle('active', activeLocalBoard===null || activeLocalBoard===i));
    document.getElementById('scoreX').textContent = metaBoard.filter(v=>v==='X').length;
    document.getElementById('scoreO').textContent = metaBoard.filter(v=>v==='O').length;
}

function backToSetup() { if(confirm("العودة للإعدادات؟ سيفقد تقدمك.")) location.reload(); }
function toggleModal(s) { document.getElementById('instr-modal').classList.toggle('hidden', !s); }
function clearAll() { playerAnswer = ""; document.getElementById('answer-input').textContent = "_"; }
function backspace() { playerAnswer = playerAnswer.slice(0,-1); document.getElementById('answer-input').textContent = playerAnswer || "_"; }

document.getElementById('startGameBtn').onclick = () => {
    mathOp = document.getElementById('mathOperation').value;
    timeLimit = parseInt(document.getElementById('timerOption').value);
    document.getElementById('labelX').textContent = document.getElementById('teamXName').value || 'فريق X';
    document.getElementById('labelO').textContent = document.getElementById('teamOName').value || 'فريق O';
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    const meta = document.getElementById('meta-board');
    meta.innerHTML = '';
    for(let i=0; i<9; i++) {
        let lb = document.createElement('div'); lb.className = 'local-board'; lb.dataset.board = i;
        for(let j=0; j<9; j++) {
            let c = document.createElement('div'); c.className = 'cell'; c.dataset.cell = j;
            c.onclick = (e) => onCellClick(e.target); lb.appendChild(c);
        }
        meta.appendChild(lb);
    }
    gameActive = true; updateView();
};

window.onload = initMatrix;
