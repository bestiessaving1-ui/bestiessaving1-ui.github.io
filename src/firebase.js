import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAp-lthduwgBxS3zgWo8y1WHORRl9Rov_E",   // ✅ real API key
  authDomain: "besties-app-8d0b1.firebaseapp.com",
  projectId: "besties-app-8d0b1",
  storageBucket: "besties-app-8d0b1.appspot.com",
  messagingSenderId: "1030669020596",
  appId: "1:1030669020596:web:69b86643861367597b96e1",
  measurementId: "G-REG14DSLVS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
