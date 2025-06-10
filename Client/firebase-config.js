// Firebase configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js';
import { getDatabase, ref, get, set, update } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js';

// Firebase configuration object
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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Export Firebase instances
export { app, auth, database, onAuthStateChanged, signOut, ref, get, set, update }; 