function applyShot() {
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (!shot) return null;

    // Optional seed for deterministic randomness if needed
    const seed = params.get('seed');
    if (seed) {
        // seed handling if any randomness used
    }

    // Reset level / state defaults first
    level.artifacts.forEach(a => a.collected = false);
    PLAYER.reset();
    guards = makeGuards();

    if (shot === 'start') {
        // player at PLAYER_START; all four guards on patrol; vision cones visible; detection 0; objective line visible
        GAME.detection = 0;
        GAME.alarms = 0;
        GAME.state = 'title';
    } else if (shot === 'play') {
        // mid-sneak: player crouched behind tall display case in west wing (e.g. x: 190, y: 145),
        // guard's cone sweeping past case edge; one artifact collected; detection 15.
        PLAYER.x = 190;
        PLAYER.y = 145;
        level.artifacts[0].collected = true;
        PLAYER.artifactsCollected = 1;
        GAME.detection = 15;
        GAME.alarms = 0;
        GAME.state = 'playing';
        if (guards.length > 0) {
            guards[0].x = 220;
            guards[0].y = 200;
            guards[0].facing = Math.PI / 2;
            guards[0].state = 'patrol';
        }
    } else if (shot === 'chase') {
        // detection 88 and rising; nearest guard turned toward player and mid-stride, "?" over head; red alarm light at edges; 2 artifacts collected.
        PLAYER.x = 520;
        PLAYER.y = 300;
        level.artifacts[0].collected = true;
        level.artifacts[1].collected = true;
        PLAYER.artifactsCollected = 2;
        GAME.detection = 88;
        GAME.alarms = 1;
        GAME.state = 'playing';
        if (guards.length > 0) {
            guards[0].x = 520;
            guards[0].y = 380;
            guards[0].facing = -Math.PI / 2;
            guards[0].state = 'suspicious';
            guards[0].suspicion = 0.9;
        }
    } else if (shot === 'exit') {
        // all 3 artifacts collected; exit door glowing green and open; player stepping into doorway; guards far away; detection 0.
        level.artifacts.forEach(a => a.collected = true);
        PLAYER.artifactsCollected = 3;
        PLAYER.x = 1190;
        PLAYER.y = 720;
        GAME.detection = 0;
        GAME.alarms = 0;
        GAME.state = 'playing';
        if (guards.length > 0) {
            guards[0].x = 100;
            guards[0].y = 150;
            guards[0].state = 'patrol';
        }
    }

    return shot;
}
