/**
 * Particle & Visual FX System for Lexicon Forge
 */
class Particle {
    constructor(x, y, vx, vy, color, size, life, shape = 'circle') {
        this.pos = new Vector2(x, y);
        this.vel = new Vector2(vx, vy);
        this.color = color;
        this.size = size;
        this.maxSize = size;
        this.life = life;
        this.maxLife = life;
        this.shape = shape;
        this.alpha = 1;
    }

    update(dt) {
        this.pos.add(new Vector2(this.vel.x * dt, this.vel.y * dt));
        this.life -= dt;
        this.alpha = Math.max(0, this.life / this.maxLife);
        this.size = this.maxSize * (0.3 + 0.7 * this.alpha);
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.size * 2;

        if (this.shape === 'star') {
            ctx.beginPath();
            const r = this.size;
            for (let i = 0; i < 5; i++) {
                ctx.lineTo(
                    this.pos.x + r * Math.cos((18 + i * 72) * Math.PI / 180),
                    this.pos.y - r * Math.sin((18 + i * 72) * Math.PI / 180)
                );
                ctx.lineTo(
                    this.pos.x + (r / 2) * Math.cos((54 + i * 72) * Math.PI / 180),
                    this.pos.y - (r / 2) * Math.sin((54 + i * 72) * Math.PI / 180)
                );
            }
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.shockwaves = [];
    }

    emitIgniteBurst(x, y, count = 25) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 260;
            const color = Math.random() < 0.5 ? '#ff3300' : '#ffaa00';
            this.particles.push(new Particle(
                x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
                color, 3 + Math.random() * 5, 0.4 + Math.random() * 0.4
            ));
        }
    }

    emitTeslaBurst(x, y, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 120 + Math.random() * 280;
            this.particles.push(new Particle(
                x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
                '#bd00ff', 2 + Math.random() * 4, 0.3 + Math.random() * 0.4, 'star'
            ));
        }
    }

    emitShatterBurst(x, y, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 200;
            this.particles.push(new Particle(
                x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
                '#00e5ff', 4 + Math.random() * 4, 0.5 + Math.random() * 0.5
            ));
        }
    }

    update(dt) {
        this.particles = this.particles.filter(p => p.update(dt));
    }

    draw(ctx) {
        for (const p of this.particles) p.draw(ctx);
    }

    clear() {
        this.particles = [];
    }
}
