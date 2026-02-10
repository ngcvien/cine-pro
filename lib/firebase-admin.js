import admin from "firebase-admin";

// Kiểm tra xem đã khởi tạo app chưa để tránh lỗi "App already exists"
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Xử lý lỗi xuống dòng của Private Key khi deploy lên Vercel
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        : undefined,
    }),
  });
}

// Export dbAdmin để dùng trong API Route
export const dbAdmin = admin.firestore();