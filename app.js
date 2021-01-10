
var width, height;
var ctx;
var canvas;

const PLAYER = 1;
const OTHER = 2;
const CITY = 3;

const GAME_STOP = 0;
const GAME_RUNNING = 1;
const GAME_LEVEL_INIT = 1;

const GAME_MODE_MANUAL = 'MANUAL';
const GAME_MODE_AUTO = 'AUTO';

var game = {
    status:GAME_RUNNING,
    level:GAME_LEVEL_INIT,
    mode: GAME_MODE_AUTO
};

var conf = {
    ASTEROID_SPEED: 40,
    MISSILE_SPEED: 200,
    SCORE_BASE:25
};
var score = {};

var cities = [];
var asteroids = [];
var missiles = [];
var explosions = [];

var asteroidsWave = [];


var targetIds = [];

var limitTop = 0;
var limitBottom = 0;


function init() {

	// start & score
	modalEl = document.getElementById( 'modalEl' );
	scoreEl = document.getElementById( 'scoreEl' );
	levelEl = document.getElementById( 'levelEl' );
	scoreBigEl = document.getElementById( 'scoreBigEl' );
	modalEl.style.display = 'none';    


    canvas = document.getElementById("game-canvas");

    var canvasRatio = canvas.height / canvas.width;
    var windowRatio = window.innerHeight / window.innerWidth;

    if (windowRatio < canvasRatio) {
        height = window.innerHeight;
        width = height / canvasRatio;
    } else {
        width = window.innerWidth;
        height = width * canvasRatio;
    }

    canvas.width  = width;
    canvas.height = height;

    ctx = canvas.getContext("2d");

    limitTop = height*2/8;
    limitBottom = height*6/8;


	cities = [];
	missiles = [];
	asteroids = [];
    explosions = [];
        
    // create cities and defense towers
    cities.push(new Tower({x:width*1/10,y:height-30}));
    cities.push(new City({x:width*2/10,y:height-30}));
    cities.push(new City({x:width*3/10,y:height-30}));
    cities.push(new City({x:width*4/10,y:height-30}));
    cities.push(new Tower({x:width*5/10,y:height-30}));
    cities.push(new City({x:width*6/10,y:height-30}));
    cities.push(new City({x:width*7/10,y:height-30}));
    cities.push(new City({x:width*8/10,y:height-30}));
    cities.push(new Tower({x:width*9/10,y:height-30}));

	score = { points: 0, missiles: 0 };

    initLevel(GAME_LEVEL_INIT);
    game.status = GAME_RUNNING;

}

function initLevel(level) {

    game.level = level;

    while (asteroidsWave.length < game.level*2) {
        // create new asteroid
        var origin = {x: Math.random()*width, y:height*1/10};

        var num = Math.floor(Math.random() * cities.length);
        var target = cities[num];
        //var dest = {x:width/2 + (Math.random()-0.5)* width, y:height}; 
        var dest = {x:target.x, y:height}; 
        var asteroid = new Asteroid( origin, dest, conf.ASTEROID_SPEED);

        // add to asteroid wave
        asteroidsWave.push(asteroid);

        if (asteroidsWave.length > 200) break;
    }
}



// game loop

function loop() {
	if (game.status == GAME_RUNNING) 
        step(60/1000);    
    draw(ctx);
    window.requestAnimationFrame(loop);
}

function step(dt) {

    game.dt = dt;

    while (asteroidsWave.length>0) {
        var asteroid = asteroidsWave.pop();
        asteroids.push(asteroid);
    }
    

    // calculate next state 
    asteroids.forEach(asteroid => { asteroid.step(dt); });
    missiles.forEach(missile => { missile.step(dt); });
    explosions.forEach(explosion => { explosion.step(dt); });
    cities.forEach(city => { city.step(dt); });

    
    missiles.forEach( function(missile) { 
        if (missile.live == 0)
            explosions.push(new Explosion(PLAYER, {x:missile.x,y:missile.y}));
     });

     asteroids.forEach( function(asteroid) { 
        if (asteroid.live == 0)
            explosions.push(new Explosion(OTHER, {x:asteroid.x,y:asteroid.y}));
     });


    // explosion-asteroid interaction
    asteroids.forEach(asteroid => {
        explosions.forEach(explosion => {
            if ( explosion.collide( asteroid)) {
                asteroid.live = 0;

                var newScore = conf.SCORE_BASE + (explosion.score!=null?explosion.score:0);
                if (explosion.owner != PLAYER)
                    newScore = 0;

                explosions.push(new Explosion(explosion.owner, {x:asteroid.x,y:asteroid.y}, newScore));
                score.points += newScore;
            }
        });
    });


	// cities-asteroid interaction
	asteroids.forEach(asteroid => {
		cities.forEach( city => {
            if (city.live > 0) {
                if (asteroid.collide(city)) {

                    asteroid.live = 0;
                    explosions.push(new Explosion(OTHER, {x:asteroid.x,y:asteroid.y}));
    
                    city.damage(100);
    
                    if (city.live < 1)
                        explosions.push(new Explosion(CITY, {x:city.x,y:city.y}));
    
                }
            } 
		});
	});    

    // clear dead objects
    asteroids = asteroids.filter(asteroid => asteroid.live > 0);
    missiles = missiles.filter(missile => missile.live > 0);
    explosions = explosions.filter(explosion => explosion.live > 0);
    // cities = cities.filter(city => city.live > 0);


	if(cities.filter(city => city.live>0).length==0)
        gameOver();    
        
    if (asteroids.length == 0 && explosions.length == 0)
        initLevel(game.level + 1);



    if (game.mode == GAME_MODE_AUTO) {

        // keep only remain targets of remain asteroids
        var remainAsteroids = [];
        asteroids.forEach(asteroid => {
            var asteroidId = getAsteroidId(asteroid);
            remainAsteroids.push(asteroidId);
        });
        targetIds = targetIds.filter(id => remainAsteroids.filter( id2 => id2 == id ).length > 0 );

        if (missiles.length == 0) targetIds = [];

        var towers = cities.filter(city => city instanceof Tower && city.live > 0);

        if (towers.length > 0) {

            for(var i=0; i< asteroids.length; i++) {

                var tower = towers[Math.floor(Math.random()*towers.length)];

                var target = asteroids[i];
                var targetId = getAsteroidId(asteroids[i]);
    
                if (targetIds.filter( t => targetId == t).length == 1) continue;

                if (missiles.length < 100) { // asteroids.length

                    var pos = intercept({x:tower.x, y:tower.y}, {x:target.x, y:target.y, vx: target.vx, vy:target.vy}, conf.MISSILE_SPEED*game.dt);

           
                    if (pos == null) continue;

                    // add explosion distance
                    let explosionDist = 80;
                    pos = {x: pos.x+explosionDist*Math.cos(target.angle), y: pos.y+explosionDist*Math.sin(target.angle)};

                    //if (pos.y < limitTop && pos.y > limitBottom) continue;

                    if (pos.y > limitTop && pos.y < limitBottom) {

                        if (tower.isReady()) {
                            tower.shot();

                            // create missile
                            var missile = new Missile( {x:tower.x,y:tower.y}, {x:pos.x, y:pos.y}, conf.MISSILE_SPEED);
                            score.missiles += 1;
                        
                            // add to missile stack
                            missiles.push(missile);
    
                            targetIds.push(targetId);
                        }
                    }

                }
        
            }
        }

    }


}




function draw(ctx) {

    // clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0,width,height);
    ctx.stroke();

    if (game.mode == GAME_MODE_AUTO) {
        ctx.fillStyle = '#030301';
        ctx.fillRect(0,limitTop,width,limitBottom-limitTop);
        ctx.stroke();    
    }

    // canvas text
    ctx.beginPath()
    ctx.textAlign = 'center';
    ctx.font = '14px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('DEMO v0.1', width - 60, 20);
    ctx.stroke();


    // draw cities
    cities.forEach(city => { city.draw(ctx); });

    // draw asteroids
    asteroids.forEach(asteroid => { asteroid.draw(ctx); });

    // draw missiles
    missiles.forEach(missile => { missile.draw(ctx); });

    // draw explosions
    explosions.forEach(explosion => { explosion.draw(ctx); });


    scoreEl.innerHTML = score.points;
    levelEl.innerHTML = game.level; // +' '+ targetIds;
    autoBtn.innerHTML = game.mode;


}


init();
loop();



function gameOver() {
	game.status = GAME_STOP;
	scoreBigEl.innerHTML = score.points; // +' ('+ score.missiles +')';
	modalEl.style.display = 'flex';
}

canvas.addEventListener('click', function(e) {

    var playerDestX = e.pageX + this.offsetLeft;
    var playerDestY = e.pageY + this.offsetTop;

    //console.log('player point at x:'+ playerDestX +' y:'+ playerDestY);


    var tower = getTower(cities,playerDestX);

    if (tower != null) {

        tower.shot();

        // create missile
        var missile = new Missile( {x:tower.x,y:tower.y}, {x:playerDestX, y:playerDestY}, conf.MISSILE_SPEED);

        // add to missile stack
        missiles.push(missile);

        score.missiles += 1;

    }


});

gameBtn.addEventListener('click', () => {
	init();
});

autoBtn.addEventListener('click', () => {
    game.mode = (game.mode != GAME_MODE_MANUAL?GAME_MODE_MANUAL:GAME_MODE_AUTO);
});

// INPUT



function onkeydown(evt) {
    var code = evt.keyCode;
    
	if (code == KEY.ESPACE ) input.espace = true;

}


function onkeyup(evt) {
    var code = evt.keyCode;

    if (code == KEY.ESPACE ) input.espace = false;
    
    if (code == KEY.ESPACE ) {
        game.mode = (game.mode != GAME_MODE_MANUAL?GAME_MODE_MANUAL:GAME_MODE_AUTO);
    }
}



window.addEventListener( 'keydown', onkeydown );
window.addEventListener( 'keyup', onkeyup );















function getAsteroidId(target) {
    return target.targetX.toFixed(2) +'-'+ target.targetY.toFixed(2) +'-'+ target.angle.toFixed(2);    
}



function getTower(cities,playerX) {

    var towers = cities.filter(item => item instanceof Tower && item.live > 0 && item.isReady());

    var tower = null;

    var minDist = Infinity;

    for (var i=0; i<towers.length;i++) {

        var dist = getDist(towers[i], {x:playerX,y:0});

        if ( dist < minDist ) {
            tower = towers[i];
            minDist = dist;
        }
    };

    return tower;
}


function getDist(a,b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);    
}











// https://stackoverflow.com/questions/2248876/2d-game-fire-at-a-moving-target-by-predicting-intersection-of-projectile-and-u

/**
 * Return the firing solution for a projectile starting at 'src' with
 * velocity 'v', to hit a target, 'dst'.
 *
 * @param Object src position of shooter
 * @param Object dst position & velocity of target
 * @param Number v   speed of projectile
 * @return Object Coordinate at which to fire (and where intercept occurs)
 *
 * E.g.
 * >>> intercept({x:2, y:4}, {x:5, y:7, vx: 2, vy:1}, 5)
 * = {x: 8, y: 8.5}
 */
function intercept(src, dst, v) {
	var tx = dst.x - src.x,
		ty = dst.y - src.y,
		tvx = dst.vx,
		tvy = dst.vy;
  
	// Get quadratic equation components
	var a = tvx*tvx + tvy*tvy - v*v;
	var b = 2 * (tvx * tx + tvy * ty);
	var c = tx*tx + ty*ty;    
  
	// Solve quadratic
	var ts = quad(a, b, c); // See quad(), below
  
	// Find smallest positive solution
	var sol = null;
	if (ts) {
	  var t0 = ts[0], t1 = ts[1];
	  var t = Math.min(t0, t1);
	  if (t < 0) t = Math.max(t0, t1);    
	  if (t > 0) {
		sol = {
		  x: dst.x + dst.vx*t,
		  y: dst.y + dst.vy*t
		};
	  }
	}
  
	return sol;
  }
  
  
  /**
   * Return solutions for quadratic
   */
  function quad(a,b,c) {
	var sol = null;
	if (Math.abs(a) < 1e-6) {
	  if (Math.abs(b) < 1e-6) {
		sol = Math.abs(c) < 1e-6 ? [0,0] : null;
	  } else {
		sol = [-c/b, -c/b];
	  }
	} else {
	  var disc = b*b - 4*a*c;
	  if (disc >= 0) {
		disc = Math.sqrt(disc);
		a = 2*a;
		sol = [(-b-disc)/a, (-b+disc)/a];
	  }
	}
	return sol;
  }