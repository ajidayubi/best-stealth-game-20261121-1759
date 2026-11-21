const WALLS = [
    // Outer border (thickness 24)
    { x: 0, y: 0, w: 1280, h: 24 },
    { x: 0, y: 776, w: 1280, h: 24 },
    { x: 0, y: 24, w: 24, h: 752 },
    { x: 1256, y: 24, w: 24, h: 752 },

    // Interior walls forming 3 wings with door gaps
    // West wing divider (vertical around x=400, gap in middle y=350..450)
    { x: 400, y: 24, w: 24, h: 326 },
    { x: 400, y: 450, w: 24, h: 326 },

    // North gallery divider (horizontal around y=280, gap x=200..300)
    { x: 24, y: 280, w: 176, h: 24 },
    { x: 300, y: 280, w: 100, h: 24 },

    // East wing divider (vertical around x=880, gap y=350..450)
    { x: 880, y: 24, w: 24, h: 326 },
    { x: 880, y: 450, w: 24, h: 326 },

    // Central room divider short walls
    { x: 550, y: 550, w: 180, h: 24 },
    { x: 550, y: 250, w: 180, h: 24 }
];

const COVER = [
    // 6 glass display cases (approx 90x50)
    { type: 'case', x: 150, y: 120, w: 90, h: 50 },
    { type: 'case', x: 200, y: 600, w: 90, h: 50 },
    { type: 'case', x: 500, y: 400, w: 50, h: 90 },
    { type: 'case', x: 750, y: 150, w: 90, h: 50 },
    { type: 'case', x: 1000, y: 300, w: 50, h: 90 },
    { type: 'case', x: 950, y: 650, w: 90, h: 50 },

    // 4 round stone pillars (radius 26 -> stored as circle center x,y, r)
    { type: 'pillar', x: 480, y: 150, r: 26 },
    { type: 'pillar', x: 480, y: 650, r: 26 },
    { type: 'pillar', x: 800, y: 650, r: 26 },
    { type: 'pillar', x: 1100, y: 150, r: 26 }
];

const LOW_ROPES = [
    // 4 velvet-rope stands (thin rectangles blocking movement, not sight)
    { x: 600, y: 350, w: 120, h: 8 },
    { x: 600, y: 450, w: 120, h: 8 },
    { x: 250, y: 450, w: 8, h: 100 },
    { x: 1050, y: 450, w: 8, h: 100 }
];

const ARTIFACTS = [
    { id: 'jade_mask', name: 'Jade Mask', x: 120, y: 400, collected: false },
    { id: 'gold_scarab', name: 'Gold Scarab', x: 640, y: 100, collected: false },
    { id: 'ruby', name: 'Ruby Gem', x: 1160, y: 400, collected: false }
];

const EXIT = { x: 1180, y: 700, w: 50, h: 60 };

const PLAYER_START = { x: 70, y: 720 };

const GUARD_PATHS = [
    // Guard 1: West wing patrol
    [
        { x: 100, y: 150 },
        { x: 320, y: 150 },
        { x: 320, y: 650 },
        { x: 100, y: 650 }
    ],
    // Guard 2: North gallery patrol
    [
        { x: 500, y: 100 },
        { x: 800, y: 100 },
        { x: 800, y: 220 },
        { x: 500, y: 220 }
    ],
    // Guard 3: Central / East wing patrol
    [
        { x: 650, y: 400 },
        { x: 830, y: 400 },
        { x: 830, y: 720 },
        { x: 650, y: 720 }
    ],
    // Guard 4: Far East wing patrol
    [
        { x: 950, y: 200 },
        { x: 1200, y: 200 },
        { x: 1200, y: 600 },
        { x: 950, y: 600 }
    ]
];

const PAINTINGS = [
    { x: 24, y: 150, w: 8, h: 60 },
    { x: 24, y: 550, w: 8, h: 60 },
    { x: 600, y: 24, w: 60, h: 8 },
    { x: 1000, y: 24, w: 60, h: 8 },
    { x: 1248, y: 200, w: 8, h: 60 },
    { x: 1248, y: 550, w: 8, h: 60 },
    { x: 400, y: 200, w: 8, h: 50 },
    { x: 880, y: 600, w: 8, h: 50 }
];

const level = {
    walls: WALLS,
    cover: COVER,
    lowRopes: LOW_ROPES,
    artifacts: ARTIFACTS,
    exit: EXIT,
    playerStart: PLAYER_START,
    guardPaths: GUARD_PATHS,
    paintings: PAINTINGS,

    isBlocked(x, y, radius) {
        // Check walls
        for (const w of this.walls) {
            const closestX = Math.max(w.x, Math.min(x, w.x + w.w));
            const closestY = Math.max(w.y, Math.min(y, w.y + w.h));
            const dx = x - closestX;
            const dy = y - closestY;
            if ((dx * dx + dy * dy) < (radius * radius)) {
                return true;
            }
        }

        // Check cover (tall cases & pillars)
        for (const c of this.cover) {
            if (c.type === 'case') {
                const closestX = Math.max(c.x, Math.min(x, c.x + c.w));
                const closestY = Math.max(c.y, Math.min(y, c.y + c.h));
                const dx = x - closestX;
                const dy = y - closestY;
                if ((dx * dx + dy * dy) < (radius * radius)) {
                    return true;
                }
            } else if (c.type === 'pillar') {
                const dx = x - c.x;
                const dy = y - c.y;
                const minDist = radius + c.r;
                if ((dx * dx + dy * dy) < (minDist * minDist)) {
                    return true;
                }
            }
        }

        // Check low ropes
        for (const r of this.lowRopes) {
            const closestX = Math.max(r.x, Math.min(x, r.x + r.w));
            const closestY = Math.max(r.y, Math.min(y, r.y + r.h));
            const dx = x - closestX;
            const dy = y - closestY;
            if ((dx * dx + dy * dy) < (radius * radius)) {
                return true;
            }
        }

        return false;
    },

    blocksSight(x1, y1, x2, y2) {
        const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 10);
        if (steps === 0) return false;

        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const sx = x1 + (x2 - x1) * t;
            const sy = y1 + (y2 - y1) * t;

            // Check walls
            for (const w of this.walls) {
                if (sx >= w.x && sx <= w.x + w.w && sy >= w.y && sy <= w.y + w.h) {
                    return true;
                }
            }

            // Check tall cover only (cases and pillars)
            for (const c of this.cover) {
                if (c.type === 'case') {
                    if (sx >= c.x && sx <= c.x + c.w && sy >= c.y && sy <= c.y + c.h) {
                        return true;
                    }
                } else if (c.type === 'pillar') {
                    const dx = sx - c.x;
                    const dy = sy - c.y;
                    if ((dx * dx + dy * dy) <= (c.r * c.r)) {
                        return true;
                    }
                }
            }
            // Low ropes do NOT block sight
        }
        return false;
    }
};
