/**
 * Game Entities for Lexicon Forge
 */

/**
 * Kinetic Letter Orb Entity
 */
class LetterOrb {
    constructor(id, letter, x, y, radius = 28) {
        this.id = id;
        this.letter = letter.toUpperCase();
        this.pos = new Vector2(x, y);
        this.vel = new Vector2((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40);
        this.radius = radius;
        this.targetRadius = radius;
        this.selected = false;
        this.selectedIndex = -1;
        this.isCorrupt = false;
        this.element = this.determineElement(letter);
        this.pulse = Math.random() * Math.PI * 2;
    }

    determineElement(letter) {
        const rare = ['Q', 'X', 'Z', 'J', 'K', 'V', 'W'];
        const fire = ['F', 'R', 'B', 'M', 'P'];
        const tesla = ['E', 'A', 'I', 'O', 'U'];
        
        if (rare.includes(this.letter)) return 'SHATTER'; // Ice shatter
        if (fire.includes(this.letter)) return 'IGNITE';   // Fire ignite
        if (tesla.includes(this.letter)) return 'TESLA';   // Electric arc
        return 'STANDARD';
    }

    update(dt, bounds) {
        // Floating kinetic movement
        this.pos.add(new Vector2(this.vel.x * dt, this.vel.y * dt));

        // Screen bounce boundaries
        if (this.pos.x < this.radius) { this.pos.x = this.radius; this.vel.x *= -0.8; }
        if (this.pos.x > bounds.width - this.radius) { this.pos.x = bounds.width - this.radius; this.vel.x *= -0.8; }
        if (this.pos.y < 120 + this.radius) { this.pos.y = 120 + this.radius; this.vel.y *= -0.8; }
        if (this.pos.y > bounds.height - 100 - this.radius) { this.pos.y = bounds.height - 100 - this.radius; this.vel.y *= -0.8; }

        // Pulse scale animation when selected
        const targetR = this.selected ? this.radius * 1.25 : this.radius;
        this.targetRadius += (targetR - this.targetRadius) * (dt * 12);
        this.pulse += dt * 3;
    }

    draw(ctx) {
        ctx.save();

        let baseGlow = '#ffaa00';
        let bgGradientStart = '#2a1a00';
        let bgGradientEnd = '#150d00';

        if (this.selected) {
            baseGlow = '#00f0ff';
            bgGradientStart = '#003344';
            bgGradientEnd = '#00111a';
        } else if (this.isCorrupt) {
            baseGlow = '#ff0044';
            bgGradientStart = '#330011';
            bgGradientEnd = '#1a0008';
        } else if (this.element === 'IGNITE') {
            baseGlow = '#ff4400';
        } else if (this.element === 'SHATTER') {
            baseGlow = '#00e5ff';
        } else if (this.element === 'TESLA') {
            baseGlow = '#bd00ff';
        }

        ctx.shadowColor = baseGlow;
        ctx.shadowBlur = this.selected ? 30 : 15;

        // Outer Orb Ring
        ctx.strokeStyle = baseGlow;
        ctx.lineWidth = this.selected ? 4 : 2;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.targetRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner Glass Orb Fill
        const grad = ctx.createRadialGradient(
            this.pos.x - this.targetRadius * 0.3, this.pos.y - this.targetRadius * 0.3, 2,
            this.pos.x, this.pos.y, this.targetRadius
        );
        grad.addColorStop(0, bgGradientStart);
        grad.addColorStop(1, bgGradientEnd);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.targetRadius - 1, 0, Math.PI * 2);
        ctx.fill();

        // Letter Text
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 ${this.targetRadius * 0.9}px 'Cinzel', serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.letter, this.pos.x, this.pos.y + 2);

        // Sequence Index Badge
        if (this.selected && this.selectedIndex >= 0) {
            ctx.fillStyle = '#00f0ff';
            ctx.beginPath();
            ctx.arc(this.pos.x + this.targetRadius * 0.7, this.pos.y - this.targetRadius * 0.7, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000000';
            ctx.font = `900 10px 'Orbitron', sans-serif`;
            ctx.fillText((this.selectedIndex + 1).toString(), this.pos.x + this.targetRadius * 0.7, this.pos.y - this.targetRadius * 0.7 + 1);
        }

        ctx.restore();
    }
}
