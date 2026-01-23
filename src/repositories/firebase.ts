// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
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