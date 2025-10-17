import { Game } from './core/Game.js';
import { GameLoop } from './core/GameLoop.js';

/**
 * Main entry point for the game
 */
class MissileCommandApp {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.game = null;
        this.gameLoop = null;
    }

    /**
     * Initialize the application
     */
    init() {
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }

        // Create game instance
        this.game = new Game(this.canvas);
        this.gameLoop = new GameLoop(this.game);

        // Initialize and start the game
        this.game.init();
        this.gameLoop.start();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new MissileCommandApp();
    app.init();
});
