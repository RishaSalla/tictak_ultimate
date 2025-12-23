/* =========================================
   1. الإعدادات والمتغيرات العالمية
   ========================================= */
let currentP = 'X', gameOn = false, activeBig = null;
let bigStats = Array(9).fill(null), logic = Array(9).fill(null).map(() => Array(9).fill(null));
let selectedLvl = 1, timer = 10, countdown, targetC, correctA;
let pInput = "", mathPool = []; // مخزن الأسئلة لمنع التكرار

// ربط العناصر
const vSetup = document.getElementById('view-setup');
const vGame = document.getElementById('view-game');
const mInstructions = document.getElementById('modal-instructions');
const mMath = document.getElementById('modal-math');

/* =========================================
   2. إدارة الواجهة والمستويات
   ========================================= */
document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedLvl = parseInt(btn.dataset.lvl);
    });
});

document.getElementById('launchGame').onclick = initGame;

function initGame() {
    document.getElementById('labelX').textContent = document.getElementById('nameX').value || "X";
    document.getElementById('labelO').textContent = document.getElementById('nameO').value || "O";
    
    // تصفير البيانات
    bigStats.fill(null);
    logic = Array(9).fill(null).map(() => Array(9).fill(null));
    currentP = 'X'; activeBig = null; gameOn = true; mathPool = [];

    // بناء اللوحة الثابتة
    const grid = document.getElementById('grid-81');
    grid.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const lb = document.createElement('div');
        lb.className = 'local-board';
        lb.id = `lb-${i}`;
        for (let j = 0; j < 9; j++) {
            const c = document.createElement('div');
            c.className = 'cell';
            c.dataset.b = i; c.dataset.c = j;
            c.onclick = () => handleCell(c);
            lb.appendChild(c);
        }
        grid.appendChild(lb);
    }

    vSetup.classList.remove('active');
    vGame.classList.add('active');
    updateUI();
}

/* =========================================
   3. محرك الرياضيات (منطق الكلاسيك والعشوائية)
   ========================================= */
function generateQuestion() {
    let a, b, op, ans, str;
    const ops = ['+', '-', '*', '/'];
    
    // محاولة توليد سؤال فريد
    let attempts = 0;
    do {
        op = ops[Math.floor(Math.random() * 4)];
        if (op === '+') { a = rand(1, 9); b = rand(1, 9); ans = a + b; }
        else if (op === '-') { a = rand(1, 18); b = rand(1, 9); ans = a - b; if(ans < 0) {ans=0; a=b;} }
        else if (op === '*') { a = rand(1, 9); b = rand(1, 9); ans = a * b; }
        else { b = rand(1, 9); ans = rand(1, 9); a = b * ans; }
        
        str = `${a}${op}${b}`;
        attempts++;
    } while (mathPool.includes(str) && attempts < 100);

    mathPool.push(str);

    // تطبيق منطق المستويات
    switch(selectedLvl) {
        case 1: document.getElementById('m-eq').textContent = `${a} ${op === '*' ? '×' : op === '/' ? '÷' : op} ${b} = ?`; correctA = ans; break;
        case 2: document.getElementById('m-eq').textContent = `? ${op === '*' ? '×' : op === '/' ? '÷' : op} ${b} = ${ans}`; correctA = a; break;
        case 3: document.getElementById('m-eq').textContent = `? ${op === '*' ? '×' : op === '/' ? '÷' : op} ? = ${ans}`; correctA = a; break; 
        case 4: let offset = rand(1, 3); document.getElementById('m-eq').textContent = `${a} ${op === '*' ? '×' : op === '/' ? '÷' : op} ${b} = ? + ${offset}`; correctA = ans - offset; break;
    }
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

/* =========================================
   4. منطق اللعب والتوجيه والوميض
   ========================================= */
function handleCell(cell) {
    const bIdx = parseInt(cell.dataset.b);
    if (!gameOn || cell.textContent || bigStats[bIdx]) return;
    if (activeBig !== null && activeBig !== bIdx) return;

    targetC = cell; pInput = "";
    document.getElementById('m-ans').textContent = "_";
    document.getElementById('m-lvl').textContent = selectedLvl;
    
    mMath.style.display = "flex";
    generateQuestion();
    startTimer();
}

function keyP(n) {
    pInput += n;
    document.getElementById('m-ans').textContent = pInput;
    if (parseInt(pInput) === correctA) {
        clearInterval(countdown);
        setTimeout(solveSuccess, 150);
    }
}

function solveSuccess() {
    mMath.style.display = "none";
    const bIdx = parseInt(targetC.dataset.b);
    const cIdx = parseInt(targetC.dataset.c);

    targetC.textContent = currentP;
    targetC.classList.add(currentP);
    logic[bIdx][cIdx] = currentP;

    if (checkWin(logic[bIdx])) {
        bigStats[bIdx] = currentP;
        const lb = document.getElementById(`lb-${bIdx}`);
        const over = document.createElement('div');
        over.className = 'win-overlay';
        over.textContent = currentP;
        over.style.color = currentP === 'X' ? 'var(--accent-x)' : 'var(--accent-o)';
        lb.appendChild(over);
    }

    activeBig = (bigStats[cIdx] === null) ? cIdx : null;
    currentP = (currentP === 'X') ? 'O' : 'X';
    updateUI();
}

function updateUI() {
    document.getElementById('statusX').style.boxShadow = currentP === 'X' ? "0 0 15px var(--accent-x)" : "none";
    document.getElementById('statusO').style.boxShadow = currentP === 'O' ? "0 0 15px var(--accent-o)" : "none";
    
    document.querySelectorAll('.local-board').forEach((lb, i) => {
        lb.classList.remove('active-glow');
        if (activeBig === i) lb.classList.add('active-glow'); // تفعيل الوميض
        lb.style.opacity = (activeBig === null || activeBig === i) ? "1" : "0.3";
    });
    
    document.getElementById('free-msg').classList.toggle('hidden', activeBig !== null);
}

function checkWin(b) {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return lines.some(l => b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]);
}

/* =========================================
   5. المساعدات (المؤقت والتعليمات)
   ========================================= */
function startTimer() {
    let s = 10;
    const prog = document.getElementById('t-prog');
    const txt = document.getElementById('t-val');
    clearInterval(countdown);
    countdown = setInterval(() => {
        s--; txt.textContent = s;
        prog.style.strokeDashoffset = 283 - (s / 10 * 283);
        if (s <= 0) {
            clearInterval(countdown); mMath.style.display = "none";
            activeBig = null; currentP = (currentP === 'X') ? 'O' : 'X';
            updateUI();
        }
    }, 1000);
}

function toggleInstructions(show) { mInstructions.style.display = show ? "flex" : "none"; }
function keyC() { pInput = ""; document.getElementById('m-ans').textContent = "_"; }
function keyD() { pInput = pInput.slice(0,-1); document.getElementById('m-ans').textContent = pInput || "_"; }
