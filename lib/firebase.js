import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const getAuthDomain = () => {
  if (typeof window !== "undefined") {
    // 1. Nếu đang chạy Localhost -> Dùng domain gốc của Firebase (để tránh lỗi SSL/Port)
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    }
    // 2. Nếu đã Deploy (Vercel) -> Dùng domain hiện tại (để fix lỗi cookie trên Mobile)
    return window.location.hostname;
  }
  return process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key",
  // authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy.firebaseapp.com",
  // authDomain: typeof window !== "undefined"
  //   ? window.location.hostname
  //   : process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  authDomain: getAuthDomain() || "dummy.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef",
  databaseURL: "https://cine-pro-3d877-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Lỗi cài đặt persistence:", error);
});

// Providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

export { auth, db, googleProvider, facebookProvider, rtdb };