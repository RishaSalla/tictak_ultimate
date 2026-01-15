/**
 * MATH MATRIX ENGINE v2.1
 * Includes: Security, Level Select, Battle Setup
 */

// متغير عام لحفظ المستوى المختار
let selectedLevelId = null;

// دالة اختيار المستوى (مربوطة بـ HTML)
function selectLevel(lvlId, cardElement) {
    // 1. إزالة التحديد عن الجميع
    document.querySelectorAll('.plasma-card').forEach(c => c.classList.remove('active-card'));
    
    // 2. تحديد البطاقة الجديدة
    cardElement.classList.add('active-card');
    selectedLevelId = lvlId;
    
    // 3. إظهار زر البدء
    const btn = document.getElementById('btn-start-game');
    if(btn) btn.classList.remove('hidden');
    
    console.log("Selected Level: " + lvlId);
}

const App = {
    config: null,
    
    // --- 1. التشغيل والتحقق ---
    init: async function() {
        console.log("System Booting...");
        try {
            // محاولة تحميل ملف الإعدادات (إن وجد) أو استخدام الافتراضي
            try {
                const response = await fetch('config.json');
                this.config = await response.json();
            } catch (e) {
                // إعدادات افتراضية في حال عدم وجود الملف لتجنب التوقف
                this.config = { accessCode: "00000000" }; 
            }
            
            this.setupLoginEvents();
        } catch (error) {
            console.error("Critical Error", error);
        }
    },

    setupLoginEvents: function() {
        const btn = document.getElementById('btn-verify');
        const input = document.getElementById('access-code');
        if(btn) btn.onclick = () => this.verifyAccess();
        if(input) input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.verifyAccess();
        });
    },

    verifyAccess: function() {
        const input = document.getElementById('access-code');
        const msg = document.getElementById('login-msg');
        const userCode = input.value;

        msg.style.color = "#00C9FF";
        msg.textContent = "VERIFYING...";

        setTimeout(() => {
            if (userCode === this.config.accessCode) {
                this.grantAccess();
            } else {
                this.denyAccess(msg, input);
            }
        }, 500);
    },

    grantAccess: function() {
        const gate = document.getElementById('login-gate');
        const content = document.getElementById('app-content');

        gate.style.transition = "opacity 0.5s ease";
        gate.style.opacity = "0";
        
        setTimeout(() => {
            gate.classList.add('hidden');
            content.classList.remove('hidden');
        }, 500);
    },

    denyAccess: function(msgElem, inputElem) {
        msgElem.style.color = "#FF4D4D";
        msgElem.textContent = "ACCESS DENIED";
        inputElem.style.border = "1px solid #FF4D4D";
    },

    // --- 2. إدارة نافذة التجهيز (الجزء الذي كان ناقصاً) ---
    
    launchGame: function() {
        // هذه الدالة تستدعى عند ضغط "بدء المهمة"
        if(!selectedLevelId) return;
        
        // إظهار نافذة إعداد اللاعبين
        const setupModal = document.getElementById('battle-setup');
        if(setupModal) {
            setupModal.classList.remove('hidden');
            console.log("Battle Setup Opened");
        } else {
            console.error("Error: Setup Modal not found in HTML");
        }
    },

    hideSetup: function() {
        // إغلاق النافذة (تراجع)
        document.getElementById('battle-setup').classList.add('hidden');
    },

    // 3. بدء المعركة وبناء اللوحة
    startMatch: function() {
        const p1 = document.getElementById('p1-name').value || "اللاعب 1";
        const p2 = document.getElementById('p2-name').value || "اللاعب 2";
        
        // إخفاء كل شيء قديم
        this.hideSetup();
        document.querySelector('.levels-grid').classList.add('hidden');
        document.querySelector('.game-header').classList.add('hidden');
        document.querySelector('.action-area').classList.add('hidden');
        
        // إظهار ساحة اللعب
        const arena = document.getElementById('game-arena');
        arena.classList.remove('hidden');
        
        // بناء الـ 81 مربع
        this.buildBoard();
        
        console.log(`Battle Started: ${p1} VS ${p2}`);
    },

    // بناء الشبكة 9x9
    buildBoard: function() {
        const arena = document.getElementById('game-arena');
        arena.innerHTML = ''; // تنظيف

        // إنشاء 9 مربعات كبيرة (Sub-grids)
        for(let i=0; i<9; i++) {
            const subGrid = document.createElement('div');
            subGrid.className = 'sub-grid';
            subGrid.id = `grid-${i}`;
            
            // داخل كل مربع كبير، إنشاء 9 مربعات صغيرة (Cells)
            for(let j=0; j<9; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.grid = i; // رقم المربع الكبير
                cell.dataset.cell = j; // رقم الخلية
                
                // حدث النقر: فتح الحاسبة
                cell.onclick = () => this.openCalculator(cell);
                
                subGrid.appendChild(cell);
            }
            arena.appendChild(subGrid);
        }
    },

    // --- منطق الحاسبة ---
    
    currentActiveCell: null, // لتذكر الخلية التي ضغطنا عليها
    currentInput: "", // لتخزين الأرقام المدخلة

    openCalculator: function(cell) {
        // إذا الخلية ملعوبة مسبقاً، لا تفعل شيئاً
        if(cell.classList.contains('x-marked') || cell.classList.contains('o-marked')) return;

        this.currentActiveCell = cell;
        this.currentInput = "";
        
        // توليد سؤال عشوائي (مؤقتاً حتى نربط ملف JSON)
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        this.currentAnswer = num1 * num2; // الإجابة الصحيحة
        
        // تحديث الواجهة
        document.getElementById('calc-question').textContent = `${num1} × ${num2} = ?`;
        document.getElementById('calc-input').textContent = "_";
        document.getElementById('math-modal').classList.remove('hidden');
    },

    typeNum: function(num) {
        if(this.currentInput.length < 3) {
            this.currentInput += num;
            document.getElementById('calc-input').textContent = this.currentInput;
        }
    },

    clearCalc: function() {
        this.currentInput = "";
        document.getElementById('calc-input').textContent = "_";
    },

    submitAnswer: function() {
        if(parseInt(this.currentInput) === this.currentAnswer) {
            // إجابة صحيحة!
            this.markCell(this.currentActiveCell, 'X'); // مؤقتاً X دائماً، سنعدلها للتبديل لاحقاً
            document.getElementById('math-modal').classList.add('hidden');
        } else {
            // إجابة خاطئة
            const screen = document.querySelector('.calc-screen');
            screen.style.borderColor = "red";
            setTimeout(() => screen.style.borderColor = "rgba(255,255,255,0.1)", 500);
            this.clearCalc();
        }
    },

    markCell: function(cell, player) {
        cell.classList.add(player === 'X' ? 'x-marked' : 'o-marked');
        cell.textContent = player;
    }
};

// ... (تأكد من وجود مستمع الحدث DOMContentLoaded في النهاية)
