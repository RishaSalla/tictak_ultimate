/**
 * 🧠 GAME LOGIC ENGINE - RETRO EDITION
 * محرك القوانين المطور للرقعة الكبيرة ونظام الفرق
 */

export const GameLogic = {
    state: {
        grid: [],        // الرقعة 9x9
        metaGrid: [],    // رقعة الفوز الكبيرة 3x3
        turn: 'X',       // الفريق الحالي
        nextGrid: null,  // المربع الموجه إليه الخصم
        winner: null,    
        
        p1: { 
            name: '', roster: [], turnIndex: 0, symbol: 'X', 
            score: 0, powers: { nuke: 1, freeze: 1, hack: 1 }, avatar: 'X' 
        },
        p2: { 
            name: '', roster: [], turnIndex: 0, symbol: 'O', 
            score: 0, powers: { nuke: 1, freeze: 1, hack: 1 }, avatar: 'O' 
        }
    },

    init() {
        this.state.grid = Array(9).fill(null).map(() => Array(9).fill(null));
        this.state.metaGrid = Array(9).fill(null);
        this.state.turn = 'X';
        this.state.nextGrid = null;
        this.state.winner = null;
    },

    // تحديد العضو الذي عليه الدور داخل الفريق
    getCurrentMember() {
        const p = this.state.turn === 'X' ? this.state.p1 : this.state.p2;
        if (!p.roster || p.roster.length === 0) return p.name;
        return p.roster[p.turnIndex % p.roster.length];
    },

    // التحقق من صلاحية الحركة قبل البدء
    isValidMove(gIndex, cIndex) {
        const s = this.state;
        if (s.winner) return false;
        // لا يمكن اللعب في مربع كبير تم الفوز به مسبقاً
        if (s.metaGrid[gIndex] !== null) return false;
        // لا يمكن اللعب في خلية محجوزة
        if (s.grid[gIndex][cIndex] !== null) return false;
        // شرط التوجيه: يجب اللعب في المربع المحدد إلا لو كان حراً (null)
        if (s.nextGrid !== null && s.nextGrid !== gIndex) return false;
        return true;
    },

    makeMove(gIndex, cIndex) {
        const s = this.state;
        const currentTeam = s.turn === 'X' ? s.p1 : s.p2;

        s.grid[gIndex][cIndex] = s.turn;

        // فحص الفوز بالمربع الصغير
        if (this.checkWin(s.grid[gIndex])) {
            s.metaGrid[gIndex] = s.turn;
            currentTeam.score++;
        } else if (this.isFull(s.grid[gIndex])) {
            s.metaGrid[gIndex] = 'DRAW';
        }

        // فحص الفوز الكلي باللعبة
        if (this.checkWin(s.metaGrid)) {
            s.winner = s.turn;
            return 'GAME_OVER';
        }

        /** * ⚖️ تحديد المربع القادم (The Golden Rule)
         * إذا كان المربع الموجه إليه الخصم مكتملاً أو فاز به أحد، يصبح اللعب حراً
         */
        if (s.metaGrid[cIndex] !== null) {
            s.nextGrid = null; 
        } else {
            s.nextGrid = cIndex;
        }

        this.switchTurn();
        return 'CONTINUE';
    },

    checkWin(arr) {
        const wins = [
            [0,1,2], [3,4,5], [6,7,8], // أفقي
            [0,3,6], [1,4,7], [2,5,8], // عمودي
            [0,4,8], [2,4,6]           // قطري
        ];
        return wins.some(combo => combo.every(i => arr[i] === this.state.turn));
    },

    isFull(arr) { return arr.every(cell => cell !== null); },

    switchTurn() {
        const p = this.state.turn === 'X' ? this.state.p1 : this.state.p2;
        p.turnIndex++; // تدوير الدور للعضو التالي
        this.state.turn = this.state.turn === 'X' ? 'O' : 'X';
    },

    // القوات الخاصة (بدون أسئلة حسب طلبك)
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
        const p = this.state.turn === 'X' ? this.state.p1 : this.state.p2;
        if (p.powers.freeze > 0) {
            p.powers.freeze--;
            return true; // لا نبدل الدور هنا
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
            return true;
        }
        return false;
    }
};
