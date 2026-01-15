/**
 * MATH MATRIX ENGINE - FINAL ULTIMATE EDITION (ARABIC)
 * Core Logic: Modes, Power-ups, Customization, Audio
 */

// --- 1. نظام الصوت (مدمج بدون ملفات) ---
const AudioController = {
    ctx: null,
    init: function() {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
    },
    playTone: function(freq, type, duration, vol=0.1) {
        if (!this.ctx) this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    // المؤثرات
    click: function() { this.playTone(600, 'sine', 0.1); },
    error: function() { this.playTone(150, 'sawtooth', 0.4, 0.2); },
    win: function() { 
        this.playTone(400, 'square', 0.1); 
        setTimeout(() => this.playTone(600, 'square', 0.1), 100);
        setTimeout(() => this.playTone(800, 'square', 0.3), 200);
    },
    nuke: function() { this.playTone(100, 'sawtooth', 0.8, 0.5); },
    freeze: function() { this.playTone(1200, 'sine', 0.5, 0.2); },
    hack: function() { this.playTone(2000, 'square', 0.1, 0.1); }
};

// --- 2. إدارة المستويات ---
let selectedLevelId = null;

function selectLevel(lvlId, cardElement) {
    AudioController.click();
    document.querySelectorAll('.plasma-card').forEach(c => c.classList.remove('active-card'));
    cardElement.classList.add('active-card');
    selectedLevelId = lvlId;
    
    // إظهار زر البدء
    const btn = document.getElementById('btn-start-game');
    if(btn) btn.classList.remove('hidden');
}

// --- 3. المحرك الرئيسي ---
const App = {
    config: null,
    
    // حالة اللعب
    currentPlayer: 'X', // X always starts
    nextForcedGrid: null,
    gridStatus: Array(9).fill(null), // null, 'X', 'O', 'Tie'
    
    // بيانات اللاعبين (أسماء، أفاتار، نتائج)
    players: {
        X: { name: "الفريق 1", avatar: "X", score: 0, powers: { nuke: 1, freeze: 1, hack: 1 } },
        O: { name: "الفريق 2", avatar: "O", score: 0, powers: { nuke: 1, freeze: 1, hack: 1 } }
    },
    
    // إعدادات اللعبة
    settings: {
        timer: 0,
        theme: 'plasma'
    },

    // حالة القوى الخارقة النشطة
    activePower: null, // 'nuke', 'hack', 'freeze'

    // متغيرات الحاسبة
    currentActiveCell: null,
    currentInput: "",
    currentAnswer: 0,
    timerInterval: null,

    // --- التهيئة ---
    init: async function() {
        try {
            const response = await fetch('config.json');
            this.config = await response.json();
        } catch (e) {
            this.config = { accessCode: "00000000" };
        }
        this.setupLoginEvents();
    },

    setupLoginEvents: function() {
        const btn = document.getElementById('btn-verify');
        const input = document.getElementById('access-code');
        if(btn) btn.onclick = () => this.verifyAccess();
        if(input) input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.verifyAccess();
        });
    },

    verifyAccess: function() {
        const input = document.getElementById('access-code');
        const msg = document.getElementById('login-msg');
        msg.textContent = "جاري التحقق...";
        
        setTimeout(() => {
            if (input.value === this.config.accessCode) {
                AudioController.win();
                document.getElementById('login-gate').classList.add('hidden');
                document.getElementById('app-content').classList.remove('hidden');
            } else {
                AudioController.error();
                msg.textContent = "شفرة خاطئة";
                input.style.border = "1px solid red";
            }
        }, 500);
    },

    launchGame: function() {
        if(!selectedLevelId) return;
        AudioController.click();
        document.getElementById('battle-setup').classList.remove('hidden');
    },

    hideSetup: function() {
        AudioController.click();
        document.getElementById('battle-setup').classList.add('hidden');
    },

    // --- بدء المعركة وتطبيق التخصيص ---
    startMatch: function() {
        AudioController.win();
        
        // 1. قراءة البيانات من واجهة الإعداد
        this.players.X.name = document.getElementById('p1-name').value || "الفريق الأول";
        this.players.O.name = document.getElementById('p2-name').value || "الفريق الثاني";
        
        this.players.X.avatar = document.getElementById('p1-avatar').value;
        this.players.O.avatar = document.getElementById('p2-avatar').value;

        // قراءة الإعدادات (مؤقت وثيم)
        const timers = document.getElementsByName('timer');
        for(let t of timers) { if(t.checked) this.settings.timer = parseInt(t.value); }

        const themes = document.getElementsByName('theme');
        for(let t of themes) { if(t.checked) this.settings.theme = t.value; }

        // تطبيق الثيم
        document.body.className = `theme-${this.settings.theme}`;

        // تحديث HUD
        document.getElementById('hud-name-x').textContent = this.players.X.name;
        document.getElementById('hud-name-o').textContent = this.players.O.name;
        document.getElementById('avatar-display-x').textContent = this.players.X.avatar;
        document.getElementById('avatar-display-o').textContent = this.players.O.avatar;
        document.getElementById('game-hud').classList.remove('hidden');

        // إخفاء القوائم القديمة
        this.hideSetup();
        document.querySelector('.levels-grid').classList.add('hidden');
        document.querySelector('.game-header').classList.add('hidden');
        document.querySelector('.action-area').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        
        // إعادة تعيين المتغيرات
        this.currentPlayer = 'X';
        this.nextForcedGrid = null;
        this.gridStatus = Array(9).fill(null);
        this.activePower = null;
        
        // إعادة شحن القوى
        this.players.X.powers = { nuke: 1, freeze: 1, hack: 1 };
        this.players.O.powers = { nuke: 1, freeze: 1, hack: 1 };
        this.updatePowerButtons();

        this.buildBoard();
        this.highlightActiveGrid();
        this.updateHUD();
    },

    rematch: function() {
        document.getElementById('victory-modal').classList.add('hidden');
        this.startMatch(); 
    },

    buildBoard: function() {
        const arena = document.getElementById('game-arena');
        arena.innerHTML = ''; 
        for(let i=0; i<9; i++) {
            const subGrid = document.createElement('div');
            subGrid.className = 'sub-grid';
            subGrid.id = `grid-${i}`;
            // إضافة خاصية لطباعة الرمز الفائز لاحقاً
            subGrid.setAttribute('data-winner-symbol', ''); 
            
            for(let j=0; j<9; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.grid = i; 
                cell.dataset.cell = j; 
                cell.onclick = () => this.handleCellClick(cell);
                subGrid.appendChild(cell);
            }
            arena.appendChild(subGrid);
        }
    },

    // --- التحكم بالقوى الخارقة ---
    updatePowerButtons: function() {
        const p = this.players[this.currentPlayer].powers;
        const btns = document.querySelectorAll('.power-btn');
        
        // تحديث حالة الأزرار (مفعل/معطل) حسب الرصيد
        document.querySelector('.btn-nuke').disabled = (p.nuke <= 0);
        document.querySelector('.btn-freeze').disabled = (p.freeze <= 0);
        document.querySelector('.btn-hack').disabled = (p.hack <= 0);

        // إزالة التحديد السابق
        btns.forEach(b => b.style.boxShadow = "none");
    },

    usePower: function(type) {
        if (this.players[this.currentPlayer].powers[type] <= 0) return;
        
        if (type === 'freeze') {
            // التجميد يعمل فوراً
            AudioController.freeze();
            this.players[this.currentPlayer].powers.freeze--;
            this.activePower = 'freeze'; // علامة لعدم تبديل الدور
            this.updatePowerButtons();
            // وميض أزرق
            document.body.style.boxShadow = "inset 0 0 100px cyan";
            setTimeout(() => document.body.style.boxShadow = "none", 500);
            return;
        }

        // النووي والهاك يحتاجان لنقرة تالية في الشبكة
        if (this.activePower === type) {
            this.activePower = null; // إلغاء التفعيل
            this.updatePowerButtons();
        } else {
            this.activePower = type;
            AudioController.click();
            // تمييز الزر
            document.querySelector(`.btn-${type}`).style.boxShadow = "0 0 30px white";
        }
    },

    // --- منطق النقر واللعب ---
    handleCellClick: function(cell) {
        const gridIdx = parseInt(cell.dataset.grid);
        const cellIdx = parseInt(cell.dataset.cell);

        // 1. التعامل مع القوى النشطة (النووي والهاك)
        if (this.activePower === 'nuke') {
            this.executeNuke(gridIdx);
            return;
        }
        if (this.activePower === 'hack') {
            this.executeHack(cell);
            return;
        }

        // 2. التحقق من صحة الحركة العادية
        // هل الخلية محجوزة؟
        if(cell.classList.contains('x-marked') || cell.classList.contains('o-marked')) return;
        
        // هل المربع الكبير متاح (حسب الإجبار)؟
        if (this.nextForcedGrid !== null && this.nextForcedGrid !== gridIdx) {
            AudioController.error();
            const forcedGrid = document.getElementById(`grid-${this.nextForcedGrid}`);
            forcedGrid.style.transform = "translateX(5px)";
            setTimeout(() => forcedGrid.style.transform = "translateX(0)", 100);
            return; 
        }
        // هل المربع الكبير منتهي؟
        if (this.gridStatus[gridIdx] !== null) return;

        // 3. تحديد نوع المستوى (استراتيجي أم رياضيات)
        if (selectedLevelId === 'strategy') {
            // المستوى 1: العب فوراً بدون حاسبة
            AudioController.click();
            this.currentActiveCell = cell;
            this.finalizeMove(); // تنفيذ الحركة مباشرة
        } else {
            // باقي المستويات: افتح الحاسبة
            this.openCalculator(cell);
        }
    },

    // تنفيذ القوى
    executeNuke: function(gridIdx) {
        AudioController.nuke();
        const grid = document.getElementById(`grid-${gridIdx}`);
        
        // مسح الخلايا بصرياً
        Array.from(grid.children).forEach(c => {
            c.className = 'cell';
            c.textContent = '';
        });
        // مسح حالة الفوز إن وجدت
        grid.className = 'sub-grid';
        this.gridStatus[gridIdx] = null;
        
        // خصم الرصيد وإنهاء التفعيل
        this.players[this.currentPlayer].powers.nuke--;
        this.activePower = null;
        this.updatePowerButtons();
        
        // اهتزاز الشاشة
        document.body.classList.add('shake-screen');
        setTimeout(() => document.body.classList.remove('shake-screen'), 500);
        
        // تبديل الدور (استخدام النووي ينهي دورك)
        this.switchTurn();
    },

    executeHack: function(cell) {
        // الهاك يسرق خلية الخصم
        if (!cell.textContent || cell.textContent === this.players[this.currentPlayer].avatar) {
            // لا يمكن سرقة خلية فارغة أو خليتك
            AudioController.error();
            return;
        }

        AudioController.hack();
        // تغيير الملكية
        cell.className = 'cell'; // reset classes
        this.markCell(cell, this.currentPlayer);
        
        // خصم الرصيد
        this.players[this.currentPlayer].powers.hack--;
        this.activePower = null;
        this.updatePowerButtons();
        
        // فحص الفوز بعد السرقة
        const gridIdx = parseInt(cell.dataset.grid);
        this.checkSubGridWin(gridIdx);
        
        this.switchTurn();
    },

    // --- الحاسبة والأسئلة ---
    openCalculator: function(cell) {
        AudioController.click();
        this.currentActiveCell = cell;
        this.currentInput = "";
        
        // إخفاء رسالة الانفجار
        document.getElementById('timeout-msg').classList.add('hidden');
        document.querySelector('.calc-screen').classList.remove('shake-screen');

        // توليد سؤال حسب المستوى (مستقبلاً يمكن تطويره، حالياً ضرب عشوائي)
        const n1 = Math.floor(Math.random() * 9) + 2;
        const n2 = Math.floor(Math.random() * 9) + 2;
        this.currentAnswer = n1 * n2;
        
        document.getElementById('calc-question').textContent = `${n1} × ${n2} = ?`;
        document.getElementById('calc-input').textContent = "_";
        document.getElementById('math-modal').classList.remove('hidden');

        this.startTimer();
    },

    startTimer: function() {
        const barContainer = document.getElementById('timer-bar-container');
        const barFill = document.getElementById('timer-bar-fill');
        
        clearInterval(this.timerInterval);
        barContainer.classList.add('hidden');
        
        if (this.settings.timer > 0) {
            barContainer.classList.remove('hidden');
            barFill.style.transition = 'none';
            barFill.style.width = '100%';
            
            setTimeout(() => {
                barFill.style.transition = `width ${this.settings.timer}s linear`;
                barFill.style.width = '0%';
            }, 50);

            this.timerInterval = setTimeout(() => {
                this.handleTimeout();
            }, this.settings.timer * 1000);
        }
    },

    handleTimeout: function() {
        AudioController.error();
        const modal = document.getElementById('math-modal');
        const msg = document.getElementById('timeout-msg');
        
        msg.classList.remove('hidden');
        document.querySelector('.calculator-box').classList.add('shake-screen');
        
        setTimeout(() => {
            document.querySelector('.calculator-box').classList.remove('shake-screen');
            modal.classList.add('hidden');
            msg.classList.add('hidden');
            this.switchTurn(); // عقوبة الوقت
        }, 1500);
    },

    typeNum: function(num) {
        AudioController.click();
        if(this.currentInput.length < 3) {
            this.currentInput += num;
            document.getElementById('calc-input').textContent = this.currentInput;
        }
    },

    clearCalc: function() {
        AudioController.click();
        this.currentInput = "";
        document.getElementById('calc-input').textContent = "_";
    },

    submitAnswer: function() {
        clearInterval(this.timerInterval);
        if(parseInt(this.currentInput) === this.currentAnswer) {
            AudioController.win();
            document.getElementById('math-modal').classList.add('hidden');
            this.finalizeMove();
        } else {
            AudioController.error();
            const screen = document.querySelector('.calc-screen');
            screen.style.border = "1px solid red";
            setTimeout(() => screen.style.border = "1px solid rgba(255,255,255,0.1)", 500);
            this.clearCalc();
        }
    },

    // --- تنفيذ الحركة وإنهاء الدور ---
    finalizeMove: function() {
        const cell = this.currentActiveCell;
        this.markCell(cell, this.currentPlayer);
        
        const gridIdx = parseInt(cell.dataset.grid);
        const cellIdx = parseInt(cell.dataset.cell);

        this.checkSubGridWin(gridIdx);
        
        // تحديث الإجبار (الوجهة القادمة)
        this.nextForcedGrid = cellIdx;
        
        // قانون الإفلات (Free Move)
        if (this.gridStatus[this.nextForcedGrid] !== null) {
            this.nextForcedGrid = null; // حر
        } else {
            // هل المربع ممتلئ (تعادل)؟
            const targetGrid = document.getElementById(`grid-${this.nextForcedGrid}`);
            const filledCells = targetGrid.querySelectorAll('.x-marked, .o-marked').length;
            if (filledCells === 9) {
                this.gridStatus[this.nextForcedGrid] = 'Tie'; 
                this.nextForcedGrid = null;
            }
        }

        // فحص الفوز الشامل
        if (this.checkGlobalWin()) return;

        // تبديل الدور (إلا إذا كان التجميد مفعلاً)
        if (this.activePower === 'freeze') {
            // لقد استخدم التجميد، لذا يبقى دوره
            this.activePower = null; // نلغي التجميد للدور القادم
            this.updatePowerButtons();
            // تحديث الإضاءة ليبقى نفس اللاعب
            this.highlightActiveGrid();
            document.body.style.boxShadow = "none";
        } else {
            this.switchTurn();
        }
    },

    switchTurn: function() {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.activePower = null; // إلغاء أي قوى معلقة عند انتهاء الدور
        this.updatePowerButtons();
        this.highlightActiveGrid();
        this.updateHUD();
    },

    markCell: function(cell, playerSymbol) {
        cell.classList.add(playerSymbol === 'X' ? 'x-marked' : 'o-marked');
        // هنا نضع الأفاتار (الأسد، النمر..) بدلاً من الحرف
        cell.textContent = this.players[playerSymbol].avatar;
    },

    // --- منطق الفوز ---
    checkSubGridWin: function(gridIdx) {
        if (this.gridStatus[gridIdx] !== null) return;
        
        const grid = document.getElementById(`grid-${gridIdx}`);
        const cells = Array.from(grid.children);
        // نتحقق باستخدام "class" لأن النص قد يكون أفاتار
        const currentClass = this.currentPlayer === 'X' ? 'x-marked' : 'o-marked';
        
        const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

        for (let combo of wins) {
            const [a, b, c] = combo;
            if (cells[a].classList.contains(currentClass) &&
                cells[b].classList.contains(currentClass) &&
                cells[c].classList.contains(currentClass)) {
                
                this.gridStatus[gridIdx] = this.currentPlayer;
                grid.classList.add(this.currentPlayer === 'X' ? 'won-x' : 'won-o');
                // نضع الأفاتار كختم كبير
                grid.setAttribute('data-winner-symbol', this.players[this.currentPlayer].avatar);
                
                AudioController.win();
                return;
            }
        }
    },

    checkGlobalWin: function() {
        const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        for (let combo of wins) {
            const [a, b, c] = combo;
            if (this.gridStatus[a] && this.gridStatus[a] !== 'Tie' &&
                this.gridStatus[a] === this.gridStatus[b] &&
                this.gridStatus[a] === this.gridStatus[c]) {
                
                this.declareWinner(this.gridStatus[a]);
                return true;
            }
        }
        return false;
    },

    declareWinner: function(winnerSymbol) {
        AudioController.win();
        const winnerData = this.players[winnerSymbol];
        winnerData.score++;
        
        document.getElementById('winner-name').textContent = winnerData.name;
        document.getElementById('victory-modal').classList.remove('hidden');
        this.spawnConfetti();
    },

    // --- تحديث الواجهة ---
    updateHUD: function() {
        document.getElementById('score-board').textContent = `${this.players.X.score} - ${this.players.O.score}`;
        const xEl = document.getElementById('hud-x');
        const oEl = document.getElementById('hud-o');
        if(this.currentPlayer === 'X') {
            xEl.classList.add('active-turn');
            oEl.classList.remove('active-turn');
        } else {
            oEl.classList.add('active-turn');
            xEl.classList.remove('active-turn');
        }
    },

    highlightActiveGrid: function() {
        for(let i=0; i<9; i++) {
            const grid = document.getElementById(`grid-${i}`);
            grid.classList.remove('active-zone');
            if (this.gridStatus[i] === null) {
                if (this.nextForcedGrid === null || this.nextForcedGrid === i) {
                    grid.classList.add('active-zone');
                }
            }
        }
    },

    spawnConfetti: function() {
        const container = document.getElementById('confetti-container');
        container.innerHTML = '';
        for(let i=0; i<50; i++) {
            const conf = document.createElement('div');
            conf.style.position = 'absolute';
            conf.style.left = Math.random() * 100 + '%';
            conf.style.top = -10 + 'px';
            conf.style.width = '10px';
            conf.style.height = '10px';
            conf.style.backgroundColor = ['#f00', '#0f0', '#00f', '#ff0'][Math.floor(Math.random()*4)];
            conf.style.animation = `fall ${Math.random()*2+2}s linear infinite`;
            container.appendChild(conf);
        }
        const style = document.createElement('style');
        style.innerHTML = `@keyframes fall { to { top: 100vh; transform: rotate(720deg); } }`;
        document.head.appendChild(style);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
