/**
 * 🎨 UI MANAGER - RETRO MECHANICAL EDITION
 * مدير الواجهة المسؤول عن الرقعة الكبيرة وربط الأيقونات الشامل
 */

import { GameLogic } from './logic.js';
import { HelpData } from './data.js';

export const UI = {
    elements: {
        screens: document.querySelectorAll('.screen'),
        gridContainer: document.getElementById('game-grid'),
        turnDisplay: document.getElementById('turn-indicator'),
        helpContent: document.getElementById('help-content-area'),
        calcQ: document.getElementById('calc-q'),
        calcInputs: document.getElementById('calc-inputs'),
        
        // لوحات المعلومات الجانبية
        p1Avatar: document.getElementById('disp-av-p1'),
        p2Avatar: document.getElementById('disp-av-p2'),
        p1Name: document.getElementById('disp-name-p1'),
        p2Name: document.getElementById('disp-name-p2'),
        p1Score: document.getElementById('score-x'),
        p2Score: document.getElementById('score-o')
    },

    // تنقل الشاشات (تبديل الكلاسات لضمان المركزية)
    showScreen(screenId) {
        this.elements.screens.forEach(s => {
            s.classList.add('hidden');
            s.classList.remove('active');
        });
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
        }
    },

    // بناء الرقعة الكبيرة (The Giant Grid)
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

    // تحديث الحالة البصرية للرقعة والأيقونات
    updateGrid(logicState) {
        const { grid, metaGrid, nextGrid, winner, p1, p2 } = logicState;

        for (let g = 0; g < 9; g++) {
            const subEl = document.getElementById(`sub-${g}`);
            subEl.className = 'sub-grid'; 
            
            // وميض النيون للمربع النشط
            if (!winner && metaGrid[g] === null) {
                if (nextGrid === null || nextGrid === g) {
                    subEl.classList.add('active-zone');
                }
            }

            // عرض الرموز الضخمة عند الفوز بمربع
            if (metaGrid[g] !== null) {
                subEl.classList.add('won');
                const winSymbol = metaGrid[g] === 'X' ? p1.avatar : p2.avatar;
                subEl.setAttribute('data-symbol', winSymbol);
                subEl.style.color = metaGrid[g] === 'X' ? 'var(--p1-color)' : 'var(--p2-color)';
            }

            const cells = subEl.children;
            for (let c = 0; c < 9; c++) {
                const cell = cells[c];
                const val = grid[g][c];
                cell.textContent = val === 'X' ? p1.avatar : (val === 'O' ? p2.avatar : '');
                if (val) cell.style.color = val === 'X' ? 'var(--p1-color)' : 'var(--p2-color)';
            }
        }
    },

    // تحديث اللوحات الجانبية (HUD)
    updateHUD(state) {
        const { turn, p1, p2 } = state;
        const currentMember = GameLogic.getCurrentMember();

        this.elements.p1Name.textContent = p1.name;
        this.elements.p2Name.textContent = p2.name;
        this.elements.p1Score.textContent = p1.score;
        this.elements.p2Score.textContent = p2.score;
        
        this.elements.turnDisplay.textContent = `دور: ${currentMember}`;
        this.elements.turnDisplay.style.color = turn === 'X' ? 'var(--p1-color)' : 'var(--p2-color)';
    },

    // إدارة النوافذ والتعليمات
    openModal(id, helpKey = null) {
        if (helpKey) {
            this.elements.helpContent.innerHTML = `<p>${HelpData[helpKey]}</p>`;
        }
        document.getElementById(id).classList.remove('hidden');
    },

    closeModal(id) {
        document.getElementById(id).classList.add('hidden');
    }
};
