/**
 * 🧠 MATH ENGINE - DYNAMIC GENERATOR
 * مولد المسائل الرياضية الذكي للأطوار الأربعة
 */

export const MathGenerator = {
    // إعدادات التحكم
    settings: {
        numbers: [2, 3, 4, 5, 6, 7, 8, 9],
        rareNum: 1,
        rareChance: 0.1 // 10% لظهور الرقم 1
    },

    // جلب رقم عشوائي بناءً على الشروط
    getRandomNum() {
        if (Math.random() < this.settings.rareChance) return this.settings.rareNum;
        return this.settings.numbers[Math.floor(Math.random() * this.settings.numbers.length)];
    },

    // مولد طور المواجهة (A + B = ?)
    generateClash() {
        const a = this.getRandomNum();
        const b = this.getRandomNum();
        const op = Math.random() > 0.5 ? '+' : '-';
        
        // ضمان عدم وجود ناتج سالب في الطرح
        if (op === '-' && a < b) return this.generateClash();
        
        return {
            q: `${a} ${op} ${b} = ؟`,
            a: op === '+' ? a + b : a - b
        };
    },

    // مولد طور المجهول (A + ? = C)
    generateVoid() {
        const a = this.getRandomNum();
        const target = this.getRandomNum(); // المجهول يجب أن يكون 1-9
        const op = Math.random() > 0.5 ? '+' : '-';
        
        let c;
        if (op === '+') {
            c = a + target;
        } else {
            // في الطرح: C = A - target، ويجب أن يكون A > target
            if (a <= target) return this.generateVoid();
            c = a - target;
        }

        return {
            q: `${a} ${op} ؟ = ${c}`,
            a: target
        };
    },

    // مولد طور الميزان (A + B = C + ?)
    generateBalance() {
        const a = this.getRandomNum();
        const b = this.getRandomNum();
        const sum = a + b; // الناتج الذي يجب أن يتساوى فيه الطرفان

        const c = this.getRandomNum();
        const target = sum - c; // المجهول المطلوب

        // شرط: يجب أن يكون المجهول بين 1-9 وصحيحاً
        if (target < 1 || target > 9) return this.generateBalance();

        return {
            q: `${a} + ${b} = ${c} + ؟`,
            a: target
        };
    },

    // مولد طور الثنائيات (? + ? = C)
    generateDuality() {
        // نختار ناتجاً يقبل القسمة على أرقام بين 1-9 (مثلاً 12)
        const a = this.getRandomNum();
        const b = this.getRandomNum();
        const sum = a + b;

        return {
            q: `؟ + ؟ = ${sum}`,
            a: [a, b], // سنعدل المنطق في app.js ليقبل أي رقمين ناتجهما sum
            targetSum: sum,
            isDuality: true
        };
    },

    // الوظيفة الرئيسية لجلب سؤال حسب النمط
    getQuestion(mode) {
        switch(mode) {
            case 'clash': return this.generateClash();
            case 'void': return this.generateVoid();
            case 'balance': return this.generateBalance();
            case 'duality': return this.generateDuality();
            default: return null;
        }
    }
};

/**
 * بنك النصوص الثابتة للتعليمات الشاملة
 */
export const HelpData = {
    login: "أدخل الرمز السري المكون من 4 أرقام للوصول إلى أنظمة التحكم. الرمز الافتراضي هو 0000.",
    setup: "هنا يمكنك تسمية الفرق واختيار الرمز (X أو O). يمكنك أيضاً إضافة أسماء أعضاء الفريق لتدوير الأدوار بينهم تلقائياً.",
    modes: `
        - كلاسيك: لعب حر بدون مسائل.
        - المواجهة: حل ناتج العملية الحسابية.
        - المجهول: أوجد الرقم الناقص في المعادلة.
        - الميزان: اجعل كفة اليمين تساوي كفة اليسار.
        - الثنائيات: أدخل أي رقمين ناتجهما يساوي الرقم المعروض.
    `,
    game: "مكان لعبك في المربع الصغير يحدد المربع الكبير الذي سيلعب فيه خصمك تالياً. استخدم القوى الخاصة لتغيير مجرى اللعبة!"
};
