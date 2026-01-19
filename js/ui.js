/**
 * 🎨 UI MANAGER (UPDATED)
 * رسم SVG، الشبكة، والتحديثات
 */

import { GameLogic } from './logic.js';
import { HelpData } from './data.js';

export const UI = {
    elements: {
        screens: document.querySelectorAll('.screen'),
        grid: document.getElementById('game-grid'),
        turnText: document.getElementById('turn-text'),
        logText: document.getElementById('game-log-text'),
        p1Score: document.getElementById('score-p1'),
        p2Score: document.getElementById('score-p2'),
        p1Avatar: document.getElementById('p1-avatar-img'),
        p2Avatar: document.getElementById('p2-avatar-img'),
        p1Name: document.getElementById('p1-display-name'),
        p2Name: document.getElementById('p2-display-name'),
        timerBar: document.getElementById('timer-bar')
    },

    showScreen(id) {
        this.elements.screens.forEach(s => {
            s.classList.remove('active');
            s.classList.add('hidden');
        });
        const active = document.getElementById(id);
        active.classList.remove('hidden');
        setTimeout(() => active.classList.add('active'), 10);
    },

    initGrid(callback) {
        const gridEl = this.elements.grid;
        gridEl.innerHTML = '';
        for (let g = 0; g < 9; g++) {
            const sub = document.createElement('div');
            sub.className = 'sub-grid';
            sub.id = `sub-${g}`;
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.g = g;
                cell.dataset.c = c;
                cell.addEventListener('click', () => callback(g, c));
                sub.appendChild(cell);
            }
            gridEl.appendChild(sub);
        }
    },

    updateGrid(state) {
        const { grid, metaGrid, nextGrid, winner, p1, p2, frozenGrid } = state;

        for (let g = 0; g < 9; g++) {
            const sub = document.getElementById(`sub-${g}`);
            sub.className = 'sub-grid';
            
            // إزالة أي طبقة فوز سابقة
            const oldOverlay = sub.querySelector('.win-overlay');
            if (oldOverlay) oldOverlay.remove();

            // 1. حالة الفوز بالمربع (رسم SVG)
            if (metaGrid[g] !== null) {
                sub.classList.add('won');
                const winIcon = metaGrid[g] === 'X' ? p1.icon : p2.icon;
                const color = metaGrid[g] === 'X' ? 'var(--p1-color)' : 'var(--p2-color)';
                
                const overlay = document.createElement('div');
                overlay.className = 'win-overlay';
                overlay.style.position = 'absolute'; overlay.style.inset = '0';
                overlay.style.background = 'rgba(0,0,0,0.85)';
                overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
                overlay.style.zIndex = '5';
                
                if (['X', 'O'].includes(winIcon)) {
                    overlay.textContent = winIcon;
                    overlay.style.fontSize = '4rem'; overlay.style.fontWeight = 'bold';
                    overlay.style.color = color;
                } else {
                    const img = document.createElement('img');
                    img.src = `assets/icons/${winIcon}.svg`;
                    img.style.width = '60%'; img.style.height = '60%';
                    img.style.filter = 'drop-shadow(0 0 10px currentColor)';
                    overlay.style.color = color;
                    overlay.appendChild(img);
                }
                sub.appendChild(overlay);
            } 
            // 2. المنطقة النشطة
            else if (!winner && (nextGrid === null || nextGrid === g)) {
                sub.classList.add('active-zone');
            }

            if (frozenGrid === g) sub.classList.add('frozen');

            // تحديث الخلايا
            Array.from(sub.children).forEach((cell, c) => {
                if(cell.classList.contains('win-overlay')) return;
                const val = grid[g][c];
                cell.innerHTML = '';
                if (val) {
                    const icon = val === 'X' ? p1.icon : p2.icon;
                    if (['X', 'O'].includes(icon)) {
                        const span = document.createElement('span');
                        span.textContent = icon;
                        cell.appendChild(span);
                    } else {
                        const img = document.createElement('img');
                        img.src = `assets/icons/${icon}.svg`;
                        cell.appendChild(img);
                    }
                    cell.style.color = val === 'X' ? 'var(--p1-color)' : 'var(--p2-color)';
                }
            });
        }
    },

    updateHUD(state) {
        const cur = GameLogic.getCurrentMember();
        this.elements.p1Name.textContent = state.p1.name;
        this.elements.p2Name.textContent = state.p2.name;
        this.elements.p1Score.textContent = state.p1.score;
        this.elements.p2Score.textContent = state.p2.score;
        
        this.elements.turnText.textContent = `الدور: ${cur.name}`;
        this.elements.turnText.style.color = state.turn === 'X' ? 'var(--p1-color)' : 'var(--p2-color)';

        // تحديث أزرار القوى
        ['p1', 'p2'].forEach(pid => {
            const powers = state[pid].powers;
            document.querySelectorAll(`.power-btn.${pid}`).forEach(btn => {
                const type = btn.dataset.power;
                if (!powers[type]) {
                    btn.classList.add('disabled');
                    btn.style.opacity = '0.3'; btn.style.pointerEvents = 'none';
                } else {
                    btn.classList.remove('disabled');
                    btn.style.opacity = '1'; btn.style.pointerEvents = 'all';
                }
            });
        });
    },

    updateTimer(percent) {
        const bar = this.elements.timerBar.firstElementChild;
        if(bar) {
            bar.style.width = `${percent}%`;
            bar.style.background = percent < 30 ? 'red' : 'var(--accent-gold)';
        }
    },

    setAvatars(p1Icon, p2Icon) {
        const getSrc = (i) => ['X', 'O'].includes(i) ? 'assets/icons/code.svg' : `assets/icons/${i}.svg`;
        this.elements.p1Avatar.src = getSrc(p1Icon);
        this.elements.p2Avatar.src = getSrc(p2Icon);
    },
    
    log(msg) {
        if(this.elements.logText) this.elements.logText.textContent = msg;
    }
};
