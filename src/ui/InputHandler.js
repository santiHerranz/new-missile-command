import { KEY } from '../constants/keys.js';

/**
 * Input handler for keyboard and mouse events
 */
export class InputHandler {
    constructor() {
        this.input = {
            right: false,
            up: false,
            left: false,
            down: false,
            espace: false,
            shoot: false,
            quit: false
        };

        this.setupEventListeners();
    }

    /**
     * Setup event listeners for input
     */
    setupEventListeners() {
        window.addEventListener('keydown', (evt) => this.onKeyDown(evt));
        window.addEventListener('keyup', (evt) => this.onKeyUp(evt));
    }

    /**
     * Handle key down events
     * @param {KeyboardEvent} evt - Keyboard event
     */
    onKeyDown(evt) {
        const code = evt.keyCode;

        if (code === KEY.ESPACE) {
            this.input.espace = true;
        }
    }

    /**
     * Handle key up events
     * @param {KeyboardEvent} evt - Keyboard event
     */
    onKeyUp(evt) {
        const code = evt.keyCode;

        if (code === KEY.ESPACE) {
            this.input.espace = false;
        }
    }

    /**
     * Get current input state
     * @returns {Object} Current input state
     */
    getInput() {
        return this.input;
    }

    /**
     * Reset input state
     */
    reset() {
        this.input = {
            right: false,
            up: false,
            left: false,
            down: false,
            espace: false,
            shoot: false,
            quit: false
        };
    }
}
