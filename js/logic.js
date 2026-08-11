/**
 * 🧠 GAME LOGIC ENGINE (STRATEGIC POWERS UPGRADE)
 * محرك القوانين والقوى والتحقق من الفوز، معدل للخطط الاستراتيجية (النووي، الهاك، التجميد)
 */

export const GameLogic = {
    state: {
        grid: [],       // 9x9 grid
        metaGrid: [],   // 3x3 main grid
        turn: 'X',      // X or O
        nextGrid: null, // Constraint (0-8 or null for free move)
        winner: null,
        p1: { name: 'P1', score: 0, icon: 'X', powers: { nuke: true, freeze: true, hack: true }, roster: [], rosterIndex: 0 },
        p2: { name: 'P2', score: 0, icon: 'O', powers: { nuke: true, freeze: true, hack: true }, roster: [], rosterIndex: 0 },
        frozenGrid: null // For Freeze trap
    },

    init(p1Data, p2Data) {
        this.state.grid = Array(9).fill(null).map(() => Array(9).fill(null));
        this.state.metaGrid = Array(9).fill(null);
        this.state.turn = 'X'; 
        this.state.nextGrid = null;
        this.state.winner = null;
        this.state.frozenGrid = null;

        if (p1Data) {
            this.state.p1 = { 
                ...this.state.p1, 
                ...p1Data, 
                powers: { nuke: true, freeze: true, hack: true },
                roster: p1Data.roster && p1Data.roster.length > 0 ? p1Data.roster : [p1Data.name],
                rosterIndex: 0
            };
            this.state.p2 = { 
                ...this.state.p2, 
                ...p2Data, 
                powers: { nuke: true, freeze: true, hack: true },
                roster: p2Data.roster && p2Data.roster.length > 0 ? p2Data.roster : [p2Data.name],
                rosterIndex: 0
            };
        }
    },

    getCurrentTeam() {
        return this.state.turn === 'X' ? this.state.p1 : this.state.p2;
    },

    getCurrentMemberName() {
        const team = this.getCurrentTeam();
        return team.roster[team.rosterIndex];
    },

    isValidMove(g, c) {
        if (this.state.winner) return false;
        if (this.state.frozenGrid === g) return false;
        if (this.state.grid[g][c] !== null) return false;

        if (this.state.nextGrid !== null && this.state.nextGrid !== g) {
            if (this.state.metaGrid[this.state.nextGrid] === null) return false;
        }

        if (this.state.metaGrid[g] !== null) return false;

        return true;
    },

    makeMove(g, c) {
        const team = this.getCurrentTeam();
        this.state.grid[g][c] = this.state.turn;

        // التحقق من فوز المربع الصغير
        if (this.checkWin(this.state.grid[g])) {
            this.state.metaGrid[g] = this.state.turn;
            team.score += 100;
        }

        // التحقق من فوز اللعبة
        if (this.checkWin(this.state.metaGrid)) {
            this.state.winner = this.state.turn;
            team.score += 1000;
            return 'GAME_OVER';
        }

        // تحديد المربع التالي الإلزامي
        if (this.state.metaGrid[c] !== null || this.isGridFull(this.state.grid[c])) {
            this.state.nextGrid = null;
        } else {
            this.state.nextGrid = c;
        }

        // ❄️ نظام فخ التجميد (Freeze Trap Logic)
        // إذا كان المربع الإلزامي الذي أُجبر عليه الخصم هو نفس المربع المجمد!
        if (this.state.nextGrid !== null && this.state.nextGrid === this.state.frozenGrid) {
            this.state.frozenGrid = null; // ينكسر الجليد
            this.switchTurn(); // نمرر الدور للخصم (الضحية)
            this.switchTurn(); // نمرر الدور مرة أخرى ليعود للمهاجم! (يفقد الخصم النقلة)
            return 'TRAP_TRIGGERED'; // إرسال إشارة لـ app.js لعرض رسالة الفخ
        }

        this.switchTurn();
        return 'CONTINUE';
    },

    usePower(type, g, c) {
        const team = this.getCurrentTeam();
        
        if (!team.powers[type]) return false;

        switch (type) {
            case 'nuke': // تدمير وإجبار
                if (this.state.metaGrid[g] !== null) return false; 
                this.state.grid[g] = Array(9).fill(null);
                this.state.nextGrid = g; // ☢️ إجبار الخصم على اللعب في المنطقة المدمرة
                if (this.state.frozenGrid === g) this.state.frozenGrid = null; // النووي يذيب الجليد
                break;

            case 'freeze': // وضع فخ التجميد
                this.state.frozenGrid = g;
                // تمت إزالة خاصية الفك التلقائي ليبقى الفخ نشطاً
                break;

            case 'hack': // السرقة التكتيكية
                if (this.state.grid[g][c] === null || this.state.grid[g][c] === this.state.turn) return false;
                this.state.grid[g][c] = this.state.turn; 
                
                // 👾 التحقق الذكي: هل تسببت السرقة في إكمال خط والفوز بالمربع؟
                if (this.checkWin(this.state.grid[g])) {
                    this.state.metaGrid[g] = this.state.turn;
                    team.score += 100;
                    if (this.checkWin(this.state.metaGrid)) {
                        this.state.winner = this.state.turn;
                        team.score += 1000;
                    }
                }
                break;
        }

        team.powers[type] = false; 
        team.score -= 50; 
        this.switchTurn(); 
        
        // إذا تسبب الهاك في فوز مباشر، نخبر النظام بذلك
        return this.state.winner ? 'GAME_OVER' : true;
    },

    // 🛑 دالة جديدة لمعاقبة المخطئ في الرياضيات (خسارة الدور)
    skipTurn() {
        this.switchTurn();
    },

    switchTurn() {
        const currentTeam = this.getCurrentTeam();
        currentTeam.rosterIndex = (currentTeam.rosterIndex + 1) % currentTeam.roster.length;
        this.state.turn = this.state.turn === 'X' ? 'O' : 'X';
    },

    checkWin(board) {
        const wins = [
            [0,1,2], [3,4,5], [6,7,8], 
            [0,3,6], [1,4,7], [2,5,8], 
            [0,4,8], [2,4,6]           
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
