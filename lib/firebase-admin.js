import admin from "firebase-admin";

// Kiểm tra xem đã khởi tạo app chưa để tránh lỗi "App already exists"
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Xử lý xuống dòng trong private key (quan trọng)
      privateKey: process.env.FIREBASE_PRIVATE_KEY 
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") 
        : undefined,
    }),
  });
}

const dbAdmin = admin.firestore();
const authAdmin = admin.auth();

export { dbAdmin, authAdmin }; 