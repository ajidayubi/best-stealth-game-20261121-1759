const PLAYER = {
    x: 70,
    y: 720,
    radius: 14,
    coins: 999, // unlimited
    artifactsCollected: 0,
    facing: 0,

    reset() {
        this.x = level.playerStart.x;
        this.y = level.playerStart.y;
        this.artifactsCollected = 0;
        this.coins = 999;
        this.facing = 0;
    },

    move(dx, dy, dt, level) {
        if (dx === 0 && dy === 0) return;

        this.facing = Math.atan2(dy, dx);
        const distance = CONFIG.playerSpeed * dt;
        const moveX = dx * distance;
        const moveY = dy * distance;

        // Wall sliding: try x then y separately
        let newX = this.x + moveX;
        if (!level.isBlocked(newX, this.y, this.radius)) {
            this.x = newX;
        }

        let newY = this.y + moveY;
        if (!level.isBlocked(this.x, newY, this.radius)) {
            this.y = newY;
        }
    },

    tossCoin(tx, ty) {
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.hypot(dx, dy);
        let targetX = tx;
        let targetY = ty;
        if (dist > CONFIG.coinThrowRange) {
            const angle = Math.atan2(dy, dx);
            targetX = this.x + Math.cos(angle) * CONFIG.coinThrowRange;
            targetY = this.y + Math.sin(angle) * CONFIG.coinThrowRange;
        }

        return {
            x: this.x,
            y: this.y,
            tx: targetX,
            ty: targetY,
            t: 0,
            duration: 0.35,
            active: true
        };
    }
};
