import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyACENpHBZ2EyFzngBC2yuK_ddlsf45rluU",
  authDomain: "reale-40c3f.firebaseapp.com",
  projectId: "reale-40c3f",
  storageBucket: "reale-40c3f.firebasestorage.app",
  messagingSenderId: "360101403087",
  appId: "1:360101403087:web:4d783d424933fd1273daba",
  measurementId: "G-4DWWSBF399"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;
