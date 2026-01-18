/**
 * 🧠 GAME LOGIC ENGINE
 * محرك قوانين اللعبة (يعمل في الخلفية ويدير القوانين فقط)
 */

export const GameLogic = {
    // حالة اللعبة (The State)
    state: {
        grid: [],        // 9 مصفوفات فرعية (9x9)
        metaGrid: [],    // مصفوفة المربعات الكبيرة (9 خانات)
        turn: 'X',       // دور من؟ (X دائماً يبدأ)
        nextGrid: null,  // المربع الذي يجب اللعب فيه (null = حر)
        winner: null,    // الفائز النهائي
        
        // بيانات اللاعبين وقدراتهم
        p1: { name: 'اللاعب 1', symbol: 'X', score: 0, powers: { nuke: 1, freeze: 1, hack: 1 } },
        p2: { name: 'اللاعب 2', symbol: 'O', score: 0, powers: { nuke: 1, freeze: 1, hack: 1 } }
    },

    // 1. تهيئة اللعبة (Reset)
    init() {
        // بناء مصفوفة فارغة
        this.state.grid = Array(9).fill(null).map(() => Array(9).fill(null));
        this.state.metaGrid = Array(9).fill(null);
        this.state.turn = 'X';
        this.state.nextGrid = null;
        this.state.winner = null;
        
        // إعادة تعيين النقاط والقدرات (الأسماء تظل كما هي من الإعدادات)
        this.resetPlayerStats(this.state.p1);
        this.resetPlayerStats(this.state.p2);
    },

    resetPlayerStats(p) {
        p.score = 0;
        p.powers = { nuke: 1, freeze: 1, hack: 1 };
    },

    // 2. التحقق من صلاحية الحركة
    isValidMove(gIndex, cIndex) {
        const s = this.state;
        
        // هل اللعبة انتهت؟
        if (s.winner) return false;

        // هل المربع الكبير مغلق (محسوم أو مدمر)؟
        if (s.metaGrid[gIndex] !== null) return false;

        // هل الخلية مشغولة؟
        if (s.grid[gIndex][cIndex] !== null) return false;

        // هل اللاعب مقيد بمربع معين؟ (Rule of Focus)
        // إذا كان nextGrid ليس null، يجب أن يلعب في نفس رقم المربع
        if (s.nextGrid !== null && s.nextGrid !== gIndex) return false;

        return true;
    },

    // 3. تنفيذ الحركة
    makeMove(gIndex, cIndex) {
        const s = this.state;
        const currentPlayer = s.turn === 'X' ? s.p1 : s.p2;

        // تسجيل الحركة
        s.grid[gIndex][cIndex] = s.turn;

        // هل فاز بالمربع الصغير؟
        if (this.checkWin(s.grid[gIndex])) {
            s.metaGrid[gIndex] = s.turn;
            currentPlayer.score++; // نقطة للمربع
        } else if (this.isFull(s.grid[gIndex])) {
            s.metaGrid[gIndex] = 'DRAW'; // تعادل (يحترق المربع)
        }

        // هل فاز باللعبة الكبيرة؟
        if (this.checkWin(s.metaGrid)) {
            s.winner = s.turn;
            return 'GAME_OVER';
        }

        // تحديد الوجهة القادمة للخصم
        // الخصم يجب أن يذهب للمربع رقم cIndex (حسب الخلية التي لُعب فيها)
        // لكن لو المربع cIndex محسوم مسبقاً، يصبح اللعب حراً (Free Play)
        if (s.metaGrid[cIndex] !== null) {
            s.nextGrid = null; 
        } else {
            s.nextGrid = cIndex;
        }

        // تبديل الدور
        this.switchTurn();
        return 'CONTINUE';
    },

    // 4. خوارزمية الفحص (Win Checker)
    checkWin(arr) {
        const wins = [
            [0,1,2], [3,4,5], [6,7,8], // أفقي
            [0,3,6], [1,4,7], [2,5,8], // عمودي
            [0,4,8], [2,4,6]           // قطري
        ];
        return wins.some(combo => combo.every(i => arr[i] === this.state.turn));
    },

    isFull(arr) {
        return arr.every(cell => cell !== null);
    },

    switchTurn() {
        this.state.turn = this.state.turn === 'X' ? 'O' : 'X';
    },

    // 5. منطق القدرات الخاصة (Special Powers)
    
    // الممحاة: تنظف مربعاً كاملاً
    useNuke(gIndex) {
        const s = this.state;
        const p = s.turn === 'X' ? s.p1 : s.p2;
        
        // شرط: المربع الكبير لم يحسم بعد، واللاعب يملك القدرة
        if (p.powers.nuke > 0 && s.metaGrid[gIndex] === null) {
            s.grid[gIndex] = Array(9).fill(null); // مسح البيانات
            p.powers.nuke--;
            
            this.switchTurn(); 
            s.nextGrid = null; // اللعب حر بعد التفجير (لأن الهدف قد يكون تغير)
            return true;
        }
        return false;
    },

    // التجميد: يلعب مرة أخرى
    useFreeze() {
        const s = this.state;
        const p = s.turn === 'X' ? s.p1 : s.p2;

        if (p.powers.freeze > 0) {
            p.powers.freeze--;
            // لا نبدل الدور (اللاعب يلعب مرة أخرى)
            return true;
        }
        return false;
    },

    // الاستحواذ: سرقة خلية
    useHack(gIndex, cIndex) {
        const s = this.state;
        const p = s.turn === 'X' ? s.p1 : s.p2;
        const opponent = s.turn === 'X' ? 'O' : 'X';

        // الشروط: الخلية للخصم، والمربع الكبير مفتوح، ولديه رصيد
        if (p.powers.hack > 0 && 
            s.grid[gIndex][cIndex] === opponent && 
            s.metaGrid[gIndex] === null) {
            
            s.grid[gIndex][cIndex] = s.turn; // تغيير الملكية
            p.powers.hack--;

            // فحص الفوز بعد السرقة (قد يكمل صفاً ويفوز بالمربع)
            if (this.checkWin(s.grid[gIndex])) {
                s.metaGrid[gIndex] = s.turn;
                p.score++;
            }

            this.switchTurn();
            // تحديد الوجهة (نفس منطق الحركة العادية)
            if (s.metaGrid[cIndex] !== null) s.nextGrid = null;
            else s.nextGrid = cIndex;

            return true;
        }
        return false;
    }
};
