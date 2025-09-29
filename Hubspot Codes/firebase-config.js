// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAErPG4jI_Cty79spferP46JC2pgc6m6dM",
  authDomain: "stars-vacation-management.firebaseapp.com",
  projectId: "stars-vacation-management",
  storageBucket: "stars-vacation-management.firebasestorage.app",
  messagingSenderId: "381862926615",
  appId: "1:381862926615:web:27e670f68fa6df9cbb3f52"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Export the initialized services
export { app, db, auth };
export default app;
