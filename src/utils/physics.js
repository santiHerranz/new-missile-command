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

    // Quadratic coefficients for ||r + vt * t||^2 = (v * t)^2
    // a t^2 + b t + c = 0
    const a = (tvx * tvx + tvy * tvy) - v * v;
    const b = 2 * (tvx * tx + tvy * ty);
    const c = tx * tx + ty * ty;

    // Solve using a numerically stable quadratic solver
    const ts = solveQuadraticStable(a, b, c);

    // Choose the smallest positive time
    let sol = null;
    if (ts) {
        let [t0, t1] = ts;
        // Ensure t0 <= t1
        if (t0 > t1) {
            const tmp = t0; t0 = t1; t1 = tmp;
        }
        let t = t0;
        if (t <= 0) t = t1;
        if (t > 0) {
            sol = { x: dst.x + tvx * t, y: dst.y + tvy * t };
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
function solveQuadraticStable(a, b, c) {
    const EPS = 1e-9;
    // Handle near-linear case: a ~ 0 -> bt + c = 0
    if (Math.abs(a) < EPS) {
        if (Math.abs(b) < EPS) {
            // Degenerate: c ~ 0 -> infinite solutions, treat as t=0
            return Math.abs(c) < EPS ? [0, 0] : null;
        }
        const t = -c / b;
        return [t, t];
    }

    let disc = b * b - 4 * a * c;
    // Clamp tiny negative discriminants to zero due to FP error
    if (disc < 0 && disc > -EPS) disc = 0;
    if (disc < 0) return null;

    const sqrtDisc = Math.sqrt(disc);
    // Use stable form to compute roots
    const q = -0.5 * (b + Math.sign(b || 1) * sqrtDisc);
    // If q is 0, fall back to symmetric formula
    if (q === 0) {
        const twoA = 2 * a;
        return [(-b - sqrtDisc) / twoA, (-b + sqrtDisc) / twoA];
    }
    const t0 = q / a;
    const t1 = c / q;
    return [t0, t1];
}
