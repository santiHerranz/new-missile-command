/**
 * Particle system for enhanced visual effects
 */
export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.pool = [];
        this.maxParticles = 100;
        
        // Pre-populate particle pool
        for (let i = 0; i < this.maxParticles; i++) {
            this.pool.push(this.createParticle());
        }
    }

    /**
     * Create a new particle
     * @returns {Object} New particle object
     */
    createParticle() {
        return {
            x: 0, y: 0, vx: 0, vy: 0,
            life: 0, maxLife: 0, size: 0,
            color: '#ffffff', alpha: 1,
            gravity: 0, friction: 0.98
        };
    }

    /**
     * Get a particle from the pool
     * @returns {Object} Pooled particle
     */
    getParticle() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return this.createParticle();
    }

    /**
     * Return a particle to the pool
     * @param {Object} particle - Particle to return
     */
    releaseParticle(particle) {
        if (this.pool.length < this.maxParticles) {
            this.pool.push(particle);
        }
    }

    /**
     * Emit particles for an explosion
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Particle color
     * @param {number} count - Number of particles
     * @param {number} speed - Particle speed
     */
    emitExplosion(x, y, color = '#ff6600', count = 15, speed = 2) {
        for (let i = 0; i < count; i++) {
            const particle = this.getParticle();
            
            particle.x = x;
            particle.y = y;
            particle.life = 0;
            particle.maxLife = 30 + Math.random() * 20;
            particle.size = 2 + Math.random() * 3;
            particle.color = color;
            particle.alpha = 1;
            
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            const velocity = speed * (0.5 + Math.random() * 0.5);
            particle.vx = Math.cos(angle) * velocity;
            particle.vy = Math.sin(angle) * velocity;
            
            particle.gravity = 0.1;
            particle.friction = 0.98;
            
            this.particles.push(particle);
        }
    }

    /**
     * Emit particles for a trail
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Particle color
     * @param {number} count - Number of particles
     */
    emitTrail(x, y, color = '#ffff00', count = 3) {
        for (let i = 0; i < count; i++) {
            const particle = this.getParticle();
            
            particle.x = x + (Math.random() - 0.5) * 4;
            particle.y = y + (Math.random() - 0.5) * 4;
            particle.life = 0;
            particle.maxLife = 10 + Math.random() * 10;
            particle.size = 1 + Math.random() * 2;
            particle.color = color;
            particle.alpha = 0.8;
            
            particle.vx = (Math.random() - 0.5) * 0.5;
            particle.vy = (Math.random() - 0.5) * 0.5;
            
            particle.gravity = 0.02;
            particle.friction = 0.95;
            
            this.particles.push(particle);
        }
    }

    /**
     * Emit particles for city destruction
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} count - Number of particles
     */
    emitCityDestruction(x, y, count = 20) {
        for (let i = 0; i < count; i++) {
            const particle = this.getParticle();
            
            particle.x = x + (Math.random() - 0.5) * 40;
            particle.y = y + (Math.random() - 0.5) * 40;
            particle.life = 0;
            particle.maxLife = 40 + Math.random() * 30;
            particle.size = 1 + Math.random() * 4;
            particle.color = '#666666';
            particle.alpha = 0.9;
            
            const angle = Math.random() * Math.PI * 2;
            const velocity = 1 + Math.random() * 2;
            particle.vx = Math.cos(angle) * velocity;
            particle.vy = Math.sin(angle) * velocity;
            
            particle.gravity = 0.15;
            particle.friction = 0.96;
            
            this.particles.push(particle);
        }
    }

    /**
     * Update all particles
     * @param {number} dt - Delta time
     */
    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update position
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            
            // Apply gravity
            particle.vy += particle.gravity * dt;
            
            // Apply friction
            particle.vx *= particle.friction;
            particle.vy *= particle.friction;
            
            // Update life
            particle.life += dt;
            
            // Update alpha based on life
            particle.alpha = 1 - (particle.life / particle.maxLife);
            
            // Remove dead particles
            if (particle.life >= particle.maxLife || particle.alpha <= 0) {
                this.releaseParticle(particle);
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Draw all particles
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        ctx.save();
        
        for (const particle of this.particles) {
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    /**
     * Clear all particles
     */
    clear() {
        for (const particle of this.particles) {
            this.releaseParticle(particle);
        }
        this.particles = [];
    }

    /**
     * Get particle count
     * @returns {number} Number of active particles
     */
    getParticleCount() {
        return this.particles.length;
    }
}
