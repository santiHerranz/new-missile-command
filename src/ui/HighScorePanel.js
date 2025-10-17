import { StorageManager } from '../utils/StorageManager.js';

/**
 * High score panel for displaying and managing high scores
 */
export class HighScorePanel {
    constructor() {
        this.panel = null;
        this.isVisible = false;
    }

    /**
     * Show the high score panel
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
     * Hide the high score panel
     */
    hide() {
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
        this.isVisible = false;
    }

    /**
     * Toggle high score panel visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Create the high score panel HTML
     */
    createPanel() {
        const scores = StorageManager.getHighScores();
        
        this.panel = document.createElement('div');
        this.panel.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        this.panel.innerHTML = `
            <div class="bg-gray-900 max-w-lg w-full mx-4 p-6 rounded-2xl text-white shadow-2xl border border-gray-700">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-yellow-400">High Scores</h2>
                    <button id="closeHighScores" class="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                
                <div class="space-y-2 mb-6">
                    ${this.renderScores(scores)}
                </div>

                <div class="flex space-x-3">
                    <button id="clearScores" class="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-bold transition-colors">
                        Clear Scores
                    </button>
                    <button id="closeHighScoresBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-bold transition-colors">
                        Close
                    </button>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    /**
     * Render high scores list
     * @param {Array} scores - Array of high scores
     * @returns {string} HTML string
     */
    renderScores(scores) {
        if (scores.length === 0) {
            return '<p class="text-gray-400 text-center py-8">No high scores yet!</p>';
        }

        return scores.map((score, index) => `
            <div class="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <div class="flex items-center space-x-3">
                    <span class="text-yellow-400 font-bold text-lg">#${index + 1}</span>
                    <div>
                        <div class="font-medium">${score.player}</div>
                        <div class="text-sm text-gray-400">${new Date(score.date).toLocaleDateString()}</div>
                    </div>
                </div>
                <div class="text-xl font-mono text-green-400">${score.score.toLocaleString()}</div>
            </div>
        `).join('');
    }

    /**
     * Setup event listeners for the high score panel
     */
    setupEventListeners() {
        // Close buttons
        this.panel.querySelector('#closeHighScores').addEventListener('click', () => {
            this.hide();
        });

        this.panel.querySelector('#closeHighScoresBtn').addEventListener('click', () => {
            this.hide();
        });

        // Click outside to close
        this.panel.addEventListener('click', (e) => {
            if (e.target === this.panel) {
                this.hide();
            }
        });

        // Clear scores button
        this.panel.querySelector('#clearScores').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all high scores?')) {
                this.clearScores();
            }
        });
    }

    /**
     * Clear all high scores
     */
    clearScores() {
        StorageManager.clearAll();
        this.hide();
        this.show(); // Refresh the panel
    }

    /**
     * Show new high score dialog
     * @param {number} score - New high score
     * @param {Function} callback - Callback function when name is entered
     */
    showNewHighScore(score, callback) {
        if (this.panel) {
            this.panel.remove();
        }

        this.panel = document.createElement('div');
        this.panel.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        this.panel.innerHTML = `
            <div class="bg-gray-900 max-w-md w-full mx-4 p-6 rounded-2xl text-white shadow-2xl border border-gray-700">
                <div class="text-center mb-6">
                    <h2 class="text-3xl font-bold text-yellow-400 mb-2">New High Score!</h2>
                    <p class="text-xl text-green-400 font-mono">${score.toLocaleString()} points</p>
                </div>
                
                <div class="mb-6">
                    <label class="block text-sm font-medium mb-2">Enter your name:</label>
                    <input type="text" id="playerName" class="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white text-center text-lg" 
                           placeholder="Anonymous" maxlength="20" autofocus>
                </div>

                <button id="saveHighScore" class="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-bold text-lg transition-colors">
                    Save Score
                </button>
            </div>
        `;

        document.body.appendChild(this.panel);
        this.isVisible = true;

        // Setup event listeners
        const playerNameInput = this.panel.querySelector('#playerName');
        const saveButton = this.panel.querySelector('#saveHighScore');

        const saveScore = () => {
            const name = playerNameInput.value.trim() || 'Anonymous';
            StorageManager.saveHighScore(score, name);
            this.hide();
            if (callback) callback();
        };

        saveButton.addEventListener('click', saveScore);
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveScore();
            }
        });

        // Focus on input
        setTimeout(() => playerNameInput.focus(), 100);
    }
}
