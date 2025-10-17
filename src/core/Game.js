import { 
    GAME_STOP, 
    GAME_RUNNING, 
    GAME_OVER, 
    GAME_LEVEL_INIT, 
    GAME_MODE_MANUAL, 
    GAME_MODE_AUTO,
    PLAYER,
    OTHER,
    CITY
} from '../constants/gameStates.js';
import { GAME_CONFIG, PHYSICS_CONFIG, UI_CONFIG } from '../constants/config.js';
import { Asteroid } from '../entities/Asteroid.js';
import { City as CityEntity } from '../entities/City.js';
import { Tower } from '../entities/Tower.js';
import { Missile } from '../entities/Missile.js';
import { Explosion } from '../entities/Explosion.js';
import { InputHandler } from '../ui/InputHandler.js';
import { SettingsPanel } from '../ui/SettingsPanel.js';
import { HighScorePanel } from '../ui/HighScorePanel.js';
import { StorageManager } from '../utils/StorageManager.js';
import { GameObjectPools } from '../utils/ObjectPool.js';
import { ParticleSystem } from '../entities/ParticleSystem.js';
import { getDist, intercept } from '../utils/physics.js';
import { checkCollision, sortByDistance } from '../utils/collision.js';
import { Focus } from '../entities/Focus.js';

/**
 * Main game class
 */
export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 0;
        this.height = 0;

        // Game state
        this.game = {
            version: GAME_CONFIG.VERSION,
            status: GAME_RUNNING,
            level: GAME_LEVEL_INIT,
            mode: GAME_MODE_AUTO,
            dt: 0
        };

        // Game objects
        this.cities = [];
        this.asteroids = [];
        this.missiles = [];
        this.explosions = [];
        this.asteroidsWave = [];
        this.targetFocus = [];
        this.targetIds = [];

        // Game configuration
        this.conf = {
            ASTEROID_SPEED: PHYSICS_CONFIG.ASTEROID_SPEED,
            ASTEROID_SPEED_MAX: PHYSICS_CONFIG.ASTEROID_SPEED_MAX,
            MISSILE_SPEED: PHYSICS_CONFIG.MISSILE_SPEED,
            EXPLOSION_LEAD_DISTANCE: PHYSICS_CONFIG.EXPLOSION_LEAD_DISTANCE,
            SCORE_BASE: GAME_CONFIG.SCORE_BASE
        };

        // Score
        this.score = { points: 0, missiles: 0 };

        // Timing
        this.cadence = 0;
        this.CADENCE_TIME = GAME_CONFIG.CADENCE_TIME;

        // Target area
        this.targetArea = { top: 0, bottom: 0 };

        // Input handler
        this.inputHandler = new InputHandler();

        // UI panels
        this.settingsPanel = new SettingsPanel(this);
        this.highScorePanel = new HighScorePanel();

        // Performance systems
        this.objectPools = new GameObjectPools();
        this.particleSystem = new ParticleSystem();

        // UI elements
        this.modalEl = null;
        this.scoreEl = null;
        this.levelEl = null;
        this.scoreBigEl = null;
        this.modalMenu = null;
        this.autoBtn = null;
        this.pauseBtn = null;
        this.gameBtn = null;
        this.resumeBtn = null;
        this.settingsBtn = null;
        this.highScoresBtn = null;

        // Load settings
        this.loadSettings();
    }

    /**
     * Initialize the game
     */
    init() {
        this.setupUI();
        this.setupCanvas();
        this.setupGameObjects();
        this.setupEventListeners();
        this.game.status = GAME_RUNNING;
    }

    /**
     * Setup UI elements
     */
    setupUI() {
        this.modalEl = document.getElementById('modalEl');
        this.scoreEl = document.getElementById('scoreEl');
        this.levelEl = document.getElementById('levelEl');
        this.scoreBigEl = document.getElementById('scoreBigEl');
        this.modalMenu = document.getElementById('modalMenu');
        this.autoBtn = document.getElementById('autoBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.gameBtn = document.getElementById('gameBtn');
        this.resumeBtn = document.getElementById('resumeBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.highScoresBtn = document.getElementById('highScoresBtn');

        // Debug logs
        console.log('UI Elements found:');
        console.log('autoBtn:', this.autoBtn);
        console.log('pauseBtn:', this.pauseBtn);
        console.log('settingsBtn:', this.settingsBtn);
        console.log('highScoresBtn:', this.highScoresBtn);

        if (this.modalEl) this.modalEl.style.display = 'none';
        if (this.modalMenu) this.modalMenu.style.display = 'none';
    }

    /**
     * Setup canvas dimensions
     */
    setupCanvas() {
        const canvasRatio = this.canvas.height / this.canvas.width;
        const windowRatio = window.innerHeight / window.innerWidth;

        if (windowRatio < canvasRatio) {
            this.height = window.innerHeight;
            this.width = this.height / canvasRatio;
        } else {
            this.width = window.innerWidth;
            this.height = this.width * canvasRatio;
        }

        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.targetArea.top = this.height * UI_CONFIG.TARGET_AREA_TOP_RATIO;
        this.targetArea.bottom = this.height * UI_CONFIG.TARGET_AREA_BOTTOM_RATIO;
    }

    /**
     * Setup initial game objects
     */
    setupGameObjects() {
        this.cities = [];
        this.missiles = [];
        this.asteroids = [];
        this.explosions = [];
        this.asteroidsWave = [];
        this.targetFocus = [];
        this.targetIds = [];
        this.debugIntercepts = [];

        // Create cities and defense towers
        this.cities.push(new Tower({ x: this.width * 1 / 10, y: this.height * 9 / 10 }, 1000));
        this.cities.push(new CityEntity({ x: this.width * 2 / 10, y: this.height * 9 / 10 }));
        this.cities.push(new CityEntity({ x: this.width * 3 / 10, y: this.height * 9 / 10 }));
        this.cities.push(new CityEntity({ x: this.width * 4 / 10, y: this.height * 9 / 10 }));
        this.cities.push(new Tower({ x: this.width * 5 / 10, y: this.height * 9 / 10 }, 1000));
        this.cities.push(new CityEntity({ x: this.width * 6 / 10, y: this.height * 9 / 10 }));
        this.cities.push(new CityEntity({ x: this.width * 7 / 10, y: this.height * 9 / 10 }));
        this.cities.push(new CityEntity({ x: this.width * 8 / 10, y: this.height * 9 / 10 }));
        this.cities.push(new Tower({ x: this.width * 9 / 10, y: this.height * 9 / 10 }, 1000));

        this.score = { points: 0, missiles: 0 };
        this.initLevel(GAME_LEVEL_INIT);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Canvas click for manual firing
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        // Button events
        if (this.gameBtn) {
            this.gameBtn.addEventListener('click', () => this.init());
        }

        if (this.autoBtn) {
            console.log('Adding click listener to autoBtn');
            this.autoBtn.addEventListener('click', () => {
                console.log('Auto button clicked');
                this.toggleMode();
            });
        }

        if (this.pauseBtn) {
            console.log('Adding click listener to pauseBtn');
            this.pauseBtn.addEventListener('click', () => {
                console.log('Pause button clicked');
                this.togglePause();
            });
        }

        if (this.resumeBtn) {
            console.log('Adding click listener to resumeBtn');
            this.resumeBtn.addEventListener('click', () => {
                console.log('Resume button clicked');
                this.resume();
            });
        }

        if (this.settingsBtn) {
            console.log('Adding click listener to settingsBtn');
            this.settingsBtn.addEventListener('click', () => {
                console.log('Settings button clicked');
                this.settingsPanel.toggle();
            });
        }

        if (this.highScoresBtn) {
            console.log('Adding click listener to highScoresBtn');
            this.highScoresBtn.addEventListener('click', () => {
                console.log('High scores button clicked');
                this.highScorePanel.toggle();
            });
        }

        // Keyboard events
        window.addEventListener('keyup', (evt) => this.handleKeyUp(evt));
    }

    /**
     * Handle canvas click for manual firing
     * @param {MouseEvent} e - Mouse event
     */
    handleCanvasClick(e) {
        // Get canvas position relative to viewport
        const rect = this.canvas.getBoundingClientRect();
        const playerDestX = e.clientX - rect.left;
        const playerDestY = e.clientY - rect.top;

        console.log('Click at:', playerDestX, playerDestY); // Debug log

        const tower = this.getTower(this.cities, playerDestX);

        if (tower != null) {
            console.log('Tower found:', tower); // Debug log

            // Determine if click is targeting a nearby asteroid
            let closest = null;
            let minD = Infinity;
            for (let k = 0; k < this.asteroids.length; k++) {
                const a = this.asteroids[k];
                const d = getDist({ x: playerDestX, y: playerDestY }, a);
                if (d < minD) { minD = d; closest = a; }
            }

            let finalTarget = { x: playerDestX, y: playerDestY };

            // If click is close to an asteroid, compute intercept lead
            const CLICK_TARGET_RADIUS = 40;
            if (closest && minD <= CLICK_TARGET_RADIUS) {
                const pos = intercept(
                    { x: tower.x, y: tower.y },
                    { x: closest.x, y: closest.y, vx: closest.vx, vy: closest.vy },
                    this.conf.MISSILE_SPEED * this.game.dt
                );
                if (pos) {
                    const explosionDist = this.conf.EXPLOSION_LEAD_DISTANCE;
                    finalTarget = {
                        x: pos.x + explosionDist * Math.cos(closest.angle),
                        y: pos.y + explosionDist * Math.sin(closest.angle)
                    };

                    // Aim the tower visually towards the computed intercept
                    tower.headingTarget = -Math.atan2(tower.x - finalTarget.x, tower.y - finalTarget.y) + Math.PI / 4 + Math.PI;

                    // Debug overlay markers
                    if (this.settingsPanel.getSettings().debugIntercept) {
                        this.debugIntercepts.push({ kind: 'point', x: pos.x, y: pos.y, color: 'cyan' });
                        this.debugIntercepts.push({ kind: 'point', x: finalTarget.x, y: finalTarget.y, color: 'yellow' });
                        this.debugIntercepts.push({ kind: 'line', x1: tower.x, y1: tower.y, x2: finalTarget.x, y2: finalTarget.y, color: 'gray' });
                    }
                }
            }

            tower.shot();
            const missile = new Missile(
                { x: tower.x, y: tower.y },
                finalTarget,
                this.conf.MISSILE_SPEED
            );
            this.missiles.push(missile);
            this.score.missiles += 1;
        } else {
            console.log('No tower found'); // Debug log
        }
    }

    /**
     * Handle key up events
     * @param {KeyboardEvent} evt - Keyboard event
     */
    handleKeyUp(evt) {
        const code = evt.keyCode;
        if (code === 32) { // Space key
            this.toggleMode();
        }
    }

    /**
     * Toggle between manual and auto mode
     */
    toggleMode() {
        this.game.mode = (this.game.mode !== GAME_MODE_MANUAL ? GAME_MODE_MANUAL : GAME_MODE_AUTO);
    }

    /**
     * Toggle pause state
     */
    togglePause() {
        this.game.status = (this.game.status !== GAME_RUNNING ? GAME_RUNNING : GAME_STOP);
    }

    /**
     * Resume game
     */
    resume() {
        if (this.modalMenu) this.modalMenu.style.display = 'none';
        this.game.status = (this.game.status !== GAME_RUNNING ? GAME_RUNNING : GAME_STOP);
    }

    /**
     * Initialize a new level
     * @param {number} level - Level number
     */
    initLevel(level) {
        this.game.level = level;

        while (this.asteroidsWave.length < this.game.level * 1) {
            const origin = { x: Math.random() * this.width, y: this.height * 1 / 10 };
            const num = Math.floor(Math.random() * this.cities.length);
            const target = this.cities[num];
            const dest = { x: target.x, y: target.y };

            let levelSpeed = this.conf.ASTEROID_SPEED * (1 + this.game.level / 10);
            levelSpeed = levelSpeed + levelSpeed * (Math.random() - 0.5);

            if (levelSpeed > this.conf.ASTEROID_SPEED_MAX) levelSpeed = this.conf.ASTEROID_SPEED_MAX;
            if (levelSpeed < this.conf.ASTEROID_SPEED) levelSpeed = this.conf.ASTEROID_SPEED;

            const asteroid = new Asteroid(origin, dest, levelSpeed);
            this.asteroidsWave.push(asteroid);

            if (this.asteroidsWave.length > 100) break;
        }

        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.stroke();
    }

    /**
     * Main game step
     * @param {number} dt - Delta time
     */
    step(dt) {
        this.game.dt = dt;

        // Clear dead objects
        this.asteroids = this.asteroids.filter(asteroid => asteroid.live > 0);
        this.missiles = this.missiles.filter(missile => missile.live > 0);
        this.explosions = this.explosions.filter(explosion => explosion.live > 0);

        // Spawn new asteroids
        this.cadence += dt;
        if ((this.asteroids.length === 0 || this.cadence > this.CADENCE_TIME * 10 / this.game.level) && this.asteroidsWave.length > 0) {
            const asteroid = this.asteroidsWave.pop();
            this.asteroids.push(asteroid);
            this.cadence = 0;
        }

        // Update all objects
        this.asteroids.forEach(asteroid => asteroid.step(dt));
        this.missiles.forEach(missile => missile.step(dt));
        this.explosions.forEach(explosion => explosion.step(dt));
        
        this.cities.forEach(city => city.step(dt));
        
        // Update particle system (only if enabled)
        if (this.settingsPanel.getSettings().particleEffects) {
            this.particleSystem.update(dt);
        }

        // Handle missile explosions
        this.missiles.forEach(missile => {
            if (missile.live === 0) {
                this.explosions.push(new Explosion(PLAYER, { x: missile.x, y: missile.y }));
                
                // Add particle effect
                if (this.settingsPanel.getSettings().particleEffects) {
                    this.particleSystem.emitExplosion(missile.x, missile.y, '#0066ff', 8, 1.5);
                }
            }
        });

        // Handle asteroid explosions
        this.asteroids.forEach(asteroid => {
            if (asteroid.live === 0) {
                this.explosions.push(new Explosion(OTHER, { x: asteroid.x, y: asteroid.y }));
                
                // Add particle effect
                if (this.settingsPanel.getSettings().particleEffects) {
                    this.particleSystem.emitExplosion(asteroid.x, asteroid.y, '#ff3300', 12, 2);
                }
            }
        });

        // Handle explosion-asteroid collisions
        this.asteroids.forEach(asteroid => {
            this.explosions.forEach(explosion => {
                if (explosion.collide(asteroid)) {
                    asteroid.live = 0;

                    let newScore = this.conf.SCORE_BASE + (explosion.score != null ? explosion.score : 0);
                    if (explosion.owner !== PLAYER) {
                        newScore = 0;
                    }

                    this.explosions.push(new Explosion(explosion.owner, { x: asteroid.x, y: asteroid.y }, newScore));
                    this.score.points += newScore;
                }
            });
        });

        // Handle city-asteroid collisions
        this.asteroids.forEach(asteroid => {
            this.cities.forEach(city => {
                if (city.live > 0) {
                    if (asteroid.collide(city)) {
                        asteroid.live = 0;
                        city.damage(100);

                        if (city.live < 1) {
                            this.explosions.push(new Explosion(CITY, { x: city.x, y: city.y }));
                            
                            // Add city destruction particles
                            if (this.settingsPanel.getSettings().particleEffects) {
                                this.particleSystem.emitCityDestruction(city.x, city.y, 15);
                            }
                        }
                    }
                }
            });
        });

        // Check game over condition
        if (this.cities.filter(city => city instanceof Tower === false && city.live > 0).length === 0) {
            const towers = this.cities.filter(city => city instanceof Tower && city.live > 0);

        towers.forEach(tower => {
            this.explosions.push(new Explosion(CITY, { x: tower.x, y: tower.y }));
            tower.live = 0;
            
            // Add tower destruction particles
            if (this.settingsPanel.getSettings().particleEffects) {
                this.particleSystem.emitCityDestruction(tower.x, tower.y, 10);
            }
        });

            setTimeout(() => {
                this.gameOver();
            }, 800);
        }

        // Check level completion
        if (this.asteroids.length === 0 && this.explosions.length === 0) {
            this.initLevel(this.game.level + 1);
            this.targetFocus = [];
        }

        // Auto mode logic
        if (this.game.mode === GAME_MODE_AUTO) {
            this.handleAutoMode();
        }
    }

    /**
     * Handle auto mode logic
     */
    handleAutoMode() {
        // Keep only remaining targets of remaining asteroids
        const remainAsteroids = [];
        this.asteroids.forEach(asteroid => {
            const asteroidId = this.getAsteroidId(asteroid);
            remainAsteroids.push(asteroidId);
        });
        this.targetIds = this.targetIds.filter(id => remainAsteroids.filter(id2 => id2 === id).length > 0);

        if (this.missiles.length === 0) this.targetIds = [];

        const towers = this.cities.filter(city => city instanceof Tower && city.live > 0);

        for (let j = 0; j < towers.length; j++) {
            const tower = towers[j];
            const sortedAsteroids = sortByDistance(tower, this.asteroids);

            for (let i = 0; i < sortedAsteroids.length; i++) {
                const target = sortedAsteroids[i];
                const targetId = this.getAsteroidId(target);

                if (this.targetIds.filter(t => targetId === t).length === 1) continue;

                if (this.missiles.length < 100) {
                    const pos = intercept(
                        { x: tower.x, y: tower.y },
                        { x: target.x, y: target.y, vx: target.vx, vy: target.vy },
                        this.conf.MISSILE_SPEED * this.game.dt
                    );

                    if (pos == null) {
                        // If we cannot compute an intercept, at least aim at current target
                        if (i === 0) {
                            tower.headingTarget = -Math.atan2(tower.x - target.x, tower.y - target.y) + Math.PI / 4 + Math.PI;
                        }
                        continue;
                    }

                    // Add explosion distance along target direction to compensate for blast radius
                    const explosionDist = this.conf.EXPLOSION_LEAD_DISTANCE;
                    const adjustedPos = {
                        x: pos.x + explosionDist * Math.cos(target.angle),
                        y: pos.y + explosionDist * Math.sin(target.angle)
                    };

                    // Update tower aiming line to point to the intercept (first target only)
                    if (i === 0) {
                        tower.headingTarget = -Math.atan2(tower.x - adjustedPos.x, tower.y - adjustedPos.y) + Math.PI / 4 + Math.PI;
                    }

                    // Debug overlay markers for auto targeting
                    if (this.settingsPanel.getSettings().debugIntercept) {
                        this.debugIntercepts.push({ kind: 'point', x: pos.x, y: pos.y, color: 'cyan' });
                        this.debugIntercepts.push({ kind: 'point', x: adjustedPos.x, y: adjustedPos.y, color: 'yellow' });
                        this.debugIntercepts.push({ kind: 'line', x1: tower.x, y1: tower.y, x2: adjustedPos.x, y2: adjustedPos.y, color: 'gray' });
                    }

                    if (adjustedPos.y > this.targetArea.top && adjustedPos.y < this.targetArea.bottom) {
                        if (tower.isReady()) {
                            tower.shot();

                            const missile = new Missile(
                                { x: tower.x, y: tower.y },
                                adjustedPos,
                                this.conf.MISSILE_SPEED
                            );
                            this.score.missiles += 1;
                            this.missiles.push(missile);
                            this.targetIds.push(targetId);

                            this.targetFocus.push(new Focus(tower, targetId, target.x, target.y, target.vx, target.vy));
                        }
                    }
                }
            }
        }
    }

    /**
     * Draw the game
     */
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.setLineDash([]);
        this.ctx.lineWidth = 2;

        // Draw ground
        this.ctx.fillStyle = 'rgba(120, 80, 20, 0.5)';
        this.ctx.fillRect(0, this.height * UI_CONFIG.GROUND_HEIGHT_RATIO, this.width, UI_CONFIG.GROUND_THICKNESS);
        this.ctx.stroke();

        // Draw target area in auto mode
        if (this.game.mode === GAME_MODE_AUTO) {
            this.ctx.strokeStyle = 'rgba(50, 50, 50, 0.1)';
            this.ctx.moveTo(0, this.targetArea.bottom);
            this.ctx.lineTo(this.width, this.targetArea.bottom);
            this.ctx.moveTo(0, this.targetArea.top);
            this.ctx.lineTo(this.width, this.targetArea.top);
            this.ctx.stroke();
        }

        // Draw version info
        this.ctx.beginPath();
        this.ctx.textAlign = 'center';
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('DEMO v' + this.game.version, this.width - 60, 20);
        this.ctx.stroke();

        // Draw all game objects
        this.cities.forEach(city => city.draw(this.ctx));
        this.asteroids.forEach(asteroid => asteroid.draw(this.ctx));
        this.missiles.forEach(missile => missile.draw(this.ctx));
        this.explosions.forEach(explosion => explosion.draw(this.ctx));
        
        // Draw particle system (only if enabled)
        if (this.settingsPanel.getSettings().particleEffects) {
            this.particleSystem.draw(this.ctx);
        }

        // Debug intercept overlay
        if (this.settingsPanel.getSettings().debugIntercept && this.debugIntercepts && this.debugIntercepts.length > 0) {
            for (const marker of this.debugIntercepts) {
                if (marker.kind === 'point') {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = marker.color || 'white';
                    this.ctx.fillStyle = 'transparent';
                    this.ctx.arc(marker.x, marker.y, 4, 0, Math.PI * 2, false);
                    this.ctx.stroke();
                } else if (marker.kind === 'line') {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = marker.color || 'white';
                    this.ctx.moveTo(marker.x1, marker.y1);
                    this.ctx.lineTo(marker.x2, marker.y2);
                    this.ctx.stroke();
                }
            }
            // Clear markers after drawing so they are per-frame
            this.debugIntercepts = [];
        }

        // Update UI
        if (this.scoreEl) this.scoreEl.innerHTML = this.score.points;
        if (this.levelEl) this.levelEl.innerHTML = this.game.level;
        if (this.autoBtn) this.autoBtn.innerHTML = this.game.mode;
    }

    /**
     * Game over
     */
    gameOver() {
        this.game.status = GAME_OVER;
        if (this.scoreBigEl) this.scoreBigEl.innerHTML = this.score.points;
        
        // Check if it's a high score
        if (StorageManager.isHighScore(this.score.points)) {
            this.highScorePanel.showNewHighScore(this.score.points, () => {
                if (this.modalEl) this.modalEl.style.display = 'flex';
            });
        } else {
            if (this.modalEl) this.modalEl.style.display = 'flex';
        }
    }

    /**
     * Load settings from storage
     */
    loadSettings() {
        const settings = StorageManager.getSettings();
        this.settingsPanel.settings = settings;
        this.settingsPanel.applySettings();
    }

    /**
     * Update pooled asteroid object
     * @param {Object} asteroid - Pooled asteroid object
     * @param {number} dt - Delta time
     */
    updateAsteroid(asteroid, dt) {
        const dx = asteroid.target.x - asteroid.x;
        const dy = asteroid.target.y - asteroid.y;
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

        if (asteroid.distanceToTarget == null) {
            asteroid.distanceToTarget = distanceToTarget;
        }

        if (distanceToTarget > asteroid.distanceToTarget) {
            asteroid.live = 0;
        } else {
            asteroid.vx = dt * asteroid.speed * Math.cos(asteroid.angle);
            asteroid.vy = dt * asteroid.speed * Math.sin(asteroid.angle);

            asteroid.x += asteroid.vx;
            asteroid.y += asteroid.vy;
        }

        asteroid.distanceToTarget = distanceToTarget;
    }

    /**
     * Update pooled missile object
     * @param {Object} missile - Pooled missile object
     * @param {number} dt - Delta time
     */
    updateMissile(missile, dt) {
        missile.x += dt * missile.speed * Math.cos(missile.angle);
        missile.y += dt * missile.speed * Math.sin(missile.angle);

        const dx = missile.targetX - missile.x;
        const dy = missile.targetY - missile.y;
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

        if (missile.distanceToTarget == null) {
            missile.distanceToTarget = distanceToTarget;
        }

        if (distanceToTarget > missile.distanceToTarget) {
            missile.x = missile.targetX;
            missile.y = missile.targetY;
            missile.live = 0;
        }

        missile.distanceToTarget = distanceToTarget;
    }

    /**
     * Update pooled explosion object
     * @param {Object} explosion - Pooled explosion object
     * @param {number} dt - Delta time
     */
    updateExplosion(explosion, dt) {
        explosion.live -= dt * 100;

        if (explosion.live > 1000 / 2) {
            explosion.radius = 10 + explosion.power * (1000 - explosion.live) / 1000;
        } else {
            explosion.radius = 10 + explosion.power - explosion.power * (1000 - explosion.live) / 1000;
        }

        if (explosion.radius < 1) {
            explosion.radius = 0;
        }
    }

    /**
     * Draw pooled asteroid object
     * @param {Object} asteroid - Pooled asteroid object
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawAsteroid(asteroid, ctx) {
        // Draw trail
        ctx.beginPath();
        ctx.moveTo(asteroid.originX, asteroid.originY);
        ctx.lineTo(asteroid.x, asteroid.y);
        ctx.strokeStyle = asteroid.trailColor;
        ctx.stroke();

        // Draw asteroid body
        ctx.beginPath();
        ctx.strokeStyle = asteroid.bodyColor;
        ctx.fillStyle = asteroid.bodyColor;
        ctx.arc(asteroid.x, asteroid.y, asteroid.radius, 2 * Math.PI, false);
        ctx.fill();
        ctx.stroke();
    }

    /**
     * Draw pooled missile object
     * @param {Object} missile - Pooled missile object
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawMissile(missile, ctx) {
        // Draw missile body
        ctx.beginPath();
        ctx.strokeStyle = 'gray';
        ctx.fillStyle = 'yellow';
        ctx.arc(missile.x, missile.y, missile.radius, 2 * Math.PI, false);
        ctx.fill();

        // Draw target crosshair
        const crossSize = 5;
        ctx.beginPath();
        ctx.strokeStyle = 'lightgreen';
        ctx.moveTo(missile.targetX - crossSize, missile.targetY - crossSize);
        ctx.lineTo(missile.targetX + crossSize, missile.targetY + crossSize);
        ctx.stroke();

        ctx.moveTo(missile.targetX + crossSize, missile.targetY - crossSize);
        ctx.lineTo(missile.targetX - crossSize, missile.targetY + crossSize);
        ctx.stroke();
    }

    /**
     * Draw pooled explosion object
     * @param {Object} explosion - Pooled explosion object
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawExplosion(explosion, ctx) {
        this.drawExplosionEffect(explosion, ctx);

        // Draw score if explosion is large enough
        if (explosion.score > 0 && explosion.radius > 12) {
            ctx.save();
            ctx.beginPath();
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.font = "17px Verdana";
            ctx.fillText(explosion.score, explosion.x + 12, explosion.y);
            ctx.restore();
        }
    }

    /**
     * Draw explosion effect with concentric circles
     * @param {Object} explosion - Pooled explosion object
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawExplosionEffect(explosion, ctx) {
        const size = explosion.radius;
        
        // Draw concentric circles of different colors
        ctx.fillStyle = explosion.color;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, size * 1.1, 0, Math.PI * 2, false);
        ctx.fill();

        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, size * 1.1, 0, Math.PI * 2, false);
        ctx.fill();

        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, size * 1.0, 0, Math.PI * 2, false);
        ctx.fill();

        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, size * 0.95, 0, Math.PI * 2, false);
        ctx.fill();

        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, size * 0.9, 0, Math.PI * 2, false);
        ctx.fill();
    }

    /**
     * Check collision between two objects
     * @param {Object} obj1 - First object with x, y, radius properties
     * @param {Object} obj2 - Second object with x, y, radius properties
     * @returns {boolean} True if objects collide
     */
    checkCollision(obj1, obj2) {
        const dx = obj2.x - obj1.x;
        const dy = obj2.y - obj1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = obj1.radius + obj2.radius;
        return dist < minDist;
    }

    /**
     * Get tower closest to player click
     * @param {Array} cities - Array of cities
     * @param {number} playerX - Player click X coordinate
     * @returns {Tower|null} Closest ready tower
     */
    getTower(cities, playerX) {
        const towers = cities.filter(item => item instanceof Tower && item.live > 0 && item.isReady());
        console.log('Available towers:', towers.length); // Debug log
        console.log('Player X:', playerX); // Debug log
        
        let tower = null;
        let minDist = Infinity;

        for (let i = 0; i < towers.length; i++) {
            const dist = getDist(towers[i], { x: playerX, y: 0 });
            console.log(`Tower ${i} at x:${towers[i].x}, distance:${dist}`); // Debug log
            if (dist < minDist) {
                tower = towers[i];
                minDist = dist;
            }
        }

        console.log('Selected tower:', tower); // Debug log
        return tower;
    }

    /**
     * Get asteroid ID for tracking
     * @param {Asteroid} target - Asteroid object
     * @returns {string} Unique asteroid ID
     */
    getAsteroidId(target) {
        return target.target.x.toFixed(2) + '-' + target.target.y.toFixed(2) + '-' + target.angle.toFixed(2);
    }
}

