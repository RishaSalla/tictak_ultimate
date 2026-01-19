/**
 * 🧠 GAME LOGIC ENGINE
 * محرك القوانين والقوى والتحقق من الفوز
 */

export const GameLogic = {
    state: {
        grid: [],       // 9x9 grid
        metaGrid: [],   // 3x3 main grid
        turn: 'X',      // X or O
        nextGrid: null, // Constraint (0-8 or null for free move)
        winner: null,
        p1: { name: 'P1', score: 0, icon: 'X', powers: { nuke: true, freeze: true, hack: true } },
        p2: { name: 'P2', score: 0, icon: 'O', powers: { nuke: true, freeze: true, hack: true } },
        frozenGrid: null // For Freeze power
    },

    init(p1Data, p2Data) {
        // تهيئة الشبكة الفارغة
        this.state.grid = Array(9).fill(null).map(() => Array(9).fill(null));
        this.state.metaGrid = Array(9).fill(null);
        this.state.turn = 'X'; // الفريق الأول يبدأ دائماً
        this.state.nextGrid = null;
        this.state.winner = null;
        this.state.frozenGrid = null;

        // تحديث بيانات اللاعبين إذا وجدت
        if (p1Data) {
            this.state.p1 = { ...this.state.p1, ...p1Data, powers: { nuke: true, freeze: true, hack: true } };
            this.state.p2 = { ...this.state.p2, ...p2Data, powers: { nuke: true, freeze: true, hack: true } };
        }
    },

    getCurrentMember() {
        return this.state.turn === 'X' ? this.state.p1 : this.state.p2;
    },

    isValidMove(g, c) {
        if (this.state.winner) return false;
        
        // التحقق من التجميد
        if (this.state.frozenGrid === g) return false;

        // التحقق من الخانة الفارغة
        if (this.state.grid[g][c] !== null) return false;

        // التحقق من القيد (Next Grid)
        if (this.state.nextGrid !== null && this.state.nextGrid !== g) {
            // إلا إذا كان المربع المحدد ممتلئاً (قاعدة الطريق المسدود)
            if (this.state.metaGrid[this.state.nextGrid] === null) return false;
        }

        // لا يمكن اللعب في مربع تم الفوز به مسبقاً
        if (this.state.metaGrid[g] !== null) return false;

        return true;
    },

    makeMove(g, c) {
        const player = this.getCurrentMember();
        this.state.grid[g][c] = this.state.turn;

        // التحقق من فوز المربع الصغير
        if (this.checkWin(this.state.grid[g])) {
            this.state.metaGrid[g] = this.state.turn;
            player.score += 100;
        }

        // التحقق من فوز اللعبة بالكامل
        if (this.checkWin(this.state.metaGrid)) {
            this.state.winner = this.state.turn;
            player.score += 1000;
            return 'GAME_OVER';
        }

        // إلغاء التجميد بعد دور واحد
        if (this.state.frozenGrid !== null) this.state.frozenGrid = null;

        // تحديد المربع التالي
        // إذا كان المربع التالي (c) محجوزاً أو ممتلئاً، يصبح اللعب حراً
        if (this.state.metaGrid[c] !== null || this.isGridFull(this.state.grid[c])) {
            this.state.nextGrid = null;
        } else {
            this.state.nextGrid = c;
        }

        this.switchTurn();
        return 'CONTINUE';
    },

    usePower(type, g, c) {
        const player = this.getCurrentMember();
        
        // التحقق من توفر القوة
        if (!player.powers[type]) return false;

        switch (type) {
            case 'nuke': // تدمير مربع كامل
                if (this.state.metaGrid[g] !== null) return false; // لا يمكن تدمير مربع محسوم
                this.state.grid[g] = Array(9).fill(null);
                this.state.nextGrid = null; // كسر القيد
                break;

            case 'freeze': // تجميد مربع
                this.state.frozenGrid = g;
                break;

            case 'hack': // سرقة خانة
                if (this.state.grid[g][c] === null || this.state.grid[g][c] === this.state.turn) return false;
                this.state.grid[g][c] = this.state.turn; // قلب الرمز
                break;
        }

        player.powers[type] = false; // استهلاك القوة
        player.score -= 50; // تكلفة استخدام القوة
        this.switchTurn(); // القوة تستهلك الدور
        return true;
    },

    switchTurn() {
        this.state.turn = this.state.turn === 'X' ? 'O' : 'X';
    },

    checkWin(board) {
        const wins = [
            [0,1,2], [3,4,5], [6,7,8], // أفقي
            [0,3,6], [1,4,7], [2,5,8], // عمودي
            [0,4,8], [2,4,6]           // قطري
        ];
        return wins.some(comb => {
            return board[comb[0]] && 
                   board[comb[0]] === board[comb[1]] && 
                   board[comb[0]] === board[comb[2]];
        });
    },

    isGridFull(subGrid) {
        return subGrid.every(cell => cell !== null);
    }
};
