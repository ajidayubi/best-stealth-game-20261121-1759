const RENDER = {
    draw(ctx, level, guards, player, coins, globalDetection, gameState, elapsedTime) {
        // Clear canvas
        ctx.fillStyle = CONFIG.colors.floorDark;
        ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

        // Draw checkerboard floor tiles
        const tileSize = 64;
        for (let x = 0; x < CONFIG.width; x += tileSize) {
            for (let y = 0; y < CONFIG.height; y += tileSize) {
                if (((x / tileSize + y / tileSize) % 2) === 0) {
                    ctx.fillStyle = CONFIG.colors.floorLight;
                    ctx.fillRect(x, y, tileSize, tileSize);
                }
            }
        }

        // Draw paintings on walls
        ctx.fillStyle = CONFIG.colors.painting;
        for (const p of level.paintings) {
            ctx.fillRect(p.x, p.y, p.w, p.h);
            ctx.strokeStyle = '#222';
            ctx.strokeRect(p.x, p.y, p.w, p.h);
        }

        // Draw Walls
        ctx.fillStyle = CONFIG.colors.wallStone;
        for (const w of level.walls) {
            ctx.fillRect(w.x, w.y, w.w, w.h);
            ctx.strokeStyle = '#1a1d23';
            ctx.lineWidth = 2;
            ctx.strokeRect(w.x, w.y, w.w, w.h);
        }

        // Draw Exit
        ctx.fillStyle = (player.artifactsCollected >= 3) ? CONFIG.colors.exitGreen : '#238636';
        ctx.fillRect(level.exit.x, level.exit.y, level.exit.w, level.exit.h);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(level.exit.x, level.exit.y, level.exit.w, level.exit.h);
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('EXIT', level.exit.x + level.exit.w / 2, level.exit.y + level.exit.h / 2 + 4);

        // Draw Artifacts
        for (const art of level.artifacts) {
            if (!art.collected) {
                ctx.beginPath();
                ctx.arc(art.x, art.y, 12, 0, Math.PI * 2);
                ctx.fillStyle = CONFIG.colors.artifactGold;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Sparkle / icon
                ctx.fillStyle = '#fff';
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('★', art.x, art.y + 4);
            }
        }

        // Draw Cover (Display cases and pillars)
        for (const c of level.cover) {
            if (c.type === 'case') {
                ctx.fillStyle = CONFIG.colors.caseGlass;
                ctx.fillRect(c.x, c.y, c.w, c.h);
                ctx.strokeStyle = CONFIG.colors.caseGlassBorder;
                ctx.lineWidth = 2;
                ctx.strokeRect(c.x, c.y, c.w, c.h);
            } else if (c.type === 'pillar') {
                ctx.beginPath();
                ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
                ctx.fillStyle = CONFIG.colors.pillar;
                ctx.fill();
                ctx.strokeStyle = '#21262d';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        }

        // Draw Low Ropes
        ctx.fillStyle = CONFIG.colors.rope;
        for (const r of level.lowRopes) {
            ctx.fillRect(r.x, r.y, r.w, r.h);
        }

        // Draw Coins in flight / landed
        for (const coin of coins) {
            ctx.beginPath();
            ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#e3b341';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw Guards Vision Cones first (under guards)
        for (const guard of guards) {
            const coneAngle = CONFIG.visionAngle * (Math.PI / 180);
            const halfCone = coneAngle / 2;
            const startAngle = guard.facing - halfCone;
            const endAngle = guard.facing + halfCone;

            ctx.beginPath();
            ctx.moveTo(guard.x, guard.y);
            ctx.arc(guard.x, guard.y, CONFIG.visionRange, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = (guard.state === 'alarmed' || guard.state === 'suspicious') ? 'rgba(248, 81, 73, 0.2)' : CONFIG.colors.coneYellow;
            ctx.fill();
        }

        // Draw Guards
        for (const guard of guards) {
            ctx.beginPath();
            ctx.arc(guard.x, guard.y, 15, 0, Math.PI * 2);
            ctx.fillStyle = (guard.state === 'alarmed') ? CONFIG.colors.guardAlert : (guard.state === 'suspicious' ? '#db6d28' : CONFIG.colors.guardNavy);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Facing line / indicator
            ctx.beginPath();
            ctx.moveTo(guard.x, guard.y);
            ctx.lineTo(guard.x + Math.cos(guard.facing) * 18, guard.y + Math.sin(guard.facing) * 18);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Suspicion bar above guard if suspicious
            if (guard.suspicion > 0) {
                ctx.fillStyle = '#30363d';
                ctx.fillRect(guard.x - 16, guard.y - 26, 32, 5);
                ctx.fillStyle = guard.state === 'alarmed' ? CONFIG.colors.alarmRed : CONFIG.colors.artifactGold;
                ctx.fillRect(guard.x - 16, guard.y - 26, 32 * guard.suspicion, 5);
            }
        }

        // Draw Player
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.colors.playerAmber;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Player facing line
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(player.x + Math.cos(player.facing) * (player.radius + 4), player.y + Math.sin(player.facing) * (player.radius + 4));
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Game Over / Win Overlays
        if (gameState === 'gameover' || gameState === 'win') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 48px monospace';
            ctx.textAlign = 'center';
            if (gameState === 'win') {
                ctx.fillStyle = CONFIG.colors.exitGreen;
                ctx.fillText('HEIST SUCCESSFUL!', CONFIG.width / 2, CONFIG.height / 2 - 40);
                ctx.font = '20px monospace';
                ctx.fillStyle = '#c9d1d9';
                ctx.fillText(`Final Time: ${elapsedTime.toFixed(1)}s`, CONFIG.width / 2, CONFIG.height / 2 + 10);
            } else {
                ctx.fillStyle = CONFIG.colors.alarmRed;
                ctx.fillText('BUSTED! CAUGHT BY GUARDS', CONFIG.width / 2, CONFIG.height / 2 - 40);
            }

            ctx.font = '18px monospace';
            ctx.fillStyle = '#8b949e';
            ctx.fillText('Press R to Restart', CONFIG.width / 2, CONFIG.height / 2 + 60);
        }
    }
};
