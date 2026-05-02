const boardElement = document.getElementById('chessboard');
const turnIndicator = document.getElementById('turn-indicator');
const gameOverModal = document.getElementById('game-over-modal');
const winnerText = document.getElementById('winner-text');
const restartBtn = document.getElementById('restart-btn');

// Unicode pieces
const PIECES = {
    w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
    b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
};

// Initial board setup (8x8 array)
// Format: 'color_type' e.g. 'w_r' = white rook, null = empty
const initialBoard = [
    ['b_r', 'b_n', 'b_b', 'b_q', 'b_k', 'b_b', 'b_n', 'b_r'],
    ['b_p', 'b_p', 'b_p', 'b_p', 'b_p', 'b_p', 'b_p', 'b_p'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['w_p', 'w_p', 'w_p', 'w_p', 'w_p', 'w_p', 'w_p', 'w_p'],
    ['w_r', 'w_n', 'w_b', 'w_q', 'w_k', 'w_b', 'w_n', 'w_r']
];

let board = [];
let currentTurn = 'w'; // 'w' or 'b'
let selectedSquare = null; // {row, col}
let validMoves = []; // Array of {row, col}

function initGame() {
    // Deep copy initial board
    board = initialBoard.map(row => [...row]);
    currentTurn = 'w';
    selectedSquare = null;
    validMoves = [];
    gameOverModal.classList.add('hidden');
    updateTurnIndicator();
    renderBoard();
}

function updateTurnIndicator() {
    turnIndicator.textContent = currentTurn === 'w' ? "White's Turn" : "Black's Turn";
    turnIndicator.style.backgroundColor = currentTurn === 'w' ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.5)";
}

function renderBoard() {
    boardElement.innerHTML = '';
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = document.createElement('div');
            // Checkered pattern
            square.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
            square.dataset.row = r;
            square.dataset.col = c;
            
            // Render piece
            const piece = board[r][c];
            if (piece) {
                const [color, type] = piece.split('_');
                const span = document.createElement('span');
                span.textContent = PIECES[color][type];
                span.className = color === 'w' ? 'white-piece' : 'black-piece';
                square.appendChild(span);
            }
            
            // Highlights
            if (selectedSquare && selectedSquare.row === r && selectedSquare.col === c) {
                square.classList.add('selected');
            }
            
            if (validMoves.some(m => m.row === r && m.col === c)) {
                square.classList.add('valid-move');
            }
            
            square.addEventListener('click', () => handleSquareClick(r, c));
            boardElement.appendChild(square);
        }
    }
}

function handleSquareClick(r, c) {
    const clickedPiece = board[r][c];
    const isMoveTarget = validMoves.some(m => m.row === r && m.col === c);

    // If clicking a valid move target, execute move
    if (selectedSquare && isMoveTarget) {
        executeMove(selectedSquare, {row: r, col: c});
        return;
    }

    // If clicking own piece, select it
    if (clickedPiece && clickedPiece.startsWith(currentTurn)) {
        selectedSquare = {row: r, col: c};
        validMoves = calculateValidMoves(r, c);
        renderBoard();
    } else {
        // Clicking anywhere else clears selection
        selectedSquare = null;
        validMoves = [];
        renderBoard();
    }
}

function executeMove(from, to) {
    const pieceToMove = board[from.row][from.col];
    const capturedPiece = board[to.row][to.col];
    
    // Execute move
    board[to.row][to.col] = pieceToMove;
    board[from.row][from.col] = null;
    
    // Check for King capture (Simple win condition)
    if (capturedPiece && capturedPiece.endsWith('_k')) {
        endGame(currentTurn);
        return;
    }
    
    // Switch turn
    currentTurn = currentTurn === 'w' ? 'b' : 'w';
    selectedSquare = null;
    validMoves = [];
    
    updateTurnIndicator();
    renderBoard();
}

function endGame(winnerColor) {
    winnerText.textContent = winnerColor === 'w' ? "White Wins!" : "Black Wins!";
    gameOverModal.classList.remove('hidden');
}

// Logic to calculate valid moves for a given piece at (r,c)
function calculateValidMoves(startR, startC) {
    const piece = board[startR][startC];
    if (!piece) return [];
    
    const [color, type] = piece.split('_');
    const moves = [];
    
    // Helper to check if a square is valid to move into
    const isValidSquare = (r, c) => {
        if (r < 0 || r > 7 || c < 0 || c > 7) return false; // Out of bounds
        const targetPiece = board[r][c];
        if (!targetPiece) return true; // Empty square
        return !targetPiece.startsWith(color); // Capturable if different color
    };

    // Helper for sliding pieces (Rook, Bishop, Queen)
    const addSlidingMoves = (dirs) => {
        for (const [dr, dc] of dirs) {
            let currR = startR + dr;
            let currC = startC + dc;
            while (isValidSquare(currR, currC)) {
                moves.push({row: currR, col: currC});
                if (board[currR][currC]) break; // Stop sliding after capturing
                currR += dr;
                currC += dc;
            }
        }
    };

    const straightDirs = [[-1,0], [1,0], [0,-1], [0,1]];
    const diagonalDirs = [[-1,-1], [-1,1], [1,-1], [1,1]];

    switch (type) {
        case 'p': // Pawn
            const dir = color === 'w' ? -1 : 1;
            const startRow = color === 'w' ? 6 : 1;
            
            // Forward 1
            if (!board[startR + dir][startC]) {
                moves.push({row: startR + dir, col: startC});
                // Forward 2 (only if starting position and forward 1 is empty)
                if (startR === startRow && !board[startR + 2*dir][startC]) {
                    moves.push({row: startR + 2*dir, col: startC});
                }
            }
            // Captures (Diagonal)
            if (isValidSquare(startR + dir, startC - 1) && board[startR + dir][startC - 1]) {
                moves.push({row: startR + dir, col: startC - 1});
            }
            if (isValidSquare(startR + dir, startC + 1) && board[startR + dir][startC + 1]) {
                moves.push({row: startR + dir, col: startC + 1});
            }
            break;
            
        case 'r': // Rook
            addSlidingMoves(straightDirs);
            break;
            
        case 'b': // Bishop
            addSlidingMoves(diagonalDirs);
            break;
            
        case 'q': // Queen
            addSlidingMoves([...straightDirs, ...diagonalDirs]);
            break;
            
        case 'k': // King
            const kingDirs = [...straightDirs, ...diagonalDirs];
            for (const [dr, dc] of kingDirs) {
                if (isValidSquare(startR + dr, startC + dc)) {
                    moves.push({row: startR + dr, col: startC + dc});
                }
            }
            break;
            
        case 'n': // Knight
            const knightDirs = [[-2,-1], [-2,1], [-1,-2], [-1,2], [1,-2], [1,2], [2,-1], [2,1]];
            for (const [dr, dc] of knightDirs) {
                if (isValidSquare(startR + dr, startC + dc)) {
                    moves.push({row: startR + dr, col: startC + dc});
                }
            }
            break;
    }
    
    return moves;
}

restartBtn.addEventListener('click', initGame);

// Start game
initGame();
