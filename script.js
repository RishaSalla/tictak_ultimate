let currentTeam = 'X', gameActive = false, metaBoard = Array(9).fill(null);
let localBoards = Array(9).fill(null).map(() => Array(9).fill(null));
let diffLevel, timeLimit, countdown, targetCell, currentAns, playerAnswer = "";

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

function generateQuestion() {
    let a, b, op, ans, qText;
    const level = parseInt(diffLevel);
    
    // الأطراف دائماً 1-9
    const getNum = (isOneAllowed) => (isOneAllowed && Math.random() < 0.01) ? 1 : Math.floor(Math.random() * 8) + 2;

    const type = ['+', '-', '*', '/'][Math.floor(Math.random() * 4)];
    if (type === '*') { a = getNum(false); b = getNum(false); ans = a * b; op = '×'; }
    else if (type === '/') { 
        ans = Math.floor(Math.random() * 5) + 2; // ناتج بسيط في المباشر
        b = Math.floor(Math.random() * 4) + 2;
        if (level > 1) { ans = getNum(false); b = getNum(false); } // توسيع في المفقود
        a = ans * b; op = '÷';
    } 
    else if (type === '+') { a = getNum(true); b = getNum(true); ans = a + b; op = '+'; }
    else { a = Math.floor(Math.random() * 8) + 2; b = Math.floor(Math.random() * (a-1)) + 1; ans = a - b; op = '-'; }

    if (level === 1) { qText = `${a} ${op} ${b} = ?`; currentAns = ans; }
    else if (level === 2) { 
        if (Math.random() > 0.5) { qText = `? ${op} ${b} = ${ans}`; currentAns = a; }
        else { qText = `${a} ${op} ? = ${ans}`; currentAns = b; }
    }
    else if (level === 3) { qText = `? ${op} ? = ${ans}`; currentAns = a; } // مثال مبسط للفراغين
    else { let off = 1; qText = `${a} ${op} ${b} = ? + ${off}`; currentAns = ans - off; }

    document.getElementById('equation-display').textContent = qText;
}

function initGame() {
    diffLevel = document.getElementById('difficultyLevel').value;
    timeLimit = parseInt(document.getElementById('timerConfig').value);
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    const container = document.getElementById('main-81-board');
    container.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        let lb = document.createElement('div'); lb.className = 'local-board'; lb.dataset.board = i;
        for (let j = 0; j < 9; j++) {
            let c = document.createElement('div'); c.className = 'cell'; c.dataset.cell = j;
            c.onclick = () => {
                if (!gameActive || c.getAttribute('data-content')) return;
                targetCell = c; playerAnswer = ""; document.getElementById('ans-preview').textContent = "_";
                document.getElementById('math-popup').classList.remove('hidden'); generateQuestion();
            };
            lb.appendChild(c);
        }
        container.appendChild(lb);
    }
    gameActive = true;
}

function numClick(n) {
    playerAnswer += n; document.getElementById('ans-preview').textContent = playerAnswer;
    if (parseInt(playerAnswer) === currentAns) {
        document.getElementById('ans-status').classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('math-popup').classList.add('hidden');
            document.getElementById('ans-status').classList.add('hidden');
            targetCell.setAttribute('data-content', currentTeam);
            currentTeam = currentTeam === 'X' ? 'O' : 'X';
        }, 1000);
    }
}

document.getElementById('launchGameBtn').onclick = initGame;
function toggleModal(s) { document.getElementById('full-instr-modal').classList.toggle('hidden', !s); }
function numClear() { playerAnswer = ""; document.getElementById('ans-preview').textContent = "_"; }
function backToMenu() { location.reload(); }
