// quests.js

// Firebase configuration
const firebaseConfig = {
            apiKey: "AIzaSyCqhxq6sPDU3EmuvvkBIIDJ-H6PsBc42Jg",
            authDomain: "project-fighters-by-fishb0nes.firebaseapp.com",
            databaseURL: "https://project-fighters-by-fishb0nes-default-rtdb.europe-west1.firebasedatabase.app",
            projectId: "project-fighters-by-fishb0nes",
            storageBucket: "project-fighters-by-fishb0nes.appspot.com",
            messagingSenderId: "867339299995",
            appId: "1:867339299995:web:99c379940014b9c05cea3e",
            measurementId: "G-LNEM6HR842"
        };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Function to update quest progress
function updateQuestProgress(userId, questId, increment = 1) {
    const questRef = database.ref(`users/${userId}/quests/${questId}`);

    questRef.once('value').then(snapshot => {
        let currentProgress = snapshot.val() || 0;
        currentProgress += increment;

        // Update the progress in the database
        questRef.set(currentProgress);

        // Update the progress bar on the UI
        const questElement = document.querySelector(`.quest[data-id="${questId}"]`);
        if (questElement) {
            const progressBar = questElement.querySelector('.quest-progress div');
            progressBar.style.width = `${(currentProgress / 1) * 100}%`; // Assuming target progress is 1 for now
        }

        // Check if the quest is completed
        if (currentProgress >= 1) {
            markQuestCompleted(userId, questId);
        }
    });
}

// Function to mark quest as completed and reward the player
function markQuestCompleted(userId, questId) {
    const skinsRef = database.ref(`users/${userId}/skins`);

    skinsRef.once('value').then(snapshot => {
        let skins = snapshot.val() || {};

        // Add the new skin to the user's collection
        skins['Cham Cham Monochrome'] = 1;

        // Update the skins collection in the database
        skinsRef.set(skins);

        // Mark the quest as completed in the UI
        const questElement = document.querySelector(`.quest[data-id="${questId}"]`);
        if (questElement) {
            questElement.classList.add('completed');
        }

        alert('Quest completed! You have unlocked a new skin: Cham Cham Monochrome');
    });
}

// Example function to play a game (for testing)
function playGame(userId) {
    updateQuestProgress(userId, 1);
}

// Initialize the quest progress on page load
document.addEventListener('DOMContentLoaded', function () {
    const userId = 'USER_ID'; // Replace with the actual user ID
    const questId = 1;
    const questRef = database.ref(`users/${userId}/quests/${questId}`);

    questRef.once('value').then(snapshot => {
        let currentProgress = snapshot.val() || 0;

        const questElement = document.querySelector(`.quest[data-id="${questId}"]`);
        if (questElement) {
            const progressBar = questElement.querySelector('.quest-progress div');
            progressBar.style.width = `${(currentProgress / 1) * 100}%`; // Assuming target progress is 1 for now
        }
    });
});