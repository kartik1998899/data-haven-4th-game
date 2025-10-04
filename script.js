// ==========================================
// CANVAS SETUP
// ==========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = 800;
canvas.height = 600;

// ==========================================
// GAME VARIABLES
// ==========================================
let score = 0;
let lives = 3;
let gameRunning = false;
let animationId;

// Load images
const ballImage = new Image();
ballImage.src = 'https://i.ibb.co/Kjj1tz2f/Baby-Moose.png';

const brickImage = new Image();
brickImage.src = 'https://i.ibb.co/d09pFB9N/acorn.png';

// Paddle properties
const paddle = {
    width: 120,
    height: 15,
    x: canvas.width / 2 - 60,
    y: canvas.height - 40,
    speed: 8,
    dx: 0
};

// Ball properties - using image now
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 20, // Matching moose image size
    dx: 4,
    dy: -4
};

// Brick properties - now 10x6 grid with smaller bricks
const brick = {
    rows: 6,
    cols: 10,
    width: 60, // Smaller width
    height: 30,
    padding: 10,
    offsetTop: 80,
    offsetLeft: 35
};

// Brick colors - kept but will use acorn image
const brickColors = [
    '#FF6B6B', // Red
    '#FFA500', // Orange
    '#FFD93D', // Yellow
    '#6BCB77', // Green
    '#4D96FF', // Blue
    '#9B59B6'  // Purple - added for 6th row
];

// Initialize bricks array
let bricks = [];

// ==========================================
// INPUT HANDLING
// ==========================================
let rightPressed = false;
let leftPressed = false;
let mouseX = 0;
let useMouseControl = false;

// Keyboard controls
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);

function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
        useMouseControl = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
        useMouseControl = false;
    }
}

function keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false;
    }
}

// Mouse controls
canvas.addEventListener('mousemove', mouseMoveHandler);

function mouseMoveHandler(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    useMouseControl = true;
}

// ==========================================
// GAME INITIALIZATION
// ==========================================
function initBricks() {
    bricks = [];
    for (let row = 0; row < brick.rows; row++) {
        bricks[row] = [];
        for (let col = 0; col < brick.cols; col++) {
            bricks[row][col] = {
                x: 0,
                y: 0,
                status: 1,
                color: brickColors[row % brickColors.length] // Cycle through colors if we have more rows
            };
        }
    }
}

function resetGame() {
    // Reset game variables
    score = 0;
    lives = 3;
    gameRunning = true;
    
    // Reset paddle position
    paddle.x = canvas.width / 2 - paddle.width / 2;
    paddle.dx = 0;
    
    // Reset ball position and velocity
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = -4;
    
    // Reinitialize bricks
    initBricks();
    
    // Update UI
    updateScore();
    updateLives();
    hideMessage();
    
    // Start game loop
    gameLoop();
}

// ==========================================
// DRAWING FUNCTIONS
// ==========================================
function drawPaddle() {
    // Gradient for paddle
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, '#00d4ff');
    gradient.addColorStop(1, '#0099cc');
    
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00d4ff';
    
    // Draw rounded rectangle for paddle
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
}

function drawBall() {
    // Draw the moose image instead of a ball
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(139, 69, 19, 0.5)'; // Brown shadow for moose
    ctx.drawImage(ballImage, ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);
    ctx.restore();
}

function drawBricks() {
    for (let row = 0; row < brick.rows; row++) {
        for (let col = 0; col < brick.cols; col++) {
            if (bricks[row][col].status === 1) {
                const brickX = col * (brick.width + brick.padding) + brick.offsetLeft;
                const brickY = row * (brick.height + brick.padding) + brick.offsetTop;
                
                bricks[row][col].x = brickX;
                bricks[row][col].y = brickY;
                
                // Draw acorn image instead of colored bricks
                ctx.drawImage(brickImage, brickX, brickY, brick.width, brick.height);
            }
        }
    }
}

function drawScore() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '20px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Lives: ${lives}`, 20, 55);
}

// ==========================================
// GAME LOGIC
// ==========================================
function movePaddle() {
    if (useMouseControl) {
        // Mouse control - smooth follow
        paddle.x = mouseX - paddle.width / 2;
    } else {
        // Keyboard control
        if (rightPressed) {
            paddle.dx = paddle.speed;
        } else if (leftPressed) {
            paddle.dx = -paddle.speed;
        } else {
            paddle.dx = 0;
        }
        paddle.x += paddle.dx;
    }
    
    // Boundary detection for paddle
    if (paddle.x < 0) {
        paddle.x = 0;
    }
    if (paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width;
    }
}

function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Wall collision (left and right)
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
    }
    
    // Wall collision (top)
    if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
    }
    
    // Paddle collision - adjusted for larger ball radius
    if (ball.y + ball.radius > paddle.y &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width) {
        
        // Calculate hit position for angle variation
        const hitPos = (ball.x - paddle.x) / paddle.width;
        const angle = (hitPos - 0.5) * Math.PI / 3; // Max 60 degrees
        
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        ball.dx = speed * Math.sin(angle);
        ball.dy = -Math.abs(speed * Math.cos(angle));
    }
    
    // Ball falls below paddle (lose life)
    if (ball.y + ball.radius > canvas.height) {
        lives--;
        updateLives();
        
        if (lives <= 0) {
            gameOver();
        } else {
            resetBall();
        }
    }
}

function collisionDetection() {
    for (let row = 0; row < brick.rows; row++) {
        for (let col = 0; col < brick.cols; col++) {
            const b = bricks[row][col];
            if (b.status === 1) {
                // Adjusted collision detection for the larger ball and acorn images
                if (ball.x + ball.radius > b.x &&
                    ball.x - ball.radius < b.x + brick.width &&
                    ball.y + ball.radius > b.y &&
                    ball.y - ball.radius < b.y + brick.height) {
                    
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score += 10;
                    updateScore();
                    
                    // Check win condition
                    if (checkWin()) {
                        winGame();
                    }
                }
            }
        }
    }
}

function checkWin() {
    for (let row = 0; row < brick.rows; row++) {
        for (let col = 0; col < brick.cols; col++) {
            if (bricks[row][col].status === 1) {
                return false;
            }
        }
    }
    return true;
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = -4;
}

// ==========================================
// UI UPDATES
// ==========================================
function updateScore() {
    document.getElementById('score').textContent = score;
}

function updateLives() {
    document.getElementById('lives').textContent = lives;
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    document.getElementById('messageText').textContent = 'GAME OVER';
    document.getElementById('messageSubtext').innerHTML = `Your final score: <span id="finalScore">${score}</span>`;
    showMessage();
}

function winGame() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    document.getElementById('messageText').textContent = '🎉 YOU WIN! 🎉';
    document.getElementById('messageSubtext').innerHTML = `Perfect score: <span id="finalScore">${score}</span>`;
    showMessage();
}

function showMessage() {
    document.getElementById('gameMessage').classList.remove('hidden');
}

function hideMessage() {
    document.getElementById('gameMessage').classList.add('hidden');
}

// ==========================================
// GAME LOOP
// ==========================================
function gameLoop() {
    if (!gameRunning) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw everything
    drawBricks();
    drawPaddle();
    drawBall();
    
    // Update positions
    movePaddle();
    moveBall();
    collisionDetection();
    
    // Continue loop
    animationId = requestAnimationFrame(gameLoop);
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function shadeColor(color, percent) {
    const num = parseInt(color.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
}

// Polyfill for roundRect if not supported
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        if (typeof radius === 'number') {
            radius = [radius, radius, radius, radius];
        } else if (radius.length === 1) {
            radius = [radius[0], radius[0], radius[0], radius[0]];
        } else if (radius.length === 2) {
            radius = [radius[0], radius[1], radius[0], radius[1]];
        }
        
        this.moveTo(x + radius[0], y);
        this.lineTo(x + width - radius[1], y);
        this.arcTo(x + width, y, x + width, y + radius[1], radius[1]);
        this.lineTo(x + width, y + height - radius[2]);
        this.arcTo(x + width, y + height, x + width - radius[2], y + height, radius[2]);
        this.lineTo(x + radius[3], y + height);
        this.arcTo(x, y + height, x, y + height - radius[3], radius[3]);
        this.lineTo(x, y + radius[0]);
        this.arcTo(x, y, x + radius[0], y, radius[0]);
    };
}

// ==========================================
// EVENT LISTENERS
// ==========================================
document.getElementById('restartBtn').addEventListener('click', resetGame);

// ==========================================
// START GAME
// ==========================================
initBricks();
resetGame();