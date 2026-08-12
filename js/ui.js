/**
 * 🎨 UI MANAGER (FINAL)
 * رسم SVG، التوهج الديناميكي، المعلق الآلي، ونافذة الفوز الشاملة
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
    
    logTimer: null,

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
            
            sub.style.borderColor = '';
            sub.style.boxShadow = '';

            const oldOverlay = sub.querySelector('.win-overlay');
            if (oldOverlay) oldOverlay.remove();

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
            else if (!winner && (nextGrid === null || nextGrid === g)) {
                sub.classList.add('active-zone');
                
                const glow = state.turn === 'X' ? 'var(--p1-color)' : 'var(--p2-color)';
                const shadowGlow = state.turn === 'X' ? 'rgba(255, 158, 100, 0.4)' : 'rgba(100, 200, 255, 0.4)';
                
                sub.style.borderColor = glow;
                sub.style.boxShadow = `0 0 15px ${shadowGlow}, inset 0 0 20px rgba(0,0,0,0.5)`;
            }

            if (frozenGrid === g) {
                sub.classList.add('frozen');
                sub.style.borderColor = '#00d0ff';
                sub.style.boxShadow = '0 0 20px rgba(0, 208, 255, 0.6), inset 0 0 20px rgba(0, 208, 255, 0.3)';
            }

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
        const currentMemberName = GameLogic.getCurrentMemberName();
        
        this.elements.p1Name.textContent = state.p1.name;
        this.elements.p2Name.textContent = state.p2.name;
        this.elements.p1Score.textContent = state.p1.score;
        this.elements.p2Score.textContent = state.p2.score;
        
        this.elements.turnText.textContent = `الدور: ${currentMemberName}`;
        this.elements.turnText.style.color = state.turn === 'X' ? 'var(--p1-color)' : 'var(--p2-color)';

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

    // توليد SVG حقيقي للأيقونات بدلاً من البحث عن ملف خارجي
    setAvatars(p1Icon, p2Icon) {
        const getSrc = (i) => {
            if (i === 'X') return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><line x1='18' y1='6' x2='6' y2='18'></line><line x1='6' y1='6' x2='18' y2='18'></line></svg>";
            if (i === 'O') return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='9'></circle></svg>";
            return `assets/icons/${i}.svg`;
        };
        this.elements.p1Avatar.src = getSrc(p1Icon);
        this.elements.p2Avatar.src = getSrc(p2Icon);
    },
    
    log(msg) {
        if(this.elements.logText) {
            this.elements.logText.textContent = msg;
            
            if(this.logTimer) clearTimeout(this.logTimer);
            this.logTimer = setTimeout(() => {
                this.elements.logText.textContent = '...';
            }, 4000);
        }
    },

    showVictory(state, resultType) {
        const modal = document.getElementById('modal-victory');
        const contentBox = document.getElementById('victory-modal-content');
        const winnerNameEl = document.getElementById('victory-winner-name');
        const winnerIconEl = document.getElementById('victory-winner-icon');
        const titleEl = document.getElementById('victory-title');
        const subtitleEl = document.getElementById('victory-subtitle');
        const rosterEl = document.getElementById('victory-roster');

        const getSrc = (i) => {
            if (i === 'X') return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><line x1='18' y1='6' x2='6' y2='18'></line><line x1='6' y1='6' x2='18' y2='18'></line></svg>";
            if (i === 'O') return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='9'></circle></svg>";
            return `assets/icons/${i}.svg`;
        };
        
        rosterEl.innerHTML = '';
        contentBox.className = 'mech-modal';

        if (resultType === 'GAME_OVER_TIE') {
            titleEl.textContent = 'نهاية اللعبة';
            titleEl.style.color = '#fff';
            subtitleEl.textContent = 'تعادل تام! لا غالب ولا مغلوب';
            
            winnerNameEl.textContent = 'تعادل استراتيجي';
            winnerNameEl.style.color = '#aaa';
            winnerIconEl.src = 'assets/icons/balance.svg'; 
            winnerIconEl.style.color = '#aaa';
            
            contentBox.style.borderColor = '#555';
            contentBox.style.color = '#555';
        } 
        else {
            const winningTeam = state.winner === 'X' ? state.p1 : state.p2;
            const color = state.winner === 'X' ? 'var(--p1-color)' : 'var(--p2-color)';
            
            titleEl.textContent = 'نهاية اللعبة';
            titleEl.style.color = 'var(--accent-gold)';
            
            if (resultType === 'GAME_OVER_POINTS') {
                subtitleEl.textContent = 'تعادل في الساحة.. وتقدم بالنقاط!';
            } else {
                subtitleEl.textContent = 'انتصار مستحق!';
            }
            
            winnerNameEl.textContent = winningTeam.name;
            winnerNameEl.style.color = color;
            winnerIconEl.src = getSrc(winningTeam.icon);
            winnerIconEl.style.color = color;

            contentBox.style.borderColor = color;
            contentBox.style.color = color; 
            contentBox.classList.add('victory-pulse');

            if (winningTeam.roster && winningTeam.roster.length > 0) {
                winningTeam.roster.forEach(member => {
                    const badge = document.createElement('span');
                    badge.textContent = member;
                    badge.style.background = 'rgba(255,255,255,0.1)';
                    badge.style.border = `1px solid ${color}`;
                    badge.style.color = '#fff';
                    badge.style.padding = '5px 12px';
                    badge.style.borderRadius = '20px';
                    badge.style.fontSize = '0.9rem';
                    badge.style.fontWeight = 'bold';
                    rosterEl.appendChild(badge);
                });
            }
        }

        modal.classList.remove('hidden');
    }
};
