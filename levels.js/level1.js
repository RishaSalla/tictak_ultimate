/**
 * LEVEL 1 LOGIC - THE CLASSIC
 * متخصص في العمليات المباشرة (أ × ب) أو (أ ÷ ب)
 */

const Level1Processor = {
    // 1. معالجة البيانات القادمة من JSON
    prepareData: function(pool) {
        // دمج المجموعات المتاحة في ملف المستوى الأول
        const combined = [
            ...pool.ones_group.slice(0, 10), // نأخذ عينة من العمليات السهلة
            ...pool.core_challenges           // ندمجها مع التحديات الأساسية
        ];
        // خلط العمليات عشوائياً لضمان عدم التكرار
        return combined.sort(() => Math.random() - 0.5);
    },

    // 2. تحديد شكل الواجهة داخل الحاسبة لهذا المستوى
    renderUI: function(item) {
        const displayQ = item.q.replace(/\*/g, '×').replace(/\//g, '÷'); // تصحيح الرموز رياضياً
        return {
            questionHtml: `<div class="q-text">${displayQ}</div>`,
            requiredSlots: 1, // المستوى الأول يتطلب خانة إدخال واحدة فقط
            placeholder: "?"
        };
    },

    // 3. التحقق من صحة الإجابة
    verify: function(item, inputs) {
        const userAnswer = parseInt(inputs[0]);
        const correctAnswer = item.a; // الإجابة الصحيحة مخزنة في مفتاح 'a'
        return userAnswer === correctAnswer;
    }
};

// تصدير المنطق ليكون متاحاً للمحرك الأساسي core.js
window.Level1Processor = Level1Processor;
