/**
 * LEVEL 3 LOGIC - THE PAIRS (المزدوج)
 * متخصص في التحقق من أزواج الأرقام بناءً على مصفوفة ثابتة
 */

const Level3Processor = {
    // 1. معالجة البيانات من JSON
    prepareData: function(pool) {
        // نركز على مصفوفة التحديات الصارمة من 2 إلى 9
        const items = [...pool.strict_challenges_2_to_9];
        return items.sort(() => Math.random() - 0.5);
    },

    // 2. واجهة الحاسبة (تفعيل خانتين للمزدوج)
    renderUI: function(item) {
        return {
            questionHtml: `
                <div class="q-label">أوجد رقمين ناتجهما:</div>
                <div class="q-target">${item.target}</div>
            `,
            requiredSlots: 2, // يتطلب رقمين (الزوج)
            placeholders: ["?", "?"]
        };
    },

    // 3. التحقق من صحة الإجابة (البحث في مصفوفة Pairs)
    verify: function(item, inputs) {
        const val1 = parseInt(inputs[0]);
        const val2 = parseInt(inputs[1]);
        
        if (isNaN(val1) || isNaN(val2)) return false;

        // البحث داخل مصفوفة الأزواج المسموح بها في ملف الـ JSON
        // نتحقق من الزوج بغض النظر عن الترتيب (2*3 هي نفسها 3*2)
        return item.pairs.some(pair => {
            return (pair[0] === val1 && pair[1] === val2) || 
                   (pair[0] === val2 && pair[1] === val1);
        });
    }
};

// تصدير المنطق للمحرك الأساسي
window.Level3Processor = Level3Processor;
