/**
 * 💾 DATA MODULE (DYNAMIC MATH ENGINE & GAME MANUAL)
 * محرك توليد الأسئلة + الدليل الشامل والحديث لقوانين اللعبة
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
    <div style="text-align: right; line-height: 1.8;">
        <h3 style="color: var(--p1-color); border-bottom: 1px solid #333; padding-bottom: 5px;">📜 القواعد ونظام النقاط</h3>
        <p>1. <b>الهدف الرئيسي (الضربة القاضية):</b> سيطر على 3 مربعات كبيرة متتالية للفوز فوراً بالمباراة.</p>
        <p>2. <b>نظام التوجيه:</b> مكان لعبك للرمز (X أو O) في المربع الصغير يُحدد أين يُجبر خصمك على اللعب في النقلة القادمة.</p>
        <p>3. <b>النقاط والتعادل:</b> إذا امتلأت الساحة (81 خانة) دون فائز بالضربة القاضية، تتوقف اللعبة ويتم <b>الاحتكام للنقاط</b> لتحديد الفائز بالسيطرة.</p>
        <p style="color: #aaa; font-size: 0.9rem;">(الفوز بمربع صغير: +100 نقطة | استخدام قوة: -50 نقطة)</p>
        <p>4. <b>اللعب الحر:</b> إذا أرسلك الخصم لمربع مُمتلئ بالكامل أو محسوم نتيجته، يحق لك اللعب في أي خانة فارغة في الساحة.</p>
    </div>
    `,
    math: `
    <div style="text-align: right; line-height: 1.8;">
        <h3 style="color: var(--p1-color); border-bottom: 1px solid #333; padding-bottom: 5px;">🧮 بروتوكولات التحدي والعقاب</h3>
        <p>العب في الأطوار الرياضية لفتح تحدي الحاسبة. <b>تحذير: إدخال إجابة خاطئة يؤدي لخسارة النقلة وانتقال الدور فوراً للخصم!</b></p>
        <ul style="margin-top: 10px; padding-right: 20px;">
            <li><b>المواجهة (Clash):</b> حل المعادلة المباشرة لتثبيت رمزك.</li>
            <li><b>المجهول (Void):</b> جد الرقم المفقود لإكمال المعادلة.</li>
            <li><b>الميزان (Balance):</b> وازن الكفتين (اليمين = اليسار).</li>
            <li><b>الثنائيات (Duality):</b> أدخل رقمين من اختيارك يحققان المعادلة.</li>
        </ul>
    </div>
    `,
    powers: `
    <div style="text-align: right; line-height: 1.8;">
        <h3 style="color: var(--p1-color); border-bottom: 1px solid #333; padding-bottom: 5px;">⚡ الترسانة الاستراتيجية (تُستخدم مرة واحدة)</h3>
        <p style="margin-bottom: 10px;">استخدام أي قوة يستهلك النقلة ويخصم 50 نقطة من فريقك.</p>
        <ul style="padding-right: 20px;">
            <li style="margin-bottom: 8px;"><b>☢️ النووي (Nuke):</b> يمسح جميع رموز مربع صغير، ويُجبر الخصم على اللعب في هذا المربع المدمر لتضييع دوره.</li>
            <li style="margin-bottom: 8px;"><b>❄️ فخ التجميد (Freeze):</b> تختار مربعاً لتجميده. يستمر اللعب طبيعياً حتى يُجبر أحدهم على اللعب فيه.. فيقع في الفخ ويخسر دوره، ثم ينكسر الجليد ليعود الدور للمهاجم للعب في نفس المربع!</li>
            <li style="margin-bottom: 8px;"><b>👾 الهاك (Hack):</b> يكسر قيود التوجيه. تضيء الساحة بالكامل ويُسمح لك بسرقة أي رمز لخصمك وقلبه لصالحك فوراً.</li>
        </ul>
    </div>
    `
};
