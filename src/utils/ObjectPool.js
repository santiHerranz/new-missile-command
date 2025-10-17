/**
 * Object pool for efficient object reuse
 */
export class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = new Set();
        
        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    /**
     * Get an object from the pool
     * @returns {Object} Pooled object
     */
    get() {
        let obj;
        
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFn();
        }
        
        this.active.add(obj);
        return obj;
    }

    /**
     * Return an object to the pool
     * @param {Object} obj - Object to return
     */
    release(obj) {
        if (this.active.has(obj)) {
            this.active.delete(obj);
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }

    /**
     * Release all active objects
     */
    releaseAll() {
        for (const obj of this.active) {
            this.resetFn(obj);
            this.pool.push(obj);
        }
        this.active.clear();
    }

    /**
     * Get the number of active objects
     * @returns {number} Number of active objects
     */
    getActiveCount() {
        return this.active.size;
    }

    /**
     * Get the number of available objects in pool
     * @returns {number} Number of available objects
     */
    getAvailableCount() {
        return this.pool.length;
    }

    /**
     * Get total pool size
     * @returns {number} Total pool size
     */
    getTotalSize() {
        return this.active.size + this.pool.length;
    }
}

/**
 * Specific object pools for game entities
 */
export class GameObjectPools {
    constructor() {
        // Missile pool
        this.missilePool = new ObjectPool(
            () => ({
                x: 0, y: 0, targetX: 0, targetY: 0,
                speed: 0, angle: 0, live: 0, radius: 3,
                originX: 0, originY: 0, distanceToTarget: null
            }),
            (obj) => {
                obj.x = 0; obj.y = 0; obj.targetX = 0; obj.targetY = 0;
                obj.speed = 0; obj.angle = 0; obj.live = 0;
                obj.originX = 0; obj.originY = 0; obj.distanceToTarget = null;
            },
            20
        );

        // Explosion pool
        this.explosionPool = new ObjectPool(
            () => ({
                x: 0, y: 0, radius: 1, power: 60,
                owner: 0, color: 'blue', score: 0, live: 0
            }),
            (obj) => {
                obj.x = 0; obj.y = 0; obj.radius = 1; obj.power = 60;
                obj.owner = 0; obj.color = 'blue'; obj.score = 0; obj.live = 0;
            },
            15
        );

        // Asteroid pool
        this.asteroidPool = new ObjectPool(
            () => ({
                x: 0, y: 0, originX: 0, originY: 0,
                vx: 0, vy: 0, speed: 0, angle: 0,
                radius: 5, live: 0, trailColor: "orange",
                bodyColor: "red", target: { x: 0, y: 0 },
                distanceToTarget: null
            }),
            (obj) => {
                obj.x = 0; obj.y = 0; obj.originX = 0; obj.originY = 0;
                obj.vx = 0; obj.vy = 0; obj.speed = 0; obj.angle = 0;
                obj.radius = 5; obj.live = 0;
                obj.target = { x: 0, y: 0 }; obj.distanceToTarget = null;
            },
            25
        );
    }

    /**
     * Get a pooled missile
     * @param {Object} pos - Position {x, y}
     * @param {Object} target - Target {x, y}
     * @param {number} speed - Speed
     * @returns {Object} Pooled missile object
     */
    getMissile(pos, target, speed) {
        const missile = this.missilePool.get();
        missile.x = pos.x;
        missile.y = pos.y;
        missile.originX = pos.x;
        missile.originY = pos.y;
        missile.targetX = target.x;
        missile.targetY = target.y;
        missile.speed = speed;
        missile.angle = -Math.atan2(pos.x - target.x, pos.y - target.y) - Math.PI / 2;
        missile.live = 100;
        missile.radius = 3;
        missile.distanceToTarget = null;
        return missile;
    }

    /**
     * Get a pooled explosion
     * @param {number} owner - Owner type
     * @param {Object} pos - Position {x, y}
     * @param {number} score - Score value
     * @returns {Object} Pooled explosion object
     */
    getExplosion(owner, pos, score = 0) {
        const explosion = this.explosionPool.get();
        explosion.x = pos.x;
        explosion.y = pos.y;
        explosion.owner = owner;
        explosion.score = score;
        explosion.live = 1000;
        explosion.radius = 1;
        explosion.power = 60;
        
        // Set color based on owner
        if (owner === 1) { // PLAYER
            explosion.color = 'blue';
        } else if (owner === 2) { // OTHER
            explosion.color = 'red';
        } else if (owner === 3) { // CITY
            explosion.power = 100;
            explosion.color = 'lightgreen';
        }
        
        return explosion;
    }

    /**
     * Get a pooled asteroid
     * @param {Object} pos - Position {x, y}
     * @param {Object} target - Target {x, y}
     * @param {number} speed - Speed
     * @returns {Object} Pooled asteroid object
     */
    getAsteroid(pos, target, speed) {
        const asteroid = this.asteroidPool.get();
        asteroid.x = pos.x;
        asteroid.y = pos.y;
        asteroid.originX = pos.x;
        asteroid.originY = pos.y;
        asteroid.target = { x: target.x, y: target.y };
        asteroid.speed = speed;
        asteroid.angle = -Math.atan2(pos.x - target.x, pos.y - target.y) - Math.PI / 2;
        asteroid.live = 100;
        asteroid.radius = 5;
        asteroid.vx = 0;
        asteroid.vy = 0;
        asteroid.distanceToTarget = null;
        return asteroid;
    }

    /**
     * Release a missile back to pool
     * @param {Object} missile - Missile to release
     */
    releaseMissile(missile) {
        this.missilePool.release(missile);
    }

    /**
     * Release an explosion back to pool
     * @param {Object} explosion - Explosion to release
     */
    releaseExplosion(explosion) {
        this.explosionPool.release(explosion);
    }

    /**
     * Release an asteroid back to pool
     * @param {Object} asteroid - Asteroid to release
     */
    releaseAsteroid(asteroid) {
        this.asteroidPool.release(asteroid);
    }

    /**
     * Release all objects
     */
    releaseAll() {
        this.missilePool.releaseAll();
        this.explosionPool.releaseAll();
        this.asteroidPool.releaseAll();
    }

    /**
     * Get pool statistics
     * @returns {Object} Pool statistics
     */
    getStats() {
        return {
            missiles: {
                active: this.missilePool.getActiveCount(),
                available: this.missilePool.getAvailableCount(),
                total: this.missilePool.getTotalSize()
            },
            explosions: {
                active: this.explosionPool.getActiveCount(),
                available: this.explosionPool.getAvailableCount(),
                total: this.explosionPool.getTotalSize()
            },
            asteroids: {
                active: this.asteroidPool.getActiveCount(),
                available: this.asteroidPool.getAvailableCount(),
                total: this.asteroidPool.getTotalSize()
            }
        };
    }
}
