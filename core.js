/**
 * XO ULTIMATE - CORE ENGINE
 * Single File Logic | No External Dependencies
 */

/* --- 1. نظام الصوت (Synthesizer) --- */
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
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            osc.start(t); osc.stop(t + 0.1);
        } 
        else if (type === 'move') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, t);
            osc.frequency.linearRampToValueAtTime(500, t + 0.1);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.2);
            osc.start(t); osc.stop(t + 0.2);
        }
        else if (type === 'error') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.linearRampToValueAtTime(100, t + 0.3);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.3);
            osc.start(t); osc.stop(t + 0.3);
        }
        else if (type === 'power') { // صوت تفعيل القوة
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.linearRampToValueAtTime(800, t + 0.4);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
            osc.start(t); osc.stop(t + 0.4);
        }
        else if (type === 'win') {
            // نغمة الفوز
            [400, 500, 600, 800].forEach((f, i) => {
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

/* --- 2. إدارة التطبيق والبيانات --- */
const App = {
    // الحالة العامة
    state: {
        mode: null,      // strategy, clash, code, duality, genius
        turn: 'X',       // X starts
        grid: Array(9).fill(null), // حالة المربعات الكبيرة
        nextGrid: null,  // الإجبار (0-8) أو حر (null)
        activePower: null, // القوة المفعلة حالياً
        
        // بيانات اللاعبين
        p1: { name: 'اللاعب 1', avatar: 'X', score: 0, powers: { nuke: 1, freeze: 1, hack: 1 } },
        p2: { name: 'اللاعب 2', avatar: 'O', score: 0, powers: { nuke: 1, freeze: 1, hack: 1 } },
        
        // بيانات الحاسبة المؤقتة
        mathAns: 0,
        tempMove: null // {g: gridIdx, c: cellIdx, el: element}
    },

    /* --- وحدة الواجهة (UI) --- */
    UI: {
        // التنقل بين الشاشات
        showScreen(id) {
            document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            const target = document.getElementById(id);
            target.classList.remove('hidden');
            // تأخير بسيط لتفعيل الأنيميشن
            setTimeout(() => target.classList.add('active'), 10);
        },

        // اختيار الأفاتار في الإعدادات
        initSetupListeners() {
            // P1 Avatars
            document.querySelectorAll('#p1-avatars .avatar-opt').forEach(el => {
                el.onclick = () => {
                    AudioSys.play('click');
                    document.querySelectorAll('#p1-avatars .avatar-opt').forEach(a => a.classList.remove('selected'));
                    el.classList.add('selected');
                };
            });
            // P2 Avatars
            document.querySelectorAll('#p2-avatars .avatar-opt').forEach(el => {
                el.onclick = () => {
                    AudioSys.play('click');
                    document.querySelectorAll('#p2-avatars .avatar-opt').forEach(a => a.classList.remove('selected'));
                    el.classList.add('selected');
                };
            });
        },

        previewTheme(theme) {
            AudioSys.play('click');
            // تحديث الأزرار
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            document.querySelector(`.theme-btn[data-theme="${theme}"]`).classList.add('active');
            
            // تطبيق الألوان عبر المتغيرات
            const root = document.documentElement;
            if (theme === 'matrix') {
                root.style.setProperty('--accent', '#00ff00');
                root.style.setProperty('--primary', '#00cc00');
            } else if (theme === 'royal') {
                root.style.setProperty('--accent', '#9b59b6');
                root.style.setProperty('--primary', '#8e44ad');
            } else { // Plasma/Default
                root.style.setProperty('--accent', '#FFD700');
                root.style.setProperty('--primary', '#007AFF');
            }
        },

        updateHUD() {
            const s = App.state;
            const p1Badge = document.getElementById('hud-p1');
            const p2Badge = document.getElementById('hud-p2');

            // تحديث الأسماء والأفاتار
            p1Badge.querySelector('.avatar').textContent = s.p1.avatar;
            p2Badge.querySelector('.avatar').textContent = s.p2.avatar;
            document.getElementById('score-x').textContent = s.p1.score;
            document.getElementById('score-o').textContent = s.p2.score;

            // تحديد الدور
            if (s.turn === 'X') {
                p1Badge.classList.add('active-turn');
                p2Badge.classList.remove('active-turn');
            } else {
                p2Badge.classList.add('active-turn');
                p1Badge.classList.remove('active-turn');
            }

            // تحديث رسالة الحالة
            const statusBox = document.getElementById('game-status');
            const playerName = s.turn === 'X' ? s.p1.name : s.p2.name;
            
            if (s.activePower) {
                statusBox.textContent = s.activePower === 'nuke' ? `⚠️ ${playerName}: اختر المنطقة المراد مسحها!` :
                                      s.activePower === 'hack' ? `✋ ${playerName}: اختر خلية الخصم لسرقتها!` : 
                                      `❄️ ${playerName}: تم التجميد! العب مرة أخرى.`;
                statusBox.style.color = 'var(--accent)';
            } else {
                statusBox.textContent = `دور ${playerName} (${s.turn === 'X' ? s.p1.avatar : s.p2.avatar})`;
                statusBox.style.color = '#ccc';
            }

            // تحديث أزرار القوى
            const currP = s.turn === 'X' ? s.p1 : s.p2;
            ['nuke', 'freeze', 'hack'].forEach(type => {
                const btn = document.querySelector(`.btn-${type}`);
                btn.classList.remove('active');
                if (currP.powers[type] <= 0) {
                    btn.disabled = true;
                    btn.style.opacity = 0.3;
                } else {
                    btn.disabled = false;
                    btn.style.opacity = 1;
                }
            });
            
            if (s.activePower) {
                document.querySelector(`.btn-${s.activePower}`).classList.add('active');
            }
            
            // تحديث العدادات
            document.getElementById('count-nuke').textContent = currP.powers.nuke;
            document.getElementById('count-freeze').textContent = currP.powers.freeze;
            document.getElementById('count-hack').textContent = currP.powers.hack;
        },

        // إدارة النوافذ المنبثقة
        openHelp() { document.getElementById('modal-help').classList.remove('hidden'); },
        closeHelp() { document.getElementById('modal-help').classList.add('hidden'); },
        
        backToSetup() {
            if(confirm('العودة للإعدادات؟')) App.UI.showScreen('screen-setup');
        }
    },

    /* --- المنطق الأساسي (Core) --- */
    Core: {
        init() {
            // تفعيل زر الدخول
            document.getElementById('btn-login').onclick = () => {
                const code = document.getElementById('access-code').value;
                const msg = document.getElementById('login-msg');
                // الكود السري الافتراضي
                if (code === '0000') {
                    AudioSys.play('move');
                    App.UI.showScreen('screen-setup');
                } else {
                    AudioSys.play('error');
                    msg.textContent = 'الرمز غير صحيح ❌';
                }
            };
            App.UI.initSetupListeners();
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

        selectMode(modeName) {
            AudioSys.play('click');
            App.state.mode = modeName;
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
            if(confirm('هل تريد الانسحاب والعودة للقائمة؟')) {
                App.UI.showScreen('screen-menu');
            }
        },

        buildGrid() {
            const arena = document.getElementById('game-grid');
            arena.innerHTML = '';
            for (let i = 0; i < 9; i++) {
                const sub = document.createElement('div');
                sub.className = 'sub-grid';
                sub.id = `grid-${i}`;
                
                for (let j = 0; j < 9; j++) {
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    cell.onclick = () => this.handleCellClick(i, j, cell);
                    sub.appendChild(cell);
                }
                arena.appendChild(sub);
            }
        },

        highlightGrid() {
            const s = App.state;
            for(let i=0; i<9; i++) {
                const g = document.getElementById(`grid-${i}`);
                g.classList.remove('active-zone');
                
                // إذا المربع منتهي، لا يمكن اللعب فيه
                if(s.grid[i] !== null) continue;

                // التفعيل حسب الإجبار
                if(s.nextGrid === null || s.nextGrid === i) {
                    g.classList.add('active-zone');
                }
            }
        },

        activatePower(type) {
            const s = App.state;
            const p = s.turn === 'X' ? s.p1 : s.p2;

            if (p.powers[type] <= 0) return; // لا يوجد رصيد

            AudioSys.play('power');

            if (type === 'freeze') {
                // التجميد فوري
                p.powers.freeze--;
                s.activePower = 'freeze';
                App.UI.updateHUD();
                // تأثير بصري
                document.body.style.boxShadow = 'inset 0 0 50px var(--freeze-glow)';
                setTimeout(() => document.body.style.boxShadow = 'none', 500);
            } else {
                // الممحاة والاستحواذ تحتاج اختيار هدف
                if (s.activePower === type) s.activePower = null; // إلغاء
                else s.activePower = type;
                App.UI.updateHUD();
            }
        },

        handleCellClick(gIdx, cIdx, cellEl) {
            const s = App.state;

            // 1. معالجة القوى الخاصة
            if (s.activePower === 'nuke') {
                this.executeNuke(gIdx);
                return;
            }
            if (s.activePower === 'hack') {
                this.executeHack(cIdx, cellEl); // cIdx هنا غير مهم، المهم العنصر
                return;
            }

            // 2. التحقق من صحة الحركة العادية
            // هل الخلية مشغولة؟
            if (cellEl.classList.contains('x') || cellEl.classList.contains('o')) return;
            
            // هل المربع مسموح؟
            if (s.nextGrid !== null && s.nextGrid !== gIdx) {
                AudioSys.play('error');
                // اهتزاز المربع الصحيح
                const correct = document.getElementById(`grid-${s.nextGrid}`);
                correct.classList.add('shake-screen');
                setTimeout(() => correct.classList.remove('shake-screen'), 500);
                return;
            }
            // هل المربع الكبير منتهي؟
            if (s.grid[gIdx] !== null) return;

            // 3. التحقق من النمط (تكتيك vs رياضيات)
            if (s.mode === 'strategy') {
                AudioSys.play('move');
                this.finalizeMove(gIdx, cIdx, cellEl);
            } else {
                // فتح الحاسبة
                AudioSys.play('click');
                this.openCalculator(gIdx, cIdx, cellEl);
            }
        },

        // --- منطق الحاسبة ---
        openCalculator(g, c, el) {
            const s = App.state;
            s.tempMove = {g, c, el};
            
            let q = '', ans = 0;
            const n1 = Math.floor(Math.random()*8)+2;
            const n2 = Math.floor(Math.random()*8)+2;

            if (s.mode === 'clash') { // جدول الضرب
                q = `${n1} × ${n2}`;
                ans = n1 * n2;
            } else if (s.mode === 'code') { // المجهول
                const sum = n1 + n2;
                q = `${n1} + ؟ = ${sum}`;
                ans = n2;
            } else if (s.mode === 'duality') { // زوجي فردي
                const num = Math.floor(Math.random()*50)+1;
                q = `${num}: فردي(1) أم زوجي(2)؟`;
                ans = (num % 2 === 0) ? 2 : 1;
            } else if (s.mode === 'genius') { // عباقرة
                const n3 = Math.floor(Math.random()*5)+1;
                q = `(${n1}×${n2}) + ${n3}`;
                ans = (n1*n2) + n3;
            }

            s.mathAns = ans;
            document.getElementById('calc-q').textContent = q + ' = ؟';
            document.getElementById('calc-a').textContent = '_';
            document.getElementById('modal-calc').classList.remove('hidden');
            
            // تحريك شريط الوقت
            const bar = document.getElementById('timer-fill');
            bar.style.width = '100%';
            setTimeout(() => bar.style.width = '0%', 50); // أنيميشن بسيط
        },

        typeNum(n) {
            const disp = document.getElementById('calc-a');
            if(disp.textContent === '_') disp.textContent = '';
            if(disp.textContent.length < 3) disp.textContent += n;
        },

        clearCalc() { document.getElementById('calc-a').textContent = '_'; },

        submitCalc() {
            const val = parseInt(document.getElementById('calc-a').textContent);
            if (val === App.state.mathAns) {
                AudioSys.play('move');
                document.getElementById('modal-calc').classList.add('hidden');
                const {g, c, el} = App.state.tempMove;
                this.finalizeMove(g, c, el);
            } else {
                AudioSys.play('error');
                const box = document.querySelector('.calc-box');
                box.classList.add('shake-screen');
                setTimeout(() => box.classList.remove('shake-screen'), 500);
                this.clearCalc();
            }
        },

        // --- تنفيذ الحركة النهائية ---
        finalizeMove(gIdx, cIdx, cellEl) {
            const s = App.state;
            const p = s.turn === 'X' ? s.p1 : s.p2;

            // 1. رسم العلامة
            cellEl.classList.add(s.turn.toLowerCase());
            cellEl.textContent = p.avatar;

            // 2. فحص فوز المربع الصغير
            this.checkSubGrid(gIdx);

            // 3. فحص الفوز الكبير
            if (this.checkGlobalWin()) return;

            // 4. تحديد الوجهة القادمة
            s.nextGrid = cIdx;
            // إذا الوجهة ممتلئة أو فائزة، حرر الحركة
            if (s.grid[cIdx] !== null) {
                s.nextGrid = null;
            } else {
                // فحص الامتلاء الفيزيائي (تعادل داخل المربع)
                const targetGrid = document.getElementById(`grid-${cIdx}`);
                const emptyCells = targetGrid.querySelectorAll('.cell:not(.x):not(.o)').length;
                if (emptyCells === 0) s.nextGrid = null;
            }

            // 5. تبديل الدور (إلا في حالة التجميد)
            if (s.activePower === 'freeze') {
                s.activePower = null; // استهلاك التجميد
                App.UI.updateHUD();
                this.highlightGrid(); // تحديث الإضاءة لنفس اللاعب
            } else {
                this.switchTurn();
            }
        },

        // --- تنفيذ القدرات ---
        executeNuke(gIdx) {
            const s = App.state;
            const p = s.turn === 'X' ? s.p1 : s.p2;

            AudioSys.play('power');
            const gEl = document.getElementById(`grid-${gIdx}`);
            
            // مسح الخلايا
            Array.from(gEl.children).forEach(c => {
                c.className = 'cell';
                c.textContent = '';
            });
            // إزالة حالة الفوز
            gEl.className = 'sub-grid';
            gEl.removeAttribute('data-winner');
            s.grid[gIdx] = null;

            // خصم واهتزاز
            p.powers.nuke--;
            s.activePower = null;
            document.body.classList.add('shake-screen');
            setTimeout(() => document.body.classList.remove('shake-screen'), 500);

            this.switchTurn();
        },

        executeHack(cIdx, cellEl) { // cIdx مهمل، نحتاج العنصر
            const s = App.state;
            const p = s.turn === 'X' ? s.p1 : s.p2;
            const oppClass = s.turn === 'X' ? 'o' : 'x';

            // شرط: يجب أن تكون الخلية ملك الخصم
            if (!cellEl.classList.contains(oppClass)) {
                AudioSys.play('error');
                return;
            }

            AudioSys.play('move');
            // تغيير الملكية
            cellEl.classList.remove(oppClass);
            cellEl.classList.add(s.turn.toLowerCase());
            cellEl.textContent = p.avatar;

            p.powers.hack--;
            s.activePower = null;

            // قد يسبب هذا الاستحواذ فوزاً بالمربع
            const parentGrid = cellEl.parentElement;
            const gIdx = parseInt(parentGrid.id.split('-')[1]);
            this.checkSubGrid(gIdx);
            
            this.switchTurn();
        },

        // --- منطق الفوز ---
        checkSubGrid(gIdx) {
            const s = App.state;
            if (s.grid[gIdx] !== null) return; // فائز مسبقاً

            const gEl = document.getElementById(`grid-${gIdx}`);
            const cells = Array.from(gEl.children);
            const turn = s.turn.toLowerCase(); // 'x' or 'o'

            const wins = [
                [0,1,2],[3,4,5],[6,7,8],
                [0,3,6],[1,4,7],[2,5,8],
                [0,4,8],[2,4,6]
            ];

            // هل يوجد صف مكتمل؟
            const isWon = wins.some(combo => 
                combo.every(i => cells[i].classList.contains(turn))
            );

            if (isWon) {
                s.grid[gIdx] = s.turn;
                gEl.classList.add('won', `winner-${s.turn}`);
                gEl.setAttribute('data-winner', s.turn === 'X' ? s.p1.avatar : s.p2.avatar);
                AudioSys.play('win');
            }
        },

        checkGlobalWin() {
            const grid = App.state.grid;
            const wins = [
                [0,1,2],[3,4,5],[6,7,8],
                [0,3,6],[1,4,7],[2,5,8],
                [0,4,8],[2,4,6]
            ];

            const winnerCombo = wins.find(combo => 
                grid[combo[0]] && 
                grid[combo[0]] === grid[combo[1]] && 
                grid[combo[0]] === grid[combo[2]]
            );

            if (winnerCombo) {
                const winSymbol = grid[winnerCombo[0]];
                const winName = winSymbol === 'X' ? App.state.p1.name : App.state.p2.name;
                
                document.getElementById('winner-name').textContent = winName;
                document.getElementById('modal-win').classList.remove('hidden');
                AudioSys.play('win'); // موسيقى الفوز

                // زيادة النتيجة
                if (winSymbol === 'X') App.state.p1.score++;
                else App.state.p2.score++;
                App.UI.updateHUD();
                
                return true;
            }
            return false;
        },

        switchTurn() {
            App.state.turn = App.state.turn === 'X' ? 'O' : 'X';
            App.state.activePower = null; // تصفير القوة عند انتهاء الدور
            this.highlightGrid();
            App.UI.updateHUD();
        },

        rematch() {
            document.getElementById('modal-win').classList.add('hidden');
            this.startGame();
        }
    }
};

// تشغيل التطبيق
window.onload = () => {
    AudioSys.init();
    App.Core.init();
};
