// المتغيرات المركزية للحالة (State Management)
let currentData = [];
let usedIds = new Set();
let selectedLevel = 'level1';
let activeCell = null;
let teamNames = { a: "الفريق 1", b: "الفريق 2" };
let scores = { a: 0, b: 0 };

// 1. إدارة التنقل بين الشاشات وتحميل البيانات
document.getElementById('start-game-btn').addEventListener('click', async () => {
    const nameA = document.getElementById('team-a').value;
    const nameB = document.getElementById('team-b').value;
    if (nameA) teamNames.a = nameA;
    if (nameB) teamNames.b = nameB;

    selectedLevel = document.getElementById('level-select').value;
    
    // تحميل ملف الـ JSON المطلوب
    try {
        const response = await fetch(`data/${selectedLevel}.json`);
        const data = await response.json();
        
        // تطبيق منطق السحب (81 سؤالاً: 8 من مجموعة الـ 1 و 73 من البقية)
        prepareLevelPool(data.pool);
        
        // عرض شاشة اللعب
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        updateHeader();
        initBoard();
        initNumpad();
    } catch (error) {
        console.error("خطأ في تحميل ملف المستوى:", error);
        alert("تأكد من وجود ملفات JSON في مجلد data");
    }
});

// 2. معالجة البيانات وتطبيق نسبة الـ 10% ومنع التكرار
function prepareLevelPool(pool) {
    let group1, group2;
    
    // تحديد المجموعات بناءً على هيكلية الملف (المستوى 3 له مسميات مختلفة)
    if (selectedLevel === 'level3') {
        group1 = pool.ones_group;
        group2 = [...pool.multi_solution_group, ...pool.unique_challenges];
    } else {
        group1 = pool.ones_group_10_percent || pool.only_ones_group;
        group2 = pool.strict_challenges_90_percent || pool.strict_challenges_2_to_9 || pool.challenges;
    }

    // خلط المجموعات (Shuffle)
    const shuffled1 = group1.sort(() => Math.random() - 0.5);
    const shuffled2 = group2.sort(() => Math.random() - 0.5);

    // سحب 8 من الأولى و 73 من الثانية لضمان الـ 81 خلية
    currentData = [...shuffled1.slice(0, 8), ...shuffled2.slice(0, 73)];
    // خلط نهائي للـ 81 سؤالاً لتوزيعها عشوائياً في اللوحة
    currentData = currentData.sort(() => Math.random() - 0.5);
}

// 3. بناء لوحة اللعب 9x9
function initBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    
    currentData.forEach((item, index) => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = index;
        
        // عرض السؤال (q في المستويات 1-2-4) أو (target في المستوى 3)
        if (selectedLevel === 'level3') {
            cell.innerHTML = `<span>${item.op}</span><b>${item.target}</b>`;
        } else {
            cell.textContent = item.q;
        }

        cell.onclick = () => {
            document.querySelectorAll('.cell').forEach(c => c.classList.remove('active'));
            cell.classList.add('active');
            activeCell = cell;
        };
        board.appendChild(cell);
    });
}

// 4. نظام الإدخال والتحقق الاحترافي
function initNumpad() {
    const numpad = document.getElementById('numpad');
    numpad.innerHTML = '';
    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.className = 'numpad-btn';
        btn.textContent = i;
        btn.onclick = () => handleInput(i);
        numpad.appendChild(btn);
    }
}

function handleInput(num) {
    if (!activeCell) return;
    const index = activeCell.dataset.index;
    const question = currentData[index];
    let isCorrect = false;

    // منطق التحقق لكل مستوى
    if (selectedLevel === 'level3') {
        // المستوى الثالث يحتاج رقمين (سنتعامل هنا مع الإدخال المتتابع)
        if (!activeCell.dataset.firstNum) {
            activeCell.dataset.firstNum = num;
            activeCell.textContent = `${num}, ?`;
        } else {
            const firstNum = parseInt(activeCell.dataset.firstNum);
            const secondNum = num;
            // التحقق من وجود الزوج في المصفوفة
            isCorrect = question.pairs.some(p => (p[0] === firstNum && p[1] === secondNum));
            if (isCorrect) finalizeCell(activeCell, `${firstNum},${secondNum}`);
            else resetCell(activeCell);
        }
    } else {
        // المستويات 1-2-4: مقارنة بسيطة مع الإجابة a
        if (num === question.a) {
            finalizeCell(activeCell, num);
            isCorrect = true;
        } else {
            activeCell.style.backgroundColor = '#f8d7da';
            setTimeout(() => activeCell.style.backgroundColor = 'white', 300);
        }
    }
    
    if (isCorrect) checkWin();
}

function finalizeCell(cell, val) {
    cell.classList.add('correct');
    cell.textContent = val;
    cell.onclick = null;
    activeCell = null;
    scores.a++; // تحديث النتيجة افتراضياً للفريق النشط
    updateHeader();
}

function resetCell(cell) {
    const index = cell.dataset.index;
    cell.textContent = currentData[index].target;
    delete cell.dataset.firstNum;
}

// 5. إدارة الفوز والواجهة
function updateHeader() {
    document.getElementById('display-team-a').textContent = teamNames.a;
    document.getElementById('display-team-b').textContent = teamNames.b;
    document.getElementById('score-a').textContent = scores.a;
}

function checkWin() {
    if (document.querySelectorAll('.correct').length === 81) {
        showModal(`فوز ساحق لـ ${teamNames.a}!`, "تم إكمال جميع التحديات بنجاح.");
    }
}

function showModal(title, msg) {
    document.getElementById('overlay').classList.remove('hidden');
    document.getElementById('result-title').textContent = title;
    document.getElementById('result-body').textContent = msg;
}

// العودة والبدء من جديد
document.getElementById('new-round-btn').onclick = () => location.reload();
document.getElementById('back-to-menu-btn').onclick = () => location.reload();
