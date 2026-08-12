/**
 * 🧠 GAME LOGIC ENGINE (STRATEGIC POWERS & POINTS WIN)
 * محرك القوانين والقوى، مزود بنظام حسم النقاط عند امتلاء اللوحة
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

        // 1. التحقق من فوز اللعبة (الضربة القاضية)
        if (this.checkWin(this.state.metaGrid)) {
            this.state.winner = this.state.turn;
            team.score += 1000;
            return 'GAME_OVER';
        }

        // 2. التحقق من فوز اللعبة (الاحتكام للنقاط عند امتلاء اللوحة)
        const gameEndStatus = this.checkGameEnd();
        if (gameEndStatus) {
            return gameEndStatus; // 'GAME_OVER_POINTS' أو 'GAME_OVER_TIE'
        }

        // تحديد المربع التالي الإلزامي
        if (this.state.metaGrid[c] !== null || this.isGridFull(this.state.grid[c])) {
            this.state.nextGrid = null;
        } else {
            this.state.nextGrid = c;
        }

        // ❄️ نظام فخ التجميد
        if (this.state.nextGrid !== null && this.state.nextGrid === this.state.frozenGrid) {
            this.state.frozenGrid = null; 
            this.switchTurn(); 
            this.switchTurn(); 
            return 'TRAP_TRIGGERED'; 
        }

        this.switchTurn();
        return 'CONTINUE';
    },

    usePower(type, g, c) {
        const team = this.getCurrentTeam();
        
        if (!team.powers[type]) return false;

        switch (type) {
            case 'nuke': 
                if (this.state.metaGrid[g] !== null) return false; 
                this.state.grid[g] = Array(9).fill(null);
                this.state.nextGrid = g; 
                if (this.state.frozenGrid === g) this.state.frozenGrid = null; 
                break;

            case 'freeze': 
                this.state.frozenGrid = g;
                break;

            case 'hack': 
                if (this.state.grid[g][c] === null || this.state.grid[g][c] === this.state.turn) return false;
                this.state.grid[g][c] = this.state.turn; 
                
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
        
        return this.state.winner ? 'GAME_OVER' : true;
    },

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
    },

    // 🛑 دالة جديدة للتحقق من انسداد اللوحة وحساب النقاط
    checkGameEnd() {
        // التحقق مما إذا كانت جميع المربعات الـ 81 ممتلئة أو محسومة
        let isBoardFull = true;
        for (let g = 0; g < 9; g++) {
            if (this.state.metaGrid[g] === null && !this.isGridFull(this.state.grid[g])) {
                isBoardFull = false;
                break;
            }
        }

        if (isBoardFull) {
            // اللوحة امتلأت، نحتكم للنقاط
            if (this.state.p1.score > this.state.p2.score) {
                this.state.winner = 'X';
                return 'GAME_OVER_POINTS';
            } else if (this.state.p2.score > this.state.p1.score) {
                this.state.winner = 'O';
                return 'GAME_OVER_POINTS';
            } else {
                this.state.winner = 'TIE';
                return 'GAME_OVER_TIE';
            }
        }
        
        return null; // اللعبة مستمرة
    }
};
