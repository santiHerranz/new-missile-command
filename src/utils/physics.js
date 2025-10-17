/**
 * Physics utility functions
 */

/**
 * Calculate distance between two points
 * @param {Object} a - First point with x, y properties
 * @param {Object} b - Second point with x, y properties
 * @returns {number} Distance between points
 */
export function getDist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Return the firing solution for a projectile starting at 'src' with
 * velocity 'v', to hit a target, 'dst'.
 * @param {Object} src - Position of shooter
 * @param {Object} dst - Position & velocity of target
 * @param {number} v - Speed of projectile
 * @returns {Object|null} Coordinate at which to fire (and where intercept occurs)
 */
export function intercept(src, dst, v) {
    const tx = dst.x - src.x;
    const ty = dst.y - src.y;
    const tvx = dst.vx;
    const tvy = dst.vy;

    // Get quadratic equation components
    const a = tvx * tvx + tvy * tvy - v * v;
    const b = 2 * (tvx * tx + tvy * ty);
    const c = tx * tx + ty * ty;

    // Solve quadratic
    const ts = quad(a, b, c);

    // Find smallest positive solution
    let sol = null;
    if (ts) {
        const t0 = ts[0];
        const t1 = ts[1];
        let t = Math.min(t0, t1);
        if (t < 0) t = Math.max(t0, t1);
        if (t > 0) {
            sol = {
                x: dst.x + dst.vx * t,
                y: dst.y + dst.vy * t
            };
        }
    }

    return sol;
}

/**
 * Return solutions for quadratic equation
 * @param {number} a - Coefficient a
 * @param {number} b - Coefficient b
 * @param {number} c - Coefficient c
 * @returns {Array|null} Solutions array or null
 */
function quad(a, b, c) {
    let sol = null;
    if (Math.abs(a) < 1e-6) {
        if (Math.abs(b) < 1e-6) {
            sol = Math.abs(c) < 1e-6 ? [0, 0] : null;
        } else {
            sol = [-c / b, -c / b];
        }
    } else {
        const disc = b * b - 4 * a * c;
        if (disc >= 0) {
            const sqrtDisc = Math.sqrt(disc);
            const twoA = 2 * a;
            sol = [(-b - sqrtDisc) / twoA, (-b + sqrtDisc) / twoA];
        }
    }
    return sol;
}
