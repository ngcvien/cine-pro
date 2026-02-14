import { NextResponse } from "next/server";
import { authAdmin, dbAdmin } from "@/lib/firebase-admin"; // Đảm bảo bạn đã setup firebase-admin
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request) {
  try {
    // 1. Lấy dữ liệu từ Client gửi lên
    const { sessionId, idToken } = await request.json();

    if (!sessionId || !idToken) {
      return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
    }

    // 2. Xác thực người dùng (Verify ID Token)
    // Bước này để đảm bảo người đang bấm nút là user thật, không phải hacker
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // 3. TẠO CUSTOM TOKEN (Quan trọng cho TV)
    // Token này cho phép TV đăng nhập mà không cần mật khẩu
    const customToken = await authAdmin.createCustomToken(uid);

    // 4. Ghi vào Firestore để TV lắng nghe
    await dbAdmin.collection("login_sessions").doc(sessionId).set({
      token: customToken,      // Token để TV đăng nhập
      uid: uid,                // Lưu thêm UID để biết ai đăng nhập
      status: "success",       // Trạng thái để TV biết đã xong
      timestamp: FieldValue.serverTimestamp(), // Thời gian thực
      deviceInfo: "Web Login"  // (Optional) Thông tin thiết bị
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("TV Auth Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}