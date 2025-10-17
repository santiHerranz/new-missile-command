/**
 * Focus class for auto mode targeting visualization
 */
export class Focus {
    constructor(tower, id, x, y, vx, vy) {
        this.tower = tower;
        this.id = id;
        this.radius = 15;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
    }

    /**
     * Draw the focus indicator on canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = 'lightblue';
        ctx.fillStyle = 'transparent';
        ctx.arc(this.x, this.y, this.radius, 2 * Math.PI, false);
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.beginPath();
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "white";
        ctx.font = "12px Verdana";
        ctx.fillText(this.tower.id, this.x + 3, this.y + 25);
        ctx.restore();
    }
}
