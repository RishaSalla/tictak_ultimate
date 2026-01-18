/**
 * 🧠 GAME LOGIC ENGINE - TEAM EDITION
 * محرك القوانين مع دعم نظام الفرق والتناوب
 */

export const GameLogic = {
    // حالة اللعبة
    state: {
        grid: [],        // 9x9
        metaGrid: [],    // 3x3
        turn: 'X',       // الدور الحالي للفريق
        nextGrid: null,  // المربع المطلوب
        winner: null,    // الفائز النهائي
        
        // بيانات الفرق (تم تحديثها لتشمل القوائم)
        p1: { 
            name: 'فريق X', // اسم الفريق العام
            roster: [],     // قائمة أسماء اللاعبين [أحمد، سارة..]
            turnIndex: 0,   // مؤشر من عليه الدور حالياً
            symbol: 'X', 
            score: 0, 
            powers: { nuke: 1, freeze: 1, hack: 1 },
            avatar: 'X'
        },
        p2: { 
            name: 'فريق O',
            roster: [],
            turnIndex: 0,
            symbol: 'O', 
            score: 0, 
            powers: { nuke: 1, freeze: 1, hack: 1 },
            avatar: 'O'
        }
    },

    // 1. تهيئة اللعبة
    init() {
        this.state.grid = Array(9).fill(null).map(() => Array(9).fill(null));
        this.state.metaGrid = Array(9).fill(null);
        this.state.turn = 'X';
        this.state.nextGrid = null;
        this.state.winner = null;
        
        // تصفير النقاط والقدرات (مع الحفاظ على القوائم)
        this.resetTeamStats(this.state.p1);
        this.resetTeamStats(this.state.p2);
    },

    resetTeamStats(p) {
        p.score = 0;
        p.turnIndex = 0; // البدء من أول لاعب في القائمة
        p.powers = { nuke: 1, freeze: 1, hack: 1 };
    },

    // 2. معرفة اسم اللاعب الحالي (داخل الفريق)
    getCurrentMember() {
        const p = this.state.turn === 'X' ? this.state.p1 : this.state.p2;
        
        // إذا لم توجد قائمة أسماء، نستخدم اسم الفريق العام
        if (!p.roster || p.roster.length === 0) {
            return p.name;
        }
        
        // تدوير الأسماء: (الدور % عدد اللاعبين)
        // مثال: لو عندنا 3 لاعبين، والدور رقم 4، النتيجة 1 (اللاعب الثاني)
        const memberName = p.roster[p.turnIndex % p.roster.length];
        return memberName;
    },

    // 3. التحقق من الصلاحية
    isValidMove(gIndex, cIndex) {
        const s = this.state;
        if (s.winner) return false;
        if (s.metaGrid[gIndex] !== null) return false;
        if (s.grid[gIndex][cIndex] !== null) return false;
        if (s.nextGrid !== null && s.nextGrid !== gIndex) return false;
        return true;
    },

    // 4. تنفيذ الحركة
    makeMove(gIndex, cIndex) {
        const s = this.state;
        const currentTeam = s.turn === 'X' ? s.p1 : s.p2;

        // تسجيل الحركة
        s.grid[gIndex][cIndex] = s.turn;

        // فحص الفوز بالمربع الصغير
        if (this.checkWin(s.grid[gIndex])) {
            s.metaGrid[gIndex] = s.turn;
            currentTeam.score++;
        } else if (this.isFull(s.grid[gIndex])) {
            s.metaGrid[gIndex] = 'DRAW';
        }

        // فحص الفوز الكبير
        if (this.checkWin(s.metaGrid)) {
            s.winner = s.turn;
            return 'GAME_OVER';
        }

        // تحديد الوجهة القادمة
        if (s.metaGrid[cIndex] !== null) {
            s.nextGrid = null; // لعب حر
        } else {
            s.nextGrid = cIndex; // مقيد
        }

        this.switchTurn();
        return 'CONTINUE';
    },

    checkWin(arr) {
        const wins = [
            [0,1,2], [3,4,5], [6,7,8],
            [0,3,6], [1,4,7], [2,5,8],
            [0,4,8], [2,4,6]
        ];
        return wins.some(combo => combo.every(i => arr[i] === this.state.turn));
    },

    isFull(arr) { return arr.every(cell => cell !== null); },

    // تبديل الدور + تحديث مؤشر لاعب الفريق
    switchTurn() {
        const currentP = this.state.turn === 'X' ? this.state.p1 : this.state.p2;
        
        // تحريك المؤشر للاعب التالي في هذا الفريق للمرة القادمة
        currentP.turnIndex++;
        
        // تسليم الدور للفريق الخصم
        this.state.turn = this.state.turn === 'X' ? 'O' : 'X';
    },

    // 5. القدرات الخاصة (نفس المنطق لكن تخصم من الفريق)
    useNuke(gIndex) {
        const s = this.state;
        const p = s.turn === 'X' ? s.p1 : s.p2;
        if (p.powers.nuke > 0 && s.metaGrid[gIndex] === null) {
            s.grid[gIndex] = Array(9).fill(null);
            p.powers.nuke--;
            this.switchTurn(); 
            s.nextGrid = null;
            return true;
        }
        return false;
    },

    useFreeze() {
        const s = this.state;
        const p = s.turn === 'X' ? s.p1 : s.p2;
        if (p.powers.freeze > 0) {
            p.powers.freeze--;
            // لا نبدل الدور، لكن يجب تحديث مؤشر اللاعب؟ 
            // لا، نفس اللاعب يكمل دوره الإضافي (مكافأة له)
            return true;
        }
        return false;
    },

    useHack(gIndex, cIndex) {
        const s = this.state;
        const p = s.turn === 'X' ? s.p1 : s.p2;
        const opponent = s.turn === 'X' ? 'O' : 'X';

        if (p.powers.hack > 0 && s.grid[gIndex][cIndex] === opponent && s.metaGrid[gIndex] === null) {
            s.grid[gIndex][cIndex] = s.turn;
            p.powers.hack--;
            if (this.checkWin(s.grid[gIndex])) {
                s.metaGrid[gIndex] = s.turn;
                p.score++;
            }
            this.switchTurn();
            if (s.metaGrid[cIndex] !== null) s.nextGrid = null;
            else s.nextGrid = cIndex;
            return true;
        }
        return false;
    }
};
