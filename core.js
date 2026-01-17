/**
 * XO ULTIMATE - PRO EDITION (CORE ENGINE)
 * Integrated Logic & Data
 */

/* ===========================
   1. DATABASE (The Levels)
   =========================== */
const GameLevels = {
    // 1. المواجهة (Clash) - عمليات مباشرة
    clash: {
        pool: [
            {q:"1+1",a:2}, {q:"1+2",a:3}, {q:"2*2",a:4}, {q:"3*3",a:9}, {q:"4/2",a:2}, {q:"10-5",a:5},
            {q:"5*5",a:25}, {q:"6+6",a:12}, {q:"8/4",a:2}, {q:"9-3",a:6}, {q:"7*7",a:49}, {q:"3+7",a:10},
            {q:"8*8",a:64}, {q:"9*9",a:81}, {q:"12/4",a:3}, {q:"15-7",a:8}, {q:"6*7",a:42}, {q:"4*8",a:32}
        ],
        init() { return this.pool.sort(()=>Math.random()-0.5); },
        ui(item) {
            const txt = item.q.replace(/\*/g,'×').replace(/\//g,'÷');
            return { html: `<div class="pro-font">${txt}</div>`, slots: 1 };
        },
        check(input, item) { return parseInt(input[0]) === item.a; }
    },

    // 2. الشيفرة (Code) - المجهول
    code: {
        pool: [
            {q:"?+1=2",a:1}, {q:"?-1=0",a:1}, {q:"?*2=4",a:2}, {q:"?/2=2",a:4}, {q:"3+?=6",a:3},
            {q:"5-?=2",a:3}, {q:"4*?=16",a:4}, {q:"10/?=2",a:5}, {q:"?+5=10",a:5}, {q:"?-3=7",a:10},
            {q:"?*3=21",a:7}, {q:"?/3=3",a:9}, {q:"8+?=16",a:8}, {q:"9-?=4",a:5}, {q:"6*?=36",a:6}
        ],
        init() { return this.pool.sort(()=>Math.random()-0.5); },
        ui(item) {
            const txt = item.q.replace(/\*/g,'×').replace(/\//g,'÷').replace(/\?/g,'<span style="color:var(--accent)">?</span>');
            return { html: `<div class="pro-font">${txt}</div>`, slots: 1 };
        },
        check(input, item) { return parseInt(input[0]) === item.a; }
    },

    // 3. الثنائيات (Duality) - الأزواج
    duality: {
        pool: [
            {t:4,op:"*",p:[[2,2]]}, {t:6,op:"*",p:[[2,3],[3,2]]}, {t:10,op:"+",p:[[5,5],[6,4],[4,6],[3,7],[7,3]]},
            {t:12,op:"*",p:[[3,4],[4,3],[2,6],[6,2]]}, {t:8,op:"-",p:[[9,1]]}, {t:2,op:"/",p:[[4,2],[6,3],[8,4]]},
            {t:9,op:"*",p:[[3,3]]}, {t:15,op:"*",p:[[3,5],[5,3]]}, {t:16,op:"*",p:[[4,4],[2,8],[8,2]]}
        ],
        init() { return this.pool.sort(()=>Math.random()-0.5); },
        ui(item) {
            const opName = item.op==='*'?'ضرب':item.op==='+'?'جمع':item.op==='-'?'طرح':'قسمة';
            return { 
                html: `<div>أوجد رقمين ناتجهما <b>${item.t}</b> (${opName})</div>`, 
                slots: 2 
            };
        },
        check(input, item) {
            const v1=parseInt(input[0]), v2=parseInt(input[1]);
            return item.p.some(pair => (pair[0]===v1 && pair[1]===v2) || (pair[0]===v2 && pair[1]===v1));
        }
    },

    // 4. الميزان (Balance) - 90/10 Logic
    balance: {
        easy: [
            {q:"1+5=?*3",a:2}, {q:"9-1=?*4",a:2}, {q:"1*6=?+4",a:2}, {q:"8/1=?+5",a:3}, {q:"1+1=?*1",a:2}
        ],
        hard: [
            {q:"2+6=?*4",a:2}, {q:"3*4=?+5",a:7}, {q:"9-3=?/1",a:6}, {q:"8/2=9-?",a:5},
            {q:"4+5=?*3",a:3}, {q:"2*9=?+10",a:8}, {q:"12-4=?*2",a:4}, {q:"15/3=?+2",a:3},
            {q:"7+7=?+8",a:6}, {q:"5*5=?+16",a:9}, {q:"9+9=?*6",a:3}, {q:"6*6=?+20",a:16}
        ],
        init() {
            // الخوارزمية 90/10: دمج عشوائي
            const hardSet = [...this.hard].sort(()=>Math.random()-0.5);
            const easySet = [...this.easy].sort(()=>Math.random()-0.5);
            return [...hardSet, ...easySet].sort(()=>Math.random()-0.5);
        },
        ui(item) {
            const txt = item.q.replace(/\*/g,'×').replace(/\//g,'÷');
            return { html: `<div class="pro-font">${txt}</div>`, slots: 1 };
        },
        check(input, item) { return parseInt(input[0]) === item.a; }
    }
};

/* ===========================
   2. APP LOGIC
   =========================== */
const App = {
    state: {
        mode: null,
        turn: 'X',
        grid: Array(9).fill(null),
        nextGrid: null,
        activePower: null,
        p1: { name:'P1', avatar:'X', score:0, powers:{nuke:1, freeze:1, hack:1} },
        p2: { name:'P2', avatar:'O', score:0, powers:{nuke:1, freeze:1, hack:1} },
        pendingTask: null, // { g, c, el }
        inputBuffer: [],
        configPin: '0000'
    },

    /* --- UI Manager --- */
    UI: {
        showScreen(id) {
            document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
            document.getElementById(id).classList.remove('hidden');
        },
        toggleHelp() {
            const el = document.getElementById('modal-help');
            el.classList.toggle('hidden');
        },
        updateHUD() {
            const s = App.state;
            const p1 = document.getElementById('hud-p1');
            const p2 = document.getElementById('hud-p2');
            
            p1.querySelector('.av').textContent = s.p1.avatar;
            p2.querySelector('.av').textContent = s.p2.avatar;
            document.getElementById('score-x').textContent = s.p1.score;
            document.getElementById('score-o').textContent = s.p2.score;

            if(s.turn === 'X') { p1.classList.add('active'); p2.classList.remove('active'); }
            else { p2.classList.add('active'); p1.classList.remove('active'); }

            const status = document.getElementById('game-status');
            const pName = s.turn==='X' ? s.p1.name : s.p2.name;
            if(s.activePower) {
                status.textContent = s.activePower==='nuke' ? `⚠️ اختر منطقة للتدمير` :
                                     s.activePower==='hack' ? `✋ اختر خلية للسرقة` : `❄️ تم التجميد`;
                status.style.background = 'var(--text-main)';
            } else {
                status.textContent = `دور ${pName}`;
                status.style.background = s.turn==='X'?'var(--p1)':'var(--p2)';
            }

            // Power Dots
            const cp = s.turn==='X' ? s.p1 : s.p2;
            ['nuke','freeze','hack'].forEach(k => {
                const btn = document.querySelector(`.btn-${k}`);
                const dot = document.getElementById(`dot-${k}`);
                btn.classList.remove('active');
                if(cp.powers[k] > 0) {
                    btn.disabled = false; dot.style.display = 'block';
                } else {
                    btn.disabled = true; dot.style.display = 'none';
                }
            });
            if(s.activePower) document.querySelector(`.btn-${s.activePower}`).classList.add('active');
        },
        
        // Calculator Inputs
        setupCalc(uiData) {
            const container = document.getElementById('calc-inputs-container');
            container.innerHTML = '';
            document.getElementById('calc-q-container').innerHTML = uiData.html;
            App.state.inputBuffer = [];
            
            for(let i=0; i<uiData.slots; i++) {
                const slot = document.createElement('div');
                slot.className = 'calc-slot';
                slot.id = `slot-${i}`;
                if(i===0) slot.classList.add('active');
                container.appendChild(slot);
                App.state.inputBuffer.push('');
            }
        },
        type(n) {
            const idx = App.state.inputBuffer.findIndex(v => v === '');
            if(idx !== -1) {
                App.state.inputBuffer[idx] = n;
                document.getElementById(`slot-${idx}`).textContent = n;
                document.querySelectorAll('.calc-slot').forEach(e=>e.classList.remove('active'));
                if(idx+1 < App.state.inputBuffer.length) {
                    document.getElementById(`slot-${idx+1}`).classList.add('active');
                }
            }
        },
        del() {
            // Find last filled
            let idx = -1;
            for(let i=App.state.inputBuffer.length-1; i>=0; i--) {
                if(App.state.inputBuffer[i] !== '') { idx = i; break; }
            }
            if(idx !== -1) {
                App.state.inputBuffer[idx] = '';
                document.getElementById(`slot-${idx}`).textContent = '';
                document.querySelectorAll('.calc-slot').forEach(e=>e.classList.remove('active'));
                document.getElementById(`slot-${idx}`).classList.add('active');
            }
        },
        submit() {
            // Check if full
            if(App.state.inputBuffer.includes('')) return; // Not finished
            App.Core.verifyAnswer();
        }
    },

    /* --- Core Engine --- */
    Core: {
        async login() {
            // Fetch Config
            try {
                const res = await fetch('config.json');
                const conf = await res.json();
                App.state.configPin = conf.access_pin;
            } catch(e) { console.log('Config default'); }

            const pin = document.getElementById('pin-input').value;
            if(pin === App.state.configPin) {
                App.UI.showScreen('screen-setup');
            } else {
                document.getElementById('login-msg').textContent = 'رمز الدخول غير صحيح';
            }
        },
        saveSetup() {
            App.state.p1.name = document.getElementById('p1-name').value || 'P1';
            App.state.p2.name = document.getElementById('p2-name').value || 'P2';
            
            // Avatar selection logic (simplified)
            const getAv = (id) => document.querySelector(`#${id} .selected`).dataset.val;
            App.state.p1.avatar = getAv('p1-avatars');
            App.state.p2.avatar = getAv('p2-avatars');

            App.UI.showScreen('screen-menu');
        },
        startGame(mode) {
            App.state.mode = mode;
            App.state.turn = 'X';
            App.state.grid.fill(null);
            App.state.nextGrid = null;
            App.state.activePower = null;
            App.state.p1.powers = {nuke:1, freeze:1, hack:1};
            App.state.p2.powers = {nuke:1, freeze:1, hack:1};
            
            this.buildGrid();
            this.highlight();
            App.UI.updateHUD();
            App.UI.showScreen('screen-game');
        },
        exitGame() {
            if(confirm('هل تريد الخروج؟')) App.UI.showScreen('screen-menu');
        },
        buildGrid() {
            const grid = document.getElementById('game-grid');
            grid.innerHTML = '';
            for(let i=0; i<9; i++) {
                const sub = document.createElement('div');
                sub.className = 'sub-grid';
                sub.id = `grid-${i}`;
                for(let j=0; j<9; j++) {
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    cell.onclick = () => this.handleCell(i, j, cell);
                    sub.appendChild(cell);
                }
                grid.appendChild(sub);
            }
        },
        highlight() {
            const s = App.state;
            for(let i=0; i<9; i++) {
                const g = document.getElementById(`grid-${i}`);
                g.classList.remove('active-zone');
                if(s.grid[i] !== null) continue;
                if(s.nextGrid === null || s.nextGrid === i) g.classList.add('active-zone');
            }
        },
        usePower(type) {
            const s = App.state;
            const p = s.turn === 'X' ? s.p1 : s.p2;
            if(p.powers[type] <= 0) return;

            if(type === 'freeze') {
                p.powers.freeze--;
                s.activePower = 'freeze';
                App.UI.updateHUD();
            } else {
                s.activePower = (s.activePower === type) ? null : type;
                App.UI.updateHUD();
            }
        },
        handleCell(g, c, el) {
            const s = App.state;
            
            // Powers Logic
            if(s.activePower === 'nuke') { this.doNuke(g); return; }
            if(s.activePower === 'hack') { this.doHack(el); return; }

            // Validation
            if(el.classList.contains('x') || el.classList.contains('o')) return;
            if(s.grid[g] !== null) return;
            if(s.nextGrid !== null && s.nextGrid !== g) return;

            // Strategy vs Math
            if(s.mode === 'strategy') {
                this.finalizeMove(g, c, el);
            } else {
                this.triggerMath(g, c, el);
            }
        },
        triggerMath(g, c, el) {
            const s = App.state;
            s.pendingTask = { g, c, el, question: null };
            
            // Get Question from Level Data
            const levelData = GameLevels[s.mode];
            // Simple random pick for demo (real app should maintain pool)
            const qItem = levelData.pool[Math.floor(Math.random() * levelData.pool.length)];
            s.pendingTask.question = qItem;
            
            // Render UI
            const uiConfig = levelData.ui(qItem);
            App.UI.setupCalc(uiConfig);
            
            document.getElementById('modal-calc').classList.remove('hidden');
            // Timer Animation
            const bar = document.getElementById('timer-progress');
            bar.style.width = '100%';
            setTimeout(()=>bar.style.width='0%', 50);
        },
        verifyAnswer() {
            const s = App.state;
            const levelData = GameLevels[s.mode];
            const isCorrect = levelData.check(s.inputBuffer, s.pendingTask.question);
            
            document.getElementById('modal-calc').classList.add('hidden');
            
            if(isCorrect) {
                const { g, c, el } = s.pendingTask;
                this.finalizeMove(g, c, el);
            } else {
                // Error feedback (shake)
                const arena = document.querySelector('.game-arena');
                arena.style.animation = 'none';
                void arena.offsetWidth; // trigger reflow
                arena.style.animation = 'shake 0.5s';
            }
        },
        finalizeMove(g, c, el) {
            const s = App.state;
            const p = s.turn === 'X' ? s.p1 : s.p2;
            
            el.classList.add(s.turn.toLowerCase());
            
            this.checkSubWin(g);
            if(this.checkGameWin()) return;
            
            // Next Grid Logic
            const targetGrid = document.getElementById(`grid-${c}`);
            const isFull = targetGrid.querySelectorAll('.cell:not(.x):not(.o)').length === 0;
            
            if(s.grid[c] !== null || isFull) {
                s.nextGrid = null;
            } else {
                s.nextGrid = c;
            }

            if(s.activePower === 'freeze') {
                s.activePower = null;
                App.UI.updateHUD();
                this.highlight();
            } else {
                s.turn = (s.turn === 'X') ? 'O' : 'X';
                s.activePower = null;
                this.highlight();
                App.UI.updateHUD();
            }
        },
        doNuke(g) {
            const s = App.state;
            const p = s.turn === 'X' ? s.p1 : s.p2;
            
            const box = document.getElementById(`grid-${g}`);
            Array.from(box.children).forEach(c => c.className = 'cell');
            box.className = 'sub-grid';
            box.removeAttribute('data-winner');
            s.grid[g] = null;
            
            p.powers.nuke--;
            s.activePower = null;
            s.turn = (s.turn === 'X') ? 'O' : 'X';
            this.highlight();
            App.UI.updateHUD();
        },
        doHack(el) {
            const s = App.state;
            const opp = s.turn === 'X' ? 'o' : 'x';
            if(!el.classList.contains(opp)) return;
            
            el.classList.remove(opp);
            el.classList.add(s.turn.toLowerCase());
            
            const p = s.turn === 'X' ? s.p1 : s.p2;
            p.powers.hack--;
            s.activePower = null;
            
            const g = parseInt(el.parentElement.id.split('-')[1]);
            this.checkSubWin(g);
            
            s.turn = (s.turn === 'X') ? 'O' : 'X';
            this.highlight();
            App.UI.updateHUD();
        },
        checkSubWin(g) {
            const s = App.state;
            if(s.grid[g] !== null) return;
            
            const el = document.getElementById(`grid-${g}`);
            const cells = Array.from(el.children);
            const t = s.turn.toLowerCase();
            const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
            
            if(wins.some(w => w.every(i => cells[i].classList.contains(t)))) {
                s.grid[g] = s.turn;
                el.classList.add('won', `winner-${s.turn}`);
                el.setAttribute('data-winner', s.turn==='X'?s.p1.avatar:s.p2.avatar);
            }
        },
        checkGameWin() {
            const g = App.state.grid;
            const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
            const w = wins.find(c => g[c[0]] && g[c[0]]===g[c[1]] && g[c[0]]===g[c[2]]);
            
            if(w) {
                const name = g[w[0]] === 'X' ? App.state.p1.name : App.state.p2.name;
                document.getElementById('winner-name').textContent = name;
                document.getElementById('modal-win').classList.remove('hidden');
                return true;
            }
            return false;
        },
        rematch() {
            document.getElementById('modal-win').classList.add('hidden');
            this.startGame(App.state.mode);
        }
    }
};

/* --- Selectors Logic (Avatars) --- */
document.querySelectorAll('.av-btn').forEach(btn => {
    btn.onclick = function() {
        this.parentElement.querySelectorAll('.av-btn').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
    }
});
