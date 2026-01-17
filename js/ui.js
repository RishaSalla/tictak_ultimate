/**
 * 🎨 UI MANAGER
 * مسؤول عن الرسم، التحريك، والتعامل مع عناصر DOM
 * يفصل المنطق (Logic) عن العرض (View)
 */

export const UI = {
    // تخزين مراجع العناصر لتسريع الأداء
    elements: {
        screens: document.querySelectorAll('.screen'),
        gridContainer: document.getElementById('game-grid'),
        statusText: document.getElementById('status-text'),
        hudP1: document.getElementById('hud-p1'),
        hudP2: document.getElementById('hud-p2'),
        scoreX: document.getElementById('score-x'),
        scoreO: document.getElementById('score-o'),
        modals: document.querySelectorAll('.modal-overlay'),
        calcQ: document.getElementById('calc-q'),
        calcInputs: document.getElementById('calc-inputs')
    },

    // 1. التنقل بين الشاشات
    showScreen(screenId) {
        // إخفاء الكل
        this.elements.screens.forEach(s => {
            s.classList.add('hidden');
            s.classList.remove('active');
        });

        // إظهار المطلوب
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.remove('hidden');
            // تأخير بسيط لتفعيل الأنيميشن
            setTimeout(() => target.classList.add('active'), 10);
        }
    },

    // 2. تحديث واجهة الإعدادات
    updateAvatarSelection(playerId, selectedVal) {
        const container = document.getElementById(`${playerId}-avatars`);
        const btns = container.querySelectorAll('.av-item');
        
        btns.forEach(btn => {
            if (btn.dataset.val === selectedVal) btn.classList.add('selected');
            else btn.classList.remove('selected');
        });
    },

    // 3. بناء الرقعة (Grid Builder)
    createGrid(onClickCallback) {
        const grid = this.elements.gridContainer;
        grid.innerHTML = ''; // تنظيف

        // إنشاء 9 مربعات كبيرة
        for (let g = 0; g < 9; g++) {
            const subGrid = document.createElement('div');
            subGrid.className = 'sub-grid';
            subGrid.id = `sub-${g}`;
            subGrid.dataset.g = g;

            // إنشاء 9 خلايا داخل كل مربع
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.g = g;
                cell.dataset.c = c;
                
                // ربط حدث النقر
                cell.addEventListener('click', () => onClickCallback(g, c));
                
                subGrid.appendChild(cell);
            }
            grid.appendChild(subGrid);
        }
    },

    // 4. تحديث الرقعة (أهم دالة)
    updateGrid(logicState) {
        const { grid, metaGrid, nextGrid, winner } = logicState;

        // تحديث كل خلية
        for (let g = 0; g < 9; g++) {
            const subEl = document.getElementById(`sub-${g}`);
            
            // هل المربع الكبير فائز؟
            if (metaGrid[g] !== null) {
                subEl.classList.add('won');
                subEl.classList.add(`winner-${metaGrid[g]}`); // للتلوين
                subEl.setAttribute('data-winner', metaGrid[g] === 'DRAW' ? '=' : metaGrid[g]);
            } else {
                subEl.classList.remove('won', 'winner-X', 'winner-O');
                subEl.removeAttribute('data-winner');
            }

            // تحديث المناطق النشطة (Focus Mode)
            // إذا كانت اللعبة منتهية، لا يوجد نشاط
            if (winner) {
                subEl.classList.remove('active-zone');
            } else {
                // إذا كان nextGrid حر (null) أو يطابق المربع الحالي
                if ((nextGrid === null || nextGrid === g) && metaGrid[g] === null) {
                    subEl.classList.add('active-zone');
                } else {
                    subEl.classList.remove('active-zone');
                }
            }

            // تحديث الخلايا الصغيرة
            const cells = subEl.children;
            for (let c = 0; c < 9; c++) {
                const cell = cells[c];
                const val = grid[g][c];
                
                cell.className = 'cell'; // إعادة تعيين
                if (val === 'X') cell.classList.add('x', 'pop-in');
                if (val === 'O') cell.classList.add('o', 'pop-in');
                
                cell.textContent = val || '';
            }
        }
    },

    // 5. تحديث الشريط العلوي (HUD)
    updateHUD(state) {
        const { turn, p1, p2 } = state;
        
        // النتائج
        this.elements.scoreX.textContent = p1.score;
        this.elements.scoreO.textContent = p2.score;

        // الدور النشط
        if (turn === 'X') {
            this.elements.hudP1.classList.add('active');
            this.elements.hudP2.classList.remove('active');
            this.updateStatus(`دور ${p1.name || 'القائد 1'}`, 'var(--p1-color)');
        } else {
            this.elements.hudP2.classList.add('active');
            this.elements.hudP1.classList.remove('active');
            this.updateStatus(`دور ${p2.name || 'القائد 2'}`, 'var(--p2-color)');
        }

        // تحديث عدادات القوى
        this.updatePowerCounts('X', p1.powers);
        this.updatePowerCounts('O', p2.powers);
        
        // تعطيل/تفعيل أزرار القوى حسب الدور
        const currentPowers = turn === 'X' ? p1.powers : p2.powers;
        document.querySelectorAll('.power-btn').forEach(btn => {
            const type = btn.dataset.power;
            if (currentPowers[type] > 0) {
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'all';
            } else {
                btn.style.opacity = '0.3';
                btn.style.pointerEvents = 'none';
            }
            // إزالة التفعيل السابق
            btn.classList.remove('active');
        });
    },

    updateStatus(msg, color) {
        const el = document.getElementById('game-status');
        const txt = document.getElementById('status-text');
        const dot = el.querySelector('.dot-indicator');
        
        txt.textContent = msg;
        dot.style.backgroundColor = color || '#ccc';
        el.classList.add('pulse-effect'); // نبض خفيف عند التحديث
        setTimeout(() => el.classList.remove('pulse-effect'), 500);
    },

    updatePowerCounts(playerSymbol, powers) {
        // نحدث العدادات فقط إذا كان هو اللاعب الحالي لتجنب الخلط البصري
        // أو يمكن تحديثها دائماً ولكن إخفاؤها بصرياً.
        // هنا سنحدث العدادات في DOM بناءً على المعرفات
        ['nuke', 'freeze', 'hack'].forEach(p => {
            const counter = document.getElementById(`count-${p}`);
            if (counter) counter.textContent = powers[p];
        });
    },

    // 6. التعامل مع النوافذ (Modals)
    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('hidden');
            // إعادة تشغيل أنيميشن الظهور
            const card = modal.querySelector('.modal-card');
            card.style.animation = 'none';
            card.offsetHeight; /* trigger reflow */
            card.style.animation = 'popUp 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
        }
    },

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('hidden');
    },

    // 7. إعداد الحاسبة (Calculator Setup)
    setupCalculator(questionData, mode) {
        const qContainer = this.elements.calcQ;
        const inputsContainer = this.elements.calcInputs;
        
        // عرض السؤال
        let displayQ = questionData.q || `الهدف: ${questionData.t}`;
        // تلوين العلامات
        displayQ = displayQ.replace(/\?/g, '<span style="color:var(--primary)">?</span>');
        
        if (mode === 'duality') {
            const opMap = {'*':'×', '/':'÷', '+':'جمع', '-':'طرح'};
            displayQ = `أوجد رقمين ناتجهما <b>${questionData.t}</b> (${opMap[questionData.op]})`;
        }
        
        qContainer.innerHTML = displayQ;
        inputsContainer.innerHTML = ''; // تفريغ الخانات

        // تحديد عدد الخانات
        let slotsCount = 1;
        if (mode === 'duality') slotsCount = 2;

        // إنشاء الخانات
        for (let i = 0; i < slotsCount; i++) {
            const slot = document.createElement('div');
            slot.className = 'calc-slot';
            slot.id = `calc-slot-${i}`;
            if (i === 0) slot.classList.add('active'); // تفعيل الأولى
            inputsContainer.appendChild(slot);
        }

        // إعادة تعيين شريط الوقت
        const timer = document.getElementById('timer-progress');
        timer.style.transition = 'none';
        timer.style.width = '100%';
        setTimeout(() => {
            timer.style.transition = 'width 15s linear'; // وقت افتراضي 15 ثانية
            timer.style.width = '0%';
        }, 50);
    },

    updateCalcInput(buffer, activeIndex) {
        // تحديث النصوص داخل الخانات
        const slots = document.querySelectorAll('.calc-slot');
        slots.forEach((slot, idx) => {
            slot.textContent = buffer[idx] || '';
            
            // تحديد الخانة النشطة
            if (idx === activeIndex) {
                slot.classList.add('active');
                slot.style.borderColor = 'var(--primary)';
            } else {
                slot.classList.remove('active');
                slot.style.borderColor = 'var(--border-light)';
            }
        });
    },

    // 8. مؤثرات بصرية خاصة
    shakeCalculator() {
        const card = document.querySelector('#modal-calc .modal-card');
        card.classList.add('shake-error');
        setTimeout(() => card.classList.remove('shake-error'), 400);
    },

    showWinScreen(winnerName) {
        document.getElementById('winner-name').textContent = winnerName;
        this.openModal('modal-win');
    }
};
