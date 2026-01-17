/**
 * XO ULTIMATE - CORE LOGIC
 * Single File Engine
 */

/* 1. الصوت (Synthesizer) */
const AudioSys = {
    ctx: null,
    init() {
        if(!this.ctx) {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
    },
    play(type) {
        if(!this.ctx) this.init();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        if(type==='click') {
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(300, t+0.05);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t+0.05);
            osc.start(t); osc.stop(t+0.05);
        } else if(type==='move') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, t);
            osc.frequency.linearRampToValueAtTime(600, t+0.1);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0, t+0.15);
            osc.start(t); osc.stop(t+0.15);
        } else if(type==='error') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, t);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.linearRampToValueAtTime(0, t+0.3);
            osc.start(t); osc.stop(t+0.3);
        } else if(type==='win') {
            [400, 500, 600, 800].forEach((f, i) => {
                const o = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                o.frequency.value = f;
                g.gain.value = 0.05;
                g.gain.exponentialRampToValueAtTime(0.001, t+i*0.1+0.5);
                o.connect(g); g.connect(this.ctx.destination);
                o.start(t+i*0.1); o.stop(t+i*0.1+0.5);
            });
            return;
        }
        osc.connect(gain); gain.connect(this.ctx.destination);
    }
};

/* 2. التطبيق */
const App = {
    state: {
        mode: null,
        turn: 'X',
        grid: Array(9).fill(null),
        nextGrid: null,
        activePower: null,
        p1: { name: 'P1', avatar: 'X', score: 0, powers: {nuke:1, freeze:1, hack:1} },
        p2: { name: 'P2', avatar: 'O', score: 0, powers: {nuke:1, freeze:1, hack:1} },
        pendingMove: null,
        mathAns: 0
    },

    UI: {
        showScreen(id) {
            document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
            document.getElementById(id).classList.remove('hidden');
        },
        setTheme(t) {
            AudioSys.play('click');
            document.querySelectorAll('.theme-opt').forEach(b => b.classList.remove('active'));
            document.querySelector(`.theme-opt[data-theme="${t}"]`).classList.add('active');
            const r = document.documentElement;
            if(t==='matrix') { r.style.setProperty('--accent','#0f0'); r.style.setProperty('--p1','#0c0'); }
            else if(t==='royal') { r.style.setProperty('--accent','#9b59b6'); r.style.setProperty('--p1','#8e44ad'); }
            else { r.style.setProperty('--accent','#FFD700'); r.style.setProperty('--p1','#ef4444'); }
        },
        updateHUD() {
            const s = App.state;
            const p1 = document.getElementById('hud-p1');
            const p2 = document.getElementById('hud-p2');
            
            p1.querySelector('.av').textContent = s.p1.avatar;
            p2.querySelector('.av').textContent = s.p2.avatar;
            document.getElementById('score-x').textContent = s.p1.score;
            document.getElementById('score-o').textContent = s.p2.score;

            if(s.turn==='X') { p1.classList.add('active'); p2.classList.remove('active'); }
            else { p2.classList.add('active'); p1.classList.remove('active'); }

            const status = document.getElementById('game-status');
            const name = s.turn==='X' ? s.p1.name : s.p2.name;
            if(s.activePower) {
                status.style.color = 'var(--accent)';
                status.textContent = s.activePower==='nuke' ? `⚠️ اختر منطقة للتدمير!` : 
                                    s.activePower==='hack' ? `✋ اختر خلية للسرقة` : `❄️ تم التجميد`;
            } else {
                status.style.color = '#a1a1aa';
                status.textContent = `دور ${name}`;
            }

            // Power Buttons
            const cp = s.turn==='X' ? s.p1 : s.p2;
            ['nuke','freeze','hack'].forEach(k => {
                const btn = document.querySelector(`.btn-${k}`);
                btn.classList.remove('active');
                document.getElementById(`count-${k}`).textContent = cp.powers[k];
                btn.disabled = cp.powers[k] <= 0;
            });
            if(s.activePower) document.querySelector(`.btn-${s.activePower}`).classList.add('active');
        },
        openHelp(){ document.getElementById('modal-help').classList.remove('hidden'); },
        closeHelp(){ document.getElementById('modal-help').classList.add('hidden'); }
    },

    Core: {
        init() {
            document.getElementById('btn-login').onclick = () => {
                if(document.getElementById('access-code').value === '0000') {
                    AudioSys.play('move'); App.UI.showScreen('screen-setup');
                } else {
                    AudioSys.play('error'); document.getElementById('login-msg').textContent='رمز خاطئ';
                }
            };
            document.querySelectorAll('.av-btn').forEach(b => {
                b.onclick = function() {
                    AudioSys.play('click');
                    this.parentElement.querySelectorAll('.av-btn').forEach(x=>x.classList.remove('selected'));
                    this.classList.add('selected');
                }
            });
        },
        finishSetup() {
            const s = App.state;
            s.p1.name = document.getElementById('p1-name').value || 'P1';
            s.p2.name = document.getElementById('p2-name').value || 'P2';
            s.p1.avatar = document.querySelector('#p1-avatars .selected').dataset.val;
            s.p2.avatar = document.querySelector('#p2-avatars .selected').dataset.val;
            AudioSys.play('move'); App.UI.showScreen('screen-menu');
        },
        selectMode(m) {
            AudioSys.play('click'); App.state.mode = m; this.start();
        },
        start() {
            App.state.turn = 'X'; App.state.grid.fill(null); App.state.nextGrid = null; App.state.activePower=null;
            App.state.p1.powers = {nuke:1,freeze:1,hack:1}; App.state.p2.powers = {nuke:1,freeze:1,hack:1};
            this.buildGrid(); this.highLight(); App.UI.updateHUD(); App.UI.showScreen('screen-game');
        },
        exitGame() {
            if(confirm('خروج؟')) App.UI.showScreen('screen-menu');
        },
        buildGrid() {
            const box = document.getElementById('game-grid'); box.innerHTML='';
            for(let i=0; i<9; i++) {
                const sub = document.createElement('div'); sub.className='sub-grid'; sub.id=`grid-${i}`;
                for(let j=0; j<9; j++) {
                    const c = document.createElement('div'); c.className='cell';
                    c.onclick = () => this.handle(i, j, c);
                    sub.appendChild(c);
                }
                box.appendChild(sub);
            }
        },
        highLight() {
            const s = App.state;
            for(let i=0; i<9; i++) {
                const g = document.getElementById(`grid-${i}`); g.classList.remove('active-zone');
                if(s.grid[i]!==null) continue;
                if(s.nextGrid===null || s.nextGrid===i) g.classList.add('active-zone');
            }
        },
        activatePower(k) {
            const s = App.state; const p = s.turn==='X'?s.p1:s.p2;
            if(p.powers[k]<=0) return;
            AudioSys.play('click');
            if(k==='freeze') {
                p.powers.freeze--; s.activePower='freeze'; App.UI.updateHUD();
            } else {
                s.activePower = s.activePower===k ? null : k; App.UI.updateHUD();
            }
        },
        handle(g, c, el) {
            const s = App.state;
            if(s.activePower==='nuke') { this.doNuke(g); return; }
            if(s.activePower==='hack') { this.doHack(el); return; }

            if(el.classList.contains('x')||el.classList.contains('o')) return;
            if(s.grid[g]!==null) return;
            if(s.nextGrid!==null && s.nextGrid!==g) {
                AudioSys.play('error');
                const t = document.getElementById(`grid-${s.nextGrid}`);
                t.classList.add('shake'); setTimeout(()=>t.classList.remove('shake'),400);
                return;
            }

            if(s.mode==='strategy') {
                AudioSys.play('move'); this.move(g, c, el);
            } else {
                AudioSys.play('click'); this.math(g, c, el);
            }
        },
        math(g, c, el) {
            App.state.pendingMove = {g,c,el};
            let q='', a=0;
            const n1=Math.floor(Math.random()*8)+2, n2=Math.floor(Math.random()*8)+2;
            if(App.state.mode==='clash') { q=`${n1} × ${n2}`; a=n1*n2; }
            else if(App.state.mode==='code') { const sum=n1+n2; q=`${n1} + ؟ = ${sum}`; a=n2; }
            else if(App.state.mode==='duality') { const n=Math.floor(Math.random()*50)+1; q=`${n}: فردي(1) زوجي(2)`; a=n%2===0?2:1; }
            else { q=`(${n1}×${n2}) + ${Math.floor(Math.random()*5)+1}`; a=(n1*n2)+(Math.floor(Math.random()*5)+1); } // Genius approx logic fix
            
            App.state.mathAns = a;
            document.getElementById('calc-q').textContent = q + ' = ؟';
            document.getElementById('calc-a').textContent = '_';
            document.getElementById('modal-calc').classList.remove('hidden');
            const bar = document.getElementById('timer-bar'); bar.style.width='100%'; setTimeout(()=>bar.style.width='0%',50);
        },
        typeNum(n) {
            const d = document.getElementById('calc-a');
            if(d.textContent==='_') d.textContent='';
            if(d.textContent.length<3) d.textContent+=n;
        },
        clearCalc() { document.getElementById('calc-a').textContent='_'; },
        submitCalc() {
            const v = parseInt(document.getElementById('calc-a').textContent);
            if(v===App.state.mathAns) {
                AudioSys.play('move'); document.getElementById('modal-calc').classList.add('hidden');
                const {g,c,el} = App.state.pendingMove; this.move(g,c,el);
            } else {
                AudioSys.play('error'); this.clearCalc();
            }
        },
        move(g, c, el) {
            const s = App.state; const p = s.turn==='X'?s.p1:s.p2;
            el.classList.add(s.turn.toLowerCase());
            this.checkSub(g);
            if(this.checkWin()) return;
            
            s.nextGrid = c;
            const target = document.getElementById(`grid-${c}`);
            if(s.grid[c]!==null || target.querySelectorAll('.cell:not(.x):not(.o)').length===0) s.nextGrid = null;

            if(s.activePower==='freeze') { s.activePower=null; App.UI.updateHUD(); this.highLight(); }
            else { s.turn = s.turn==='X'?'O':'X'; s.activePower=null; this.highLight(); App.UI.updateHUD(); }
        },
        doNuke(g) {
            const s=App.state; const p=s.turn==='X'?s.p1:s.p2;
            AudioSys.play('move');
            const box=document.getElementById(`grid-${g}`);
            Array.from(box.children).forEach(c=>c.className='cell');
            box.className='sub-grid'; box.removeAttribute('data-winner'); s.grid[g]=null;
            p.powers.nuke--; s.activePower=null;
            s.turn = s.turn==='X'?'O':'X'; this.highLight(); App.UI.updateHUD();
        },
        doHack(el) {
            const s=App.state; const opp=s.turn==='X'?'o':'x';
            if(!el.classList.contains(opp)) { AudioSys.play('error'); return; }
            AudioSys.play('move');
            el.classList.remove(opp); el.classList.add(s.turn.toLowerCase());
            const p=s.turn==='X'?s.p1:s.p2; p.powers.hack--; s.activePower=null;
            const g = parseInt(el.parentElement.id.split('-')[1]); this.checkSub(g);
            s.turn = s.turn==='X'?'O':'X'; this.highLight(); App.UI.updateHUD();
        },
        checkSub(g) {
            const s=App.state; if(s.grid[g]!==null) return;
            const el=document.getElementById(`grid-${g}`);
            const cells=Array.from(el.children); const t=s.turn.toLowerCase();
            const wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
            if(wins.some(w=>w.every(i=>cells[i].classList.contains(t)))) {
                s.grid[g]=s.turn; el.classList.add('won', `winner-${s.turn}`);
                el.setAttribute('data-winner', s.turn==='X'?s.p1.avatar:s.p2.avatar);
                AudioSys.play('win');
            }
        },
        checkWin() {
            const g=App.state.grid;
            const wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
            const w = wins.find(c => g[c[0]] && g[c[0]]===g[c[1]] && g[c[0]]===g[c[2]]);
            if(w) {
                const name = g[w[0]]==='X'?App.state.p1.name:App.state.p2.name;
                document.getElementById('winner-name').textContent = name;
                document.getElementById('modal-win').classList.remove('hidden');
                AudioSys.play('win'); return true;
            }
            return false;
        }
    }
};
window.onload = () => { AudioSys.init(); App.Core.init(); };
