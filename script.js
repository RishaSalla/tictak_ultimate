/**
 * X-MATH CHALLENGE ENGINE v4.0
 * المحرك البرمجي المتكامل للتعامل مع ملفات JSON الأربعة
 */

let gameData = {
    level: null,
    pool: [],
    selectedCells: [],
    timer: null,
    seconds: 0,
    activeCellIndex: null,
    teamA: "الفريق الأول",
    teamB: "الفريق الثاني",
    scoreA: 0,
    scoreB: 0,
    currentPlayer: 'A' // التبديل التلقائي بين الفريقين
};

// 1. إدارة الشاشات والبدء
document.getElementById('launch-btn').addEventListener('click', async () => {
    const level = document.getElementById('level-select').value;
    const teamA = document.getElementById('team-a').value.trim() || "الفريق الأول";
    const teamB = document.getElementById('team-b').value.trim() || "الفريق الثاني";

    try {
        const response = await fetch(`data/${level}.json`);
        const data = await response.json();
        
        gameData.level = level;
        gameData.teamA = teamA;
        gameData.teamB = teamB;
        
        preparePool(data.pool);
        setupGameUI();
        startTimer();
        
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
    } catch (error) {
        alert("فشل تحميل ملف المستوى. تأكد من وجود المجلد data والملفات بداخله.");
    }
});

// 2. معالجة مصفوفة البيانات (تحويلها لـ 81 خلية)
function preparePool(pool) {
    let easy = [];
    let hard = [];

    // التكيف مع مسميات ملفاتك المختلفة
    if (gameData.level === 'level4') {
        easy = pool.ones_group_10_percent;
        hard = pool.strict_challenges_90_percent;
    } else if (gameData.level === 'level3') {
        easy = pool.only_ones_group;
        hard = pool.strict_challenges_2_to_9;
    } else {
        easy = pool.ones_group || [];
        hard = pool.core_challenges || pool.all_challenges || [];
    }

    // سحب 8 عمليات سهلة (10%) و 73 عملية صعبة (90%)
    const selectedEasy = shuffle(easy).slice(0, 8);
    const selectedHard = shuffle(hard).slice(0, 73);
    
    gameData.selectedCells = shuffle([...selectedEasy, ...selectedHard]);
}

// 3. بناء لوحة اللعب
function setupGameUI() {
    const board = document.getElementById('game-board');
    const numpad = document.getElementById('numpad');
    
    document.getElementById('label-a').textContent = gameData.teamA;
    document.getElementById('label-b').textContent = gameData.teamB;

    board.innerHTML = '';
    gameData.selectedCells.forEach((item, index) => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.id = `cell-${index}`;
        cell.innerHTML = `<span class="q-text">${item.q}</span><span class="a-val"></span>`;
        cell.onclick = () => selectCell(index);
        board.appendChild(cell);
    });

    // بناء لوحة الأرقام 1-9 مع الصفر
    numpad.innerHTML = '';
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].forEach(num => {
        const btn = document.createElement('button');
        btn.textContent = num;
        btn.onclick = () => handleInput(num);
        numpad.appendChild(btn);
    });
}

// 4. منطق الإدخال والتحقق
function selectCell(index) {
    if (document.getElementById(`cell-${index}`).classList.contains('correct')) return;
    
    if (gameData.activeCellIndex !== null) {
        document.getElementById(`cell-${gameData.activeCellIndex}`).classList.remove('active');
    }
    gameData.activeCellIndex = index;
    document.getElementById(`cell-${index}`).classList.add('active');
}

function handleInput(num) {
    if (gameData.activeCellIndex === null) return;
    
    const cell = document.getElementById(`cell-${gameData.activeCellIndex}`);
    const item = gameData.selectedCells[gameData.activeCellIndex];
    const display = cell.querySelector('.a-val');

    // منطق المستوى الثالث (الأرقام المزدوجة)
    if (gameData.level === 'level3') {
        if (!display.textContent) {
            display.textContent = num; // الرقم الأول
        } else if (display.textContent.length === 1) {
            const firstNum = parseInt(display.textContent);
            const secondNum = num;
            display.textContent += ` , ${secondNum}`;
            
            // التحقق من مصفوفة الـ pairs
            const isValid = item.pairs.some(p => 
                (p[0] === firstNum && p[1] === secondNum) || 
                (p[0] === secondNum && p[1] === firstNum)
            );

            if (isValid) {
                finalizeCell(cell);
            } else {
                failCell(cell, display);
            }
        }
    } else {
        // التحقق للمستويات 1, 2, 4 (رقم واحد)
        display.textContent = num;
        if (parseInt(item.a) === num) {
            finalizeCell(cell);
        } else {
            failCell(cell, display);
        }
    }
}

function finalizeCell(cell) {
    cell.classList.remove('active');
    cell.classList.add('correct');
    
    // إضافة النقاط للفريق الحالي
    if (gameData.currentPlayer === 'A') {
        gameData.scoreA++;
        document.getElementById('score-a').textContent = gameData.scoreA;
        gameData.currentPlayer = 'B'; // تبديل الدور
    } else {
        gameData.scoreB++;
        document.getElementById('score-b').textContent = gameData.scoreB;
        gameData.currentPlayer = 'A';
    }
    gameData.activeCellIndex = null;
    checkWin();
}

function failCell(cell, display) {
    cell.classList.add('shake');
    setTimeout(() => {
        cell.classList.remove('shake');
        display.textContent = '';
    }, 500);
}

// 5. وظائف مساعدة
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

function startTimer() {
    if (gameData.timer) clearInterval(gameData.timer);
    gameData.seconds = 0;
    gameData.timer = setInterval(() => {
        gameData.seconds++;
        let m = Math.floor(gameData.seconds / 60).toString().padStart(2, '0');
        let s = (gameData.seconds % 60).toString().padStart(2, '0');
        document.getElementById('game-timer').textContent = `${m}:${s}`;
    }, 1000);
}

function checkWin() {
    const corrects = document.querySelectorAll('.cell.correct').length;
    if (corrects === 81) {
        clearInterval(gameData.timer);
        alert(`تهانينا! اكتمل التحدي.\nالنتيجة النهائية:\n${gameData.teamA}: ${gameData.scoreA}\n${gameData.teamB}: ${gameData.scoreB}`);
    }
}

// أزرار التحكم الإضافية
document.getElementById('clear-cell').onclick = () => {
    if (gameData.activeCellIndex !== null) {
        document.getElementById(`cell-${gameData.activeCellIndex}`).querySelector('.a-val').textContent = '';
    }
};

document.getElementById('terminate-game').onclick = () => location.reload();
