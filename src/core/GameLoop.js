import { GAME_CONFIG } from '../constants/config.js';
import { GAME_STOP, GAME_RUNNING } from '../constants/gameStates.js';

/**
 * Game loop manager with improved timing
 */
export class GameLoop {
    constructor(game) {
        this.game = game;
        this.lastTime = 0;
        this.isRunning = false;
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsTime = 0;
    }

    /**
     * Start the game loop
     */
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.lastFpsTime = this.lastTime;
        this.loop();
    }

    /**
     * Stop the game loop
     */
    stop() {
        this.isRunning = false;
    }

    /**
     * Main game loop
     * @param {number} currentTime - Current timestamp
     */
    loop(currentTime = performance.now()) {
        if (!this.isRunning) return;

        // Calculate delta time
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Update FPS counter
        this.updateFPS(currentTime);

        // Update game if running
        if (this.game.game.status === GAME_RUNNING) {
            this.game.step(deltaTime * 0.01); // Convert to game time units (reduced speed)
        }

        // Show pause menu if stopped
        if (this.game.game.status === GAME_STOP) {
            if (this.game.modalMenu) {
                this.game.modalMenu.style.display = 'flex';
            }
        }

        // Draw the game
        this.game.draw();

        // Continue loop
        requestAnimationFrame((time) => this.loop(time));
    }

    /**
     * Update FPS counter
     * @param {number} currentTime - Current timestamp
     */
    updateFPS(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastFpsTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsTime));
            this.frameCount = 0;
            this.lastFpsTime = currentTime;
            
            // Update FPS display if available
            if (this.game.settingsPanel && this.game.settingsPanel.getSettings().showFPS) {
                this.updateFPSDisplay();
            }
        }
    }

    /**
     * Update FPS display
     */
    updateFPSDisplay() {
        let fpsDisplay = document.getElementById('fpsDisplay');
        if (!fpsDisplay) {
            fpsDisplay = document.createElement('div');
            fpsDisplay.id = 'fpsDisplay';
            fpsDisplay.className = 'fixed top-16 right-4 text-white text-sm font-mono bg-black bg-opacity-50 px-2 py-1 rounded z-20';
            document.body.appendChild(fpsDisplay);
        }
        fpsDisplay.textContent = `FPS: ${this.fps}`;
    }

    /**
     * Get current FPS
     * @returns {number} Current FPS
     */
    getFPS() {
        return this.fps;
    }
}
