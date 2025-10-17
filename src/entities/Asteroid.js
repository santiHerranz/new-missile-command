/**
 * Asteroid class - represents falling asteroids in the game
 */
export class Asteroid {
    /**
     * Create a new asteroid
     * @param {Object} pos - Initial position {x, y}
     * @param {Object} target - Target position {x, y}
     * @param {number} speed - Movement speed
     */
    constructor(pos, target, speed) {
        this.trailColor = "orange";
        this.bodyColor = "red";
        this.radius = 5;
        this.speed = speed;

        this.originX = pos.x;
        this.originY = pos.y;

        this.x = pos.x;
        this.y = pos.y;

        this.vx = 0;
        this.vy = 0;

        this.target = {};
        this.target.x = target.x;
        this.target.y = target.y;

        this.angle = -Math.atan2(this.originX - this.target.x, this.originY - this.target.y) - Math.PI / 2;

        this.live = 100;
        this.distanceToTarget = null;
    }

    /**
     * Update asteroid position
     * @param {number} dt - Delta time
     */
    step(dt) {
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

        if (this.distanceToTarget == null) {
            this.distanceToTarget = distanceToTarget;
        }

        if (distanceToTarget > this.distanceToTarget) {
            this.live = 0;
        } else {
            this.vx = dt * this.speed * Math.cos(this.angle);
            this.vy = dt * this.speed * Math.sin(this.angle);

            this.x += this.vx;
            this.y += this.vy;
        }

        this.distanceToTarget = distanceToTarget;
    }

    /**
     * Draw the asteroid on canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        // Draw trail
        ctx.beginPath();
        ctx.moveTo(this.originX, this.originY);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = this.trailColor;
        ctx.stroke();

        // Draw asteroid body
        ctx.beginPath();
        ctx.strokeStyle = this.bodyColor;
        ctx.fillStyle = this.bodyColor;
        ctx.arc(this.x, this.y, this.radius, 2 * Math.PI, false);
        ctx.fill();
        ctx.stroke();
    }

    /**
     * Check collision with another object
     * @param {Object} other - Other object with x, y, radius properties
     * @returns {boolean} True if collision detected
     */
    collide(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = this.radius + other.radius;
        return dist < minDist;
    }
}
