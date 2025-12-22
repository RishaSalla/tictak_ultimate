/* =========================================
   1. المتغيرات العامة وحالة اللعبة
   ========================================= */
let currentTeam = 'X';
let gameActive = false;
let activeBoardIdx = null; // المربع الكبير النشط
let metaBoard = Array(9).fill(null); 
let localBoards = Array(9).fill(null).map(() => Array(9).fill(null));

let diffLevel, timeLimit, countdown, targetCell, currentAns;
let playerAnswer = "";

/* =========================================
   2. محرك توليد الأسئلة (قواعد 1-9 والـ 1%)
   ========================================= */
function generateQuestion() {
    let a, b, op, ans, qText;
    const level = parseInt(diffLevel);

    // دالة اختيار رقم بين 1 و 9 مع قاعدة الـ 1%
    const getNum = (allowOne) => {
        // إذا كان مسموحاً بالرقم 1 (جمع/طرح) تظهر بنسبة 1%
        if (allowOne) {
            return (Math.random() < 0.01) ? 1 : Math.floor(Math.random() * 8) + 2;
        }
        // في الضرب والقسمة: من 2 لـ 9 دائماً
        return Math.floor(Math.random() * 8) + 2; 
    };

    const ops = ['+', '-', '*', '/'];
    const type = ops[Math.floor(Math.random() * ops.length)];

    if (type === '+') {
        a = getNum(true); b = getNum(true); ans = a + b; op = '+';
    } else if (type === '-') {
        a = Math.floor(Math.random() * 8) + 2; 
        b = Math.floor(Math.random() * (a - 1)) + 1; // لضمان ناتج موجب وأرقام 1-9
        ans = a - b; op = '-';
    } else if (type === '*') {
        a = getNum(false); b = getNum(false); ans = a * b; op = '×';
    } else if (type === '/') {
        // المستوى الأول: قسمة بسيطة (نواتج صغيرة)
        if (level === 1) {
            ans = Math.floor(Math.random() * 3) + 2; 
            b = Math.floor(Math.random() * 3) + 2;
        } else {
            // المستويات المتقدمة: الطرف الأول قد يكون كبيراً لكن الفراغ دائماً 1-9
            ans = getNum(false); b = getNum(false);
        }
        a = ans * b; op = '÷';
    }

    // تشكيل السؤال بناءً على المستوى (الاتجاه من اليسار لليمين)
    switch(level) {
        case 1: // كلاسيك (مباشر)
            qText = `${a} ${op} ${b} = ?`;
            currentAns = ans;
            break;
        case 2: // العدد المفقود
            if (Math.random() > 0.5) {
                qText = `? ${op} ${b} = ${ans}`;
                currentAns = a;
            } else {
                qText = `${a} ${op} ? = ${ans}`;
                currentAns = b;
            }
            break;
        case 3: // فراغ مزدوج (بدون رقم 1)
            qText = `? ${op} ? = ${ans}`;
            currentAns = a; // نطلب الرقم الأول كإجابة
            break;
        case 4: // الميزان الحسابي
            let offset = Math.floor(Math.random() * 2) + 1;
            qText = `${a} ${op} ${b} = ? + ${offset}`;
            currentAns = ans - offset;
            break;
    }

    document.getElementById('equation-text').textContent = qText;
}

/* =========================================
   3. إدارة اللعب والتحكم
   ========================================= */
function startGame() {
    diffLevel = document.getElementById('levelSelect').value;
    timeLimit = parseInt(document.getElementById('timerSelect').value);
    
    // تصفير البيانات للبدء من جديد
    metaBoard.fill(null);
    localBoards = Array(9).fill(null).map(() => Array(9).fill(null));
    currentTeam = 'X';
    activeBoardIdx = null;
    gameActive = true;

    // بناء اللوحة برمجياً لضمان النظافة
    const container = document.getElementById('ultimate-grid');
    container.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        let lb = document.createElement('div');
        lb.className = 'local-board';
        lb.dataset.board = i;
        for (let j = 0; j < 9; j++) {
            let c = document.createElement('div');
            c.className = 'cell';
            c.dataset.cell = j;
            c.onclick = () => handleCellClick(c);
            lb.appendChild(c);
        }
        container.appendChild(lb);
    }

    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    updateUI();
}

function handleCellClick(cell) {
    const bIdx = parseInt(cell.parentElement.dataset.board);
    if (!gameActive || cell.textContent || metaBoard[bIdx]) return;
    if (activeBoardIdx !== null && activeBoardIdx !== bIdx) return;

    targetCell = cell;
    playerAnswer = "";
    document.getElementById('player-ans-view').textContent = "_";
    document.getElementById('feedback-tick').classList.add('hidden');
    document.getElementById('math-popup').classList.remove('hidden');
    
    generateQuestion();
    startTimer();
}

function pressNum(n) {
    playerAnswer += n;
    document.getElementById('player-ans-view').textContent = playerAnswer;
    
    if (parseInt(playerAnswer) === currentAns) {
        clearInterval(countdown);
        document.getElementById('feedback-tick').classList.remove('hidden');
        setTimeout(finalizeMove, 600);
    } else if (playerAnswer.length >= currentAns.toString().length + 1) {
        clearAns();
    }
}

function finalizeMove() {
    document.getElementById('math-popup').classList.add('hidden');
    const bIdx = parseInt(targetCell.parentElement.dataset.board);
    const cIdx = parseInt(targetCell.dataset.cell);

    targetCell.textContent = currentTeam;
    targetCell.classList.add(currentTeam);
    localBoards[bIdx][cIdx] = currentTeam;

    // تحديد المربع القادم (التوجيه)
    activeBoardIdx = (metaBoard[cIdx] === null) ? cIdx : null;
    currentTeam = (currentTeam === 'X') ? 'O' : 'X';
    updateUI();
}

/* =========================================
   4. الوظائف المساعدة والواجهة
   ========================================= */
function startTimer() {
    if (timeLimit === 0) return;
    let time = timeLimit;
    document.getElementById('countdown-display').textContent = time;
    clearInterval(countdown);
    countdown = setInterval(() => {
        time--;
        document.getElementById('countdown-display').textContent = time;
        if (time <= 0) {
            clearInterval(countdown);
            document.getElementById('math-popup').classList.add('hidden');
            activeBoardIdx = null; // فشل يعني لعب حر للخصم
            currentTeam = (currentTeam === 'X') ? 'O' : 'X';
            updateUI();
        }
    }, 1000);
}

function updateUI() {
    document.getElementById('panelX').classList.toggle('active', currentTeam === 'X');
    document.getElementById('panelO').classList.toggle('active', currentTeam === 'O');
    
    document.querySelectorAll('.local-board').forEach((b, i) => {
        b.style.opacity = (activeBoardIdx === null || activeBoardIdx === i) ? "1" : "0.3";
    });

    document.getElementById('free-move-banner').classList.toggle('hidden', activeBoardIdx !== null);
}

function toggleTheme() { document.body.classList.toggle('dark-mode'); }
function openHelp() { document.getElementById('help-modal').classList.remove('hidden'); }
function closeHelp() { document.getElementById('help-modal').classList.add('hidden'); }
function clearAns() { playerAnswer = ""; document.getElementById('player-ans-view').textContent = "_"; }
function delAns() { playerAnswer = playerAnswer.slice(0, -1); document.getElementById('player-ans-view').textContent = playerAnswer || "_"; }
