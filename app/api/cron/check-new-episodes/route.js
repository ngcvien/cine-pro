import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { getMovieData } from "@/lib/movieService";

export const dynamic = 'force-dynamic';

export async function GET(request) {
    // Check bảo mật Cron Secret (như cũ)
    const authHeader = request.headers.get('authorization');
      if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

    try {
        console.log("Cron Job: Bắt đầu kiểm tra phim mới...");

        // 1. Lấy danh sách phim mới cập nhật
        const data = await getMovieData("/danh-sach/phim-moi-cap-nhat?page=1");
        if (!data || !data.items) return NextResponse.json({ message: "Không lấy được data phim." });

        const newMovies = data.items;
        const batch = dbAdmin.batch();
        let notificationCount = 0;

        // 2. Duyệt từng phim mới
        // 2. Duyệt từng phim mới
        for (const movie of newMovies) {
            // Dùng let thay vì const để có thể gán lại giá trị mặc định nếu thiếu
            let { slug, name, episode_current, poster_url } = movie;

            // --- SỬA LỖI TẠI ĐÂY ---
            // 1. Kiểm tra nếu thiếu episode_current thì gán mặc định là "Mới"
            if (!episode_current) {
                episode_current = "!";
            }

            // 2. Đảm bảo nó là String trước khi replace (đôi khi API trả về số)
            const episodeString = String(episode_current);
            // -----------------------

            const querySnapshot = await dbAdmin.collectionGroup("watch_later")
                .where("slug", "==", slug)
                .get();

            if (querySnapshot.empty) continue;

            querySnapshot.forEach(doc => {
                // Lấy ID user từ document cha (users/{userId}/watch_later/{slug})
                const userId = doc.ref.parent.parent?.id;

                if (userId) {
                    // Xử lý chuỗi an toàn
                    const safeEpisode = episodeString.replace(/[^a-zA-Z0-9]/g, '-');

                    // Tạo ID thông báo duy nhất
                    const notificationId = `${userId}_${slug}_${safeEpisode}`;

                    const notiRef = dbAdmin.collection("notifications").doc(notificationId);

                    batch.set(notiRef, {
                        userId: userId,
                        movieSlug: slug,
                        movieName: name,
                        title: "Phim bạn theo dõi có tập mới!",
                        message: `${name} vừa cập nhật ${episodeString}`,
                        poster: poster_url || "", // Fallback nếu thiếu ảnh
                        type: "new_episode",
                        isRead: false,
                        createdAt: new Date()
                    }, { merge: true });

                    notificationCount++;
                }
            });
        }
        // 4. Ghi vào DB
        if (notificationCount > 0) {
            await batch.commit();
        }

        return NextResponse.json({
            success: true,
            processed: newMovies.length,
            notifications: notificationCount
        });

    } catch (error) {
        console.error("Cron Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}