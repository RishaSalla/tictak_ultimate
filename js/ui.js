/**
 * 🎨 UI MANAGER - FINAL
 * دعم اللعب بالأيقونات وعرض الرموز الكبيرة
 */

import { GameLogic } from './logic.js';

export const UI = {
    elements: {
        screens: document.querySelectorAll('.screen'),
        gridContainer: document.getElementById('game-grid'),
        statusText: document.getElementById('game-status'),
        turnText: document.getElementById('turn-text'),
        rolePlayerName: document.getElementById('role-player-name'),
        
        panelP1: document.getElementById('panel-p1'),
        panelP2: document.getElementById('panel-p2'),
        scoreX: document.getElementById('score-x'),
        scoreO: document.getElementById('score-o'),
        nameP1: document.getElementById('disp-name-p1'),
        nameP2: document.getElementById('disp-name-p2'),
        avP1: document.getElementById('disp-av-p1'),
        avP2: document.getElementById('disp-av-p2'),

        calcQ: document.getElementById('calc-q'),
        calcInputs: document.getElementById('calc-inputs'),
        winnerName: document.getElementById('winner-name'),
        
        rosterListP1: document.getElementById('p1-roster-list'),
        rosterListP2: document.getElementById('p2-roster-list')
    },

    showScreen(screenId) {
        this.elements.screens.forEach(s => {
            s.classList.remove('active');
            s.classList.add('hidden');
        });
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.remove('hidden');
            setTimeout(() => target.classList.add('active'), 10);
        }
    },

    renderRoster(playerId, roster) {
        const listEl = playerId === 'p1' ? this.elements.rosterListP1 : this.elements.rosterListP2;
        listEl.innerHTML = ''; 
        roster.forEach((name, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${name}</span><span class="remove-player" data-pid="${playerId}" data-idx="${index}">×</span>`;
            listEl.appendChild(li);
        });
    },

    updateAvatarSelection(playerId, selectedVal) {
        const container = document.getElementById(`${playerId}-avatars`);
        container.querySelectorAll('.av-btn').forEach(btn => {
            if (btn.dataset.val === selectedVal) btn.classList.add('selected');
            else btn.classList.remove('selected');
        });
    },

    createGrid(onClickCallback) {
        const grid = this.elements.gridContainer;
        grid.innerHTML = ''; 
        for (let g = 0; g < 9; g++) {
            const subGrid = document.createElement('div');
            subGrid.className = 'sub-grid';
            subGrid.id = `sub-${g}`;
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.g = g;
                cell.dataset.c = c;
                cell.addEventListener('click', () => onClickCallback(g, c));
                subGrid.appendChild(cell);
            }
            grid.appendChild(subGrid);
        }
    },

    // --- التعديل الجوهري هنا ---
    updateGrid(logicState) {
        const { grid, metaGrid, nextGrid, winner, p1, p2 } = logicState;

        for (let g = 0; g < 9; g++) {
            const subEl = document.getElementById(`sub-${g}`);
            subEl.className = 'sub-grid'; 
            
            // 1. حالة المربع الكبير (الرمز الكبير)
            if (metaGrid[g] !== null) {
                subEl.classList.add('won');
                
                // تحديد الرمز الكبير بناءً على الفائز
                let winSymbol = '';
                if (metaGrid[g] === 'X') {
                    subEl.style.backgroundColor = 'var(--p1-color)';
                    winSymbol = p1.avatar; // استعمل أيقونة اللاعب
                } else if (metaGrid[g] === 'O') {
                    subEl.style.backgroundColor = 'var(--p2-color)';
                    winSymbol = p2.avatar;
                } else {
                    subEl.style.backgroundColor = '#cbd5e0';
                }
                
                // حقن الرمز الكبير في الـ CSS
                subEl.setAttribute('data-symbol', winSymbol);

            } else {
                subEl.style.backgroundColor = '#e2e8f0'; // رمادي فاتح للخلفية
                subEl.removeAttribute('data-symbol');
            }

            // 2. المنطقة النشطة
            if (!winner && metaGrid[g] === null) {
                if (nextGrid === null || nextGrid === g) {
                    subEl.classList.add('active-zone');
                }
            }

            // 3. تحديث الخلايا بالأيقونات
            const cells = subEl.children;
            for (let c = 0; c < 9; c++) {
                const cell = cells[c];
                const val = grid[g][c]; // هذا يعود بـ X أو O من المنطق
                
                cell.className = 'cell';
                
                // تحويل X/O إلى الأيقونة المختارة
                if (val === 'X') {
                    cell.textContent = p1.avatar;
                    cell.classList.add('x');
                } else if (val === 'O') {
                    cell.textContent = p2.avatar;
                    cell.classList.add('o');
                } else {
                    cell.textContent = '';
                }
            }
        }
    },

    updateHUD(state) {
        const { turn, p1, p2 } = state;

        this.elements.scoreX.textContent = p1.score;
        this.elements.scoreO.textContent = p2.score;
        this.elements.nameP1.textContent = p1.name;
        this.elements.nameP2.textContent = p2.name;
        
        // عرض الأيقونات في اللوحات الجانبية
        this.elements.avP1.textContent = p1.avatar;
        this.elements.avP2.textContent = p2.avatar;

        const currentPlayerName = GameLogic.getCurrentMember();
        const turnLabel = this.elements.turnText;
        const roleLabel = this.elements.rolePlayerName;

        // إظهار اسم اللاعب المناوب فقط إذا كان هناك قائمة
        const showRole = (turn === 'X' ? p1.roster.length : p2.roster.length) > 0;
        roleLabel.style.display = showRole ? 'block' : 'none';

        if (turn === 'X') {
            this.elements.panelP1.style.boxShadow = '0 0 15px var(--p1-color)';
            this.elements.panelP1.style.border = '2px solid var(--p1-color)';
            this.elements.panelP2.style.boxShadow = 'none';
            this.elements.panelP2.style.border = 'none';
            turnLabel.textContent = `دور ${p1.name}`;
            turnLabel.className = 'turn-indicator p1-turn';
            roleLabel.textContent = `اللاعب: ${currentPlayerName}`;
        } else {
            this.elements.panelP2.style.boxShadow = '0 0 15px var(--p2-color)';
            this.elements.panelP2.style.border = '2px solid var(--p2-color)';
            this.elements.panelP1.style.boxShadow = 'none';
            this.elements.panelP1.style.border = 'none';
            turnLabel.textContent = `دور ${p2.name}`;
            turnLabel.className = 'turn-indicator p2-turn';
            roleLabel.textContent = `اللاعب: ${currentPlayerName}`;
        }
        this.updatePowers(p1, 'p1');
        this.updatePowers(p2, 'p2');
    },

    updatePowers(playerData, pid) {
        ['nuke', 'freeze', 'hack'].forEach(type => {
            const badge = document.getElementById(`${pid}-${type}-count`);
            if (badge) badge.textContent = playerData.powers[type];
            const btn = document.querySelector(`.power-btn.${pid}[data-power="${type}"]`);
            if(btn) btn.style.opacity = playerData.powers[type] > 0 ? '1' : '0.4';
        });
    },

    updateStatus(msg) {
        const el = this.elements.statusText;
        el.textContent = msg;
        el.classList.add('pulse');
        setTimeout(() => el.classList.remove('pulse'), 1000);
    },

    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) { modal.classList.remove('hidden'); modal.style.display = 'flex'; }
    },
    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) { modal.classList.add('hidden'); modal.style.display = 'none'; }
    },

    setupCalculator(questionData) {
        let displayQ = questionData.q.replace(/\?/g, '<span style="color:var(--text-main); border-bottom:2px solid">?</span>');
        this.elements.calcQ.innerHTML = displayQ;
        this.elements.calcInputs.innerHTML = ''; 
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
