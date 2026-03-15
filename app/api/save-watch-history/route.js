import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      // Nếu JSON parse fail, thử text vì sendBeacon có thể gửi text
      const text = await request.text();
      body = JSON.parse(text);
    }

    const { uid, slug, episodeSlug, currentTime } = body;

    // Validation
    if (!uid || !slug || currentTime <= 0) {
      console.warn("❌ Missing required fields:", { uid, slug, currentTime });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update Firestore with admin SDK (không cần auth)
    const historyRef = dbAdmin
      .collection("users")
      .doc(uid)
      .collection("history")
      .doc(slug);

    // Lưu dữ liệu lên Firebase
    await historyRef.update({
      seconds: currentTime,
      last_watched: new Date(),
      [`details.${episodeSlug}`]: currentTime,
    });

    console.log(`  Saved watch history for user ${uid}, video ${slug}, time ${currentTime}s`);

    return NextResponse.json(
      { success: true, message: "Watch history saved" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error saving watch history:", error);
    // Không throw error, vì sendBeacon không cần response
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
