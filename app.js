
var width, height;
var ctx;
var canvas;

const PLAYER = 1;
const OTHER = 2;
const CITY = 3;

const GAME_STOP = 0;
const GAME_RUNNING = 1;
const GAME_OVER= 2;

const GAME_LEVEL_INIT = 1;

const GAME_MODE_MANUAL = 'MANUAL';
const GAME_MODE_AUTO = 'AUTO';
const GAME_SHOW_FOCUS = false;
const RELOAD_TIME_MS = 1000;

const GAME_FPS = 60/500; // 60/1000

var game = {
    version: 0.2,
    status:GAME_RUNNING,
    level:GAME_LEVEL_INIT,
    mode: GAME_MODE_AUTO
};

var conf = {
    ASTEROID_SPEED: 10,
    ASTEROID_SPEED_MAX: 60,
    MISSILE_SPEED: 50,
    SCORE_BASE:25
};
var score = {};

var cities = [];
var asteroids = [];
var missiles = [];
var explosions = [];

var asteroidsWave = [];
var cadence = 0;
const CADENCE_TIME = 3;

var targetFocus = [];
var targetIds = [];

var targetArea = {top:0, bottom:0};


function init() {

	// start & score
	modalEl = document.getElementById( 'modalEl' );
	scoreEl = document.getElementById( 'scoreEl' );
	levelEl = document.getElementById( 'levelEl' );
	scoreBigEl = document.getElementById( 'scoreBigEl' );
	modalEl.style.display = 'none';    
	modalMenu.style.display = 'none';    


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

    targetArea.top = height*2/8;
    targetArea.bottom = height*5/8;


	cities = [];
	missiles = [];
	asteroids = [];
    explosions = [];
        
    // create cities and defense towers
    cities.push(new Tower({x:width*1/10,y:height*9/10},RELOAD_TIME_MS));
    cities.push(new City({x:width*2/10,y:height*9/10}));
    cities.push(new City({x:width*3/10,y:height*9/10}));
    cities.push(new City({x:width*4/10,y:height*9/10}));
    cities.push(new Tower({x:width*5/10,y:height*9/10},RELOAD_TIME_MS));
    cities.push(new City({x:width*6/10,y:height*9/10}));
    cities.push(new City({x:width*7/10,y:height*9/10}));
    cities.push(new City({x:width*8/10,y:height*9/10}));
    cities.push(new Tower({x:width*9/10,y:height*9/10},RELOAD_TIME_MS));

	score = { points: 0, missiles: 0 };

    initLevel(GAME_LEVEL_INIT);
    game.status = GAME_RUNNING;

}

function initLevel(level) {

    game.level = level;

    while (asteroidsWave.length < game.level*1) {
        // create new asteroid
        var origin = {x: Math.random()*width, y:height*1/10};

        var num = Math.floor(Math.random() * cities.length);
        var target = cities[num];
        //var dest = {x:width/2 + (Math.random()-0.5)* width, y:height}; 
        var dest = {x:target.x, y:target.y}; 


        var levelSpeed = conf.ASTEROID_SPEED * (1+game.level/10);

        levelSpeed = levelSpeed + levelSpeed*(Math.random()-0.5)

        if (levelSpeed > conf.ASTEROID_SPEED_MAX) levelSpeed = conf.ASTEROID_SPEED_MAX;
        if (levelSpeed < conf.ASTEROID_SPEED) levelSpeed = conf.ASTEROID_SPEED;

        var asteroid = new Asteroid( origin, dest, levelSpeed);

        // add to asteroid wave
        asteroidsWave.push(asteroid);

        // limit the asteroid wave
        if (asteroidsWave.length > 100) break;
    }


    // clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0,0,width,height);
    ctx.stroke();    
}



// game loop

function loop() {
	if (game.status == GAME_RUNNING) 
        step(GAME_FPS);    // 1000

    if (game.status == GAME_STOP) 
        modalMenu.style.display = 'flex';


    draw(ctx);
    window.requestAnimationFrame(loop);
}





function step(dt) {

    game.dt = dt;


    // clear dead objects
    asteroids = asteroids.filter(asteroid => asteroid.live > 0);
    missiles = missiles.filter(missile => missile.live > 0);
    explosions = explosions.filter(explosion => explosion.live > 0);
    // cities = cities.filter(city => city.live > 0);
        

    cadence += dt;
    if ((asteroids.length == 0 || cadence > CADENCE_TIME*10/game.level) &&  asteroidsWave.length>0) {
        var asteroid = asteroidsWave.pop();
        asteroids.push(asteroid);
        cadence = 0;
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
                    //explosions.push(new Explosion(OTHER, {x:asteroid.x,y:asteroid.y}));
    
                    city.damage(100);
    
                    if (city.live < 1){
                        explosions.push(new Explosion(CITY, {x:city.x,y:city.y}));
                    }
    
                }
            } 
		});
	});    




    // Game over when no cities are alive
	if(cities.filter(city => city instanceof Tower == false && city.live>0).length==0) {

        var towers = cities.filter(city => city instanceof Tower && city.live > 0 );

        towers.forEach(tower => {
            explosions.push(new Explosion(CITY, {x:tower.x,y:tower.y}));
            tower.live = 0;
        });


        setTimeout( function() {
            gameOver();    
        }, 800);

    }
        
    if (asteroids.length == 0 && explosions.length == 0) {
        initLevel(game.level + 1);
        targetFocus = [];
    }



    if (game.mode == GAME_MODE_AUTO) {


        // keep only remain targets of remain asteroids
        var remainAsteroids = [];
        asteroids.forEach(asteroid => {
            var asteroidId = getAsteroidId(asteroid);
            remainAsteroids.push(asteroidId);
        });
        targetIds = targetIds.filter(id => remainAsteroids.filter( id2 => id2 == id ).length > 0 );



        if (missiles.length == 0) targetIds = [];

        var towers = cities.filter(city => city instanceof Tower && city.live > 0 );

        for(var j=0; j< towers.length; j++) {

            var tower = towers[j];


            // Order asteroids by distance from this tower

            var sortedAsteroids = sortByDistance(tower,asteroids);

            for(var i=0; i< sortedAsteroids.length; i++) {

                var target = asteroids[i];
                var targetId = getAsteroidId(target);

                if (i==0) {
                    tower.headingTarget = -Math.atan2(tower.x - target.x, tower.y - target.y) + Math.PI/4 +Math.PI;
                }

                // if (! tower.isReady()) continue

                if (targetIds.filter( t => targetId == t).length == 1) continue;

                


                if (missiles.length < 100) { // asteroids.length

                    var pos = intercept({x:tower.x, y:tower.y}, {x:target.x, y:target.y, vx: target.vx, vy:target.vy}, conf.MISSILE_SPEED*game.dt);

           
                    if (pos == null) continue;

                    // add explosion distance
                    let explosionDist = 80;
                    pos = {x: pos.x+explosionDist*Math.cos(target.angle), y: pos.y+explosionDist*Math.sin(target.angle)};

                    //if (pos.y < limitTop && pos.y > limitBottom) continue;

                    if (pos.y > targetArea.top && pos.y < targetArea.bottom) {

                        if (tower.isReady()) {
                            tower.shot();

                            // create missile
                            var missile = new Missile( {x:tower.x,y:tower.y}, {x:pos.x, y:pos.y}, conf.MISSILE_SPEED);
                            score.missiles += 1;
                        
                            // add to missile stack
                            missiles.push(missile);
    
                            targetIds.push(targetId);

                            targetFocus.push(new Focus(tower, targetId, target.x, target.y, target.vx, target.vy));

                        } 

                    }

                }
        
            }
        }

    }


}




function draw(ctx) {

    // clear canvas
    // ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
    // ctx.fillRect(0,0,width,height);
    // // ctx.stroke();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.setLineDash([]);
    ctx.lineWidth = 2;


    // Ground
    ctx.fillStyle = 'rgba(120, 80, 20, 0.5)';
    ctx.fillRect(0,height*9/10,width,5);
    ctx.stroke();    


    if (game.mode == GAME_MODE_AUTO) {
        ctx.strokeStyle = 'rgba(50, 50, 50, 0.1)';
//        ctx.fillRect(0,targetArea.top,width,targetArea.bottom-targetArea.top);
        ctx.moveTo(0, targetArea.bottom);
        ctx.lineTo(width, targetArea.bottom);
        ctx.moveTo(0, targetArea.top);
        ctx.lineTo(width, targetArea.top);
        ctx.stroke();

        ctx.stroke();    
    }

    // canvas text
    ctx.beginPath()
    ctx.textAlign = 'center';
    ctx.font = '14px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('DEMO v'+ game.version, width - 60, 20);
    ctx.stroke();


    // draw cities
    cities.forEach(city => { city.draw(ctx); });

    // draw asteroids
    asteroids.forEach(asteroid => { asteroid.draw(ctx); });

    // draw missiles
    missiles.forEach(missile => { missile.draw(ctx); });

    // draw explosions
    explosions.forEach(explosion => { explosion.draw(ctx); });

    // draw focus
    if (GAME_SHOW_FOCUS)
        targetFocus.forEach(item => { item.draw(ctx); });


    scoreEl.innerHTML = score.points;
    levelEl.innerHTML = game.level; // +' '+ targetIds;
    autoBtn.innerHTML = game.mode;


}


init();
loop();



function gameOver() {
	game.status = GAME_OVER;
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

pauseBtn.addEventListener('click', () => {
    game.status = (game.status != GAME_RUNNING?GAME_RUNNING:GAME_STOP);
});
resumeBtn.addEventListener('click', () => {
	modalMenu.style.display = 'none';    
    game.status = (game.status != GAME_RUNNING?GAME_RUNNING:GAME_STOP);
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





// TODO Order asteroids by distance from the tower
function sortByDistance(tower, asteroids) {

    return asteroids.sort(function ( a, b ) {

        var A1 = getDist(a.target,tower);
        var B1 = getDist(b.target,tower);

        var A2 = getDist(a,tower);
        var B2 = getDist(b,tower);

        var A = A1 * 0.5 + A2 *0.5;
        var B = B1 * 0.5 + B2 *0.5;

        if ( A < B)
        return -1;
     if (A > B)
       return 1;
     return 0;
    });
}



  





function getAsteroidId(target) {
    return target.target.x.toFixed(2) +'-'+ target.target.y.toFixed(2) +'-'+ target.angle.toFixed(2);    
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