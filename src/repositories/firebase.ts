// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDm2hUevjcOCEnFpGjP40x51R70vJ0pJfQ",
  authDomain: "lingotrain-6ce70.firebaseapp.com",
  projectId: "lingotrain-6ce70",
  storageBucket: "lingotrain-6ce70.firebasestorage.app",
  messagingSenderId: "938360439384",
  appId: "1:938360439384:web:c1d57e891099e3da97002d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)
export const auth = getAuth(app)

// 🧪 Emulator NUR im Dev-Modus verbinden
// if (import.meta.env.DEV) {
//   console.log("🔥 Firebase Emulator aktiv")

//   connectFirestoreEmulator(db, "localhost", 8080)
//   connectAuthEmulator(auth, "http://localhost:9099", {
//     disableWarnings: true
//   })
// }