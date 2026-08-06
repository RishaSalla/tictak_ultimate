/**
 * 💾 DATA MODULE (DYNAMIC MATH ENGINE)
 * محرك ذكي لتوليد الأسئلة بناءً على النطاق والعمليات المحددة ديناميكياً
 */

export const MathGenerator = {
    rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },

    // المحرك الآن يستقبل config (يحتوي على min, max ومصفوفة العمليات)
    getQuestion(mode, config = null) {
        // إعدادات افتراضية كحماية (Fallback) في حال تأخر تحميل الإعدادات
        if (!config) {
            config = { min: 1, max: 12, ops: ['+'] };
        }

        let min = parseInt(config.min) || 1;
        let max = parseInt(config.max) || 12;
        
        // تصحيح النطاق آلياً إذا أدخل اللاعب الحد الأدنى أكبر من الأقصى بالخطأ
        if (min > max) [min, max] = [max, min]; 

        // اختيار عملية عشوائية من العمليات التي حددها اللاعب
        let op = '+';
        if (config.ops && config.ops.length > 0) {
            op = config.ops[Math.floor(Math.random() * config.ops.length)];
        }

        // دالة داخلية لتوليد معادلة نظيفة ومفلترة (بدون سوالب وبدون كسور)
        const genEquation = (operation, minVal, maxVal) => {
            let n1 = this.rand(minVal, maxVal);
            let n2 = this.rand(minVal, maxVal);
            let res = 0;
            let opStr = '';

            switch(operation) {
                case '+':
                    res = n1 + n2; 
                    opStr = '+'; 
                    break;
                case '-':
                    // فلتر الطرح: ضمان أن الرقم الأول هو الأكبر لمنع الناتج السالب
                    if (n2 > n1) [n1, n2] = [n2, n1];
                    res = n1 - n2; 
                    opStr = '-'; 
                    break;
                case '*':
                    res = n1 * n2; 
                    opStr = '×'; 
                    break;
                case '/':
                    // فلتر القسمة (الضرب العكسي): ضمان ناتج بدون كسور
                    res = n1; // نعتبر n1 هو الناتج النظيف المرغوب
                    n1 = res * n2; // نضرب لإنتاج الرقم الكبير الذي سيتم قسمته
                    opStr = '÷'; 
                    break;
            }
            return { n1, n2, res, opStr, operation };
        };

        let eq = genEquation(op, min, max);
        let q = {};

        switch (mode) {
            case 'clash': // المواجهة: معادلة مباشرة
                q = { q: `${eq.n1} ${eq.opStr} ${eq.n2} = ?`, a: eq.res };
                break;

            case 'void': // المجهول: إيجاد الطرف الناقص
                q = { q: `${eq.n1} ${eq.opStr} ? = ${eq.res}`, a: eq.n2 };
                break;

            case 'balance': // الميزان: موازنة كفتين
                // الكفة اليسرى هي ناتج المعادلة الأساسية الديناميكية
                let leftRes = eq.res;
                
                // الكفة اليمنى تعتمد دائماً على الجمع (لضمان إمكانية الحل الذهني وعدم التعقيد)
                // نختار رقم (C) يكون أصغر من أو يساوي ناتج الكفة اليسرى
                let c = this.rand(0, leftRes);
                let missing = leftRes - c;
                
                q = { q: `${eq.n1} ${eq.opStr} ${eq.n2} = ${c} + ?`, a: missing };
                break;

            case 'duality': // الثنائيات: أدخل رقمين يحققان الهدف
                q = { 
                    q: `x ${eq.opStr} y = ${eq.res}`, 
                    targetSum: eq.res, 
                    isDuality: true,
                    dualityOp: eq.operation // نرسل نوع العملية الفعلي لـ app.js ليتحقق منها
                };
                break;
                
            default:
                return null;
        }
        return q;
    }
};

export const HelpData = {
    rules: `
    <h3>📜 القواعد الأساسية</h3>
    <p>1. <b>الهدف:</b> سيطر على 3 مربعات كبيرة متتالية للفوز بالمباراة.</p>
    <p>2. <b>نظام الحركة:</b> مكانك في المربع الصغير يحدد أين سيلعب خصمك.</p>
    <p>3. <b>السيطرة:</b> فز بـ 3 خانات صغيرة متتالية لتظفر بالمربع الكبير.</p>
    <p>4. <b>الطريق المسدود:</b> إذا أرسلك الخصم لمربع ممتلئ، العب أينما شئت.</p>
    `,
    math: `
    <h3>🧮 بروتوكولات التحدي</h3>
    <ul>
        <li><b>المواجهة (Clash):</b> حل المعادلة المباشرة لتثبيت رمزك.</li>
        <li><b>المجهول (Void):</b> جد الرقم المفقود لإكمال المعادلة.</li>
        <li><b>الميزان (Balance):</b> وازن الكفتين (اليمين = اليسار).</li>
        <li><b>الثنائيات (Duality):</b> أدخل رقمين يحققان المعادلة والهدف المطلوب.</li>
    </ul>
    `,
    powers: `
    <h3>⚡ الترسانة الخاصة</h3>
    <p>تستخدم مرة واحدة لكل فريق:</p>
    <ul>
        <li><b>☢️ النووي (Nuke):</b> يمحو محتويات مربع صغير بالكامل.</li>
        <li><b>❄️ التجميد (Freeze):</b> يمنع اللعب في مربع محدد لدور واحد.</li>
        <li><b>👾 الهاك (Hack):</b> يقلب رمز الخصم لصالحك ويشوش النظام.</li>
    </ul>
    `
};
