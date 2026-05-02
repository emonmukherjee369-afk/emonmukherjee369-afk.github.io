const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const scoreElement = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalScoreElement = document.getElementById('final-score');

// Game State
let isPlaying = false;
let animationId;
let score = 0;
let gameSpeed = 3;
let frameCount = 0;

// Inputs
let rightPressed = false;
let leftPressed = false;

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') rightPressed = true;
    else if (e.key === 'ArrowLeft') leftPressed = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight') rightPressed = false;
    else if (e.key === 'ArrowLeft') leftPressed = false;
});

// Mobile Touch Controls
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touchX = e.touches[0].clientX;
    if (touchX > window.innerWidth / 2) {
        rightPressed = true;
    } else {
        leftPressed = true;
    }
}, {passive: false});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    rightPressed = false;
    leftPressed = false;
}, {passive: false});

// Entities
const player = {
    x: 175,
    y: 500,
    width: 40,
    height: 70,
    color: '#05d9e8', // Cyan
    speed: 5
};

let obstacles = [];
let roadLines = [];

// Initialize background road lines
for (let i = 0; i < 6; i++) {
    roadLines.push({
        y: i * 120,
        height: 60
    });
}

// Game loop functions
function initGame() {
    player.x = canvas.width / 2 - player.width / 2;
    obstacles = [];
    score = 0;
    gameSpeed = 4;
    frameCount = 0;
    scoreElement.textContent = score;
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    isPlaying = true;
    update();
}

function gameOver() {
    isPlaying = false;
    cancelAnimationFrame(animationId);
    finalScoreElement.textContent = Math.floor(score);
    gameOverScreen.classList.remove('hidden');
}

// Drawing shapes
function drawCar(x, y, w, h, color) {
    ctx.fillStyle = color;
    
    // Main Body
    ctx.fillRect(x + 5, y, w - 10, h);
    
    // Roof
    ctx.fillStyle = '#222';
    ctx.fillRect(x + 8, y + 15, w - 16, h - 30);
    
    // Wheels
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y + 10, 5, 15); // Top Left
    ctx.fillRect(x + w - 5, y + 10, 5, 15); // Top Right
    ctx.fillRect(x, y + h - 25, 5, 15); // Bottom Left
    ctx.fillRect(x + w - 5, y + h - 25, 5, 15); // Bottom Right
    
    // Headlights
    if (color === player.color) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 8, y - 2, 8, 4);
        ctx.fillRect(x + w - 16, y - 2, 8, 4);
    } else {
        // Taillights for enemies
        ctx.fillStyle = '#ff2a6d';
        ctx.fillRect(x + 8, y + h - 2, 8, 4);
        ctx.fillRect(x + w - 16, y + h - 2, 8, 4);
    }
}

function drawRoad() {
    // Draw asphalt
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw lane markers
    ctx.fillStyle = '#fff';
    for (let i = 0; i < roadLines.length; i++) {
        const line = roadLines[i];
        line.y += gameSpeed;
        if (line.y > canvas.height) {
            line.y = -60;
        }
        ctx.fillRect(canvas.width / 3 - 2, line.y, 4, line.height);
        ctx.fillRect((canvas.width / 3) * 2 - 2, line.y, 4, line.height);
    }
}

// Update loop
function update() {
    if (!isPlaying) return;
    
    // 1. Move Player
    if (rightPressed && player.x < canvas.width - player.width - 5) {
        player.x += player.speed;
    }
    if (leftPressed && player.x > 5) {
        player.x -= player.speed;
    }
    
    // 2. Spawn Obstacles
    frameCount++;
    if (frameCount % Math.max(30, 80 - Math.floor(score/10)) === 0) {
        const lanes = [
            (canvas.width / 6) - (player.width / 2),
            (canvas.width / 2) - (player.width / 2),
            (canvas.width * 5 / 6) - (player.width / 2)
        ];
        
        const randomLane = lanes[Math.floor(Math.random() * lanes.length)];
        
        obstacles.push({
            x: randomLane,
            y: -100,
            width: 40,
            height: 70,
            color: '#ff2a6d' // Pink enemies
        });
    }
    
    // 3. Clear Screen & Draw Road
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRoad();
    
    // 4. Update & Draw Obstacles
    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        obs.y += gameSpeed;
        
        drawCar(obs.x, obs.y, obs.width, obs.height, obs.color);
        
        // Collision Detection (AABB)
        if (player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y) {
            gameOver();
            return;
        }
    }
    
    // Remove off-screen obstacles
    obstacles = obstacles.filter(obs => obs.y < canvas.height);
    
    // 5. Draw Player
    drawCar(player.x, player.y, player.width, player.height, player.color);
    
    // 6. Score & Difficulty
    score += 0.1;
    scoreElement.textContent = Math.floor(score);
    if (score % 50 === 0 && gameSpeed < 15) {
        gameSpeed += 0.5;
    }
    
    animationId = requestAnimationFrame(update);
}

// Event Listeners
startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);
