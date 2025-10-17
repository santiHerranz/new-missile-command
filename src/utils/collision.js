/**
 * Collision detection utilities
 */

/**
 * Check collision between two circular objects
 * @param {Object} obj1 - First object with x, y, radius properties
 * @param {Object} obj2 - Second object with x, y, radius properties
 * @returns {boolean} True if objects collide
 */
export function checkCollision(obj1, obj2) {
    const dx = obj2.x - obj1.x;
    const dy = obj2.y - obj1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = obj1.radius + obj2.radius;
    return dist < minDist;
}

/**
 * Sort asteroids by distance from a tower
 * @param {Object} tower - Tower object with x, y properties
 * @param {Array} asteroids - Array of asteroid objects
 * @returns {Array} Sorted asteroids array
 */
export function sortByDistance(tower, asteroids) {
    return asteroids.sort((a, b) => {
        const A1 = getDist(a.target, tower);
        const B1 = getDist(b.target, tower);
        const A2 = getDist(a, tower);
        const B2 = getDist(b, tower);
        const A = A1 * 0.5 + A2 * 0.5;
        const B = B1 * 0.5 + B2 * 0.5;
        
        if (A < B) return -1;
        if (A > B) return 1;
        return 0;
    });
}

/**
 * Calculate distance between two points
 * @param {Object} a - First point with x, y properties
 * @param {Object} b - Second point with x, y properties
 * @returns {number} Distance between points
 */
function getDist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}
