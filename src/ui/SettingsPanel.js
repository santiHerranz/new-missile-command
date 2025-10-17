import { StorageManager } from '../utils/StorageManager.js';

/**
 * Settings panel for game configuration
 */
export class SettingsPanel {
    constructor(game) {
        this.game = game;
        this.settings = StorageManager.getSettings();
        this.panel = null;
        this.isVisible = false;
    }

    /**
     * Create and show the settings panel
     */
    show() {
        if (this.panel) {
            this.panel.remove();
        }

        this.createPanel();
        document.body.appendChild(this.panel);
        this.isVisible = true;
    }

    /**
     * Hide the settings panel
     */
    hide() {
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
        this.isVisible = false;
    }

    /**
     * Toggle settings panel visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Create the settings panel HTML
     */
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        this.panel.innerHTML = `
            <div class="bg-gray-900 max-w-md w-full mx-4 p-6 rounded-2xl text-white shadow-2xl border border-gray-700">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-blue-400">Settings</h2>
                    <button id="closeSettings" class="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                
                <div class="space-y-4">
                    <!-- Difficulty -->
                    <div>
                        <label class="block text-sm font-medium mb-2">Difficulty</label>
                        <select id="difficulty" class="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white">
                            <option value="easy">Easy</option>
                            <option value="normal" selected>Normal</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>

                    <!-- Sound -->
                    <div class="flex items-center justify-between">
                        <label class="text-sm font-medium">Sound Effects</label>
                        <input type="checkbox" id="soundEnabled" class="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded">
                    </div>

                    <!-- Show FPS -->
                    <div class="flex items-center justify-between">
                        <label class="text-sm font-medium">Show FPS</label>
                        <input type="checkbox" id="showFPS" class="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded">
                    </div>

                    <!-- Particle Effects -->
                    <div class="flex items-center justify-between">
                        <label class="text-sm font-medium">Particle Effects</label>
                        <input type="checkbox" id="particleEffects" class="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded">
                    </div>

                    <!-- Debug Intercept Overlay -->
                    <div class="flex items-center justify-between">
                        <label class="text-sm font-medium">Debug Intercept Overlay</label>
                        <input type="checkbox" id="debugIntercept" class="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded">
                    </div>

                    <!-- Auto Mode -->
                    <div class="flex items-center justify-between">
                        <label class="text-sm font-medium">Start in Auto Mode</label>
                        <input type="checkbox" id="autoMode" class="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded">
                    </div>
                </div>

                <div class="flex space-x-3 mt-6">
                    <button id="saveSettings" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-bold transition-colors">
                        Save
                    </button>
                    <button id="resetSettings" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-bold transition-colors">
                        Reset
                    </button>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.loadCurrentSettings();
    }

    /**
     * Setup event listeners for the settings panel
     */
    setupEventListeners() {
        // Close button
        this.panel.querySelector('#closeSettings').addEventListener('click', () => {
            this.hide();
        });

        // Click outside to close
        this.panel.addEventListener('click', (e) => {
            if (e.target === this.panel) {
                this.hide();
            }
        });

        // Save button
        this.panel.querySelector('#saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        // Reset button
        this.panel.querySelector('#resetSettings').addEventListener('click', () => {
            this.resetSettings();
        });
    }

    /**
     * Load current settings into the form
     */
    loadCurrentSettings() {
        const difficulty = this.panel.querySelector('#difficulty');
        const soundEnabled = this.panel.querySelector('#soundEnabled');
        const showFPS = this.panel.querySelector('#showFPS');
        const particleEffects = this.panel.querySelector('#particleEffects');
        const debugIntercept = this.panel.querySelector('#debugIntercept');
        const autoMode = this.panel.querySelector('#autoMode');

        difficulty.value = this.settings.difficulty;
        soundEnabled.checked = this.settings.soundEnabled;
        showFPS.checked = this.settings.showFPS;
        particleEffects.checked = this.settings.particleEffects;
        debugIntercept.checked = this.settings.debugIntercept;
        autoMode.checked = this.settings.autoMode;
    }

    /**
     * Save settings from the form
     */
    saveSettings() {
        const difficulty = this.panel.querySelector('#difficulty').value;
        const soundEnabled = this.panel.querySelector('#soundEnabled').checked;
        const showFPS = this.panel.querySelector('#showFPS').checked;
        const particleEffects = this.panel.querySelector('#particleEffects').checked;
        const debugIntercept = this.panel.querySelector('#debugIntercept').checked;
        const autoMode = this.panel.querySelector('#autoMode').checked;

        this.settings = {
            difficulty,
            soundEnabled,
            showFPS,
            particleEffects,
            debugIntercept,
            autoMode
        };

        StorageManager.saveSettings(this.settings);
        this.applySettings();
        this.hide();
    }

    /**
     * Reset settings to defaults
     */
    resetSettings() {
        this.settings = StorageManager.getDefaultSettings();
        this.loadCurrentSettings();
    }

    /**
     * Apply settings to the game
     */
    applySettings() {
        // Apply difficulty
        this.applyDifficulty(this.settings.difficulty);
        
        // Apply other settings
        if (this.game) {
            // Update game mode if needed
            if (this.settings.autoMode) {
                this.game.game.mode = 'AUTO';
            }
        }
    }

    /**
     * Apply difficulty settings
     * @param {string} difficulty - Difficulty level
     */
    applyDifficulty(difficulty) {
        const multipliers = {
            easy: { asteroidSpeed: 0.7, missileSpeed: 1.2, reloadTime: 0.8 },
            normal: { asteroidSpeed: 1.0, missileSpeed: 1.0, reloadTime: 1.0 },
            hard: { asteroidSpeed: 1.3, missileSpeed: 0.9, reloadTime: 1.2 }
        };

        const mult = multipliers[difficulty] || multipliers.normal;
        
        // Update game configuration
        if (this.game) {
            this.game.conf.ASTEROID_SPEED = 10 * mult.asteroidSpeed;
            this.game.conf.MISSILE_SPEED = 50 * mult.missileSpeed;
        }
    }

    /**
     * Get current settings
     * @returns {Object} Current settings
     */
    getSettings() {
        return this.settings;
    }
}
