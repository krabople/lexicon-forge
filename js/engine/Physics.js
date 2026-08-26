/**
 * Physics Utility Engine for Kinetic Letter Orbs
 */
class Physics {
    /**
     * Resolve elastic circle-circle collision between letter orbs
     */
    static resolveOrbCollision(orb1, orb2) {
        const delta = orb1.pos.clone().sub(orb2.pos);
        const dist = delta.length();
        const minDist = orb1.radius + orb2.radius;

        if (dist < minDist && dist > 0) {
            const overlap = minDist - dist;
            const normal = delta.clone().normalize();

            // Separate overlapping orbs
            orb1.pos.add(normal.clone().scale(overlap * 0.5));
            orb2.pos.sub(normal.clone().scale(overlap * 0.5));

            // Dampen velocities
            orb1.vel.scale(0.85);
            orb2.vel.scale(0.85);
        }
    }

    /**
     * Check circle to point collision
     */
    static pointInCircle(point, circlePos, radius) {
        return point.distSq(circlePos) <= radius * radius;
    }
}

if (typeof module !== 'undefined') {
    module.exports = Physics;
}
