/**
 * 🎨 UI MANAGER
 * مسؤول عن الرسم، التحريك، والتعامل مع عناصر DOM
 */

export const UI = {
    // تخزين العناصر لتسريع الوصول إليها
    elements: {
        screens: document.querySelectorAll('.screen'),
        gridContainer: document.getElementById('game-grid'),
        statusText: document.getElementById('game-status'),
        hudP1: document.getElementById('hud-p1'),
        hudP2: document.getElementById('hud-p2'),
        scoreX: document.getElementById('score-x'),
        scoreO: document.getElementById('score-o'),
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

    // 3. بناء الرقعة (مرة واحدة فقط)
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
            
            // 1. حالة المربع الكبير (فائز/تعادل)
            subEl.className = 'sub-grid'; // تصفير الكلاسات
            if (metaGrid[g] !== null) {
                subEl.classList.add('won');
                // إضافة لون الفائز كخلفية خفيفة
                if (metaGrid[g] === 'X') subEl.style.backgroundColor = 'var(--p1-light)';
                else if (metaGrid[g] === 'O') subEl.style.backgroundColor = 'var(--p2-light)';
                else subEl.style.backgroundColor = '#ddd'; // تعادل
            } else {
                subEl.style.backgroundColor = '#fff';
            }

            // 2. المنطقة النشطة (Active Zone)
            // إذا لم يكن هناك فائز، والمربع الحالي هو الهدف (أو اللعب حر)
            if (!winner && metaGrid[g] === null) {
                if (nextGrid === null || nextGrid === g) {
                    subEl.classList.add('active-zone');
                }
            }

            // 3. تحديث الخلايا الداخلية
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

    // 5. تحديث المعلومات (HUD)
    updateHUD(state) {
        const { turn, p1, p2 } = state;

        // تحديث النقاط
        this.elements.scoreX.textContent = p1.score;
        this.elements.scoreO.textContent = p2.score;

        // تحديث الدور النشط
        if (turn === 'X') {
            this.elements.hudP1.classList.add('active');
            this.elements.hudP2.classList.remove('active');
            this.updateStatus(`دور ${p1.name}`, 'var(--p1-color)');
        } else {
            this.elements.hudP2.classList.add('active');
            this.elements.hudP1.classList.remove('active');
            this.updateStatus(`دور ${p2.name}`, 'var(--p2-color)');
        }

        // تحديث عدادات القوى
        ['nuke', 'freeze', 'hack'].forEach(type => {
            const count = turn === 'X' ? p1.powers[type] : p2.powers[type];
            const badge = document.getElementById(`count-${type}`);
            if (badge) badge.textContent = count;
            
            // تعطيل الأزرار إذا نفذت القوة
            const btn = document.querySelector(`button[data-power="${type}"]`);
            if (btn) {
                if (count > 0) btn.style.opacity = '1';
                else btn.style.opacity = '0.3';
                btn.classList.remove('active'); // إزالة التفعيل السابق
            }
        });
    },

    updateStatus(msg, color) {
        const el = this.elements.statusText;
        el.textContent = msg;
        if (color) el.style.color = color;
        else el.style.color = 'var(--text-light)';
        
        // تأثير نبض بسيط
        el.style.transform = 'scale(1.1)';
        setTimeout(() => el.style.transform = 'scale(1)', 200);
    },

    // 6. النوافذ المنبثقة (Modals)
    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('hidden');
            // حركة دخول
            const content = modal.querySelector('.clay-modal');
            content.style.opacity = '0';
            content.style.transform = 'scale(0.8)';
            setTimeout(() => {
                content.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                content.style.opacity = '1';
                content.style.transform = 'scale(1)';
            }, 50);
        }
    },

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('hidden');
    },

    // 7. إعداد الحاسبة
    setupCalculator(questionData) {
        // عرض السؤال
        let displayQ = questionData.q.replace(/\?/g, '<span style="color:var(--p1-color)">?</span>');
        this.elements.calcQ.innerHTML = displayQ;
        
        // تفريغ المدخلات
        this.elements.calcInputs.innerHTML = ''; 
        this.updateCalcInput(['']); // خانة واحدة فارغة مبدئياً
    },

    updateCalcInput(buffer) {
        const container = this.elements.calcInputs;
        container.innerHTML = '';
        
        buffer.forEach(val => {
            const span = document.createElement('span');
            span.className = 'calc-digit';
            span.textContent = val;
            // تنسيق بسيط للأرقام
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
