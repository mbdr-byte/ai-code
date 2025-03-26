// --- Message from mbdr-byte@ ---
// A cute tetris game you can play in https://editor.p5js.org/.
//
// This was created with Gemini 2.5 Pro Experimental 03-25 in 2 messages.
// 1st message: ask for a cute tetris game for p5js.
// 2nd message: fix the compile errors that p5js found.
//
// I did not edit the code below the message.
// --- OEM from mbdr-byte@ ---

// --- Kawaii Pastel Tetris ---

// --- Game Settings ---
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30; // Size of each block in pixels
const PADDING = 2; // Small gap between blocks for visual clarity
const CORNER_RADIUS = 5; // Rounded corners for blocks
const STROKE_WEIGHT = 1.5; // Outline thickness

// --- Timing ---
let fallInterval = 800; // Milliseconds between automatic drops
let lastFallTime = 0;
let level = 1;
const levelIncreaseThreshold = 5; // Increase level every 5 lines cleared
let linesClearedTotal = 0;

// --- Game State ---
let grid; // 2D array representing the game board
let currentPiece;
let currentX, currentY;
let currentRotation;
let score = 0;
let gameOver = false;
let nextPiece;

// --- Kawaii Pastel Colors ---
// Using p5 Color objects for easier manipulation (like transparency)
let colors;
let backgroundColor;
let gridColor;
let textColor;
let shadowColor; // For a subtle drop shadow effect

// --- Particle System for Confetti ---
let particles = [];
const gravity = 0.08; // Affects how fast particles fall
const initialConfettiCount = 25; // Particles per standard line clear
const levelUpConfettiCount = 60; // Particles for a level-up line clear

// --- Tetromino Shapes ---
// Defined by [rotation][row][col] relative to anchor point
// Anchor point is usually top-leftish
const shapes = [
    // I
    [ [[0,1],[1,1],[2,1],[3,1]], [[2,0],[2,1],[2,2],[2,3]] ], // Corrected I rotations (centered better)
    // O
    [ [[1,0],[2,0],[1,1],[2,1]] ], // Centered O
    // T
    [ [[1,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[2,1],[1,2]], [[0,1],[1,1],[2,1],[1,2]], [[1,0],[0,1],[1,1],[1,2]] ],
    // S
    [ [[1,0],[2,0],[0,1],[1,1]], [[1,0],[1,1],[2,1],[2,2]] ], // Adjusted S rotation anchor
    // Z
    [ [[0,0],[1,0],[1,1],[2,1]], [[2,0],[1,1],[2,1],[1,2]] ], // Adjusted Z rotation anchor
    // J
    [ [[0,0],[0,1],[1,1],[2,1]], [[1,0],[2,0],[1,1],[1,2]], [[0,1],[1,1],[2,1],[2,2]], [[1,0],[1,1],[0,2],[1,2]] ], // Adjusted J rotation anchors
    // L
    [ [[2,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[1,2],[2,2]], [[0,1],[1,1],[2,1],[0,2]], [[0,0],[1,0],[1,1],[1,2]] ]  // Adjusted L rotation anchors
];


// --- p5.js Setup Function ---
function setup() {
    // Calculate canvas size based on grid
    let canvasWidth = COLS * BLOCK_SIZE + PADDING * (COLS + 1) + 200; // Add space for score/next piece
    let canvasHeight = ROWS * BLOCK_SIZE + PADDING * (ROWS + 1);
    createCanvas(canvasWidth, canvasHeight);

    // Define Kawaii Pastel Colors
    colors = [
        color(255, 183, 197), // Pastel Pink
        color(255, 218, 185), // Pastel Peach
        color(186, 231, 231), // Pastel Cyan
        color(222, 186, 231), // Pastel Lavender
        color(186, 231, 188), // Pastel Mint
        color(255, 245, 186), // Pastel Yellow
        color(186, 208, 231)  // Pastel Blue
    ];
    backgroundColor = color(240, 248, 255); // Alice Blue
    gridColor = color(211, 211, 211, 150); // Light Grey with transparency
    textColor = color(100, 100, 120); // Soft Dark Grey
    shadowColor = color(0, 0, 0, 30); // Very subtle shadow

    // Initialize grid
    grid = createEmptyGrid();

    // Start game
    // *** FIX: Call pickNextPiece FIRST to initialize it ***
    pickNextPiece();
    spawnNewPiece(); // Now spawnNewPiece can safely use nextPiece
    lastFallTime = millis(); // Initialize fall timer

    // p5 settings
    rectMode(CORNER);
    textAlign(LEFT, TOP);
    textFont('monospace'); // Simple font
}

// --- p5.js Draw Function (Game Loop) ---
function draw() {
    background(backgroundColor);

    // Draw grid background and border
    drawGridBackground();

    // Draw landed pieces
    drawLandedPieces();

    if (gameOver) {
        displayGameOver();
    } else {
        // --- Game Logic ---
        // Automatic falling
        // *** FIX: Renamed currentTime to 'now' ***
        let now = millis();
        if (now - lastFallTime > fallInterval) {
            if (isValidMove(currentX, currentY + 1, currentRotation)) {
                currentY++;
            } else {
                lockPiece();
                clearLines();
                spawnNewPiece();
                if (!isValidMove(currentX, currentY, currentRotation)) {
                    gameOver = true; // Game over if new piece immediately collides
                }
            }
            // *** FIX: Use the renamed variable 'now' ***
            lastFallTime = now;
        }

        // Draw current falling piece's shadow (ghost piece)
        drawGhostPiece();

        // Draw current falling piece
        if (currentPiece) { // Add check just in case
           drawPiece(currentPiece.shape[currentRotation], currentX, currentY, currentPiece.color);
        }

        // Draw UI elements (Score, Level, Next Piece)
        drawUI();
    }
  
  updateAndDrawParticles();
}

// --- Input Handling ---
function keyPressed() {
    if (gameOver || !currentPiece) return; // Ignore input if game over or no piece yet

    if (keyCode === LEFT_ARROW) {
        if (isValidMove(currentX - 1, currentY, currentRotation)) {
            currentX--;
        }
    } else if (keyCode === RIGHT_ARROW) {
        if (isValidMove(currentX + 1, currentY, currentRotation)) {
            currentX++;
        }
    } else if (keyCode === DOWN_ARROW) {
        // Soft drop
        if (isValidMove(currentX, currentY + 1, currentRotation)) {
            currentY++;
            lastFallTime = millis(); // Reset fall timer after manual move down
            score += 1; // Small score bonus for soft drop
        } else {
            // If pressing down makes it hit something, lock it immediately
            lockPiece();
            clearLines();
            spawnNewPiece();
            if (!isValidMove(currentX, currentY, currentRotation)) {
                gameOver = true;
            }
             lastFallTime = millis(); // Reset timer after lock
        }
    } else if (keyCode === UP_ARROW) {
        // Rotate
        let nextRotation = (currentRotation + 1) % currentPiece.shape.length;
        // Try rotating first
        if (isValidMove(currentX, currentY, nextRotation)) {
            currentRotation = nextRotation;
        }
        // Basic Wall Kick (Try moving left/right if rotation failed near edge)
        else if (isValidMove(currentX + 1, currentY, nextRotation)) { // Try kick right
             currentX++;
             currentRotation = nextRotation;
        } else if (isValidMove(currentX - 1, currentY, nextRotation)) { // Try kick left
             currentX--;
             currentRotation = nextRotation;
        } else if (isValidMove(currentX + 2, currentY, nextRotation)) { // Try kick right 2 (for I piece)
             currentX+=2;
             currentRotation = nextRotation;
        } else if (isValidMove(currentX - 2, currentY, nextRotation)) { // Try kick left 2 (for I piece)
             currentX-=2;
             currentRotation = nextRotation;
        }
    } else if (keyCode === 32) { // Spacebar for Hard Drop
        let startY = currentY; // Store original Y before dropping
        let hardDropY = currentY;
        while(isValidMove(currentX, hardDropY + 1, currentRotation)) {
            hardDropY++;
        }
        currentY = hardDropY;
        score += (hardDropY - startY) * 2; // Score bonus for hard drop distance
        lockPiece();
        clearLines();
        spawnNewPiece();
         if (!isValidMove(currentX, currentY, currentRotation)) {
             gameOver = true;
         }
        lastFallTime = millis(); // Reset timer after hard drop
    }
}

// --- Game Logic Functions ---

function createEmptyGrid() {
    let newGrid = [];
    for (let r = 0; r < ROWS; r++) {
        newGrid[r] = [];
        for (let c = 0; c < COLS; c++) {
            newGrid[r][c] = 0; // 0 represents an empty cell
        }
    }
    return newGrid;
}

function pickNextPiece() {
    let randomIndex = floor(random(shapes.length));
    // Ensure next color is different from current if possible (simple check)
    let randomColorIndex = floor(random(colors.length));
     if (currentPiece && colors[randomColorIndex].toString() === currentPiece.color.toString()) {
         randomColorIndex = (randomColorIndex + 1) % colors.length;
     }

    nextPiece = {
        shape: shapes[randomIndex],
        color: colors[randomColorIndex],
        shapeIndex: randomIndex // Store index for drawing if needed
    };
}

function spawnNewPiece() {
    currentPiece = nextPiece; // Use the piece that was 'next'
    currentRotation = 0;

    // Center the piece horizontally based on its specific shape's width in the current rotation
    let shapeWidth = 0;
    let minX = COLS; // Start high to find the minimum X coord in the shape
    let maxX = -1; // Start low to find the maximum X coord
    for(let block of currentPiece.shape[currentRotation]) {
        minX = min(minX, block[0]);
        maxX = max(maxX, block[0]);
    }
    shapeWidth = maxX - minX + 1;
    // Adjust spawn X to center based on the calculated width and minX offset
    currentX = floor((COLS - shapeWidth) / 2) - minX;


    // Start piece such that its lowest block is at or above row 0
    let minY = ROWS; // Start high
     for (let block of currentPiece.shape[currentRotation]) {
         minY = min(minY, block[1]);
     }
     currentY = -minY; // Position top based on the highest block (lowest Y value)

    // Pick the *next* piece for the preview *after* assigning the current one
    pickNextPiece();
}


// The crucial collision detection function
function isValidMove(x, y, rotation) {
     if (!currentPiece) return false; // Safety check

    let shape = currentPiece.shape[rotation];
    for (let block of shape) {
        let gridX = x + block[0];
        let gridY = y + block[1];

        // 1. Check horizontal boundaries
        if (gridX < 0 || gridX >= COLS) {
            return false;
        }
        // 2. Check bottom boundary (only - cannot go past the floor)
         if (gridY >= ROWS) {
             return false;
         }

        // 3. Check collision with landed pieces (only if within grid vertically)
        // Allows pieces to spawn partially above the top initially
        if (gridY >= 0 && grid[gridY][gridX] !== 0) {
            return false;
        }
    }
    return true; // No collisions found
}

function lockPiece() {
     if (!currentPiece) return; // Safety check

    let shape = currentPiece.shape[currentRotation];
    let isAboveGrid = true; // Check if the piece locked entirely above grid (game over condition)

    for (let block of shape) {
        let gridX = currentX + block[0];
        let gridY = currentY + block[1];

        // Make sure we only lock blocks within the grid bounds
        if (gridX >= 0 && gridX < COLS && gridY >= 0 && gridY < ROWS) {
            grid[gridY][gridX] = currentPiece.color; // Store the color in the grid
             isAboveGrid = false; // At least one block is within the grid
        }
    }
     // Check for game over *during* lock if piece locks entirely above grid top
     if (isAboveGrid) {
         gameOver = true;
         print("Game Over - Locked Above Grid");
     }
}


function clearLines() {
    let linesClearedThisTurn = 0;
    let clearedRowIndices = []; // Store indices of cleared rows

    for (let r = ROWS - 1; r >= 0; r--) {
        let isLineFull = true;
        for (let c = 0; c < COLS; c++) {
            if (grid[r][c] === 0) {
                isLineFull = false;
                break;
            }
        }

        if (isLineFull) {
            linesClearedThisTurn++;
            clearedRowIndices.push(r); // Store the index *before* shifting

            // Remove the full line by moving all lines above it down
            for (let rowAbove = r; rowAbove > 0; rowAbove--) {
                grid[rowAbove] = grid[rowAbove - 1].slice(); // Copy the row above
            }
            // Clear the top line
            grid[0] = Array(COLS).fill(0);

            // Since we shifted lines down, we need to re-check the same row index again
            r++;
        }
    }

    // --- Scoring, Level Up, and Confetti Trigger ---
    if (linesClearedThisTurn > 0) {
        // 1. Update Score
        let basePoints = [0, 100, 300, 500, 800]; // Points for 1, 2, 3, 4 lines
        score += basePoints[linesClearedThisTurn] * level;

        let previousTotalLines = linesClearedTotal;
        linesClearedTotal += linesClearedThisTurn;
        print(linesClearedThisTurn, "Line(s) Cleared! Total:", linesClearedTotal, "Score:", score);

        // 2. Check for Level Up (and if it happened *now*)
        let didLevelUp = false;
        let previousLevel = level;
        let requiredForNextLevel = level * levelIncreaseThreshold; // Lines needed for current level's threshold

        // Check if the *new* total crosses the threshold for the *current* level
        if (linesClearedTotal >= requiredForNextLevel && previousTotalLines < requiredForNextLevel) {
             didLevelUp = true;
             level++; // Increase level
             // Recalculate fall interval based on the *new* level
             fallInterval = max(100, 800 * pow(0.85, level - 1)); // Exponential decrease, base 800ms
             print("✨ LEVEL UP! ✨ Level:", level, "Speed:", fallInterval.toFixed(0) + 'ms');
        }

        // 3. Create Confetti!
        for (let clearedIndex of clearedRowIndices) {
            // Calculate the Y position based on the row index *before* it might have shifted down
            let rowPixelY = PADDING + clearedIndex * (BLOCK_SIZE + PADDING) + BLOCK_SIZE / 2;
            let count = didLevelUp ? levelUpConfettiCount : initialConfettiCount;
            let intensity = didLevelUp ? 1.6 : 1.0; // More energetic for level up

            // Optional: Use colors from the cleared line? More complex.
            // For now, just use the global pastel colors.
            createConfetti(rowPixelY, count, intensity, colors);
        }
    }
}

// --- Drawing Functions ---

/**
 * Creates confetti particles originating from a specific Y position.
 * @param {number} rowPixelY The center Y coordinate of the cleared row.
 * @param {number} count How many particles to create.
 * @param {number} intensity Multiplier for initial velocity and maybe lifetime.
 * @param {p5.Color[]} possibleColors Array of colors to choose from.
 */
function createConfetti(rowPixelY, count, intensity, possibleColors) {
    let gridWidth = COLS * (BLOCK_SIZE + PADDING);
    for (let i = 0; i < count; i++) {
        let particle = {
            x: random(PADDING, PADDING + gridWidth), // Start spread across the row
            y: rowPixelY + random(-BLOCK_SIZE / 2, BLOCK_SIZE / 2),
            vx: random(-1.5 * intensity, 1.5 * intensity), // Horizontal velocity
            vy: random(-2.5 * intensity, -0.5 * intensity), // Initial upward velocity
            color: random(possibleColors), // Pick a random pastel color
            size: random(4, 8) * intensity,
            life: random(60, 120) * intensity, // Frames to live
            alpha: 255,
            angle: random(TWO_PI),
            angleSpeed: random(-0.1, 0.1)
        };
        particles.push(particle);
    }
}

/**
 * Updates physics and draws all active particles.
 * Removes particles whose lifetime has expired.
 */
function updateAndDrawParticles() {
    // Loop backwards for safe removal
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];

        // Update physics
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.angleSpeed;
        p.life--;

        // Calculate fading
        p.alpha = map(p.life, 0, 60, 0, 255); // Fade out in the last 60 frames
        p.alpha = constrain(p.alpha, 0, 255);

        // Remove if dead
        if (p.life <= 0) {
            particles.splice(i, 1);
        } else {
            // Draw the particle
            push(); // Isolate drawing state
            translate(p.x, p.y);
            rotate(p.angle);
            noStroke();
            // Make a copy of the color to set alpha without modifying original
            let particleDrawColor = color(red(p.color), green(p.color), blue(p.color), p.alpha);
            fill(particleDrawColor);
            // Draw slightly rounded rects for a cute confetti look
            rectMode(CENTER); // Draw from center for rotation
            rect(0, 0, p.size, p.size, p.size * 0.2); // Small corner radius
            pop(); // Restore drawing state
        }
    }
    rectMode(CORNER); // Reset rect mode IMPORTANT!
}

function drawGridBackground() {
    let gridWidth = COLS * BLOCK_SIZE + PADDING * (COLS - 1);
    let gridHeight = ROWS * BLOCK_SIZE + PADDING * (ROWS - 1);
    let gridX = PADDING;
    let gridY = PADDING;

    // Draw a subtle border/background for the grid area
    noStroke();
    fill(gridColor);
    rect(gridX - PADDING, gridY - PADDING, gridWidth + 2 * PADDING, gridHeight + 2 * PADDING, CORNER_RADIUS); // Slightly larger background

}

function drawLandedPieces() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (grid[r][c] !== 0) {
                drawBlock(c, r, grid[r][c]);
            }
        }
    }
}

function drawPiece(shape, x, y, clr) {
    for (let block of shape) {
        let drawX = x + block[0];
        let drawY = y + block[1];
        // Only draw blocks that are within the visible grid area or just above it
         if (drawY >= -2) { // Allow drawing slightly above top for smooth entry
            drawBlock(drawX, drawY, clr);
         }
    }
}

function drawBlock(gridX, gridY, clr) {
    // Only draw if within column bounds
     if (gridX < 0 || gridX >= COLS || gridY >= ROWS) return;

    let xPos = PADDING + gridX * (BLOCK_SIZE + PADDING);
    let yPos = PADDING + gridY * (BLOCK_SIZE + PADDING);

    // Make sure color is a p5.Color object
    let blockColor = (clr instanceof p5.Color) ? clr : color(clr); // Fallback if it's not

    // Subtle shadow effect (only if block is inside grid)
     if (gridY >= 0) {
        noStroke();
        fill(shadowColor);
        rect(xPos + 2, yPos + 2, BLOCK_SIZE, BLOCK_SIZE, CORNER_RADIUS);
     }

    // Main block color
    stroke(255, 255, 255, 180); // Whiteish stroke for definition
    strokeWeight(STROKE_WEIGHT);
    fill(blockColor);
    rect(xPos, yPos, BLOCK_SIZE, BLOCK_SIZE, CORNER_RADIUS);
}

function drawGhostPiece() {
    if (!currentPiece) return; // Safety check

    let ghostY = currentY;
    while (isValidMove(currentX, ghostY + 1, currentRotation)) {
        ghostY++;
    }

    if (ghostY > currentY) { // Only draw if ghost is lower than actual piece
        let shape = currentPiece.shape[currentRotation];
        let ghostColor = color(red(currentPiece.color), green(currentPiece.color), blue(currentPiece.color), 50); // More transparent ghost

        for (let block of shape) {
            let drawX = currentX + block[0];
            let drawY = ghostY + block[1];
             if (drawY >= 0 && drawY < ROWS && drawX >=0 && drawX < COLS) { // Only draw within grid bounds
                let xPos = PADDING + drawX * (BLOCK_SIZE + PADDING);
                let yPos = PADDING + drawY * (BLOCK_SIZE + PADDING);

                noStroke();
                fill(ghostColor);
                // Draw ghost slightly smaller or differently? Maybe just transparent rect.
                rect(xPos, yPos, BLOCK_SIZE, BLOCK_SIZE, CORNER_RADIUS);
             }
        }
    }
}


function drawUI() {
    let uiX = COLS * BLOCK_SIZE + PADDING * (COLS + 1) + 30; // Position UI to the right
    let uiY = PADDING + 20;
    let uiWidth = 150; // Approximate width for UI elements

    fill(textColor);
    noStroke();
    textSize(20);
    textStyle(BOLD);

    // Score
    text("SCORE", uiX, uiY);
    textSize(28);
    textStyle(NORMAL);
    text(score, uiX, uiY + 25);

    // Level
    textSize(20);
    textStyle(BOLD);
    text("LEVEL", uiX, uiY + 80);
    textSize(28);
    textStyle(NORMAL);
    text(level, uiX, uiY + 105);

    // Next Piece Title
     textSize(20);
     textStyle(BOLD);
     text("NEXT", uiX, uiY + 180);

     // Draw Next Piece Preview Box
     let previewBoxSize = BLOCK_SIZE * 4 + PADDING * 5; // Made slightly larger
     let previewBoxX = uiX;
     let previewBoxY = uiY + 210;
     fill(gridColor);
     rect(previewBoxX, previewBoxY, previewBoxSize, previewBoxSize, CORNER_RADIUS);


    // Draw the next piece centered in the preview box
     if (nextPiece) {
         let shape = nextPiece.shape[0]; // Always show default rotation
         let clr = nextPiece.color;
         let pieceWidthBlocks = 0;
         let pieceHeightBlocks = 0;
         let minX = 4, minY = 4, maxX = -1, maxY = -1;

         // Find bounds of the piece shape
         for (let block of shape) {
             minX = min(minX, block[0]);
             minY = min(minY, block[1]);
             maxX = max(maxX, block[0]);
             maxY = max(maxY, block[1]);
         }
          pieceWidthBlocks = maxX - minX + 1;
          pieceHeightBlocks = maxY - minY + 1;

         let piecePixelWidth = pieceWidthBlocks * BLOCK_SIZE + max(0, pieceWidthBlocks - 1) * PADDING;
         let piecePixelHeight = pieceHeightBlocks * BLOCK_SIZE + max(0, pieceHeightBlocks - 1) * PADDING;


         // Calculate offsets to center the piece within the preview box
         let offsetX = previewBoxX + (previewBoxSize - piecePixelWidth) / 2;
         let offsetY = previewBoxY + (previewBoxSize - piecePixelHeight) / 2;

         // Adjust offset based on the piece's internal origin (minX, minY)
         offsetX -= minX * (BLOCK_SIZE + PADDING);
         offsetY -= minY * (BLOCK_SIZE + PADDING);


         push(); // Isolate drawing transformations
         translate(offsetX, offsetY); // Move origin for drawing the piece

         for (let block of shape) {
             let xPos = block[0] * (BLOCK_SIZE + PADDING);
             let yPos = block[1] * (BLOCK_SIZE + PADDING);

             // Shadow
             noStroke();
             fill(shadowColor);
             rect(xPos + 2, yPos + 2, BLOCK_SIZE, BLOCK_SIZE, CORNER_RADIUS);

             // Block
             stroke(255, 255, 255, 180);
             strokeWeight(STROKE_WEIGHT);
             fill(clr);
             rect(xPos, yPos, BLOCK_SIZE, BLOCK_SIZE, CORNER_RADIUS);
         }
         pop(); // Restore previous drawing state
     }
}

function displayGameOver() {
    // Dark overlay
    fill(0, 0, 0, 170); // Slightly darker overlay
    rect(0, 0, width, height);

    // Game Over Text
    textSize(60);
    fill(255, 105, 97); // Pastel Red / Coral
    stroke(255);
    strokeWeight(3);
    textAlign(CENTER, CENTER);
    text("GAME OVER", width / 2, height / 2 - 50);

    // Final Score
    textSize(30);
    fill(255);
    noStroke();
    text("Final Score: " + score, width / 2, height / 2 + 15);
     text("Level: " + level, width / 2, height / 2 + 55);


     // Reset Instructions
     textSize(18);
     fill(230);
     text("Refresh page (F5 or Cmd+R)", width / 2, height * 0.75);
     text("to play again!", width / 2, height * 0.75 + 25);


     textAlign(LEFT, TOP); // Reset text alignment for safety
}
