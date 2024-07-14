import { initializeGame, attachEventListeners } from './gameLogic.js';
import { updateHpBars, updateAbilityButtons } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the game
    initializeGame();

    // Attach event listeners
    attachEventListeners();

    // Initial update of the HP bars and ability buttons
    updateHpBars();
    updateAbilityButtons();
});