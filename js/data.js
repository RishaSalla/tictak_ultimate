/**
 * 💾 DATA MODULE (DYNAMIC MATH ENGINE & GAME MANUAL)
 * محرك التوليد بنظام "الكوتشينة" (Deck) لمنع التكرار + الدليل الشامل
 */

export const MathGenerator = {
    rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    
    // ذاكرة الأسئلة (حزمة الكوتشينة)
    deck: [],

    // بناء حزمة الأسئلة وخلطها بناءً على النطاق والعمليات المحددة
    buildDeck(config) {
        this.deck = [];
        let min = parseInt(config.min) || 1;
        let max = parseInt(config.max) || 12;
        if (min > max) [min, max] = [max, min]; 

        let ops = (config.ops && config.ops.length > 0) ? config.ops : ['+'];

        // توليد كل الاحتمالات الممكنة وإضافتها للحزمة
        for (let op of ops) {
            for (let n1 = min; n1 <= max; n1++) {
                for (let n2 = min; n2 <= max; n2++) {
                    let res = 0;
                    let opStr = '';
                    let finalN1 = n1;
                    let finalN2 = n2;

                    switch(op) {
                        case '+':
                            res = finalN1 + finalN2; 
                            opStr = '+'; 
                            break;
                        case '-':
                            if (finalN2 > finalN1) [finalN1, finalN2] = [finalN2, finalN1];
                            res = finalN1 - finalN2; 
                            opStr = '-'; 
                            break;
                        case '*':
                            res = finalN1 * finalN2; 
                            opStr = '×'; 
                            break;
                        case '/':
                            res = finalN1; 
                            finalN1 = res * finalN2; 
                            opStr = '÷'; 
                            break;
                    }

                    // للتأكد من عدم تكرار (6+10) و (10+6) في نفس الحزمة في حالتي الجمع والضرب
                    let isDuplicate = false;
                    if (op === '+' || op === '*') {
                        isDuplicate = this.deck.some(card => 
                            card.op === op && card.n1 === finalN2 && card.n2 === finalN1
                        );
                    }

                    if (!isDuplicate) {
                        this.deck.push({ n1: finalN1, n2: finalN2, res, opStr, operation: op });
                    }
                }
            }
        }

        // خلط الحزمة (Fisher-Yates Shuffle)
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
        
        console.log(`[Math Engine] تم بناء وخلط حزمة من ${this.deck.length} سؤال.`);
    },

    getQuestion(mode, config = null) {
        if (!config) config = { min: 1, max: 12, ops: ['+'] };

        // إذا كانت الحزمة فارغة، قم ببنائها وخلطها
        if (this.deck.length === 0) {
            this.buildDeck(config);
        }

        // سحب كرت من الحزمة (وحذفه منها لضمان عدم التكرار)
        let eq = this.deck.pop();
        let q = {};

        switch (mode) {
            case 'clash':
                q = { q: `${eq.n1} ${eq.opStr} ${eq.n2} = ?`, a: eq.res };
                break;

            case 'void':
                q = { q: `${eq.n1} ${eq.opStr} ? = ${eq.res}`, a: eq.n2 };
                break;

            case 'balance':
                let leftRes = eq.res;
                let c = this.rand(0, leftRes);
                let missing = leftRes - c;
                q = { q: `${eq.n1} ${eq.opStr} ${eq.n2} = ${c} + ?`, a: missing };
                break;

            case 'duality':
                q = { 
                    q: `x ${eq.opStr} y = ${eq.res}`, 
                    targetSum: eq.res, 
                    isDuality: true,
                    dualityOp: eq.operation
                };
                break;
                
            default: return null;
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
