import { City } from './City.js';

/**
 * Tower class - represents missile defense towers
 */
export class Tower extends City {
    static MAX_LOAD = 100;
    static ID = 1;

    /**
     * Create a new tower
     * @param {Object} pos - Position {x, y}
     * @param {number} loadSpeed - Reload speed in milliseconds
     */
    constructor(pos, loadSpeed) {
        super(pos);

        this.id = Tower.ID++;
        this.y = pos.y - 20;

        this.color = 'green';
        this.radius = 10;

        this.headingTarget = -Math.PI / 2;
        this.heading = -Math.PI / 2;
        this.headingDir = -1;

        this.load = Tower.MAX_LOAD;
        if (loadSpeed == null) loadSpeed = 50;
        this.loadSpeed = loadSpeed;
    }

    /**
     * Update tower state
     * @param {number} dt - Delta time
     */
    step(dt) {
        super.step(dt);

        // Reload mechanism
        this.load += 60000 / this.loadSpeed * dt;
        if (this.load > Tower.MAX_LOAD) {
            this.load = Tower.MAX_LOAD;
        }

        // Animate tower head movement
        if (this.heading < -Math.PI * 4 / 4) {
            this.headingDir *= -1;
        } else if (this.heading > 0) {
            this.headingDir *= -1;
        }

        this.heading += this.headingDir * 0.15;
    }

    /**
     * Draw the tower on canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        if (this.live > 0) {
            // Draw tower barrel
            ctx.beginPath();
            ctx.strokeStyle = "#040";
            ctx.fillStyle = this.color;
            ctx.lineWidth = 8;
            ctx.moveTo(this.x, this.y + this.height - 5);
            ctx.lineTo(
                this.x + 25 * Math.cos(this.heading),
                this.y + this.height + 25 * Math.sin(this.heading)
            );
            ctx.stroke();

            // Draw reload indicator
            const loadPercent = this.load / Tower.MAX_LOAD;

            ctx.save();
            ctx.beginPath();
            ctx.translate(this.x, this.y + this.height - 5);
            ctx.rotate(this.headingTarget);
            ctx.strokeStyle = this.color;
            ctx.fillStyle = this.color;
            ctx.lineWidth = 10;
            ctx.lineCap = "round";
            ctx.moveTo(0, 0);
            ctx.lineTo(20 * loadPercent, 20 * loadPercent);
            ctx.stroke();

            // Draw targeting line
            ctx.lineWidth = 3;
            ctx.setLineDash([1, 100]);
            ctx.strokeStyle = "gray";
            ctx.moveTo(0, 0);
            ctx.lineTo(500, 500);
            ctx.stroke();

            ctx.restore();

            // Draw tower base
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.strokeStyle = "#060";
            ctx.fillStyle = '#050';
            ctx.arc(this.x, this.y + this.height, 20, -Math.PI, 0);
            ctx.fill();
            ctx.stroke();
        }
    }

    /**
     * Check if tower is ready to fire
     * @returns {boolean} True if ready to fire
     */
    isReady() {
        return this.load === Tower.MAX_LOAD;
    }

    /**
     * Fire a shot (consume ammo)
     */
    shot() {
        if (this.load === Tower.MAX_LOAD) {
            this.load = 0;
        }
    }
}
