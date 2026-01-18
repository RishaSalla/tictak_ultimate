/**
 * 🎨 UI MANAGER
 * مسؤول عن الرسم، التحريك، والتعامل مع عناصر الشاشة
 */

export const UI = {
    // تخزين العناصر لتسريع الوصول إليها
    elements: {
        screens: document.querySelectorAll('.screen'),
        gridContainer: document.getElementById('game-grid'),
        statusText: document.getElementById('game-status'),
        turnText: document.getElementById('turn-text'),
        
        // لوحات اللاعبين الجديدة
        panelP1: document.getElementById('panel-p1'),
        panelP2: document.getElementById('panel-p2'),
        
        scoreX: document.getElementById('score-x'),
        scoreO: document.getElementById('score-o'),
        
        // الأسماء والأفاتار في اللعبة
        nameP1: document.getElementById('disp-name-p1'),
        nameP2: document.getElementById('disp-name-p2'),
        avP1: document.getElementById('disp-av-p1'),
        avP2: document.getElementById('disp-av-p2'),

        // الحاسبة والفوز
        calcQ: document.getElementById('calc-q'),
        calcInputs: document.getElementById('calc-inputs'),
        winnerName: document.getElementById('winner-name')
    },

    // 1. التنقل بين الشاشات
    showScreen(screenId) {
        // إخفاء الجميع
        this.elements.screens.forEach(s => {
            s.classList.remove('active');
            s.classList.add('hidden');
        });

        // إظهار المطلوبة
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.remove('hidden');
            // تأخير بسيط لتفعيل الترانزيشن
            setTimeout(() => target.classList.add('active'), 10);
        }
    },

    // 2. تحديث اختيار الأفاتار في الإعدادات
    updateAvatarSelection(playerId, selectedVal) {
        const container = document.getElementById(`${playerId}-avatars`);
        container.querySelectorAll('.av-btn').forEach(btn => {
            if (btn.dataset.val === selectedVal) btn.classList.add('selected');
            else btn.classList.remove('selected');
        });
    },

    // 3. بناء الرقعة (مرة واحدة فقط عند البدء)
    createGrid(onClickCallback) {
        const grid = this.elements.gridContainer;
        grid.innerHTML = ''; // تنظيف

        for (let g = 0; g < 9; g++) {
            // المربع الكبير (Sub Grid)
            const subGrid = document.createElement('div');
            subGrid.className = 'sub-grid';
            subGrid.id = `sub-${g}`;
            
            // الخلايا الصغيرة (Cells)
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.g = g;
                cell.dataset.c = c;
                
                // إضافة مستمع النقر
                cell.addEventListener('click', () => onClickCallback(g, c));
                subGrid.appendChild(cell);
            }
            grid.appendChild(subGrid);
        }
    },

    // 4. تحديث الرقعة (أهم دالة)
    updateGrid(logicState) {
        const { grid, metaGrid, nextGrid, winner } = logicState;

        for (let g = 0; g < 9; g++) {
            const subEl = document.getElementById(`sub-${g}`);
            
            // أ. حالة المربع الكبير (فائز/تعادل)
            subEl.className = 'sub-grid'; // تصفير الكلاسات
            if (metaGrid[g] !== null) {
                subEl.classList.add('won');
                // إضافة لون الفائز كخلفية خفيفة
                if (metaGrid[g] === 'X') subEl.style.backgroundColor = 'var(--p1-color)';
                else if (metaGrid[g] === 'O') subEl.style.backgroundColor = 'var(--p2-color)';
                else subEl.style.backgroundColor = '#cbd5e0'; // تعادل (رمادي)
            } else {
                subEl.style.backgroundColor = '#fff';
            }

            // ب. المنطقة النشطة (Active Zone)
            // إذا لم يكن هناك فائز، والمربع الحالي هو الهدف (أو اللعب حر)
            if (!winner && metaGrid[g] === null) {
                if (nextGrid === null || nextGrid === g) {
                    subEl.classList.add('active-zone');
                }
            }

            // ج. تحديث الخلايا الداخلية
            const cells = subEl.children;
            for (let c = 0; c < 9; c++) {
                const cell = cells[c];
                const val = grid[g][c];
                
                // إعادة التعيين
                cell.className = 'cell';
                cell.textContent = val || '';
                
                if (val === 'X') cell.classList.add('x');
                if (val === 'O') cell.classList.add('o');
            }
        }
    },

    // 5. تحديث المعلومات (HUD) - متوافق مع التقسيم الجديد
    updateHUD(state) {
        const { turn, p1, p2 } = state;

        // تحديث النصوص
        this.elements.scoreX.textContent = p1.score;
        this.elements.scoreO.textContent = p2.score;
        
        // تحديث الأسماء والأفاتار (يتم مرة واحدة عادة، لكن للتأكيد)
        this.elements.nameP1.textContent = p1.name;
        this.elements.nameP2.textContent = p2.name;
        // إذا كان هناك أفاتار مخزن
        if(p1.avatar) this.elements.avP1.textContent = p1.avatar;
        if(p2.avatar) this.elements.avP2.textContent = p2.avatar;

        // تحديث مؤشر الدور (Highlight Panel)
        const turnLabel = this.elements.turnText;
        
        if (turn === 'X') {
            // تفعيل لوحة P1
            this.elements.panelP1.style.boxShadow = '0 0 15px var(--p1-color)';
            this.elements.panelP1.style.border = '2px solid var(--p1-color)';
            this.elements.panelP2.style.boxShadow = 'none';
            this.elements.panelP2.style.border = 'none';
            
            turnLabel.textContent = `دور ${p1.name}`;
            turnLabel.className = 'turn-indicator p1-turn';
        } else {
            // تفعيل لوحة P2
            this.elements.panelP2.style.boxShadow = '0 0 15px var(--p2-color)';
            this.elements.panelP2.style.border = '2px solid var(--p2-color)';
            this.elements.panelP1.style.boxShadow = 'none';
            this.elements.panelP1.style.border = 'none';

            turnLabel.textContent = `دور ${p2.name}`;
            turnLabel.className = 'turn-indicator p2-turn';
        }

        // تحديث عدادات القوى (Badges)
        ['nuke', 'freeze', 'hack'].forEach(type => {
            // P1 Badges
            const p1Badge = document.getElementById(`p1-${type}-count`);
            if (p1Badge) {
                p1Badge.textContent = p1.powers[type];
                // تعطيل الزر إذا صفر
                const btn = document.querySelector(`.power-btn.p1[data-power="${type}"]`);
                if(btn) btn.style.opacity = p1.powers[type] > 0 ? '1' : '0.4';
            }

            // P2 Badges
            const p2Badge = document.getElementById(`p2-${type}-count`);
            if (p2Badge) {
                p2Badge.textContent = p2.powers[type];
                const btn = document.querySelector(`.power-btn.p2[data-power="${type}"]`);
                if(btn) btn.style.opacity = p2.powers[type] > 0 ? '1' : '0.4';
            }
        });
    },

    updateStatus(msg) {
        const el = this.elements.statusText;
        el.textContent = msg;
        el.classList.add('pulse');
        setTimeout(() => el.classList.remove('pulse'), 1000);
    },

    // 6. النوافذ المنبثقة (Modals)
    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('hidden');
    },

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('hidden');
    },

    // 7. إعداد الحاسبة
    setupCalculator(questionData) {
        // تلوين علامة الاستفهام
        let displayQ = questionData.q.replace(/\?/g, '<span style="color:var(--text-main); border-bottom:2px solid">?</span>');
        this.elements.calcQ.innerHTML = displayQ;
        
        this.elements.calcInputs.innerHTML = ''; 
        this.updateCalcInput(['']); 
    },

    updateCalcInput(buffer) {
        const container = this.elements.calcInputs;
        container.innerHTML = '';
        
        buffer.forEach(val => {
            const span = document.createElement('span');
            span.className = 'calc-digit';
            span.textContent = val;
            span.style.fontSize = '2rem';
            span.style.fontWeight = 'bold';
            span.style.margin = '0 5px';
            span.style.borderBottom = '3px solid var(--text-main)';
            container.appendChild(span);
        });
    },

    showWinScreen(winnerName) {
        this.elements.winnerName.textContent = winnerName;
        this.openModal('modal-win');
    }
};
