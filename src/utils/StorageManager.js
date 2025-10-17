/**
 * Storage manager for handling localStorage operations
 */
export class StorageManager {
    static HIGHSCORES_KEY = 'missileCommand_highscores';
    static SETTINGS_KEY = 'missileCommand_settings';
    static MAX_HIGHSCORES = 10;

    /**
     * Get high scores from localStorage
     * @returns {Array} Array of high scores
     */
    static getHighScores() {
        try {
            const scores = localStorage.getItem(this.HIGHSCORES_KEY);
            return scores ? JSON.parse(scores) : [];
        } catch (error) {
            console.error('Error loading high scores:', error);
            return [];
        }
    }

    /**
     * Save a new high score
     * @param {number} score - Score to save
     * @param {string} playerName - Player name (optional)
     * @returns {boolean} True if score was saved
     */
    static saveHighScore(score, playerName = 'Anonymous') {
        try {
            const scores = this.getHighScores();
            const newScore = {
                score: score,
                player: playerName,
                date: new Date().toISOString()
            };

            scores.push(newScore);
            scores.sort((a, b) => b.score - a.score);
            
            // Keep only top scores
            const topScores = scores.slice(0, this.MAX_HIGHSCORES);
            
            localStorage.setItem(this.HIGHSCORES_KEY, JSON.stringify(topScores));
            return true;
        } catch (error) {
            console.error('Error saving high score:', error);
            return false;
        }
    }

    /**
     * Check if a score qualifies as a high score
     * @param {number} score - Score to check
     * @returns {boolean} True if it's a high score
     */
    static isHighScore(score) {
        const scores = this.getHighScores();
        return scores.length < this.MAX_HIGHSCORES || score > scores[scores.length - 1].score;
    }

    /**
     * Get game settings from localStorage
     * @returns {Object} Game settings
     */
    static getSettings() {
        try {
            const settings = localStorage.getItem(this.SETTINGS_KEY);
            return settings ? JSON.parse(settings) : this.getDefaultSettings();
        } catch (error) {
            console.error('Error loading settings:', error);
            return this.getDefaultSettings();
        }
    }

    /**
     * Save game settings to localStorage
     * @param {Object} settings - Settings to save
     * @returns {boolean} True if settings were saved
     */
    static saveSettings(settings) {
        try {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    /**
     * Get default game settings
     * @returns {Object} Default settings
     */
    static getDefaultSettings() {
        return {
            difficulty: 'normal',
            soundEnabled: true,
            showFPS: false,
            autoMode: true,
            particleEffects: true,
            debugIntercept: false
        };
    }

    /**
     * Clear all stored data
     */
    static clearAll() {
        try {
            localStorage.removeItem(this.HIGHSCORES_KEY);
            localStorage.removeItem(this.SETTINGS_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }
}
