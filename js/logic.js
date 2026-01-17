/**
 * 🧠 GAME LOGIC ENGINE
 * المسؤول عن قوانين اللعبة، الفوز، والحالات
 * لا يتعامل مع DOM إطلاقاً (فصل المهام)
 */

export const GameLogic = {
    // حالة اللعبة (The State)
    state: {
        grid: [],        // 9 مصفوفات فرعية (كل واحدة 9 خلايا)
        metaGrid: [],    // مصفوفة من 9 خانات (حالة المربعات الكبيرة)
        turn: 'X',       // دور من؟
        nextGrid: null,  // المربع الكبير المسموح اللعب فيه (null = حر)
        winner: null,    // الفائز باللعبة كاملة
        
        // بيانات اللاعبين
        p1: { symbol: 'X', score: 0, powers: { nuke: 1, freeze: 1, hack: 1 } },
        p2: { symbol: 'O', score: 0, powers: { nuke: 1, freeze: 1, hack: 1 } }
    },

    // 1. تهيئة اللعبة (Reset)
    init() {
        // بناء مصفوفة فارغة 9x9
        this.state.grid = Array(9).fill(null).map(() => Array(9).fill(null));
        this.state.metaGrid = Array(9).fill(null);
        this.state.turn = 'X';
        this.state.nextGrid = null;
        this.state.winner = null;
        
        // إعادة تعيين اللاعبين
        this.resetPlayer(this.state.p1);
        this.resetPlayer(this.state.p2);
    },

    resetPlayer(p) {
        p.score = 0;
        p.powers = { nuke: 1, freeze: 1, hack: 1 };
    },

    // 2. التحقق من صلاحية الحركة
    isValidMove(gIndex, cIndex) {
        const s = this.state;
        
        // هل اللعبة انتهت؟
        if (s.winner) return false;

        // هل المربع الكبير محسموم مسبقاً؟ (مغلق)
        if (s.metaGrid[gIndex] !== null) return false;

        // هل الخلية مشغولة؟
        if (s.grid[gIndex][cIndex] !== null) return false;

        // هل اللاعب مقيد بمربع معين؟
        // إذا كان nextGrid ليس null، يجب أن يلعب فيه
        if (s.nextGrid !== null && s.nextGrid !== gIndex) return false;

        return true;
    },

    // 3. تنفيذ الحركة (بعد التأكد من صحتها)
    makeMove(gIndex, cIndex) {
        const s = this.state;
        const currentPlayer = s.turn === 'X' ? s.p1 : s.p2;

        // تسجيل الحركة في الشبكة
        s.grid[gIndex][cIndex] = s.turn;

        // هل فاز بالمربع الصغير؟
        if (this.checkWin(s.grid[gIndex])) {
            s.metaGrid[gIndex] = s.turn;
            currentPlayer.score++; // زيادة النقاط
        } else if (this.isFull(s.grid[gIndex])) {
            s.metaGrid[gIndex] = 'DRAW'; // تعادل في المربع الصغير
        }

        // هل فاز باللعبة الكبيرة؟
        if (this.checkWin(s.metaGrid)) {
            s.winner = s.turn;
            return 'GAME_OVER';
        }

        // تحديد المربع القادم (Rule of Focus)
        // الخصم يجب أن يلعب في المربع رقم cIndex
        if (s.metaGrid[cIndex] !== null) {
            // إذا كان المربع القادم محسوماً أو ممتلئاً، فاللعب حر
            s.nextGrid = null;
        } else {
            s.nextGrid = cIndex;
        }

        // تبديل الدور
        this.switchTurn();
        return 'CONTINUE';
    },

    // 4. خوارزمية الفحص (The Checker)
    checkWin(arr) {
        const wins = [
            [0,1,2], [3,4,5], [6,7,8], // أفقي
            [0,3,6], [1,4,7], [2,5,8], // عمودي
            [0,4,8], [2,4,6]           // قطري
        ];

        return wins.some(combo => {
            return combo.every(i => arr[i] === this.state.turn);
        });
    },

    isFull(arr) {
        return arr.every(cell => cell !== null);
    },

    switchTurn() {
        this.state.turn = this.state.turn === 'X' ? 'O' : 'X';
    },

    // 5. منطق القدرات (Powers Logic)
    
    // الممحاة: تنظف مربعاً كاملاً
    useNuke(gIndex) {
        const s = this.state;
        const p = s.turn === 'X' ? s.p1 : s.p2;
        
        if (p.powers.nuke > 0 && s.metaGrid[gIndex] === null) {
            s.grid[gIndex] = Array(9).fill(null); // تفريغ
            p.powers.nuke--;
            this.switchTurn(); // تستهلك الدور
            s.nextGrid = null; // الدور القادم حر لأننا دمرنا الهدف
            return true;
        }
        return false;
    },

    // التجميد: تمنع الخصم وتلعب مرة أخرى
    useFreeze() {
        const s = this.state;
        const p = s.turn === 'X' ? s.p1 : s.p2;

        if (p.powers.freeze > 0) {
            p.powers.freeze--;
            // لا نبدل الدور (اللاعب يلعب مرتين)
            // this.switchTurn(); <-- محذوفة عمداً
            return true;
        }
        return false;
    },

    // الاستحواذ: سرقة خلية
    useHack(gIndex, cIndex) {
        const s = this.state;
        const p = s.turn === 'X' ? s.p1 : s.p2;
        const opponent = s.turn === 'X' ? 'O' : 'X';

        // الشروط: الخلية مشغولة بالخصم، والمربع الكبير لم ينته بعد
        if (p.powers.hack > 0 && 
            s.grid[gIndex][cIndex] === opponent && 
            s.metaGrid[gIndex] === null) {
            
            // تغيير الملكية
            s.grid[gIndex][cIndex] = s.turn;
            p.powers.hack--;

            // فحص الفوز بعد السرقة
            if (this.checkWin(s.grid[gIndex])) {
                s.metaGrid[gIndex] = s.turn;
                p.score++;
            }

            this.switchTurn();
            // تحديد الوجهة التالية بناء على الخلية المسروقة
            if (s.metaGrid[cIndex] !== null) s.nextGrid = null;
            else s.nextGrid = cIndex;

            return true;
        }
        return false;
    }
};
