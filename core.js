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

    startMatch: function() {
        // عند ضغط "اشتباك"
        const p1 = document.getElementById('p1-name').value || "اللاعب 1";
        const p2 = document.getElementById('p2-name').value || "اللاعب 2";
        
        console.log(`Starting Match: ${p1} VS ${p2} on ${selectedLevelId}`);
        
        // إخفاء نافذة الإعداد
        this.hideSetup();
        
        // إخفاء واجهة المستويات (استعداداً لظهور اللعبة لاحقاً)
        document.querySelector('.levels-grid').classList.add('hidden');
        document.querySelector('.game-header').classList.add('hidden');
        document.querySelector('.action-area').classList.add('hidden');
        
        // رسالة مؤقتة للتأكد من الوصول لهذه المرحلة
        const content = document.getElementById('app-content');
        const tempMsg = document.createElement('h2');
        tempMsg.style.textAlign = 'center';
        tempMsg.style.marginTop = '50px';
        tempMsg.style.color = '#00f3ff';
        tempMsg.innerHTML = `جاري تحميل ساحة المعركة...<br>${p1} <span style="color:#fff">VS</span> ${p2}`;
        content.appendChild(tempMsg);
    }
};

// تشغيل النظام
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
