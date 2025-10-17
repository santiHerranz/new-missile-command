/**
 * City class - represents cities that need to be defended
 */
export class City {
    static LIVE = 100;

    /**
     * Create a new city
     * @param {Object} pos - Position {x, y}
     */
    constructor(pos) {
        this.x = pos.x;
        this.y = pos.y - 20;

        this.color = 'green';
        this.radius = 20;
        this.width = 20;
        this.height = 20;

        this.live = City.LIVE;
    }

    /**
     * Update city state
     * @param {number} dt - Delta time
     */
    step(dt) {
        // Cities don't move, but this method is called for consistency
    }

    /**
     * Draw the city on canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.rect(this.x - this.width, this.y, this.width * 2, this.height);
        ctx.fill();
        ctx.stroke();

        // Draw destruction indicator
        if (this.live < 1) {
            ctx.beginPath();
            ctx.strokeStyle = 'black';
            ctx.fillStyle = 'black';
            ctx.arc(this.x, this.y, this.width * 0.8, 2 * Math.PI, false);
            ctx.fill();
            ctx.stroke();
        }
    }

    /**
     * Apply damage to the city
     * @param {number} value - Damage amount
     */
    damage(value) {
        this.live -= value;
    }
}
