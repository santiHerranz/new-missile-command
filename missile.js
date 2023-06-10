
class Missile {

    constructor(pos, target, speed) {

        this.radius = 3;
        this.speed = speed;

        this.originX = pos.x;
        this.originY = pos.y;

        this.x = pos.x;
        this.y = pos.y;

        this.targetX = target.x;
        this.targetY = target.y;

        this.angle = -Math.atan2(this.originX -this.targetX, this.originY - this.targetY) - Math.PI/2;

        this.live = Missile.LIVE;
    }


    step(dt) {


        this.x += dt*this.speed * Math.cos(this.angle);
        this.y += dt*this.speed * Math.sin(this.angle);


        var dx = this.targetX - this.x;
        var dy = this.targetY - this.y;

        var distanceToTarget = Math.sqrt(dx * dx + dy * dy);

        if ( this.distanceToTarget == null)
            this.distanceToTarget = distanceToTarget;

        if (distanceToTarget > this.distanceToTarget) {
            this.x = this.targetX;
            this.y = this.targetY;
            this.live = 0;
        }

        this.distanceToTarget = distanceToTarget;

    }

    draw(ctx) {

        ctx.beginPath();
        ctx.strokeStyle = 'gray';
        ctx.fillStyle = 'yellow';
        ctx.arc(this.x,this.y,this.radius,2*Math.PI,false);
        ctx.fill();
        // ctx.stroke();

        let crossSize = 5;

        ctx.beginPath();
        ctx.strokeStyle = 'lightgreen';
        ctx.moveTo(this.targetX-crossSize, this.targetY-crossSize);
        ctx.lineTo(this.targetX+crossSize, this.targetY+crossSize);
        ctx.stroke();
    
        ctx.moveTo(this.targetX+crossSize, this.targetY-crossSize);
        ctx.lineTo(this.targetX-crossSize, this.targetY+crossSize);
        ctx.stroke();
            
    }
}

Missile.LIVE = 100;
