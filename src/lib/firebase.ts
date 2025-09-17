import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  projectId: "studio-5485885718-fe943",
  appId: "1:591058036897:web:e09af04c6dda2dae77e8e0",
  storageBucket: "studio-5485885718-fe943.firebasestorage.app",
  apiKey: "AIzaSyCdYFnRNQztaneidsT36OyR6nZJdz9yBQw",
  authDomain: "studio-5485885718-fe943.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "591058036897",
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export { app };
