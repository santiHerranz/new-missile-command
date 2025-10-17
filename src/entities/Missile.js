/**
 * Missile class - represents defensive missiles
 */
export class Missile {
    static LIVE = 100;

    /**
     * Create a new missile
     * @param {Object} pos - Initial position {x, y}
     * @param {Object} target - Target position {x, y}
     * @param {number} speed - Movement speed
     */
    constructor(pos, target, speed) {
        this.radius = 3;
        this.speed = speed;

        this.originX = pos.x;
        this.originY = pos.y;

        this.x = pos.x;
        this.y = pos.y;

        this.targetX = target.x;
        this.targetY = target.y;

        this.angle = -Math.atan2(this.originX - this.targetX, this.originY - this.targetY) - Math.PI / 2;

        this.live = Missile.LIVE;
        this.distanceToTarget = null;
    }

    /**
     * Update missile position
     * @param {number} dt - Delta time
     */
    step(dt) {
        this.x += dt * this.speed * Math.cos(this.angle);
        this.y += dt * this.speed * Math.sin(this.angle);

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

        if (this.distanceToTarget == null) {
            this.distanceToTarget = distanceToTarget;
        }

        if (distanceToTarget > this.distanceToTarget) {
            this.x = this.targetX;
            this.y = this.targetY;
            this.live = 0;
        }

        this.distanceToTarget = distanceToTarget;
    }

    /**
     * Draw the missile on canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        // Draw missile body
        ctx.beginPath();
        ctx.strokeStyle = 'gray';
        ctx.fillStyle = 'yellow';
        ctx.arc(this.x, this.y, this.radius, 2 * Math.PI, false);
        ctx.fill();

        // Draw target crosshair
        const crossSize = 5;
        ctx.beginPath();
        ctx.strokeStyle = 'lightgreen';
        ctx.moveTo(this.targetX - crossSize, this.targetY - crossSize);
        ctx.lineTo(this.targetX + crossSize, this.targetY + crossSize);
        ctx.stroke();

        ctx.moveTo(this.targetX + crossSize, this.targetY - crossSize);
        ctx.lineTo(this.targetX - crossSize, this.targetY + crossSize);
        ctx.stroke();
    }
}
