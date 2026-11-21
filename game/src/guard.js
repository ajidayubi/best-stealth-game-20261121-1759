class Guard {
    constructor(path) {
        this.path = path;
        this.waypointIndex = 0;
        this.x = path[0].x;
        this.y = path[0].y;
        this.pauseTimer = 0;
        this.facing = 0; // radians
        this.state = 'patrol'; // 'patrol', 'suspicious', 'investigate', 'alarmed'
        this.suspicion = 0; // 0..1
        this.investigateTarget = null;
        this.investigateTimer = 0;
        this.sweepTimer = 0;
    }

    update(dt, player, level) {
        if (this.state === 'alarmed') {
            // Chase player directly if alarmed
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.facing = angle;
            const dist = Math.hypot(player.x - this.x, player.y - this.y);
            if (dist > 30) {
                const spd = CONFIG.guardInvestigateSpeed * dt;
                const nx = this.x + Math.cos(angle) * spd;
                const ny = this.y + Math.sin(angle) * spd;
                if (!level.isBlocked(nx, ny, 15)) {
                    this.x = nx;
                    this.y = ny;
                }
            }
            return;
        }

        // Check vision of player
        if (this.canSee(player, level)) {
            this.state = 'suspicious';
            this.suspicion = Math.min(1, this.suspicion + (CONFIG.detectionFillRate / 100) * dt);
            // Turn smoothly towards player
            const targetAngle = Math.atan2(player.y - this.y, player.x - this.x);
            let diff = targetAngle - this.facing;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.facing += diff * Math.min(1, dt * 5);

            if (this.suspicion >= 1) {
                this.state = 'alarmed';
                if (typeof window.triggerAlarm === 'function') {
                    window.triggerAlarm();
                }
            }
        } else {
            // Decay suspicion / normal behavior
            if (this.suspicion > 0) {
                this.suspicion = Math.max(0, this.suspicion - (CONFIG.detectionDrainRate / 100) * dt);
                if (this.suspicion === 0 && this.state === 'suspicious') {
                    this.state = 'patrol';
                }
            }
        }

        // State machine
        if (this.state === 'investigate') {
            if (this.investigateTarget) {
                const angle = Math.atan2(this.investigateTarget.y - this.y, this.investigateTarget.x - this.x);
                this.facing = angle;
                const dist = Math.hypot(this.investigateTarget.x - this.x, this.investigateTarget.y - this.y);
                if (dist < 10) {
                    // Arrived at investigation point, look around for 2s
                    this.investigateTimer += dt;
                    this.facing += dt * 2; // sweep around
                    if (this.investigateTimer >= 2.0) {
                        this.investigateTimer = 0;
                        this.investigateTarget = null;
                        this.state = 'patrol';
                    }
                } else {
                    const spd = CONFIG.guardInvestigateSpeed * dt;
                    const nx = this.x + Math.cos(angle) * spd;
                    const ny = this.y + Math.sin(angle) * spd;
                    if (!level.isBlocked(nx, ny, 15)) {
                        this.x = nx;
                        this.y = ny;
                    } else {
                        // Path blocked, resume patrol
                        this.investigateTarget = null;
                        this.state = 'patrol';
                    }
                }
            } else {
                this.state = 'patrol';
            }
        } else if (this.state === 'patrol') {
            if (this.pauseTimer > 0) {
                this.pauseTimer -= dt;
                // Sweep facing back and forth while paused
                this.sweepTimer += dt;
                this.facing = this.baseWaypointFacing + Math.sin(this.sweepTimer * 3) * 0.75;
            } else {
                const targetWP = this.path[this.waypointIndex];
                const angle = Math.atan2(targetWP.y - this.y, targetWP.x - this.x);
                this.facing = angle;
                const dist = Math.hypot(targetWP.x - this.x, targetWP.y - this.y);
                if (dist < 5) {
                    this.pauseTimer = 1.2;
                    this.sweepTimer = 0;
                    this.baseWaypointFacing = this.facing;
                    this.waypointIndex = (this.waypointIndex + 1) % this.path.length;
                } else {
                    const spd = CONFIG.guardPatrolSpeed * dt;
                    const nx = this.x + Math.cos(angle) * spd;
                    const ny = this.y + Math.sin(angle) * spd;
                    if (!level.isBlocked(nx, ny, 15)) {
                        this.x = nx;
                        this.y = ny;
                    } else {
                        // Skip waypoint if stuck
                        this.waypointIndex = (this.waypointIndex + 1) % this.path.length;
                    }
                }
            }
        }
    }

    canSee(player, level) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > CONFIG.visionRange) return false;

        const angleToPlayer = Math.atan2(dy, dx);
        let angleDiff = angleToPlayer - this.facing;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

        const halfCone = (CONFIG.visionAngle / 2) * (Math.PI / 180);
        if (Math.abs(angleDiff) <= halfCone) {
            // Check line of sight
            if (!level.blocksSight(this.x, this.y, player.x, player.y)) {
                return true;
            }
        }
        return false;
    }

    investigate(target) {
        if (this.state !== 'alarmed') {
            this.state = 'investigate';
            this.investigateTarget = target;
            this.investigateTimer = 0;
        }
    }

    alarm() {
        this.state = 'alarmed';
    }
}

function makeGuards() {
    return level.guardPaths.map(path => new Guard(path));
}
