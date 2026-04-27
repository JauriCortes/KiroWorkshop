// ============================================================================
// CONSTANTS
// ============================================================================

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;
const HUD_HEIGHT = 40;
const PLAY_HEIGHT = CANVAS_HEIGHT - HUD_HEIGHT; // 600px

// ============================================================================
// GAME STATE
// ============================================================================

const GameState = {
  phase: 'START', // 'START' | 'PLAYING' | 'GAME_OVER'

  ghosty: {
    x: 100,
    y: 320,
    vy: 0,
    width: 40,
    height: 40,
    rotation: 0,
  },

  pipes: [],
  frameCount: 0,

  score: 0,
  highScore: 0,

  clouds: [],

  assets: {
    ghostyImg: null,
    jumpSound: null,
    gameOverSound: null,
    ghostyImgLoaded: false,
  },
};

// ============================================================================
// AUDIO MANAGER
// ============================================================================

const AudioManager = {
  init(state) {
    const jumpSound = new Audio();
    jumpSound.src = 'assets/jump.wav';
    jumpSound.onerror = () => {
      console.error('Failed to load assets/jump.wav - continuing without jump sound');
      state.assets.jumpSound = null;
    };
    state.assets.jumpSound = jumpSound;

    const gameOverSound = new Audio();
    gameOverSound.src = 'assets/game_over.wav';
    gameOverSound.onerror = () => {
      console.error('Failed to load assets/game_over.wav - continuing without game over sound');
      state.assets.gameOverSound = null;
    };
    state.assets.gameOverSound = gameOverSound;
  },

  play(audioElement) {
    if (!audioElement) return;
    audioElement.currentTime = 0;
    audioElement.play().catch(() => {});
  },
};

// ============================================================================
// PHYSICS ENGINE
// ============================================================================

const PhysicsEngine = {
  GRAVITY: 0.5,
  FLAP_VELOCITY: -8,
  MAX_FALL_SPEED: 12,
  COLLISION_MARGIN: 4,

  update(state) {
    // Update position with current velocity (before applying gravity)
    state.ghosty.y += state.ghosty.vy;

    // Apply gravity and clamp velocity
    state.ghosty.vy = Math.min(state.ghosty.vy + this.GRAVITY, this.MAX_FALL_SPEED);

    // Collision detection (only during active play)
    if (state.phase === 'PLAYING' && this.checkCollision(state)) {
      state.phase = 'GAME_OVER';
      if (typeof ScoreManager !== 'undefined') ScoreManager.save(state);
      if (typeof AudioManager !== 'undefined') AudioManager.play(state.assets.gameOverSound);
    }
  },

  flap(state) {
    state.ghosty.vy = this.FLAP_VELOCITY;
    if (typeof AudioManager !== 'undefined') AudioManager.play(state.assets.jumpSound);
  },

  checkCollision(state) {
    const g = state.ghosty;
    const m = this.COLLISION_MARGIN;

    // Border collisions use raw position (requirement 5.2)
    if (g.y < 0 || g.y + g.height > PLAY_HEIGHT) return true;

    // Pipe collisions use margin-reduced bounding box
    const gx = g.x + m;
    const gy = g.y + m;
    const gw = g.width - m * 2;
    const gh = g.height - m * 2;

    const pipes = state.pipes || [];
    for (const pipe of pipes) {
      const pw = PipeManager.PIPE_WIDTH;
      // Upper pipe
      if (gx < pipe.x + pw && gx + gw > pipe.x && gy < pipe.gapY) return true;
      // Lower pipe
      const lowerY = pipe.gapY + PipeManager.GAP_HEIGHT;
      if (gx < pipe.x + pw && gx + gw > pipe.x && gy + gh > lowerY) return true;
    }

    return false;
  },
};

// ============================================================================
// PIPE MANAGER
// ============================================================================

const PipeManager = {
  PIPE_SPEED: 3,
  PIPE_WIDTH: 60,
  GAP_HEIGHT: 150,
  SPAWN_INTERVAL: 90,
  MIN_GAP_Y: 60,
  MAX_GAP_Y: 450,

  update(state) {
    state.frameCount++;

    // Move all pipes left
    for (const pipe of state.pipes) {
      pipe.x -= this.PIPE_SPEED;
    }

    // Spawn new pipe every SPAWN_INTERVAL frames
    if (state.frameCount % this.SPAWN_INTERVAL === 0) {
      this.spawnPipe(state);
    }

    // Remove pipes that have exited the canvas
    state.pipes = state.pipes.filter(pipe => pipe.x > -this.PIPE_WIDTH);
  },

  spawnPipe(state) {
    const range = this.MAX_GAP_Y - this.MIN_GAP_Y;
    const gapY = this.MIN_GAP_Y + Math.floor(Math.random() * (range + 1));
    state.pipes.push({
      x: CANVAS_WIDTH,
      gapY,
      width: this.PIPE_WIDTH,
      gapHeight: this.GAP_HEIGHT,
      scored: false,
    });
  },

  reset(state) {
    state.pipes = [];
    state.frameCount = 0;
  },
};

// ============================================================================
// SCORE MANAGER
// ============================================================================

const ScoreManager = {
  STORAGE_KEY: 'flappy-kiro-high-score',

  init(state) {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      state.highScore = stored ? parseInt(stored, 10) : 0;
      if (isNaN(state.highScore)) state.highScore = 0;
    } catch (e) {
      state.highScore = 0;
    }
  },

  update(state) {
    for (const pipe of state.pipes) {
      if (!pipe.scored && state.ghosty.x > pipe.x + pipe.width / 2) {
        pipe.scored = true;
        state.score++;
        if (state.score > state.highScore) {
          state.highScore = state.score;
        }
      }
    }
  },

  save(state) {
    try {
      localStorage.setItem(this.STORAGE_KEY, String(state.highScore));
    } catch (e) {
      // localStorage unavailable — continue silently
    }
  },

  reset(state) {
    state.score = 0;
  },
};

// ============================================================================
// RENDERER
// ============================================================================

const Renderer = {
  _floatOffset: 0,
  _floatDir: 1,

  render(state, ctx, canvas) {
    this.drawBackground(ctx, canvas);
    this.drawSketchTexture(ctx, canvas);
    this.drawClouds(state, ctx);
    this.drawPipes(state, ctx);
    this.drawGhosty(state, ctx);
    this.drawHUD(state, ctx, canvas);
    if (state.phase === 'START') this.drawStartScreen(state, ctx, canvas);
    if (state.phase === 'GAME_OVER') this.drawGameOverScreen(state, ctx, canvas);
  },

  drawBackground(ctx, canvas) {
    ctx.fillStyle = '#5B8DD9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  },

  drawSketchTexture(ctx, canvas) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.random() * 2);
      ctx.lineTo(canvas.width, y + Math.random() * 2);
      ctx.stroke();
    }
    ctx.restore();
  },

  drawClouds(state, ctx) {
    ctx.save();
    for (const cloud of state.clouds) {
      // Move cloud
      cloud.x -= cloud.speed;
      if (cloud.x + cloud.width < 0) {
        cloud.x = CANVAS_WIDTH + cloud.width;
      }

      // Draw cloud as overlapping ellipses
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      const cx = cloud.x + cloud.width / 2;
      const cy = cloud.y + cloud.height / 2;
      const rx = cloud.width / 2;
      const ry = cloud.height / 2;

      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx - rx * 0.4, cy + ry * 0.2, rx * 0.6, ry * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + rx * 0.4, cy + ry * 0.2, rx * 0.55, ry * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },

  drawPipes(state, ctx) {
    ctx.save();
    for (const pipe of state.pipes) {
      const pw = PipeManager.PIPE_WIDTH;
      const gh = PipeManager.GAP_HEIGHT;
      const capH = 6;

      // Upper pipe body
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(pipe.x, 0, pw, pipe.gapY);
      // Upper pipe cap (darker border at bottom)
      ctx.fillStyle = '#388E3C';
      ctx.fillRect(pipe.x - 3, pipe.gapY - capH, pw + 6, capH);

      // Lower pipe
      const lowerY = pipe.gapY + gh;
      const lowerH = PLAY_HEIGHT - lowerY;
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(pipe.x, lowerY, pw, lowerH);
      // Lower pipe cap (darker border at top)
      ctx.fillStyle = '#388E3C';
      ctx.fillRect(pipe.x - 3, lowerY, pw + 6, capH);
    }
    ctx.restore();
  },

  drawGhosty(state, ctx) {
    const g = state.ghosty;
    // Rotation proportional to vy: max 30deg down, -20deg up
    const maxDown = Math.PI / 6;   // 30 degrees
    const maxUp = -Math.PI / 9;    // -20 degrees
    const rotation = g.vy > 0
      ? Math.min((g.vy / PhysicsEngine.MAX_FALL_SPEED) * maxDown, maxDown)
      : Math.max((g.vy / Math.abs(PhysicsEngine.FLAP_VELOCITY)) * maxUp, maxUp);

    ctx.save();
    ctx.translate(g.x + g.width / 2, g.y + g.height / 2);
    ctx.rotate(rotation);

    if (state.assets.ghostyImgLoaded && state.assets.ghostyImg) {
      ctx.drawImage(state.assets.ghostyImg, -g.width / 2, -g.height / 2, g.width, g.height);
    } else {
      // Fallback rectangle
      ctx.fillStyle = '#E0E0FF';
      ctx.fillRect(-g.width / 2, -g.height / 2, g.width, g.height);
      ctx.fillStyle = '#9090FF';
      ctx.fillRect(-g.width / 2 + 6, -g.height / 2 + 8, 8, 8);
      ctx.fillRect(g.width / 2 - 14, -g.height / 2 + 8, 8, 8);
    }

    ctx.restore();
  },

  drawHUD(state, ctx, canvas) {
    const hudY = PLAY_HEIGHT;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, hudY, canvas.width, HUD_HEIGHT);

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px "Courier New", monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${state.score}`, 16, hudY + HUD_HEIGHT / 2);
    ctx.textAlign = 'right';
    ctx.fillText(`High: ${state.highScore}`, canvas.width - 16, hudY + HUD_HEIGHT / 2);
  },

  drawStartScreen(state, ctx, canvas) {
    // Animated Ghosty float
    this._floatOffset += 0.05 * this._floatDir;
    if (Math.abs(this._floatOffset) > 8) this._floatDir *= -1;

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, canvas.width, PLAY_HEIGHT);

    // Title
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#4CAF50';
    ctx.shadowBlur = 12;
    ctx.fillText('Flappy Kiro', canvas.width / 2, 200);
    ctx.restore();

    // Ghosty centered with float animation
    const gx = canvas.width / 2 - 20;
    const gy = 290 + this._floatOffset;
    ctx.save();
    ctx.translate(gx + 20, gy + 20);
    if (state.assets.ghostyImgLoaded && state.assets.ghostyImg) {
      ctx.drawImage(state.assets.ghostyImg, -20, -20, 40, 40);
    } else {
      ctx.fillStyle = '#E0E0FF';
      ctx.fillRect(-20, -20, 40, 40);
    }
    ctx.restore();

    // Instructions
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '18px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Press Space / Click to Start', canvas.width / 2, 370);
  },

  drawGameOverScreen(state, ctx, canvas) {
    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, PLAY_HEIGHT);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Game Over title
    ctx.save();
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 44px "Courier New", monospace';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.fillText('Game Over', canvas.width / 2, 210);
    ctx.restore();

    // Score
    ctx.fillStyle = '#ffffff';
    ctx.font = '22px "Courier New", monospace';
    ctx.fillText(`Score: ${state.score}`, canvas.width / 2, 290);
    ctx.fillText(`Best:  ${state.highScore}`, canvas.width / 2, 325);

    // Restart instructions
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText('Press Space / Click to Restart', canvas.width / 2, 390);
  },
};

// ============================================================================
// INPUT HANDLER
// ============================================================================

const InputHandler = {
  init(canvas, onAction) {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        onAction();
      }
    });
    canvas.addEventListener('mousedown', () => onAction());
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      onAction();
    }, { passive: false });
  },
};

// ============================================================================
// GAME LOOP
// ============================================================================

function gameLoop(state, ctx, canvas) {
  if (state.phase === 'PLAYING') {
    PhysicsEngine.update(state);
    PipeManager.update(state);
    ScoreManager.update(state);
  }
  Renderer.render(state, ctx, canvas);

  requestAnimationFrame(() => gameLoop(state, ctx, canvas));
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function initClouds(state) {
  const count = 4;
  state.clouds = [];
  for (let i = 0; i < count; i++) {
    state.clouds.push({
      x: Math.random() * CANVAS_WIDTH,
      y: 40 + Math.random() * 200,
      width: 60 + Math.random() * 40,
      height: 30 + Math.random() * 20,
      speed: 0.5,
    });
  }
}

function loadAssets(state, onComplete) {
  const ghostyImg = new Image();
  ghostyImg.src = 'assets/ghosty.png';

  ghostyImg.onload = () => {
    state.assets.ghostyImg = ghostyImg;
    state.assets.ghostyImgLoaded = true;
    if (onComplete) onComplete();
  };

  ghostyImg.onerror = () => {
    console.error('Failed to load assets/ghosty.png - will use colored rectangle fallback');
    state.assets.ghostyImg = null;
    state.assets.ghostyImgLoaded = false;
    if (onComplete) onComplete();
  };

  AudioManager.init(state);
}

function resetGame(state) {
  ScoreManager.reset(state);
  PipeManager.reset(state);
  state.ghosty.x = 100;
  state.ghosty.y = 320;
  state.ghosty.vy = 0;
  state.ghosty.rotation = 0;
  state.phase = 'PLAYING';
}

function init() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  ScoreManager.init(GameState);
  initClouds(GameState);

  loadAssets(GameState, () => {
    InputHandler.init(canvas, () => {
      if (GameState.phase === 'START') {
        resetGame(GameState);
      } else if (GameState.phase === 'GAME_OVER') {
        resetGame(GameState);
      } else if (GameState.phase === 'PLAYING') {
        PhysicsEngine.flap(GameState);
      }
    });

    requestAnimationFrame(() => gameLoop(GameState, ctx, canvas));
  });
}

// Start the game when the DOM is ready (only if canvas exists)
if (typeof document !== 'undefined') {
  const startIfCanvas = () => {
    if (document.getElementById('gameCanvas')) init();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startIfCanvas);
  } else {
    startIfCanvas();
  }
}

// ============================================================================
// EXPORTS FOR TESTING
// ============================================================================

export {
  GameState,
  PhysicsEngine,
  PipeManager,
  ScoreManager,
  AudioManager,
  Renderer,
  InputHandler,
  loadAssets,
  resetGame,
  initClouds,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  HUD_HEIGHT,
  PLAY_HEIGHT,
};
