/**
 * LEVEL 4 LOGIC - THE PROFESSIONAL (الميزان)
 * يعتمد نظام التوزيع النسبي (90/10) والتحديات المركبة
 */

const Level4Processor = {
    // 1. معالجة البيانات من JSON بناءً على النسب المئوية
    prepareData: function(pool) {
        const strict = [...pool.strict_challenges_90_percent];
        const ones = [...pool.ones_group_10_percent];
        
        // دمج المجموعتين وخلطهما عشوائياً لضمان التوزيع العادل
        return [...strict, ...ones].sort(() => Math.random() - 0.5);
    },

    // 2. واجهة الحاسبة (العودة لخانة واحدة ولكن بتنسيق احترافي)
    renderUI: function(item) {
        // تحويل رموز العمليات للعرض الصحيح (× و ÷)
        const displayQ = item.q.replace(/\*/g, '×').replace(/\//g, '÷');
        return {
            questionHtml: `
                <div class="q-header">تحدي الميزان:</div>
                <div class="q-text pro-font">${displayQ}</div>
            `,
            requiredSlots: 1, // العودة لنظام الإدخال الواحد
            placeholder: "?"
        };
    },

    // 3. التحقق من صحة الإجابة
    verify: function(item, inputs) {
        const userAnswer = parseInt(inputs[0]);
        // الإجابة الصحيحة موجودة في مفتاح 'a'
        return userAnswer === item.a;
    }
};

// تصدير المنطق للمحرك الأساسي
window.Level4Processor = Level4Processor;
