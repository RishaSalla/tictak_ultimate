/**
 * CORE JS - Scalability & UI Logic
 */

// وظيفة التحجيم الديناميكي (Dynamic Scaling)
function resizeBoard() {
    const container = document.getElementById('game-container');
    if (!container) return;

    const screenWidth = window.innerWidth * 0.95; // 95% من العرض
    const screenHeight = window.innerHeight * 0.80; // 80% من الارتفاع (لترك مساحة للـ HUD)
    
    const boardWidth = 500; // العرض الطبيعي للوحة (تقريبي)
    const boardHeight = 600; // الارتفاع الطبيعي للوحة (تقريبي)

    // حساب نسبة التحجيم الأنسب (الاصغر بين الطول والعرض)
    const scale = Math.min(screenWidth / boardWidth, screenHeight / boardHeight, 1);
    
    container.style.transform = `scale(${scale})`;
}

// استدعاء التحجيم عند تغيير حجم النافذة أو تدوير الجوال
window.addEventListener('resize', resizeBoard);
window.addEventListener('orientationchange', () => {
    setTimeout(resizeBoard, 200); // تأخير بسيط لضمان تحديث الـ viewport
});

// تهيئة اللعبة عند التشغيل
document.addEventListener('DOMContentLoaded', () => {
    // منطق التبديل بين شاشات التطبيق
    const startBtn = document.getElementById('start-game');
    if(startBtn) {
        startBtn.onclick = () => {
            document.getElementById('setup-screen').classList.add('hidden');
            document.getElementById('game-screen').classList.remove('hidden');
            resizeBoard(); // تحجيم اللوحة فور ظهورها
        };
    }
});
