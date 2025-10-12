// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBN3F9s0d9f6EjEIFvvyoLBX-qzqAFz4vo",
    authDomain: "sport-counter-6a96f.firebaseapp.com",
    projectId: "sport-counter-6a96f",
    storageBucket: "sport-counter-6a96f.firebasestorage.app",
    messagingSenderId: "588269632153",
    appId: "1:588269632153:web:c67e5a920e7dc5999d5608",
    measurementId: "G-THK83D4HXD"
  };

// Initialize Firebase only if not already initialized
if (!window.firebase.apps || window.firebase.apps.length === 0) {
    window.firebaseApp = firebase.initializeApp(firebaseConfig);
} else {
    window.firebaseApp = window.firebase.apps[0];
}
window.auth = firebase.auth();

// Handle Google login
document.getElementById("googleLoginBtn")?.addEventListener("click", async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        console.log("Logged with Google;", user);
    } catch (error) {
        console.error(error);
        alert("login failed: " + error.message);
    }
});