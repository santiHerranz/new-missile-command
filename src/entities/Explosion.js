import { PLAYER, OTHER, CITY } from '../constants/gameStates.js';

/**
 * Explosion class - represents explosion effects
 */
export class Explosion {
    static LIVE = 1000;

    /**
     * Create a new explosion
     * @param {number} owner - Owner type (PLAYER, OTHER, CITY)
     * @param {Object} pos - Position {x, y}
     * @param {number} score - Score value (optional)
     */
    constructor(owner, pos, score = 0) {
        this.power = 60;
        this.radius = 1;
        this.owner = owner;

        // Set color based on owner
        if (owner === PLAYER) {
            this.color = 'blue';
        } else if (owner === OTHER) {
            this.color = 'red';
        } else if (owner === CITY) {
            this.power = 100;
            this.color = 'lightgreen';
        }

        this.x = pos.x;
        this.y = pos.y;
        this.score = score;
        this.live = Explosion.LIVE;
    }

    /**
     * Update explosion state
     * @param {number} dt - Delta time
     */
    step(dt) {
        this.live -= dt * 100;

        if (this.live > Explosion.LIVE / 2) {
            this.radius = 10 + this.power * (Explosion.LIVE - this.live) / Explosion.LIVE;
        } else {
            this.radius = 10 + this.power - this.power * (Explosion.LIVE - this.live) / Explosion.LIVE;
        }

        if (this.radius < 1) {
            this.radius = 0;
        }
    }

    /**
     * Draw the explosion on canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        this.explode(this.radius, ctx);

        // Draw score if explosion is large enough
        if (this.score > 0 && this.radius > 12) {
            ctx.save();
            ctx.beginPath();
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.font = "17px Verdana";
            ctx.fillText(this.score, this.x + 12, this.y);
            ctx.restore();
        }
    }

    /**
     * Draw explosion effect with concentric circles
     * @param {number} size - Explosion size
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    explode(size, ctx) {
        // Draw concentric circles of different colors
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 1.1, 0, Math.PI * 2, false);
        ctx.fill();

        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 1.1, 0, Math.PI * 2, false);
        ctx.fill();

        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 1.0, 0, Math.PI * 2, false);
        ctx.fill();

        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 0.95, 0, Math.PI * 2, false);
        ctx.fill();

        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 0.9, 0, Math.PI * 2, false);
        ctx.fill();
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
