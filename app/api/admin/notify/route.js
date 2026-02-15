import { NextResponse } from "next/server";
import { dbAdmin, authAdmin } from "@/lib/firebase-admin";
import { section } from "framer-motion/client";

export async function POST(request) {
    try {
        // 1. Kiểm tra quyền Admin (Giữ nguyên)
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const ADMIN_UIDS = [process.env.ADMIN_UIDS]; 
        if (!ADMIN_UIDS.includes(decodedToken.uid)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Lấy dữ liệu
        const body = await request.json();
        const { slug, movieName, episodeName, posterUrl, link } = body;

        // 3. Quét người theo dõi
        const followersSnapshot = await dbAdmin.collectionGroup("watch_later")
            .where("slug", "==", slug)
            .get();

        if (followersSnapshot.empty) {
            return NextResponse.json({ message: "Không có người theo dõi", count: 0 });
        }

        const batch = dbAdmin.batch();
        let count = 0;
        
        // Tạo ID an toàn cho tập phim (vd: tap-10)
        const safeEpisodeId = String(episodeName).replace(/[^a-zA-Z0-9]/g, '-');
        const createdAt = new Date();

        for (const doc of followersSnapshot.docs) {
            // Lấy userId từ document cha
            const userDocRef = doc.ref.parent.parent;
            if (!userDocRef) continue;
            const userId = userDocRef.id;

            // --- CẤU TRÚC MỚI THEO ẢNH CỦA BẠN ---
            // Collection: notifications (ROOT)
            // Doc ID: userId_slug_tap (để tránh trùng lặp)
            const notificationId = `${userId}_${slug}_${safeEpisodeId}`;
            
            const notiRef = dbAdmin.collection("notifications").doc(notificationId);

            // Kiểm tra trùng
            const notiSnap = await notiRef.get();
            if (notiSnap.exists) continue;

            // Ghi dữ liệu (Khớp field trong ảnh của bạn)
            batch.set(notiRef, {
                userId: userId, // QUAN TRỌNG: để lọc sau này
                movieSlug: slug,
                movieName: movieName,
                title: "Phim bạn hóng có tập mới!",
                message: `${episodeName} vừa cập nhật. Xem ngay!`,
                link: link, // Link xem phim
                poster: posterUrl || "",
                type: "new_episode",
                isRead: false,
                createdAt: createdAt
            });

            count++;
        }

        if (count > 0) await batch.commit();

        return NextResponse.json({ success: true, count });

    } catch (error) {
        console.error("Notify Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}