// =========================================
// 1. المتغيرات والبيانات الأساسية
// =========================================
let gameActive = false;
let currentTeam = 'X'; // X يبدأ دائماً
let activeBoardIndex = null; // يحدد المربع الكبير المتاح للعب (null يعني لعب حر)
let metaBoard = Array(9).fill(null); // حالة المربعات الكبيرة الـ 9
let localBoards = Array(9).fill(null).map(() => Array(9).fill(null)); // حالة الـ 81 مربع صغير

let mathOp, timeLimit, countdown, targetCell, currentAns;
let playerAnswer = "";
let qHistory = []; // لمنع تكرار الأسئلة

// مصفوفة ثابتة للقسمة (لضمان أرقام صحيحة وسهلة)
const goldDiv = [
    {a: 4, b: 2, ans: 2}, {a: 6, b: 2, ans: 3}, {a: 8, b: 2, ans: 4},
    {a: 9, b: 3, ans: 3}, {a: 10, b: 2, ans: 5}, {a: 12, b: 3, ans: 4}
];

// =========================================
// 2. إدارة الواجهة والبداية
// =========================================

// تشغيل جزيئات الخلفية عند التحميل
window.onload = () => {
    initParticles();
};

function initParticles() {
    const container = document.getElementById('bg-particles');
    container.innerHTML = '';
    const count = 30; // عدد هادئ
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.style.position = 'absolute';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.top = Math.random() * 100 + 'vh';
        p.style.width = '2px';
        p.style.height = '2px';
        p.style.background = 'white';
        p.style.borderRadius = '50%';
        container.appendChild(p);
    }
}

// بدء اللعب
document.getElementById('startGameBtn').onclick = () => {
    const nameX = document.getElementById('teamXName').value || 'فريق X';
    const nameO = document.getElementById('teamOName').value || 'فريق O';
    
    document.getElementById('displayXName').textContent = nameX;
    document.getElementById('displayOName').textContent = nameO;
    
    mathOp = document.getElementById('mathOperation').value;
    timeLimit = parseInt(document.getElementById('timerOption').value);
    
    // إخفاء شاشة الإعدادات وإظهار اللعب
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    resetAndBuildBoard();
};

// مسح وبناء اللوحة (منع الزحف)
function resetAndBuildBoard() {
    const container = document.getElementById('meta-board-container');
    container.innerHTML = ''; // مسح أي لوحة سابقة تماماً
    
    // إعادة تعيين البيانات
    metaBoard.fill(null);
    localBoards = Array(9).fill(null).map(() => Array(9).fill(null));
    currentTeam = 'X';
    activeBoardIndex = null;
    gameActive = true;

    // بناء الـ 9 مربعات كبيرة
    for (let i = 0; i < 9; i++) {
        const lb = document.createElement('div');
        lb.className = 'local-board';
        lb.dataset.board = i;
        
        // بناء الـ 9 مربعات صغيرة داخل كل واحد
        for (let j = 0; j < 9; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.cell = j;
            cell.onclick = () => handleCellClick(cell);
            lb.appendChild(cell);
        }
        container.appendChild(lb);
    }
    updateUI();
}

// =========================================
// 3. منطق الأسئلة والتحقق
// =========================================

function generateUniqueQuestion() {
    let qText, ans;
    let attempts = 0;
    
    do {
        let a, b, op, type = mathOp === 'random' ? ['add','sub','mul','div'][Math.floor(Math.random()*4)] : mathOp;
        
        if (type === 'div') {
            const item = goldDiv[Math.floor(Math.random() * goldDiv.length)];
            a = item.a; b = item.b; ans = item.ans; op = '÷';
        } else if (type === 'mul') {
            a = Math.floor(Math.random() * 7) + 2;
            b = Math.floor(Math.random() * 7) + 2;
            ans = a * b; op = '×';
        } else if (type === 'add') {
            a = Math.floor(Math.random() * 20) + 5;
            b = Math.floor(Math.random() * 20) + 5;
            ans = a + b; op = '+';
        } else {
            a = Math.floor(Math.random() * 20) + 10;
            b = Math.floor(Math.random() * (a - 5)) + 2;
            ans = a - b; op = '-';
        }
        qText = `${a} ${op} ${b}`;
        attempts++;
    } while (qHistory.includes(qText) && attempts < 10);

    qHistory.push(qText);
    if (qHistory.length > 15) qHistory.shift();
    
    currentAns = ans;
    document.getElementById('math-question-display').textContent = qText;
}

function handleCellClick(cell) {
    const bIdx = parseInt(cell.parentElement.dataset.board);
    const cIdx = parseInt(cell.dataset.cell);
    
    // شروط اللعب: اللعبة فعالة، المربع فارغ، المربع الكبير لم يُربح بعد، واللعب في المربع النشط
    if (!gameActive || cell.textContent !== "" || metaBoard[bIdx] !== null) return;
    if (activeBoardIndex !== null && activeBoardIndex !== bIdx) return;

    targetCell = cell;
    playerAnswer = "";
    document.getElementById('user-answer-view').textContent = "_";
    document.getElementById('user-answer-view').style.color = "var(--text-dark)";
    document.getElementById('success-tick').classList.add('hidden');
    document.getElementById('math-popup').classList.remove('hidden');
    
    generateUniqueQuestion();
    if (timeLimit > 0) startPopupTimer();
}

function handleNumIn(num) {
    playerAnswer += num;
    const view = document.getElementById('user-answer-view');
    view.textContent = playerAnswer;

    if (parseInt(playerAnswer) === currentAns) {
        clearInterval(countdown);
        view.style.color = "var(--success)";
        document.getElementById('success-tick').classList.remove('hidden');
        
        // التثبيت البصري لمدة ثانية قبل التنفيذ
        setTimeout(() => {
            document.getElementById('math-popup').classList.add('hidden');
            executeMove();
        }, 1000);
    } else if (playerAnswer.length >= currentAns.toString().length) {
        // خطأ: مسح المحاولة
        setTimeout(() => {
            playerAnswer = "";
            view.textContent = "_";
        }, 200);
    }
}

// =========================================
// 4. تنفيذ الحركة والاستحواذ
// =========================================

function executeMove() {
    const bIdx = parseInt(targetCell.parentElement.dataset.board);
    const cIdx = parseInt(targetCell.dataset.cell);
    
    localBoards[bIdx][cIdx] = currentTeam;
    targetCell.textContent = currentTeam;
    targetCell.classList.add(currentTeam);
    
    checkLocalWin(bIdx, cIdx);
}

function checkLocalWin(bIdx, cIdx) {
    const winPatterns = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    
    // هل فاز بالمربع الكبير؟
    const isWin = winPatterns.some(p => 
        localBoards[bIdx][p[0]] === currentTeam && 
        localBoards[bIdx][p[1]] === currentTeam && 
        localBoards[bIdx][p[2]] === currentTeam
    );

    if (isWin) {
        metaBoard[bIdx] = currentTeam;
        const boardEl = document.querySelector(`[data-board="${bIdx}"]`);
        const mark = document.createElement('div');
        mark.className = `big-win-mark win-${currentTeam}`;
        mark.textContent = currentTeam;
        boardEl.appendChild(mark);
        checkGlobalWin();
    }

    // تحديد المربع القادم (التوجيه)
    // إذا كان المربع الموجه إليه ممتلئاً، يصبح اللعب حراً
    if (metaBoard[cIdx] !== null) {
        activeBoardIndex = null;
        showFreeMoveBanner();
    } else {
        activeBoardIndex = cIdx;
        hideFreeMoveBanner();
    }

    currentTeam = currentTeam === 'X' ? 'O' : 'X';
    updateUI();
}

function checkGlobalWin() {
    const winPatterns = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const totalWin = winPatterns.some(p => 
        metaBoard[p[0]] === currentTeam && 
        metaBoard[p[1]] === currentTeam && 
        metaBoard[p[2]] === currentTeam
    );

    if (totalWin) {
        gameActive = false;
        setTimeout(() => {
            alert(`🎉 مبروك! فاز ${document.getElementById('display' + currentTeam + 'Name').textContent} بالاستحواذ الكلي!`);
        }, 500);
    }
}

// =========================================
// 5. الوظائف المساعدة (المؤقت، المودال، الخ)
// =========================================

function startPopupTimer() {
    let left = 100;
    const bar = document.getElementById('popup-timer-fill');
    const step = 100 / (timeLimit * 10);
    
    countdown = setInterval(() => {
        left -= step;
        bar.style.width = left + "%";
        if (left <= 0) {
            clearInterval(countdown);
            document.getElementById('math-popup').classList.add('hidden');
            handleFail();
        }
    }, 100);
}

function handleFail() {
    activeBoardIndex = null; // يحصل الخصم على لعب حر
    currentTeam = currentTeam === 'X' ? 'O' : 'X';
    showFreeMoveBanner();
    updateUI();
}

function updateUI() {
    document.getElementById('teamX-status').classList.toggle('active-turn', currentTeam === 'X');
    document.getElementById('teamO-status').classList.toggle('active-turn', currentTeam === 'O');
    
    document.querySelectorAll('.local-board').forEach((b, i) => {
        b.classList.remove('active');
        if (activeBoardIndex === null || activeBoardIndex === i) {
            if (metaBoard[i] === null) b.classList.add('active');
        }
    });

    document.getElementById('scoreX').textContent = metaBoard.filter(v => v === 'X').length;
    document.getElementById('scoreO').textContent = metaBoard.filter(v => v === 'O').length;
}

// التحكم بالنوافذ والمدخلات
function openInstructions() { document.getElementById('instructions-modal').classList.remove('hidden'); }
function closeInstructions() { document.getElementById('instructions-modal').classList.add('hidden'); }
function clearAnswer() { playerAnswer = ""; document.getElementById('user-answer-view').textContent = "_"; }
function deleteLast() { playerAnswer = playerAnswer.slice(0, -1); document.getElementById('user-answer-view').textContent = playerAnswer || "_"; }
function confirmReset() { if (confirm("هل تريد العودة للإعدادات؟ سيتم حذف المباراة الحالية.")) location.reload(); }
function showFreeMoveBanner() { document.getElementById('free-move-alert').classList.remove('hidden'); }
function hideFreeMoveBanner() { document.getElementById('free-move-alert').classList.add('hidden'); }

function toggleTheme() {
    document.body.classList.toggle('light-mode');
}
