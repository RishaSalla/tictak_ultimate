// بيانات اللاعبين والفرق (يتم ملؤها من شاشة الإعداد)
let gameMode = ''; // 'PVP' (Human vs Human) or 'PVA' (Human vs AI)
let teamXName = '';
let teamOName = '';
let teamXPlayers = []; // مصفوفة بأسماء لاعبي X
let teamOPlayers = []; // مصفوفة بأسماء لاعبي O
let difficulty = ''; // لنمط PVA

// متغيرات تتبع حالة اللعب
let currentTeam = 'X'; // من يبدأ الدور: 'X'
let playerIndexX = 0; // مؤشر اللاعب الحالي في فريق X
let playerIndexO = 0; // مؤشر اللاعب الحالي في فريق O

// متغيرات حالة اللوحة
// لوحة 9x9 لتمثيل جميع الحركات الممكنة
let gameBoard = Array(9).fill(null).map(() => Array(9).fill(null)); 
// لوحة 3x3 لتمثيل الفائز في كل لوحة محلية (null, 'X', 'O', or 'Tie')
let metaBoard = Array(9).fill(null); 
let activeLocalBoard = null; // يمثل فهرس اللوحة المحلية المسموح اللعب فيها (0-8)، null يعني أي لوحة
document.addEventListener('DOMContentLoaded', () => {
    // الحصول على عناصر DOM
    const modeRadios = document.querySelectorAll('input[name="gameMode"]');
    const teamSetupDiv = document.getElementById('team-setup');
    const aiSetupDiv = document.getElementById('ai-setup');
    const startGameButton = document.getElementById('startGameButton');
    
    // مُستمع أحداث لاختيار نمط اللعب
    modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const mode = e.target.value;
            gameMode = mode;
            
            // إظهار/إخفاء الأقسام حسب النمط المختار
            if (mode === 'PVP') {
                teamSetupDiv.style.display = 'block';
                aiSetupDiv.style.display = 'none';
                startGameButton.disabled = false; // تفعيل الزر بعد اختيار النمط
            } else if (mode === 'PVA') {
                teamSetupDiv.style.display = 'none';
                aiSetupDiv.style.display = 'block';
                startGameButton.disabled = false;
            }
        });
    });

    // مُستمع أحداث لزر بدء اللعبة
    startGameButton.addEventListener('click', startGame);

    // بناء اللوحة فور تحميل الصفحة
    createBoardElements();
});

// ------------------------------------------------------------------
// دالة بدء اللعبة الرئيسية
// ------------------------------------------------------------------
function startGame() {
    // 1. جمع البيانات من حقول الإدخال
    if (gameMode === 'PVP') {
        teamXName = document.getElementById('teamXName').value || 'الفريق X';
        teamOName = document.getElementById('teamOName').value || 'الفريق O';
        
        // تحويل سلاسل الأسماء إلى مصفوفات (مع تنظيف المسافات)
        const playersXString = document.getElementById('playersX').value;
        const playersOString = document.getElementById('playersO').value;
        
        teamXPlayers = playersXString.split(',').map(name => name.trim()).filter(name => name.length > 0);
        teamOPlayers = playersOString.split(',').map(name => name.trim()).filter(name => name.length > 0);

        // التحقق الأساسي: يجب أن يكون هناك لاعب واحد على الأقل في كل فريق
        if (teamXPlayers.length === 0 || teamOPlayers.length === 0) {
            alert('يجب إدخال اسم لاعب واحد على الأقل لكل فريق.');
            return;
        }

    } else if (gameMode === 'PVA') {
        // ... (سيتم تنفيذ منطق PVA لاحقًا)
        alert('نمط اللعب ضد الكمبيوتر قيد التطوير!');
        return; 
    } else {
        alert('الرجاء اختيار نمط اللعب.');
        return;
    }

    // 2. إخفاء شاشة الإعداد وإظهار شاشة اللعب
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    // 3. تحديث لوحة الحالة بالأسماء الجديدة
    updateStatusPanel();
}
// 4. بناء هيكل اللوحة (يتم استدعاؤها مرة واحدة عند تحميل الصفحة)
function createBoardElements() {
    const metaBoardDiv = document.getElementById('meta-board');
    
    // إنشاء 9 لوحات محلية (Local Boards)
    for (let localBoardIndex = 0; localBoardIndex < 9; localBoardIndex++) {
        const localBoardDiv = document.createElement('div');
        localBoardDiv.classList.add('local-board');
        localBoardDiv.dataset.board = localBoardIndex; // لتحديد اللوحة في المنطق
        
        // إنشاء 9 خلايا لعب داخل كل لوحة محلية
        for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
            const cellDiv = document.createElement('div');
            cellDiv.classList.add('cell');
            cellDiv.dataset.cell = cellIndex; // لتحديد الخلية في المنطق
            cellDiv.addEventListener('click', handleMove); // مُستمع أحداث للحركة
            localBoardDiv.appendChild(cellDiv);
        }

        metaBoardDiv.appendChild(localBoardDiv);
    }
}
// دالة التعامل مع حركة اللاعب
function handleMove(event) {
    // التأكد من أن اللعبة في وضع اللعب ضد لاعب آخر (PVP)
    if (gameMode !== 'PVP') return; 

    // 1. تحديد مكان الحركة
    const cellElement = event.target;
    const localBoardIndex = parseInt(cellElement.parentElement.dataset.board); // فهرس اللوحة المحلية (0-8)
    const cellIndex = parseInt(cellElement.dataset.cell); // فهرس الخلية داخل اللوحة (0-8)

    // 2. التحقق من صحة الحركة (القواعد الأساسية)
    
    // أ. هل الخلية ممتلئة بالفعل؟
    if (gameBoard[localBoardIndex][cellIndex] !== null) {
        // alert('هذه الخلية ممتلئة بالفعل!');
        return; 
    }

    // ب. هل اللوحة المحلية هي اللوحة النشطة المسموح اللعب فيها؟
    // إذا كانت activeLocalBoard = null، فمعناه 'Free Shot' أو بداية اللعبة، وكل اللوحات متاحة.
    if (activeLocalBoard !== null && activeLocalBoard !== localBoardIndex) {
        // alert('يجب أن تلعب في اللوحة النشطة المحددة فقط!');
        return;
    }

    // 3. تنفيذ الحركة (وضع علامة X أو O)
    const currentPlayerSymbol = currentTeam; // 'X' أو 'O'
    gameBoard[localBoardIndex][cellIndex] = currentPlayerSymbol;
    cellElement.textContent = currentPlayerSymbol; // عرض الرمز على الشاشة
    cellElement.classList.add(currentPlayerSymbol); // إضافة فئة لتنسيق الألوان

    // 4. تطبيق قاعدة Ultimate Tic-Tac-Toe لتحديد اللوحة النشطة التالية
    
    // اللوحة النشطة التالية تكون في الموقع المقابل لـ cellIndex الذي لعب فيه اللاعب.
    let nextLocalBoardIndex = cellIndex; 
    
    // التحقق من حالة اللوحة المستهدفة: هل تم الفوز بها أو هي ممتلئة (Tie)؟
    if (metaBoard[nextLocalBoardIndex] !== null) {
        // حالة "الإرسال الحر" (Free Shot): يتم تحرير اللعب لأي لوحة غير مكتملة.
        activeLocalBoard = null; 
        // عرض رسالة: 
        document.getElementById('game-message').textContent = 'اللوحة المستهدفة ممتلئة! يمكنك اللعب في أي لوحة أخرى.';
    } else {
        // الإرسال العادي: يتم توجيه اللاعب التالي للعب في اللوحة الجديدة.
        activeLocalBoard = nextLocalBoardIndex;
        document.getElementById('game-message').textContent = '';
    }

    // 5. التحقق من الفوز في اللوحة المحلية
    const localWinner = checkLocalWinner(localBoardIndex, currentPlayerSymbol);
    if (localWinner) {
        metaBoard[localBoardIndex] = localWinner; // تحديث اللوحة الكبرى بفوز الفريق
        markLocalBoardAsWon(localBoardIndex, localWinner); // تطبيق تأثير بصري على اللوحة التي تم الفوز بها
        
        // 6. التحقق من فوز اللوحة الكبرى (نهاية اللعبة)
        const overallWinner = checkOverallWinner(localWinner);
        if (overallWinner) {
            alert(`الفائز باللعبة هو ${overallWinner === 'X' ? teamXName : teamOName}!`);
            document.getElementById('game-message').textContent = `انتهت اللعبة! الفائز هو ${overallWinner === 'X' ? teamXName : teamOName}`;
            // (TODO: يجب إضافة دالة لإنهاء اللعبة ومنع المزيد من الحركات)
            return; 
        }
        
        // إذا فاز في لوحة صغيرة، يتم تحديث النقاط في لوحة الحالة
        updateStatusPanelScores();
    }

    // 7. تبديل اللاعب والدور (Rotation Logic)
    
    // أولاً: تحديث مؤشر اللاعب الذي انتهى دوره الآن
    if (currentTeam === 'X') {
        playerIndexX = (playerIndexX + 1) % teamXPlayers.length;
    } else {
        playerIndexO = (playerIndexO + 1) % teamOPlayers.length;
    }
    
    // ثانياً: تبديل الفريق للدور التالي
    currentTeam = (currentTeam === 'X') ? 'O' : 'X';
    
    // 8. تحديث العرض البصري للدور الجديد واللوحة النشطة
    updateStatusPanel(); // تحديث اسم اللاعب النشط والهايلايت
    updateActiveBoardHighlight(); // تطبيق الزوم الناعم والتعتيم
}
// دوال الفوز الممكنة (Rows, Columns, Diagonals)
const winningCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]            // Diagonals
];

// التحقق من فوز اللاعب الحالي (symbol) في اللوحة المحلية (boardIndex)
function checkLocalWinner(boardIndex, symbol) {
    const localBoard = gameBoard[boardIndex];
    
    for (const combo of winningCombos) {
        const [a, b, c] = combo;
        // التحقق مما إذا كانت جميع الخلايا الثلاث تنتمي لنفس الرمز
        if (localBoard[a] === symbol && localBoard[b] === symbol && localBoard[c] === symbol) {
            return symbol; // وجد الفائز
        }
    }
    
    // التحقق من حالة التعادل (Tie)
    if (!localBoard.includes(null)) {
        return 'Tie';
    }

    return null; // لا يوجد فائز بعد
}

// التحقق من الفوز في اللوحة الكبرى (Meta-Board)
function checkOverallWinner(symbol) {
    for (const combo of winningCombos) {
        const [a, b, c] = combo;
        // التحقق مما إذا كانت اللوحات الثلاث فاز بها نفس الرمز
        if (metaBoard[a] === symbol && metaBoard[b] === symbol && metaBoard[c] === symbol) {
            return symbol; // وجد الفائز
        }
    }
    return null;
}
// تحديث النقاط في لوحة الحالة
function updateStatusPanelScores() {
    let scoreX = metaBoard.filter(winner => winner === 'X').length;
    let scoreO = metaBoard.filter(winner => winner === 'O').length;
    
    document.getElementById('teamXScore').textContent = scoreX;
    document.getElementById('teamOScore').textContent = scoreO;
}

// تطبيق تأثير بصري على اللوحة التي تم الفوز بها (مثل خط كبير X أو O)
function markLocalBoardAsWon(boardIndex, winner) {
    const localBoardDiv = document.querySelector(`[data-board="${boardIndex}"]`);
    localBoardDiv.classList.add('won', winner);
    
    // عرض علامة الفائز على اللوحة الكبرى (لتغطية الخلايا الصغيرة)
    const winnerOverlay = document.createElement('div');
    winnerOverlay.classList.add('winner-overlay');
    winnerOverlay.textContent = winner;
    localBoardDiv.appendChild(winnerOverlay);
}

// تطبيق 'الزوم الناعم' والتعتيم
function updateActiveBoardHighlight() {
    const localBoards = document.querySelectorAll('.local-board');
    
    localBoards.forEach(board => {
        const boardIndex = parseInt(board.dataset.board);
        
        // إزالة فئة التنشيط من جميع اللوحات أولاً
        board.classList.remove('active');
        
        // إذا كانت اللوحة ممتلئة (تم الفوز بها أو تعادلت)، لا يمكن تفعيلها
        if (metaBoard[boardIndex] !== null) {
            board.classList.add('disabled-board'); // يمكننا إضافة تنسيق لتمييز اللوحات المكتملة
            return;
        }

        // تطبيق فئة التنشيط على اللوحة الصحيحة (activeLocalBoard)
        if (activeLocalBoard === null || activeLocalBoard === boardIndex) {
            board.classList.add('active'); // هذا يطبق الإطار والتكبير الطفيف
        } else {
            board.classList.remove('active');
        }
    });
}
