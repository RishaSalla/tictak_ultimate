/**
 * MATH MATRIX ENGINE v2.0
 * Includes: Security Layer, Config Loader, Game State
 */

const App = {
    config: null,
    
    // 1. التشغيل المبدئي (البوابة)
    init: async function() {
        console.log("System Booting...");
        
        // محاولة تحميل ملف الإعدادات
        try {
            const response = await fetch('config.json');
            this.config = await response.json();
            console.log("Config Loaded.");
            
            // تفعيل زر الدخول
            this.setupLoginEvents();
            
        } catch (error) {
            console.error("Critical Error: Config missing!", error);
            document.getElementById('login-msg').textContent = "SYSTEM ERROR: CONFIG NOT FOUND";
        }
    },

    // 2. إعداد أحداث الدخول
    setupLoginEvents: function() {
        const btn = document.getElementById('btn-verify');
        const input = document.getElementById('access-code');

        // عند الضغط على الزر
        btn.onclick = () => this.verifyAccess();

        // عند ضغط Enter
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.verifyAccess();
        });
    },

    // 3. التحقق من الكود
    verifyAccess: function() {
        const input = document.getElementById('access-code');
        const msg = document.getElementById('login-msg');
        const userCode = input.value;

        // تأثير "جاري التحقق"
        msg.style.color = "#00C9FF";
        msg.textContent = "VERIFYING...";

        setTimeout(() => {
            if (userCode === this.config.accessCode) {
                // نجاح الدخول
                this.grantAccess();
            } else {
                // فشل الدخول
                this.denyAccess(msg, input);
            }
        }, 800); // تأخير بسيط لمحاكاة المعالجة
    },

    // 4. منح الصلاحية (الانتقال للعبة)
    grantAccess: function() {
        const gate = document.getElementById('login-gate');
        const content = document.getElementById('app-content');

        // إخفاء البوابة بتأثير تلاشي
        gate.style.transition = "opacity 1s ease";
        gate.style.opacity = "0";
        
        setTimeout(() => {
            gate.classList.add('hidden');
            content.classList.remove('hidden');
            // هنا سنستدعي دالة بناء اللعبة لاحقاً
            console.log("Access Granted. Welcome to Math Matrix.");
            // Game.start();  <-- سنفعلها في المرحلة القادمة
        }, 1000);
    },

    // 5. رفض الصلاحية (تأثير الخطأ)
    denyAccess: function(msgElem, inputElem) {
        msgElem.style.color = "#FF4D4D";
        msgElem.textContent = "ACCESS DENIED: INVALID CODE";
        
        // اهتزاز الحقل (CSS Animation Trigger)
        inputElem.style.border = "2px solid #FF4D4D";
        setTimeout(() => inputElem.style.border = "none", 500);
    }
};

// تشغيل النظام عند اكتمال تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
// متغير لتخزين المستوى المختار
let selectedLevelId = null;

function selectLevel(lvlId, cardElement) {
    // 1. إزالة التحديد عن الجميع
    document.querySelectorAll('.plasma-card').forEach(c => c.classList.remove('active-card'));
    
    // 2. تحديد البطاقة الجديدة
    cardElement.classList.add('active-card');
    selectedLevelId = lvlId;
    
    // 3. إظهار زر البدء بصوت (تخيلي)
    const btn = document.getElementById('btn-start-game');
    btn.classList.remove('hidden');
    
    console.log("تم اختيار: " + lvlId);
}

// دالة بدء اللعبة (سنكمل برمجتها في الخطوة القادمة)
App.launchGame = function() {
    if(!selectedLevelId) return;
    console.log("جاري تجهيز ساحة المعركة للمستوى: " + selectedLevelId);
    // هنا سنقوم بإخفاء القائمة وإظهار لوحة اللعب
};
