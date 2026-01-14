/**
 * LEVEL 2 LOGIC - THE UNKNOWNS
 * متخصص في إيجاد الرقمين المفقودين: ? (+/-) ? = Target
 */

const Level2Processor = {
    // 1. معالجة البيانات من JSON
    prepareData: function(pool) {
        // دمج عمليات الجمع والطرح المجهولة
        const combined = [
            ...pool.addition_unknowns, 
            ...pool.subtraction_unknowns
        ];
        return combined.sort(() => Math.random() - 0.5);
    },

    // 2. تحديد شكل الواجهة (تفعيل الخانتين)
    renderUI: function(item) {
        // عرض العملية مع المربعات الفارغة للناتج المستهدف
        const displayOp = item.op === '+' ? '+' : '-';
        return {
            questionHtml: `<div class="q-text">? ${displayOp} ? = ${item.target}</div>`,
            requiredSlots: 2, // هنا نطلب خانتين إجبارياً
            placeholders: ["?", "?"]
        };
    },

    // 3. التحقق من صحة الإجابة (المنطق الرياضي)
    verify: function(item, inputs) {
        const val1 = parseInt(inputs[0]);
        const val2 = parseInt(inputs[1]);
        
        if (isNaN(val1) || isNaN(val2)) return false;

        // التحقق بناءً على نوع العملية المخزنة في op
        if (item.op === '+') {
            return (val1 + val2) === item.target;
        } else if (item.op === '-') {
            return (val1 - val2) === item.target;
        }
        return false;
    }
};

// تصدير المنطق للمحرك الأساسي
window.Level2Processor = Level2Processor;
