/**
 * XO ULTIMATE - CORE ENGINE
 * Console Edition | Single File Architecture
 */

/* ===========================
   1. نظام الصوت (Synthesizer)
   =========================== */
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
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // مكتبة النغمات
        if (type === 'click') {
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
            osc.start(t); osc.stop(t + 0.05);
        } 
        else if (type === 'move') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, t);
            osc.frequency.linearRampToValueAtTime(600, t + 0.1);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.15);
            osc.start(t); osc.stop(t + 0.15);
        }
        else if (type === 'error') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.linearRampToValueAtTime(50, t + 0.3);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.3);
            osc.start(t); osc.stop(t + 0.3);
        }
        else if (type === 'power') { 
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.linearRampToValueAtTime(1000, t + 0.5);
            gain.gain.setValueAtTime(0.05, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.5);
            osc.start(t); osc.stop(t + 0.5);
        }
        else if (type === 'win') {
            // نغمة الاحتفال
            [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
                const o = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                o.frequency.value = f;
                g.gain.value = 0.1;
                g.gain.exponentialRampToValueAtTime(0.01, t + i*0.1 + 0.5);
                o.connect(g); g.connect(this.ctx.destination);
                o.start(t + i*0.1); o.stop(t + i*0.1 + 0.5);
            });
            return;
        }

        osc.connect(gain);
        gain.connect(this.ctx.destination);
    }
};

/* ===========================
   2. التطبيق (App State & Logic)
   =========================== */
const App = {
    state: {
        mode: null,      // strategy, clash, code, duality, genius
        turn: 'X',
        grid: Array(9).fill(null), // حالة المربعات الكبيرة (null, X, O)
        nextGrid: null,  // الإجبار (index) أو حر (null)
        activePower: null,
        
        // بيانات اللاعبين
        p1: { name: 'اللاعب 1', avatar: 'X', score: 0, powers: { nuke: 1, freeze: 1, hack: 1 } },
        p2: { name: 'اللاعب 2', avatar: 'O', score: 0, powers: { nuke: 1, freeze: 1, hack: 1 } },
        
        // بيانات الرياضيات المؤقتة
        mathAns: 0,
        pendingMove: null // {g, c, el}
    },

    /* --- وحدة الواجهة (UI) --- */
    UI: {
        showScreen(id) {
            document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
            const target = document.getElementById(id);
            target.classList.remove('hidden');
        },

        setTheme(theme) {
            AudioSys.play('click');
            // تحديث الأزرار
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            document.querySelector(`.theme-btn[data-theme="${theme}"]`).classList.add('active');
            
            // تغيير متغيرات الألوان
            const r = document.documentElement;
            if(theme === 'matrix') {
                r.style.setProperty('--accent', '#00ff00');
                r.style.setProperty('--p1', '#00cc00');
            } else if(theme === 'royal') {
                r.style.setProperty('--accent', '#9b59b6');
                r.style.setProperty('--p1', '#8e44ad');
            } else { // Plasma
                r.style.setProperty('--accent', '#FFD700');
                r.style.setProperty('--p1', '#f43f5e');
            }
        },

        updateHUD() {
            const s = App.state;
            const p1Badge = document.getElementById('hud-p1');
            const p2Badge = document.getElementById('hud-p2');

            // الأسماء والأفاتار
            p1Badge.querySelector('.av').textContent = s.p1.avatar;
            p2Badge.querySelector('.av').textContent = s.p2.avatar;
            document.getElementById('score-x').textContent = s.p1.score;
            document.getElementById('score-o').textContent = s.p2.score;

            // تمييز الدور
            if(s.turn === 'X') {
                p1Badge.classList.add('active'); p2Badge.classList.remove('active');
            } else {
                p2Badge.classList.add('active'); p1Badge.classList.remove('active');
            }

            // رسالة الحالة العائمة
            const status = document.getElementById('game-status');
            const pName = s.turn === 'X' ? s.p1.name : s.p2.name;
            
            if(s.activePower) {
                status.style.color = 'var(--accent)';
                if(s.activePower === 'nuke') status.textContent = `⚠️ ${pName}: اختر منطقة للتدمير!`;
                else if(s.activePower === 'hack') status.textContent = `✋ ${pName}: اختر خلية للسرقة!`;
                else status.textContent = `❄️ ${pName}: تم التجميد! العب مرة أخرى.`;
            } else {
                status.style.color = '#fff';
                status.textContent = `دور ${pName} (${s.turn === 'X' ? s.p1.avatar : s.p2.avatar})`;
            }

            // تحديث أزرار القدرات
            const currP = s.turn === 'X' ? s.p1 : s.p2;
            ['nuke', 'freeze', 'hack'].forEach(type => {
                const btn = document.querySelector(`.btn-${type}`);
                btn.classList.remove('active');
                
                // تحديث العداد
                document.getElementById(`count-${type}`).textContent = currP.powers[type];

                if(currP.powers[type] <= 0) btn.disabled = true;
                else btn.disabled = false;
            });

            if(s.activePower) document.querySelector(`.btn-${s.activePower}`).classList.add('active');
        },

        // Modals
        openHelp() { document.getElementById('modal-help').classList.remove('hidden'); },
        closeHelp() { document.getElementById('modal-help').classList.add('hidden'); }
    },

    /* --- المنطق الأساسي (Core) --- */
    Core: {
        init() {
            // زر الدخول
            document.getElementById('btn-login').onclick = () => {
                const val = document.getElementById('access-code').value;
                if(val === '0000') {
                    AudioSys.play('move');
                    App.UI.showScreen('screen-setup');
                } else {
                    AudioSys.play('error');
                    document.getElementById('login-msg').textContent = 'الرمز خاطئ ❌';
                }
            };

            // اختيار الأفاتار
            document.querySelectorAll('.av-btn').forEach(btn => {
                btn.onclick = function() {
                    AudioSys.play('click');
                    const parent = this.parentElement;
                    parent.querySelectorAll('.av-btn').forEach(b => b.classList.remove('selected'));
                    this.classList.add('selected');
                }
            });
        },

        finishSetup() {
            // حفظ البيانات
            App.state.p1.name = document.getElementById('setup-p1-name').value || 'اللاعب 1';
            App.state.p2.name = document.getElementById('setup-p2-name').value || 'اللاعب 2';
            App.state.p1.avatar = document.querySelector('#p1-avatars .selected').dataset.val;
            App.state.p2.avatar = document.querySelector('#p2-avatars .selected').dataset.val;
            
            AudioSys.play('move');
            App.UI.showScreen('screen-menu');
        },

        selectMode(mode) {
            AudioSys.play('click');
            App.state.mode = mode;
            this.startGame();
        },

        startGame() {
            // تصفير اللعبة
            App.state.turn = 'X';
            App.state.grid = Array(9).fill(null);
            App.state.nextGrid = null;
            App.state.activePower = null;
            // إعادة شحن القوى
            App.state.p1.powers = { nuke: 1, freeze: 1, hack: 1 };
            App.state.p2.powers = { nuke: 1, freeze: 1, hack: 1 };

            this.buildGrid();
            this.highlightGrid();
            App.UI.updateHUD();
            App.UI.showScreen('screen-game');
        },

        exitGame() {
            if(confirm('الخروج من المباراة؟')) {
                App.UI.showScreen('screen-menu');
            }
        },

        buildGrid() {
            const container = document.getElementById('game-grid');
            container.innerHTML = '';
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
                container.appendChild(sub);
            }
        },

        highlightGrid() {
            const s = App.state;
            for(let i=0; i<9; i++) {
                const g = document.getElementById(`grid-${i}`);
                g.classList.remove('active-zone');
                
                // إذا المربع الكبير منتهي، لا يضيء
                if(s.grid[i] !== null) continue;

                // يضيء إذا كان حراً أو هو المختار
                if(s.nextGrid === null || s.nextGrid === i) {
                    g.classList.add('active-zone');
                }
            }
        },

        activatePower(type) {
            const s = App.state;
            const p = s.turn === 'X' ? s.p1 : s.p2;

            if(p.powers[type] <= 0) return;

            AudioSys.play('power');
            
            if(type === 'freeze') {
                p.powers.freeze--;
                s.activePower = 'freeze';
                App.UI.updateHUD();
            } else {
                // toggle
                if(s.activePower === type) s.activePower = null;
                else s.activePower = type;
                App.UI.updateHUD();
            }
        },

        handleCell(gIdx, cIdx, el) {
            const s = App.state;

            // 1. معالجة القوى
            if(s.activePower === 'nuke') {
                this.executeNuke(gIdx);
                return;
            }
            if(s.activePower === 'hack') {
                this.executeHack(el);
                return;
            }

            // 2. التحقق العادي
            if(el.classList.contains('x') || el.classList.contains('o')) return; // مشغولة
            if(s.grid[gIdx] !== null) return; // المربع الكبير منتهي
            
            // تحقق الإجبار
            if(s.nextGrid !== null && s.nextGrid !== gIdx) {
                AudioSys.play('error');
                const correct = document.getElementById(`grid-${s.nextGrid}`);
                correct.classList.add('shake');
                setTimeout(()=>correct.classList.remove('shake'), 400);
                return;
            }

            // 3. التنفيذ حسب النمط
            if(s.mode === 'strategy') {
                AudioSys.play('click');
                this.finalizeMove(gIdx, cIdx, el);
            } else {
                AudioSys.play('click');
                this.openCalc(gIdx, cIdx, el);
            }
        },

        // --- الحاسبة ---
        openCalc(g, c, el) {
            const s = App.state;
            s.pendingMove = {g, c, el};
            
            let q='', ans=0;
            const n1 = Math.floor(Math.random()*8)+2;
            const n2 = Math.floor(Math.random()*8)+2;

            if(s.mode === 'clash') {
                q = `${n1} × ${n2}`; ans = n1*n2;
            } else if(s.mode === 'code') {
                const sum = n1+n2; q=`${n1} + ؟ = ${sum}`; ans=n2;
            } else if(s.mode === 'duality') {
                const num = Math.floor(Math.random()*50)+1;
                q=`${num}: فردي(1) زوجي(2)؟`; ans=(num%2===0)?2:1;
            } else if(s.mode === 'genius') {
                const n3 = Math.floor(Math.random()*5)+1;
                q=`(${n1}×${n2}) + ${n3}`; ans=(n1*n2)+n3;
            }

            s.mathAns = ans;
            document.getElementById('calc-q').textContent = q;
            document.getElementById('calc-a').textContent = '_';
            document.getElementById('modal-calc').classList.remove('hidden');
            
            // Timer Animation
            const bar = document.getElementById('timer-fill');
            bar.style.width = '100%';
            setTimeout(()=>bar.style.width='0%', 50);
        },

        typeNum(n) {
            const d = document.getElementById('calc-a');
            if(d.textContent === '_') d.textContent = '';
            if(d.textContent.length < 3) d.textContent += n;
        },
        clearCalc() { document.getElementById('calc-a').textContent = '_'; },
        
        submitCalc() {
            const val = parseInt(document.getElementById('calc-a').textContent);
            if(val === App.state.mathAns) {
                AudioSys.play('move');
                document.getElementById('modal-calc').classList.add('hidden');
                const {g, c, el} = App.state.pendingMove;
                this.finalizeMove(g, c, el);
            } else {
                AudioSys.play('error');
                const box = document.querySelector('.calc-box');
                box.classList.add('shake');
                setTimeout(()=>box.classList.remove('shake'), 400);
                this.clearCalc();
            }
        },

        // --- تنفيذ الحركة ---
        finalizeMove(gIdx, cIdx, el) {
            const s = App.state;
            const p = s.turn === 'X' ? s.p1 : s.p2;

            // الرسم
            el.classList.add(s.turn.toLowerCase());
            // el.textContent = p.avatar; // (اختياري: إظهار الأفاتار داخل الخلية)

            // التحقق من فوز المربع الصغير
            this.checkSubGrid(gIdx);
            
            // التحقق من الفوز الكبير
            if(this.checkGlobalWin()) return;

            // تحديد القيد التالي
            s.nextGrid = cIdx;
            // إذا الهدف ممتلئ/منتهي، حرر اللعب
            if(s.grid[cIdx] !== null) {
                s.nextGrid = null;
            } else {
                // فحص الامتلاء الفيزيائي (تعادل)
                const targetEl = document.getElementById(`grid-${cIdx}`);
                const empty = targetEl.querySelectorAll('.cell:not(.x):not(.o)').length;
                if(empty === 0) s.nextGrid = null;
            }

            // التجميد
            if(s.activePower === 'freeze') {
                s.activePower = null;
                App.UI.updateHUD();
                this.highlightGrid();
            } else {
                this.switchTurn();
            }
        },

        // --- القدرات ---
        executeNuke(gIdx) {
            const s = App.state;
            const p = s.turn === 'X' ? s.p1 : s.p2;

            AudioSys.play('power');
            const gEl = document.getElementById(`grid-${gIdx}`);
            
            // مسح الكلاسات
            Array.from(gEl.children).forEach(c => {
                c.className = 'cell';
            });
            gEl.className = 'sub-grid';
            gEl.removeAttribute('data-winner');
            s.grid[gIdx] = null; // إعادة المربع للعب

            p.powers.nuke--;
            s.activePower = null;
            this.switchTurn();
        },

        executeHack(el) {
            const s = App.state;
            const p = s.turn === 'X' ? s.p1 : s.p2;
            const opp = s.turn === 'X' ? 'o' : 'x';

            if(!el.classList.contains(opp)) {
                AudioSys.play('error');
                return;
            }

            AudioSys.play('move');
            el.classList.remove(opp);
            el.classList.add(s.turn.toLowerCase());
            
            p.powers.hack--;
            s.activePower = null;

            // فحص إذا الاستحواذ سبب فوزاً
            const gIdx = parseInt(el.parentElement.id.split('-')[1]);
            this.checkSubGrid(gIdx);

            this.switchTurn();
        },

        // --- منطق الفوز ---
        checkSubGrid(gIdx) {
            const s = App.state;
            if(s.grid[gIdx] !== null) return;

            const gEl = document.getElementById(`grid-${gIdx}`);
            const cells = Array.from(gEl.children);
            const t = s.turn.toLowerCase();
            
            const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
            
            const won = wins.some(c => c.every(i => cells[i].classList.contains(t)));
            
            if(won) {
                s.grid[gIdx] = s.turn;
                gEl.classList.add('won', `winner-${s.turn}`);
                gEl.setAttribute('data-winner', s.turn === 'X' ? s.p1.avatar : s.p2.avatar);
                AudioSys.play('win');
            }
        },

        checkGlobalWin() {
            const g = App.state.grid;
            const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
            
            const winner = wins.find(c => g[c[0]] && g[c[0]]===g[c[1]] && g[c[0]]===g[c[2]]);
            
            if(winner) {
                AudioSys.play('win');
                const winName = g[winner[0]] === 'X' ? App.state.p1.name : App.state.p2.name;
                document.getElementById('winner-name').textContent = winName;
                document.getElementById('modal-win').classList.remove('hidden');
                
                // زيادة السكور
                if(g[winner[0]]==='X') App.state.p1.score++; else App.state.p2.score++;
                App.UI.updateHUD();
                return true;
            }
            return false;
        },

        switchTurn() {
            App.state.turn = App.state.turn === 'X' ? 'O' : 'X';
            App.state.activePower = null;
            this.highlightGrid();
            App.UI.updateHUD();
        },

        rematch() {
            document.getElementById('modal-win').classList.add('hidden');
            this.startGame();
        }
    }
};

window.onload = () => {
    AudioSys.init();
    App.Core.init();
};
