let currentPlayer = 'X';
let gameBoard = ['', '', '', '', '', '', '', '', ''];
let gameActive = true;
const scores = { X: 0, O: 0 };
let gameMode = localStorage.getItem('tictactoeGameMode') || 'friend';
let isPlayerTurn = true;
let isFirstGame = true;
let moveHistory = [];
let timerActive = false;
let timeLeft = 60;
let timerInterval;
let timerStarted = false;

const LEARNING_STORAGE_KEY = 'tictactoeLearningData';
let learningData = JSON.parse(localStorage.getItem(LEARNING_STORAGE_KEY)) || {
    moveHistory: [],
    playerPatterns: {},
    winningMoves: {},
    totalGames: 0
};

const savedScores = JSON.parse(localStorage.getItem('tictactoeScores')) || { X: 0, O: 0 };
scores.X = savedScores.X;
scores.O = savedScores.O;
updateScore();

const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

const stats = JSON.parse(localStorage.getItem('tictactoeStats')) || {
    gamesPlayed: 0,
    xWins: 0,
    oWins: 0,
    draws: 0,
    winStreak: 0,
    currentStreak: 0
};

const themes = {
    classic: {
        x: { color: '#e74c3c', symbol: 'X' },
        o: { color: '#3498db', symbol: 'O' }
    },
    emoji: {
        x: { color: 'inherit', symbol: '❌' },
        o: { color: 'inherit', symbol: '⭕' }
    },
    nature: {
        x: { color: '#27ae60', symbol: '🌳' },
        o: { color: '#f1c40f', symbol: '🌞' }
    }
};

const translations = {
    de: {
        title: "TicTacToe",
        againstFriend: "Gegen Freund spielen",
        againstAI: "Gegen KI spielen",
        coinFlip: "Münzwurf",
        timeLimit: "Zeitlimit",
        resetScore: "Punktestand zurücksetzen",
        youWin: "Du gewinnst!",
        aiWins: "KI gewinnt!",
        draw: "Unentschieden!",
        timeUp: "Zeit abgelaufen!",
        youLose: "Du verlierst!",
        player: "Spieler",
        undoMove: "Zug zurück",
        keyboardControls: "Tastatursteuerung"
    },
    en: {
        title: "TicTacToe",
        againstFriend: "Play against Friend",
        againstAI: "Play against AI",
        coinFlip: "Coin Flip",
        timeLimit: "Time Limit",
        resetScore: "Reset Score",
        youWin: "You win!",
        aiWins: "AI wins!",
        draw: "Draw!",
        timeUp: "Time's up!",
        youLose: "You lose!",
        player: "Player",
        undoMove: "Undo Move",
        keyboardControls: "Keyboard Controls"
    }
};

let currentLang = localStorage.getItem('tictactoeLang') || 'de';
document.documentElement.setAttribute('data-lang', currentLang);

// Sprach-Dropdown Event Listener
document.getElementById('languageSelect').addEventListener('change', (e) => {
    currentLang = e.target.value;
    localStorage.setItem('tictactoeLang', currentLang);
    document.documentElement.setAttribute('data-lang', currentLang);
    updateTexts();
});

// Setze initiale Sprache
document.getElementById('languageSelect').value = currentLang;
updateTexts();

function updateTexts() {
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        element.textContent = translations[currentLang][key];
    });
}

document.querySelectorAll('.cell').forEach(cell => {
    cell.addEventListener('click', handleCellClick);
});

document.getElementById('gameMode').addEventListener('change', (e) => {
    gameMode = e.target.value;
    localStorage.setItem('tictactoeGameMode', gameMode);
    resetGame();
    
    if (gameMode === 'unbeatable') {
        currentPlayer = 'X';
        isPlayerTurn = true;
    }
    
    const coinButton = document.getElementById('coinFlip');
    coinButton.disabled = gameMode !== 'friend';
    
    updatePlayerIndicator();
});

document.getElementById('resetScores').addEventListener('click', () => {
    scores.X = 0;
    scores.O = 0;
    localStorage.removeItem('tictactoeScores');
    updateScore();
    resetGame();
});

document.getElementById('coinFlip').addEventListener('click', () => {
    if (!isFirstGame) return;
    
    const overlay = document.querySelector('.coin-overlay');
    const coinAnim = document.querySelector('.coin-animation');
    const coinButton = document.getElementById('coinFlip');
    const gameBoard = document.querySelector('.game-board');
    
    overlay.classList.add('show');
    coinAnim.classList.add('flipping');
    coinButton.disabled = true;
    gameBoard.classList.add('disabled');
    
    const isHeads = Math.random() >= 0.5;
    
    setTimeout(() => {
        coinAnim.style.transform = `rotateY(${isHeads ? 1800 : 1980}deg)`;
        
        setTimeout(() => {
            overlay.classList.remove('show');
            coinAnim.classList.remove('flipping');
            coinAnim.style.transform = '';
            
            if (gameMode === 'unbeatable') {
                currentPlayer = isHeads ? 'X' : 'O';
                isPlayerTurn = isHeads;
                
                updatePlayerIndicator();
                
                const message = document.querySelector('.winner-message');
                message.innerHTML = `
                    <i class="fas ${isHeads ? 'fa-crown' : 'fa-hashtag'}"></i>&nbsp;
                    ${isHeads ? 'Du' : 'KI'} beginnt!
                `;
                message.classList.add('show');
                
                setTimeout(() => {
                    message.classList.add('hide');
                    setTimeout(() => {
                        message.classList.remove('show', 'hide');
                        gameBoard.classList.remove('disabled');
                        
                        if (!isHeads) {
                            setTimeout(() => {
                                makeBotMove();
                            }, 500);
                        }
                    }, 500);
                }, 1000);
            } else {
                currentPlayer = isHeads ? 'X' : 'O';
                isPlayerTurn = true;
                
                updatePlayerIndicator();
                
                const message = document.querySelector('.winner-message');
                message.innerHTML = `
                    <i class="fas ${isHeads ? 'fa-crown' : 'fa-hashtag'}"></i>&nbsp;
                    ${isHeads ? 'Du' : 'KI'} beginnt!
                `;
                message.classList.add('show');
                
                setTimeout(() => {
                    message.classList.add('hide');
                    setTimeout(() => {
                        message.classList.remove('show', 'hide');
                        gameBoard.classList.remove('disabled');
                        
                        if (!isHeads) {
                            setTimeout(() => {
                                makeBotMove();
                            }, 500);
                        }
                    }, 500);
                }, 1000);
            }
        }, 500);
    }, 3000);
});

document.getElementById('timerToggle').addEventListener('change', (e) => {
    timerActive = e.target.checked;
    timerStarted = false;
    if (timerActive) {
        timeLeft = 60;
        updateTimerDisplay();
    } else {
        clearInterval(timerInterval);
        document.querySelector('.timer-display').classList.remove('active');
    }
});

updatePlayerIndicator();

function handleCellClick(e) {
    if (!gameActive || !isPlayerTurn) return;
    
    const cell = e.target;
    const index = cell.getAttribute('data-index');

    if (gameBoard[index] === '') {
        makeMove(index);
        
        if (gameMode === 'unbeatable' && gameActive) {
            isPlayerTurn = false;
            setTimeout(() => {
                makeBotMove();
            }, 500);
        }
    }
}

function makeMove(index) {
    gameBoard[index] = currentPlayer;
    const cell = document.querySelector(`[data-index="${index}"]`);
    cell.textContent = currentPlayer;
    cell.setAttribute('data-symbol', currentPlayer);
    
    if (timerActive && !timerStarted && gameBoard.filter(cell => cell !== '').length === 1) {
        timerStarted = true;
        startTimer();
    }
    
    if (checkWin()) {
        scores[currentPlayer]++;
        localStorage.setItem('tictactoeScores', JSON.stringify(scores));
        updateScore();
        const message = document.querySelector('.winner-message');
        message.innerHTML = `
            <i class="fas fa-trophy"></i>&nbsp;
            ${currentPlayer === 'X' ? 'Du gewinnst!' : 'KI gewinnt!'}
        `;
        message.classList.add('show');
        gameActive = false;
        
        setTimeout(() => {
            message.classList.add('hide');
            setTimeout(() => {
                message.classList.remove('show', 'hide');
                resetGame();
            }, 500);
        }, 1500);
    } else if (isDrawInevitable()) {
        const message = document.querySelector('.winner-message');
        message.innerHTML = `
            <i class="fas fa-handshake"></i>&nbsp;
            Unentschieden!
        `;
        message.classList.add('show');
        gameActive = false;
        
        setTimeout(() => {
            message.classList.add('hide');
            setTimeout(() => {
                message.classList.remove('show', 'hide');
                resetGame();
            }, 500);
        }, 1500);
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updatePlayerIndicator();
    }
    reduceTime();
}

function makeBotMove() {
    if (!gameActive) return;
    
    const move = makeUnbeatableMove();
    
    if (move !== null) {
        makeMove(move);
        isPlayerTurn = true;
    }
    reduceTime();
}

function checkWin() {
    return winningCombinations.some(combination => {
        return combination.every(index => {
            return gameBoard[index] === currentPlayer;
        });
    });
}

function checkDraw() {
    return gameBoard.every(cell => cell !== '');
}

function updateScore() {
    document.querySelector('#player-x .points').textContent = scores.X;
    document.querySelector('#player-o .points').textContent = scores.O;
}

function updatePlayerIndicator() {
    document.getElementById('player-x').classList.toggle('active', currentPlayer === 'X');
    document.getElementById('player-o').classList.toggle('active', currentPlayer === 'O');
}

function getWinningCombination() {
    return winningCombinations.find(combination => {
        return combination.every(index => gameBoard[index] === currentPlayer);
    });
}

function drawWinningLine(combination) {
    const line = document.createElement('div');
    line.classList.add('winning-line');
    
    const lastClickedIndex = combination.find(index => gameBoard[index] === currentPlayer);
    const lastClickedCell = document.querySelector(`[data-index="${lastClickedIndex}"]`);
    
    if (combination[0] % 3 === 0 && combination[2] % 3 === 2) {
        line.classList.add('horizontal');
        if (lastClickedIndex % 3 === 2) {
            line.classList.add('reverse');
        }
        lastClickedCell.appendChild(line);
    } else if (combination[0] <= 2 && combination[2] >= 6) {
        line.classList.add('vertical');
        if (lastClickedIndex >= 6) {
            line.classList.add('reverse');
        }
        lastClickedCell.appendChild(line);
    } else {
        line.classList.add('diagonal');
        const isDiagonalDown = combination.includes(0) && combination.includes(8);
        
        if (isDiagonalDown) {
            if (lastClickedIndex === 8) {
                line.classList.add('reverse');
            }
            line.style.transform = lastClickedIndex === 8 ? 
                'translate(-50%, -50%) rotate(225deg)' : 
                'translate(-50%, -50%) rotate(45deg)';
        } else {
            if (lastClickedIndex === 6) {
                line.classList.add('reverse');
            }
            line.style.transform = lastClickedIndex === 6 ? 
                'translate(-50%, -50%) rotate(135deg)' : 
                'translate(-50%, -50%) rotate(-45deg)';
        }
        lastClickedCell.appendChild(line);
    }
}

function resetGame() {
    gameBoard = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    currentPlayer = 'X';
    isPlayerTurn = true;
    timerStarted = false;
    
    document.querySelectorAll('.cell').forEach(cell => {
        cell.textContent = '';
        cell.removeAttribute('data-symbol');
        const line = cell.querySelector('.winning-line');
        if (line) {
            line.remove();
        }
    });
    
    if (timerActive) {
        clearInterval(timerInterval);
        timeLeft = 60;
        timerStarted = false;
        updateTimerDisplay();
    }
    
    isFirstGame = true;
    const coinButton = document.getElementById('coinFlip');
    coinButton.disabled = false;
    
    updatePlayerIndicator();
}

function isDrawInevitable() {
    if (!gameBoard.includes('')) {
        return true;
    }

    const emptyCells = gameBoard.map((cell, index) => cell === '' ? index : null).filter(i => i !== null);
    
    function canWinFromPosition(board, isXTurn) {
        if (checkWinForPlayer('X', board)) return true;
        if (checkWinForPlayer('O', board)) return true;
        
        if (!board.includes('')) return false;
        
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                const newBoard = [...board];
                newBoard[i] = isXTurn ? 'X' : 'O';
                
                if (checkWinForPlayer(isXTurn ? 'X' : 'O', newBoard)) {
                    return true;
                }
                
                if (canWinFromPosition(newBoard, !isXTurn)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    function checkWinForPlayer(player, board) {
        return winningCombinations.some(combination => {
            return combination.every(index => board[index] === player);
        });
    }
    
    return !canWinFromPosition([...gameBoard], currentPlayer === 'X');
}

function isWinPossible() {
    const emptyIndices = gameBoard.map((cell, index) => cell === '' ? index : null).filter(i => i !== null);
    
    for (let player of ['X', 'O']) {
        for (let combination of winningCombinations) {
            const playerCells = combination.filter(index => gameBoard[index] === player).length;
            const emptyCells = combination.filter(index => gameBoard[index] === '').length;
            
            if (playerCells + emptyCells === 3) {
                return true;
            }
        }
    }
    
    return false;
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('gameMode').value = gameMode;
});

function updateStats(result) {
    stats.gamesPlayed++;
    if (result === 'draw') {
        stats.draws++;
        stats.currentStreak = 0;
    } else {
        if (result === 'X') {
            stats.xWins++;
            stats.currentStreak = stats.currentStreak > 0 ? stats.currentStreak + 1 : 1;
        } else {
            stats.oWins++;
            stats.currentStreak = stats.currentStreak < 0 ? stats.currentStreak - 1 : -1;
        }
    }
    stats.winStreak = Math.max(Math.abs(stats.currentStreak), stats.winStreak);
    localStorage.setItem('tictactoeStats', JSON.stringify(stats));
}

function undoMove() {
    if (moveHistory.length > 0) {
        const lastMove = moveHistory.pop();
        gameBoard = lastMove.board;
        currentPlayer = lastMove.player;
        updateBoard();
    }
}

document.addEventListener('keydown', (e) => {
    if (!gameActive) return;
    
    const keyToIndex = {
        '1': 0, '2': 1, '3': 2,
        '4': 3, '5': 4, '6': 5,
        '7': 6, '8': 7, '9': 8,
        'Numpad1': 0, 'Numpad2': 1, 'Numpad3': 2,
        'Numpad4': 3, 'Numpad5': 4, 'Numpad6': 5,
        'Numpad7': 6, 'Numpad8': 7, 'Numpad9': 8
    };
    
    if (keyToIndex.hasOwnProperty(e.key)) {
        const index = keyToIndex[e.key];
        if (gameBoard[index] === '') {
            makeMove(index);
        }
    }
});

function makeUnbeatableMove() {
    const emptyCells = gameBoard.filter(cell => cell === '').length;
    
    if (emptyCells === 9) {
        const corners = [0, 2, 6, 8];
        return corners[Math.floor(Math.random() * corners.length)];
    }
    
    if (emptyCells === 8) {
        if (gameBoard[4] === 'X') {
            const corners = [0, 2, 6, 8];
            const emptyCorners = corners.filter(i => gameBoard[i] === '');
            return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
        }
        return 4;
    }
    
    for (let i = 0; i < gameBoard.length; i++) {
        if (gameBoard[i] === '') {
            gameBoard[i] = 'O';
            if (checkWinForPlayer('O')) {
                gameBoard[i] = '';
                return i;
            }
            gameBoard[i] = '';
        }
    }
    
    for (let i = 0; i < gameBoard.length; i++) {
        if (gameBoard[i] === '') {
            gameBoard[i] = 'X';
            if (checkWinForPlayer('X')) {
                gameBoard[i] = '';
                return i;
            }
            gameBoard[i] = '';
        }
    }
    
    let bestScore = -Infinity;
    let bestMove = null;
    
    for (let i = 0; i < gameBoard.length; i++) {
        if (gameBoard[i] === '') {
            gameBoard[i] = 'O';
            let score = minimax(gameBoard, 0, false);
            gameBoard[i] = '';
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    
    return bestMove;
}

function minimax(board, depth, isMaximizing) {
    if (checkWinForPlayer('O')) return 10 - depth;
    if (checkWinForPlayer('X')) return depth - 10;
    if (!board.includes('')) return 0;
    
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                let score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                let score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function checkWinForPlayer(player) {
    return winningCombinations.some(combination => {
        return combination.every(index => gameBoard[index] === player);
    });
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (timeLeft > 0 && timerActive) {
            timeLeft--;
            updateTimerDisplay();
        } else if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimeUp();
        }
    }, 1000);
}

function updateTimerDisplay() {
    if (!timerActive) {
        document.querySelector('.timer-display').classList.remove('active');
        return;
    }

    document.querySelector('.timer-display').classList.add('active');
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const display = document.getElementById('timeLeft');
    display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const timerDisplay = document.querySelector('.timer-display');
    if (timeLeft <= 10) {
        timerDisplay.classList.add('danger');
        timerDisplay.classList.remove('warning');
    } else if (timeLeft <= 30) {
        timerDisplay.classList.add('warning');
        timerDisplay.classList.remove('danger');
    } else {
        timerDisplay.classList.remove('warning', 'danger');
    }
}

function handleTimeUp() {
    gameActive = false;
    const loser = currentPlayer;
    const winner = currentPlayer === 'X' ? 'O' : 'X';
    
    scores[winner]++;
    localStorage.setItem('tictactoeScores', JSON.stringify(scores));
    updateScore();
    
    const message = document.querySelector('.winner-message');
    message.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
            <div>
                <i class="fas fa-clock"></i>&nbsp;
                Zeit abgelaufen!
            </div>
            <div>
                ${gameMode === 'unbeatable' ? 
                    (winner === 'O' ? 'KI gewinnt!' : 'Du verlierst!') : 
                    `Spieler ${winner} gewinnt!`}
            </div>
        </div>
    `;
    message.classList.add('show');
    
    setTimeout(() => {
        message.classList.add('hide');
        setTimeout(() => {
            message.classList.remove('show', 'hide');
            resetGame();
        }, 500);
    }, 1500);
}

function reduceTime() {
    if (timerActive) {
        const reduction = Math.floor(Math.random() * 5) + 1;
        timeLeft = Math.max(0, timeLeft - reduction);
        updateTimerDisplay();
    }
} 