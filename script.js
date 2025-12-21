/* =========================================
   1. المتغيرات والبيانات الأساسية
   ========================================= */
let gameActive = false;
let currentTeam = 'X';
let activeBoardIdx = null; // المربع الكبير النشط
let metaBoard = Array(9).fill(null); // حالة الـ 9 مربعات الكبيرة
let localBoards = Array(9).fill(null).map(() => Array(9).fill(null)); // حالة الـ 81 خانة

let diffLevel, timeLimit, countdown, targetCell, currentAns;
let playerAnswer = "";
let qHistory = [];

/* =========================================
   2. محرك الأسئلة الذكي (The Math Engine)
   ========================================= */
function generateQuestion() {
    let a, b, op, qText, ans;
    const level = parseInt(diffLevel);

    // دالة لاختيار رقم بناءً على القواعد (1% للرقم 1 في الجمع والطرح)
    const getNum = (allowOneChance = 0) => {
        if (allowOneChance > 0) {
            // احتمال 1% فقط للرقم 1
            return (Math.random() < 0.01) ? 1 : Math.floor(Math.random() * 8) + 2;
        }
        return Math.floor(Math.random() * 8) + 2; // من 2 إلى 9 دائماً (للضرب والقسمة)
    };

    // اختيار العملية عشوائياً
    const ops = ['+', '-', '*', '/'];
    op = ops[Math.floor(Math.random() * ops.length)];

    // ضبط الأرقام حسب العملية
    if (op === '*') {
        a = getNum(0); b = getNum(0); ans = a * b; op = '×';
    } else if (op === '/') {
        ans = getNum(0); b = getNum(0); a = ans * b; op = '÷';
    } else if (op === '+') {
        a = getNum(1); b = getNum(1); ans = a + b; op = '+';
    } else {
        a = Math.floor(Math.random() * 9) + 10; // من 10 لـ 19 للطرح فقط
        b = getNum(1); ans = a - b; op = '-';
    }

    // تشكيل السؤال حسب المستوى المختار (من اليسار لليمين)
    switch(level) {
        case 1: // كلاسيك: A + B = ?
            qText = `${a} ${op} ${b} = ?`;
            currentAns = ans;
            break;
        case 2: // مفقود: ? + B = C أو A + ? = C
            if (Math.random() > 0.5) {
                qText = `? ${op} ${b} = ${ans}`;
                currentAns = a;
            } else {
                qText = `${a} ${op} ? = ${ans}`;
                currentAns = b;
            }
            break;
        case 3: // فراغ مزدوج: ? + ? = C (يُمنع الرقم 1)
            // هنا نغير المنطق ليكون الناتج ثابت والمطلوب رقمين
            qText = `? ${op} ? = ${ans}`;
            currentAns = [a, b]; // مصفوفة للإجابات المقبولة
            break;
        case 4: // الميزان: A + B = ? + C
            let offset = Math.floor(Math.random() * 3) + 1;
            let d = ans - offset;
            qText = `${a} ${op} ${b} = ? + ${offset}`;
            currentAns = d;
            break;
    }

    document.getElementById('equation-display').textContent = qText;
}

/* =========================================
   3. إدارة اللوحة واللعب (Layout & Logic)
   ========================================= */
function initGame() {
    const nameX = document.getElementById('pXName').value || 'فريق X';
    const nameO = document.getElementById('pOName').value || 'فريق O';
    document.getElementById('nameLabelX').textContent = nameX;
    document.getElementById('nameLabelO').textContent = nameO;

    diffLevel = document.getElementById('difficultyLevel').value;
    timeLimit = parseInt(document.getElementById('timerConfig').value);

    // تنظيف شامل للوحة (منع الزحف والتكرار)
    const container = document.getElementById('main-81-board');
    container.innerHTML = '';
    metaBoard.fill(null);
    localBoards = Array(9).fill(null).map(() => Array(9).fill(null));
    currentTeam = 'X';
    activeBoardIdx = null;
    gameActive = true;

    // بناء المربعات
    for (let i = 0; i < 9; i++) {
        let lb = document.createElement('div');
        lb.className = 'local-board';
        lb.dataset.board = i;
        for (let j = 0; j < 9; j++) {
            let c = document.createElement('div');
            c.className = 'cell';
            c.dataset.cell = j;
            c.onclick = () => onCellClick(c);
            lb.appendChild(c);
        }
        container.appendChild(lb);
    }

    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    updateUI();
}

function onCellClick(cell) {
    const bIdx = parseInt(cell.parentElement.dataset.board);
    if (!gameActive || cell.getAttribute('data-content') || metaBoard[bIdx]) return;
    if (activeBoardIdx !== null && activeBoardIdx !== bIdx) return;

    targetCell = cell;
    playerAnswer = "";
    document.getElementById('ans-preview').textContent = "_";
    document.getElementById('ans-status').classList.add('hidden');
    document.getElementById('math-popup').classList.remove('hidden');
    
    generateQuestion();
    if (timeLimit > 0) startTimer();
}

function numClick(n) {
    playerAnswer += n;
    document.getElementById('ans-preview').textContent = playerAnswer;

    // التحقق من الإجابة
    let isCorrect = false;
    if (Array.isArray(currentAns)) {
        // للمستوى الثالث (رقمين) - هنا ننتظر إدخال الرقمين ومجموعهم
        // لتبسيط الإدخال، سنعتبر أن اللاعب يدخل الرقم المطلوب فقط
        // في النسخة النهائية المتقدمة يمكن جعلها خانتين
        if (parseInt(playerAnswer) === currentAns[0] || parseInt(playerAnswer) === currentAns[1]) isCorrect = true;
    } else {
        if (parseInt(playerAnswer) === currentAns) isCorrect = true;
    }

    if (isCorrect) {
        clearInterval(countdown);
        document.getElementById('ans-status').classList.remove('hidden');
        setTimeout(commitMove, 1000); // تثبيت لمدة ثانية
    } else if (playerAnswer.length >= currentAns.toString().length + 1) {
        numClear();
    }
}

function commitMove() {
    document.getElementById('math-popup').classList.add('hidden');
    const bIdx = parseInt(targetCell.parentElement.dataset.board);
    const cIdx = parseInt(targetCell.dataset.cell);

    localBoards[bIdx][cIdx] = currentTeam;
    targetCell.setAttribute('data-content', currentTeam); // وضع الحرف عبر الـ CSS
    
    checkLocalWin(bIdx, cIdx);
}

function checkLocalWin(bIdx, cIdx) {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const isWin = wins.some(p => localBoards[bIdx][p[0]] === currentTeam && localBoards[bIdx][p[1]] === currentTeam && localBoards[bIdx][p[2]] === currentTeam);

    if (isWin) {
        metaBoard[bIdx] = currentTeam;
        const boardEl = document.querySelector(`[data-board="${bIdx}"]`);
        const over = document.createElement('div');
        over.className = `win-overlay win-${currentTeam}`;
        over.textContent = currentTeam;
        boardEl.appendChild(over);
        checkGlobalWin();
    }

    // التوجيه
    activeBoardIdx = (metaBoard[cIdx] === null) ? cIdx : null;
    currentTeam = (currentTeam === 'X') ? 'O' : 'X';
    updateUI();
}

function checkGlobalWin() {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    if (wins.some(p => metaBoard[p[0]] === currentTeam && metaBoard[p[1]] === currentTeam && metaBoard[p[2]] === currentTeam)) {
        gameActive = false;
        alert(`تهانينا! فريق ${currentTeam} استحوذ على اللوحة بالكامل!`);
    }
}

/* =========================================
   4. وظائف المساعدة (UI Helpers)
   ========================================= */
function updateUI() {
    document.getElementById('cardX').classList.toggle('active-turn', currentTeam === 'X');
    document.getElementById('cardO').classList.toggle('active-turn', currentTeam === 'O');
    
    document.querySelectorAll('.local-board').forEach((b, i) => {
        b.classList.remove('active');
        if (activeBoardIdx === null || activeBoardIdx === i) {
            if (!metaBoard[i]) b.classList.add('active');
        }
    });

    document.getElementById('valX').textContent = metaBoard.filter(v => v === 'X').length;
    document.getElementById('valO').textContent = metaBoard.filter(v => v === 'O').length;
    document.getElementById('free-play-alert').classList.toggle('hidden', activeBoardIdx !== null);
}

function startTimer() {
    let w = 100;
    const fill = document.getElementById('math-timer-fill');
    const step = 100 / (timeLimit * 10);
    countdown = setInterval(() => {
        w -= step;
        fill.style.width = w + "%";
        if (w <= 0) {
            clearInterval(countdown);
            document.getElementById('math-popup').classList.add('hidden');
            activeBoardIdx = null; // فشل يعني لعب حر للخصم
            currentTeam = (currentTeam === 'X') ? 'O' : 'X';
            updateUI();
        }
    }, 100);
}

function backToMenu() { if(confirm("العودة؟ سيتم فقدان المباراة.")) location.reload(); }
function toggleModal(show) { document.getElementById('full-instr-modal').classList.toggle('hidden', !show); }
function numClear() { playerAnswer = ""; document.getElementById('ans-preview').textContent = "_"; }
function numDel() { playerAnswer = playerAnswer.slice(0,-1); document.getElementById('ans-preview').textContent = playerAnswer || "_"; }
function toggleTheme() { document.body.classList.toggle('light-mode'); }

document.getElementById('launchGameBtn').onclick = initGame;

// مصفوفة الخلفية الهادئة
function createMatrix() {
    const bg = document.getElementById('matrix-bg-layer');
    for(let i=0; i<20; i++) {
        let s = document.createElement('span');
        s.style.left = Math.random() * 100 + "vw";
        s.style.top = Math.random() * 100 + "vh";
        s.style.position = "absolute";
        s.style.color = "white";
        s.style.fontSize = "10px";
        s.textContent = Math.floor(Math.random()*9);
        bg.appendChild(s);
    }
}
createMatrix();
