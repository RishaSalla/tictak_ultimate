/**
 * MATH MATRIX ENGINE - ELITE EDITION
 * Single File Architecture | No External Dependencies
 */

/* --- 1. Audio System (Synthesizer) --- */
const AudioSys = {
    ctx: null,
    init() {
        if (!this.ctx) {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
    },
    play(type) {
        if (!this.ctx) this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime;

        // Sound Profiles
        if (type === 'click') {
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            osc.start(t); osc.stop(t + 0.1);
        } 
        else if (type === 'win_move') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, t);
            osc.frequency.linearRampToValueAtTime(600, t + 0.2);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.3);
            osc.start(t); osc.stop(t + 0.3);
        }
        else if (type === 'error') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, t);
            osc.frequency.linearRampToValueAtTime(50, t + 0.3);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.3);
            osc.start(t); osc.stop(t + 0.3);
        }
        else if (type === 'nuke') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(50, t);
            gain.gain.setValueAtTime(0.5, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
            osc.start(t); osc.stop(t + 0.5);
        }
        else if (type === 'win_game') {
            // Simple Arpeggio
            [400, 500, 600, 800].forEach((freq, i) => {
                const o = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                o.frequency.value = freq;
                g.gain.value = 0.1;
                g.gain.exponentialRampToValueAtTime(0.001, t + i*0.1 + 0.3);
                o.connect(g); g.connect(this.ctx.destination);
                o.start(t + i*0.1); o.stop(t + i*0.1 + 0.4);
            });
            return;
        }

        osc.connect(gain);
        gain.connect(this.ctx.destination);
    }
};

/* --- 2. Game Data & Config --- */
const App = {
    state: {
        screen: 'login', // login, menu, game
        mode: null,      // strategy, clash, code, duality, genius
        turn: 'X',
        p1: { name: 'اللاعب 1', avatar: 'X', score: 0, powers: { nuke: 1, freeze: 1, hack: 1 } },
        p2: { name: 'اللاعب 2', avatar: 'O', score: 0, powers: { nuke: 1, freeze: 1, hack: 1 } },
        grid: Array(9).fill(null), // The 9 big grids status
        nextGrid: null, // Constraint (0-8 or null)
        activePower: null,
        mathAnswer: null,
        activeCell: null, // {grid, cell} waiting for calculation
        timer: null
    },

    /* --- UI Module --- */
    UI: {
        toggleMenu() {
            if(confirm('هل تريد العودة للقائمة الرئيسية؟ ستفقد تقدمك الحالي.')) {
                App.Game.exitMatch();
            }
        },
        showSettings() {
            document.getElementById('modal-settings').classList.remove('hidden');
        },
        showHelp() {
            document.getElementById('modal-help').classList.remove('hidden');
        },
        closeModal(id) {
            document.getElementById(`modal-${id}`).classList.add('hidden');
        },
        saveSettings() {
            // Get inputs
            App.state.p1.name = document.getElementById('conf-p1-name').value;
            App.state.p1.avatar = document.getElementById('conf-p1-avatar').value;
            App.state.p2.name = document.getElementById('conf-p2-name').value;
            App.state.p2.avatar = document.getElementById('conf-p2-avatar').value;
            
            this.closeModal('settings');
            // Refresh HUD if in game (optional, usually setting is done before)
        },
        setTheme(theme) {
            document.body.className = ''; // reset
            if(theme !== 'default') document.body.classList.add(`theme-${theme}`);
            
            // Visual feedback
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            document.querySelector(`.theme-btn[data-theme="${theme}"]`).classList.add('active');

            // Apply specific colors via CSS variables logic if needed, 
            // but CSS classes are cleaner as per style.css
            const root = document.documentElement;
            if(theme === 'matrix') {
                root.style.setProperty('--accent', '#00ff00');
                root.style.setProperty('--bg-dark', '#000000');
            } else if (theme === 'royal') {
                root.style.setProperty('--accent', '#9b59b6');
                root.style.setProperty('--bg-dark', '#180020');
            } else {
                root.style.setProperty('--accent', '#FFD700');
                root.style.setProperty('--bg-dark', '#0f1016');
            }
        },
        updateHUD() {
            const s = App.state;
            const p1El = document.getElementById('hud-p1');
            const p2El = document.getElementById('hud-p2');
            
            // Update Avatars & Names (Visual only)
            p1El.querySelector('.avatar').textContent = s.p1.avatar;
            p2El.querySelector('.avatar').textContent = s.p2.avatar;
            
            // Update Scores
            document.getElementById('score-x').textContent = s.p1.score;
            document.getElementById('score-o').textContent = s.p2.score;

            // Turn Indicator
            if(s.turn === 'X') {
                p1El.classList.add('active-turn');
                p2El.classList.remove('active-turn');
            } else {
                p2El.classList.add('active-turn');
                p1El.classList.remove('active-turn');
            }

            // Power Buttons
            const currentP = s.turn === 'X' ? s.p1 : s.p2;
            document.getElementById('count-nuke').textContent = currentP.powers.nuke;
            document.getElementById('count-freeze').textContent = currentP.powers.freeze;
            document.getElementById('count-hack').textContent = currentP.powers.hack;

            // Enable/Disable Power Buttons based on count
            ['nuke', 'freeze', 'hack'].forEach(p => {
                const btn = document.querySelector(`.btn-${p}`);
                btn.disabled = currentP.powers[p] <= 0;
                btn.style.opacity = currentP.powers[p] <= 0 ? 0.3 : 1;
                btn.classList.remove('active'); // reset active state visual
            });

            if(s.activePower) {
                document.querySelector(`.btn-${s.activePower}`).classList.add('active');
            }
        }
    },

    /* --- Game Logic Module --- */
    Game: {
        init() {
            // Login handling
            document.getElementById('btn-login').onclick = () => {
                const code = document.getElementById('access-code').value;
                if(code === '0000') { // Simple check, can be changed
                    AudioSys.play('win_move');
                    document.getElementById('login-screen').classList.add('hidden');
                    document.getElementById('main-app').classList.remove('hidden');
                } else {
                    AudioSys.play('error');
                    document.getElementById('access-code').style.borderColor = 'red';
                }
            };
        },

        selectMode(mode) {
            AudioSys.play('click');
            App.state.mode = mode;
            this.startMatch();
        },

        startMatch() {
            // Reset State
            App.state.turn = 'X';
            App.state.grid = Array(9).fill(null);
            App.state.nextGrid = null;
            App.state.activePower = null;
            
            // Reset Power counts (Optional: Reload from config if needed)
            App.state.p1.powers = { nuke: 1, freeze: 1, hack: 1 };
            App.state.p2.powers = { nuke: 1, freeze: 1, hack: 1 };

            // UI Switch
            document.getElementById('screen-menu').classList.remove('active-screen'); // CSS hidden logic
            document.getElementById('screen-menu').classList.add('hidden');
            document.getElementById('screen-game').classList.remove('hidden');
            
            this.buildGrid();
            this.highlightGrid();
            App.UI.updateHUD();
        },

        exitMatch() {
            document.getElementById('screen-game').classList.add('hidden');
            document.getElementById('screen-menu').classList.remove('hidden');
            document.getElementById('modal-win').classList.add('hidden');
        },

        buildGrid() {
            const arena = document.getElementById('game-arena');
            arena.innerHTML = '';
            for(let i=0; i<9; i++) {
                const sub = document.createElement('div');
                sub.className = 'sub-grid';
                sub.id = `grid-${i}`;
                sub.dataset.winner = '';
                
                for(let j=0; j<9; j++) {
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    cell.onclick = () => this.handleCell(i, j, cell);
                    sub.appendChild(cell);
                }
                arena.appendChild(sub);
            }
        },

        handleCell(gIdx, cIdx, cellEl) {
            const s = App.state;

            // 1. Power-up Interception
            if(s.activePower === 'nuke') {
                this.executeNuke(gIdx);
                return;
            }
            if(s.activePower === 'hack') {
                this.executeHack(gIdx, cIdx, cellEl);
                return;
            }

            // 2. Validation
            // Is cell empty?
            if(cellEl.classList.contains('x') || cellEl.classList.contains('o')) return;
            // Is grid forced?
            if(s.nextGrid !== null && s.nextGrid !== gIdx) {
                // Visual shake feedback on the correct grid
                const correct = document.getElementById(`grid-${s.nextGrid}`);
                correct.classList.add('shake');
                setTimeout(() => correct.classList.remove('shake'), 500);
                AudioSys.play('error');
                return;
            }
            // Is grid already won?
            if(s.grid[gIdx] !== null) return;

            // 3. Mode Logic
            if(s.mode === 'strategy') {
                // No math, just place
                AudioSys.play('click');
                this.placeMark(gIdx, cIdx, cellEl);
            } else {
                // Math required
                AudioSys.play('click');
                this.triggerCalculator(gIdx, cIdx, cellEl);
            }
        },

        usePower(type) {
            const s = App.state;
            const p = s.turn === 'X' ? s.p1 : s.p2;

            if(p.powers[type] <= 0) return;

            if(type === 'freeze') {
                // Immediate effect
                AudioSys.play('nuke'); // recycle sound
                p.powers.freeze--;
                // Logic: Switch turn twice = same person
                // But we need to update UI.
                // We will just set a flag "freeTurn" or handle in switchTurn
                // Simpler: Don't switch turn after next move.
                s.activePower = 'freeze'; 
                App.UI.updateHUD();
                // Visual effect on body
                document.body.style.boxShadow = 'inset 0 0 50px var(--freeze-color)';
                setTimeout(()=>document.body.style.boxShadow='none', 500);
            } else {
                // Target effect (Nuke/Hack)
                if(s.activePower === type) s.activePower = null; // Toggle off
                else s.activePower = type;
                App.UI.updateHUD();
            }
        },

        executeNuke(gIdx) {
            const s = App.state;
            const p = s.turn === 'X' ? s.p1 : s.p2;
            
            // Apply Nuke
            AudioSys.play('nuke');
            const gridEl = document.getElementById(`grid-${gIdx}`);
            // Clear DOM
            Array.from(gridEl.children).forEach(c => {
                c.className = 'cell';
            });
            gridEl.className = 'sub-grid'; // Remove 'won' class
            gridEl.dataset.winner = '';
            
            // Reset Logic
            s.grid[gIdx] = null;
            p.powers.nuke--;
            s.activePower = null;
            
            // Shake screen
            document.body.classList.add('shake');
            setTimeout(()=>document.body.classList.remove('shake'), 500);

            this.switchTurn();
        },

        executeHack(gIdx, cIdx, cellEl) {
            const s = App.state;
            const p = s.turn === 'X' ? s.p1 : s.p2;
            
            // Validation: Must steal opponent cell
            const oppClass = s.turn === 'X' ? 'o' : 'x';
            if(!cellEl.classList.contains(oppClass)) {
                AudioSys.play('error');
                return;
            }

            // Steal
            AudioSys.play('win_move');
            cellEl.classList.remove(oppClass);
            cellEl.classList.add(s.turn.toLowerCase());
            
            p.powers.hack--;
            s.activePower = null;
            
            // Check if this stole the grid
            this.checkSubGrid(gIdx);
            
            this.switchTurn();
        },

        /* --- Calculator Logic --- */
        triggerCalculator(gIdx, cIdx, cellEl) {
            const s = App.state;
            s.activeCell = {g: gIdx, c: cIdx, el: cellEl};
            
            // Generate Question
            let qText = '';
            let ans = 0;
            const n1 = Math.floor(Math.random()*8)+2;
            const n2 = Math.floor(Math.random()*8)+2;

            if(s.mode === 'clash') {
                qText = `${n1} × ${n2}`;
                ans = n1 * n2;
            } 
            else if (s.mode === 'code') {
                // 3 + ? = 10
                const sum = n1 + n2;
                qText = `${n1} + ? = ${sum}`;
                ans = n2;
            }
            else if (s.mode === 'duality') {
                // Is n1 Even(2) or Odd(1)?
                const num = Math.floor(Math.random()*20)+1;
                qText = `${num}: فردي(1) أم زوجي(2)؟`;
                ans = (num % 2 === 0) ? 2 : 1;
            }
            else if (s.mode === 'genius') {
                // (a * b) + c
                const n3 = Math.floor(Math.random()*5)+1;
                qText = `(${n1}×${n2}) + ${n3}`;
                ans = (n1*n2) + n3;
            }

            s.mathAnswer = ans;
            document.getElementById('calc-q').textContent = qText + ' = ?';
            document.getElementById('calc-a').textContent = '_';
            document.getElementById('modal-calc').classList.remove('hidden');

            // Timer Logic (Visual Only for now, enforced if needed)
            const bar = document.getElementById('timer-progress');
            bar.style.width = '100%';
            setTimeout(() => bar.style.width = '0%', 10);
        },

        typeCalc(num) {
            const display = document.getElementById('calc-a');
            if(display.textContent === '_') display.textContent = '';
            if(display.textContent.length < 3) display.textContent += num;
        },

        clearCalc() {
            document.getElementById('calc-a').textContent = '_';
        },

        submitCalc() {
            const val = parseInt(document.getElementById('calc-a').textContent);
            if(val === App.state.mathAnswer) {
                // Correct
                AudioSys.play('win_move');
                document.getElementById('modal-calc').classList.add('hidden');
                const {g, c, el} = App.state.activeCell;
                this.placeMark(g, c, el);
            } else {
                // Wrong
                AudioSys.play('error');
                const box = document.querySelector('.calculator-layout');
                box.classList.add('shake');
                setTimeout(()=>box.classList.remove('shake'), 500);
                this.clearCalc();
            }
        },

        /* --- Move Logic --- */
        placeMark(gIdx, cIdx, cellEl) {
            const s = App.state;
            const currentP = s.turn === 'X' ? s.p1 : s.p2;
            
            // Visual
            cellEl.classList.add(s.turn.toLowerCase()); // add .x or .o class
            // To show Avatar if wanted, we could add textContent, 
            // but CSS uses colors. Let's add text for style.
            cellEl.textContent = currentP.avatar;

            // Logic
            this.checkSubGrid(gIdx);
            
            // Check Global Win
            if(this.checkGlobalWin()) return;

            // Set Constraint for next turn
            s.nextGrid = cIdx;
            // If target grid is full/won, free move
            if(s.grid[cIdx] !== null) {
                s.nextGrid = null;
            } else {
                // Also check if grid is full physically (draw)
                // (Simplified: assuming if grid status is null it's playable, 
                // but strictly should check if cells available)
                 const targetEl = document.getElementById(`grid-${cIdx}`);
                 if(targetEl.querySelectorAll('.cell:not(.x):not(.o)').length === 0) {
                     s.nextGrid = null;
                 }
            }

            // Freeze Logic Check
            if(s.activePower === 'freeze') {
                s.activePower = null;
                // Don't switch turn
                App.UI.updateHUD();
                this.highlightGrid();
            } else {
                this.switchTurn();
            }
        },

        checkSubGrid(gIdx) {
            const gEl = document.getElementById(`grid-${gIdx}`);
            const cells = Array.from(gEl.children);
            const turn = App.state.turn.toLowerCase(); // 'x' or 'o' class checking
            
            const wins = [
                [0,1,2],[3,4,5],[6,7,8], // Rows
                [0,3,6],[1,4,7],[2,5,8], // Cols
                [0,4,8],[2,4,6]          // Diagonals
            ];

            const isWon = wins.some(combo => 
                combo.every(i => cells[i].classList.contains(turn))
            );

            if(isWon) {
                App.state.grid[gIdx] = App.state.turn;
                gEl.classList.add('won', `winner-${turn}`);
                gEl.dataset.winner = App.state.turn === 'X' ? App.state.p1.avatar : App.state.p2.avatar;
                AudioSys.play('win_move');
            }
        },

        checkGlobalWin() {
            const grid = App.state.grid;
            const wins = [
                [0,1,2],[3,4,5],[6,7,8],
                [0,3,6],[1,4,7],[2,5,8],
                [0,4,8],[2,4,6]
            ];
            
            const winner = wins.find(combo => 
                grid[combo[0]] && 
                grid[combo[0]] === grid[combo[1]] && 
                grid[combo[0]] === grid[combo[2]]
            );

            if(winner) {
                AudioSys.play('win_game');
                const winName = grid[winner[0]] === 'X' ? App.state.p1.name : App.state.p2.name;
                document.getElementById('winner-text').textContent = `المنتصر: ${winName}`;
                document.getElementById('modal-win').classList.remove('hidden');
                
                // Score update
                if(grid[winner[0]] === 'X') App.state.p1.score++;
                else App.state.p2.score++;
                App.UI.updateHUD();
                
                return true;
            }
            return false;
        },

        switchTurn() {
            App.state.turn = App.state.turn === 'X' ? 'O' : 'X';
            App.state.activePower = null; // Reset powers
            this.highlightGrid();
            App.UI.updateHUD();
        },

        highlightGrid() {
            const next = App.state.nextGrid;
            for(let i=0; i<9; i++) {
                const el = document.getElementById(`grid-${i}`);
                el.classList.remove('active-zone');
                
                // If grid is won, it's never active
                if(App.state.grid[i] !== null) continue;

                // If next is null (free) or matches i, it's active
                if(next === null || next === i) {
                    el.classList.add('active-zone');
                }
            }
        }
    }
};

// Initialize
window.onload = () => {
    AudioSys.init();
    App.Game.init();
};
