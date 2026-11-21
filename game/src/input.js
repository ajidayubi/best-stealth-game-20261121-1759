const INPUT = {
    keys: {},
    mouse: { x: 0, y: 0, clicked: false },

    init(canvas) {
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            if (e.code === 'KeyC' || e.code === 'Space') {
                this.mouse.clicked = true;
            }
        });

        window.addEventListener('keyup', e => {
            this.keys[e.code] = false;
        });

        canvas.addEventListener('mousemove', e => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        canvas.addEventListener('mousedown', e => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
            this.mouse.clicked = true;
        });
    },

    getAxes() {
        let dx = 0;
        let dy = 0;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;

        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }
        return { dx, dy };
    },

    consumeClick() {
        if (this.mouse.clicked) {
            this.mouse.clicked = false;
            return { x: this.mouse.x, y: this.mouse.y };
        }
        return null;
    }
};
