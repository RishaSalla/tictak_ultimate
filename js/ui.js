/**
 * 🎨 UI MANAGER - TEAM EDITION
 * مسؤول عن رسم القوائم، تحديث الأسماء، والشبكة
 */

import { GameLogic } from './logic.js';

export const UI = {
    elements: {
        screens: document.querySelectorAll('.screen'),
        gridContainer: document.getElementById('game-grid'),
        statusText: document.getElementById('game-status'),
        turnText: document.getElementById('turn-text'),
        rolePlayerName: document.getElementById('role-player-name'), // العنصر الجديد
        
        // الألواح
        panelP1: document.getElementById('panel-p1'),
        panelP2: document.getElementById('panel-p2'),
        scoreX: document.getElementById('score-x'),
        scoreO: document.getElementById('score-o'),
        nameP1: document.getElementById('disp-name-p1'),
        nameP2: document.getElementById('disp-name-p2'),
        avP1: document.getElementById('disp-av-p1'),
        avP2: document.getElementById('disp-av-p2'),

        // الحاسبة والنوافذ
        calcQ: document.getElementById('calc-q'),
        calcInputs: document.getElementById('calc-inputs'),
        winnerName: document.getElementById('winner-name'),
        
        // القوائم (Rosters)
        rosterListP1: document.getElementById('p1-roster-list'),
        rosterListP2: document.getElementById('p2-roster-list')
    },

    // 1. التنقل بين الشاشات
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

    // 2. إدارة القوائم (Rosters) - جديد
    renderRoster(playerId, roster) {
        const listEl = playerId === 'p1' ? this.elements.rosterListP1 : this.elements.rosterListP2;
        listEl.innerHTML = ''; // مسح القائمة الحالية

        roster.forEach((name, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${name}</span>
                <span class="remove-player" data-pid="${playerId}" data-idx="${index}">×</span>
            `;
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

    // 3. رسم الرقعة
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

    // 4. تحديث الرقعة (مع التركيز على الوضوح)
    updateGrid(logicState) {
        const { grid, metaGrid, nextGrid, winner } = logicState;

        for (let g = 0; g < 9; g++) {
            const subEl = document.getElementById(`sub-${g}`);
            
            // تنظيف الكلاسات
            subEl.className = 'sub-grid'; 
            
            // حالة المربع الكبير
            if (metaGrid[g] !== null) {
                subEl.classList.add('won');
                if (metaGrid[g] === 'X') subEl.style.backgroundColor = 'var(--p1-color)';
                else if (metaGrid[g] === 'O') subEl.style.backgroundColor = 'var(--p2-color)';
                else subEl.style.backgroundColor = '#cbd5e0';
            } else {
                subEl.style.backgroundColor = '#cbd5e0'; // لون الفراغات (رمادي)
            }

            // المنطقة النشطة (Active Zone)
            if (!winner && metaGrid[g] === null) {
                if (nextGrid === null || nextGrid === g) {
                    subEl.classList.add('active-zone'); // الإطار الذهبي
                }
            }

            // تحديث الخلايا
            const cells = subEl.children;
            for (let c = 0; c < 9; c++) {
                const cell = cells[c];
                const val = grid[g][c];
                
                cell.className = 'cell'; // إعادة تعيين
                cell.textContent = val || '';
                
                if (val === 'X') cell.classList.add('x');
                if (val === 'O') cell.classList.add('o');
            }
        }
    },

    // 5. تحديث المعلومات (HUD) - يدعم أسماء اللاعبين المتناوبين
    updateHUD(state) {
        const { turn, p1, p2 } = state;

        this.elements.scoreX.textContent = p1.score;
        this.elements.scoreO.textContent = p2.score;
        
        // أسماء الفرق
        this.elements.nameP1.textContent = p1.name;
        this.elements.nameP2.textContent = p2.name;
        
        if(p1.avatar) this.elements.avP1.textContent = p1.avatar;
        if(p2.avatar) this.elements.avP2.textContent = p2.avatar;

        // من عليه الدور؟ (اسم اللاعب المحدد)
        const currentPlayerName = GameLogic.getCurrentMember(); // دالة المنطق الجديدة

        const turnLabel = this.elements.turnText;
        const roleLabel = this.elements.rolePlayerName;

        if (turn === 'X') {
            this.elements.panelP1.style.boxShadow = '0 0 15px var(--p1-color)';
            this.elements.panelP1.style.border = '2px solid var(--p1-color)';
            this.elements.panelP2.style.boxShadow = 'none';
            this.elements.panelP2.style.border = 'none';
            
            turnLabel.textContent = `دور ${p1.name}`; // اسم الفريق
            turnLabel.className = 'turn-indicator p1-turn';
            roleLabel.textContent = `اللاعب: ${currentPlayerName}`; // اسم الشخص
        } else {
            this.elements.panelP2.style.boxShadow = '0 0 15px var(--p2-color)';
            this.elements.panelP2.style.border = '2px solid var(--p2-color)';
            this.elements.panelP1.style.boxShadow = 'none';
            this.elements.panelP1.style.border = 'none';

            turnLabel.textContent = `دور ${p2.name}`;
            turnLabel.className = 'turn-indicator p2-turn';
            roleLabel.textContent = `اللاعب: ${currentPlayerName}`;
        }

        // تحديث أزرار القوة
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

    // 6. النوافذ
    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('hidden');
            // تأكيد ظهور الـ Overlay
            modal.style.display = 'flex'; 
        }
    },

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    },

    // 7. الحاسبة
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
