const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

INPUT.init(canvas);

let guards = makeGuards();
let coins = [];

// Shared global GAME state object
const GAME = {
    detection: 0,
    alarms: 0,
    artifacts: 0,
    time: 0,
    state: 'title' // 'title', 'playing', 'caught', 'gameover', 'win'
};

let alarmFlashTimer = 0;
let lastTime = performance.now();

// Global triggerAlarm function referenced by guards
window.triggerAlarm = function() {
    if (GAME.state !== 'playing') return;
    AUDIO.alarm();
    GAME.alarms++;
    alarmFlashTimer = 0.6; // flash red duration
    
    if (GAME.alarms >= CONFIG.alarmsAllowed) {
        GAME.state = 'gameover';
    } else {
        // Reset player to start, detection to 0, guards to patrol
        PLAYER.reset();
        GAME.detection = 0;
        guards = makeGuards();
    }
};

function restartLevel() {
    PLAYER.reset();
    level.artifacts.forEach(a => a.collected = false);
    guards = makeGuards();
    coins = [];
    GAME.detection = 0;
    GAME.alarms = 0;
    GAME.artifacts = 0;
    GAME.time = 0;
    GAME.state = 'playing';
}

function update(dt) {
    // R restarts level at any time; M toggles mute (mute handled via audio or silent flag if needed)
    if (INPUT.keys['KeyR']) {
        restartLevel();
        return;
    }

    if (GAME.state === 'title') {
        // Any key press starts the game
        for (const key in INPUT.keys) {
            if (INPUT.keys[key]) {
                restartLevel();
                break;
            }
        }
        if (INPUT.consumeClick()) {
            restartLevel();
        }
        return;
    }

    if (GAME.state === 'gameover' || GAME.state === 'win') {
        return;
    }

    // Alarm flash timer decay
    if (alarmFlashTimer > 0) {
        alarmFlashTimer -= dt;
    }

    GAME.time += dt;

    // Player movement
    const axes = INPUT.getAxes();
    PLAYER.move(axes.dx, axes.dy, dt, level);

    // Coin throwing on click / space
    const clickPos = INPUT.consumeClick();
    if (clickPos) {
        coins.push(PLAYER.tossCoin(clickPos.x, clickPos.y));
        AUDIO.coinToss();
    }

    // Update coins
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        coin.t += dt;
        const progress = Math.min(1, coin.t / coin.duration);
        coin.x = coin.x + (coin.tx - coin.x) * (dt / (coin.duration - (coin.t - dt))); // smooth interpolation or linear lerp
        // Simple linear interpolation
        coin.x = coin.x + (coin.tx - coin.x) * 0.2; // approx lerp towards tx, ty
        coin.y = coin.y + (coin.ty - coin.y) * 0.2;

        if (progress >= 1 || Math.hypot(coin.tx - coin.x, coin.ty - coin.y) < 5) {
            coin.x = coin.tx;
            coin.y = coin.ty;
            AUDIO.coinLand();
            // When a coin lands, nearest guard within earshot investigates it
            let nearestGuard = null;
            let minDist = Infinity;
            for (const guard of guards) {
                const dist = Math.hypot(guard.x - coin.x, guard.y - coin.y);
                if (dist < CONFIG.coinInvestigateRadius * 3 && dist < minDist) {
                    minDist = dist;
                    nearestGuard = guard;
                }
            }
            if (nearestGuard) {
                nearestGuard.investigate({ x: coin.x, y: coin.y });
            }
            coins.splice(i, 1);
        }
    }

    // Update guards
    let anyGuardSeesPlayer = false;
    for (const guard of guards) {
        guard.update(dt, PLAYER, level);
        if (guard.canSee(PLAYER, level)) {
            anyGuardSeesPlayer = true;
        }
    }

    // Detection fill/drain
    if (anyGuardSeesPlayer) {
        GAME.detection = Math.min(100, GAME.detection + CONFIG.detectionFillRate * dt);
        if (GAME.detection >= 100) {
            window.triggerAlarm();
        }
    } else {
        GAME.detection = Math.max(0, GAME.detection - CONFIG.detectionDrainRate * dt);
    }

    // Artifact collection: walking onto a pedestal collects it (chime, artifacts+1)
    for (const art of level.artifacts) {
        if (!art.collected) {
            const dist = Math.hypot(PLAYER.x - art.x, PLAYER.y - art.y);
            if (dist < PLAYER.radius + 16) {
                art.collected = true;
                PLAYER.artifactsCollected++;
                GAME.artifacts = PLAYER.artifactsCollected;
                AUDIO.collectArtifact();
            }
        }
    }

    // Exit check: When all three are collected, exit opens. Stepping into open exit goes to 'win'
    if (PLAYER.artifactsCollected >= 3) {
        const exit = level.exit;
        if (PLAYER.x >= exit.x && PLAYER.x <= exit.x + exit.w &&
            PLAYER.y >= exit.y && PLAYER.y <= exit.y + exit.h) {
            GAME.state = 'win';
            AUDIO.win();
        }
    }
}

function updateHUD() {
    document.getElementById('hud-artifacts').textContent = `${PLAYER.artifactsCollected}/3`;
    document.getElementById('hud-detection.innerHTML' in document.getElementById('hud-detection') ? 'innerHTML' : 'textContent') || '';
    // Safely update HUD DOM elements if present
    const artEl = document.getElementById('hud-artifacts');
    if (artEl) artEl.textContent = `${PLAYER.artifactsCollected}/3`;

    const detEl = document.getElementById('hud-detection');
    if (detEl) detEl.textContent = `${Math.round(GAME.detection)}%`;

    const almEl = document.getElementById('hud-alarms');
    if (almEl) almEl.textContent = `${GAME.alarms}/${CONFIG.alarmsAllowed}`;

    const timeEl = document.getElementById('hud-timer');
    if (timeEl) timeEl.textContent = `${GAME.time.toFixed(1)}s`;

    const objEl = document.getElementById('hud-objective');
    if (objEl) {
        if (PLAYER.artifactsCollected < 3) {
            objEl.textContent = 'Steal 3 artifacts & escape!';
        } else {
            objEl.textContent = 'All artifacts stolen! Reach the green exit!';
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Call RENDER.draw with correct argument order
    if (typeof RENDER === 'object' && typeof RENDER.draw === 'function') {
        RENDER.draw(ctx, level, guards, PLAYER, coins, GAME.detection, GAME.state, GAME.time);
    }

    // Alarm red flash at screen edges
    if (alarmFlashTimer > 0 || GAME.detection >= 80) {
        ctx.strokeStyle = CONFIG.colors.alarmRed;
        ctx.lineWidth = 8;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }

    // Title screen overlay if state is 'title'
    if (GAME.state === 'title') {
        ctx.fillStyle = 'rgba(13, 17, 23, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = CONFIG.colors.playerAmber;
        ctx.font = 'bold 56px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LAMPLIGHT HEIST', canvas.width / 2, canvas.height / 2 - 60);

        ctx.font = '20px monospace';
        ctx.fillStyle = '#c9d1d9';
        ctx.fillText('Steal 3 artifacts from the museum and escape undetected.', canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillStyle = '#8b949e';
        ctx.fillText('WASD / Arrows to Move • Click / Space to Toss Coin', canvas.width / 2, canvas.height / 2 + 30);
        ctx.fillStyle = CONFIG.colors.exitGreen;
        ctx.fillText('Press any key or click to start heist', canvas.width / 2, canvas.height / 2 + 90);
    }
}

// At load: call applyShot() if it exists; if a shot was staged, draw one frame and stop (no loop); otherwise start the loop.
const stagedShot = typeof applyShot === 'function' ? applyShot() : null;

if (stagedShot) {
    // Draw one full frame at once and stop (frozen pose for screenshots)
    updateHUD();
    draw();
} else {
    // Start main game loop with requestAnimationFrame, delta time clamped to 0.05 seconds
    function loop(timestamp) {
        const dt = Math.min(0.05, (timestamp - lastTime) / 1000);
        lastTime = timestamp;

        if (GAME.state !== 'title' && GAME.state !== 'gameover' && GAME.state !== 'win') {
            // normal update loop
            update(dt);
        } else if (GAME.state === 'title') {
            update(dt); // checks for start key
        }

        updateHUD();
        draw();

        requestAnimationFrame(loop);
    }
    requestAnimationFrame(timestamp => {
        lastTime = timestamp;
        requestAnimationFrame(loop);
    });
}
