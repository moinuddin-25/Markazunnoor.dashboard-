// Replace with your Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyCJJbYQmnvcLZ7UKX37u4x3N_L1SwFZuGI",
    authDomain: "markazunnoor-f5ed7.firebaseapp.com",
    projectId: "markazunnoor-f5ed7",
    storageBucket: "markazunnoor-f5ed7.appspot.com",
    messagingSenderId: "156948689533",
    appId: "1:156948689533:web:f8898adbcb06f9d1c27714"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const db = firebase.firestore();
