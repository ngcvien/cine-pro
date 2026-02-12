import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { getMovieData } from "@/lib/movieService";
import { enrichMoviesWithDetail } from "@/app/page"

export const dynamic = 'force-dynamic';

export async function GET(request) {
    // Check bảo mật Cron Secret
    const authHeader = request.headers.get('authorization');
      if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

    try {
        console.log("Cron Job: Bắt đầu kiểm tra phim mới...");

        // 1. Lấy danh sách phim mới cập nhật
        const data = await getMovieData("/danh-sach/phim-moi-cap-nhat?page=1");
        if (!data || !data.items) return NextResponse.json({ message: "Không lấy được data phim." });


        console.log(data);
        const dataWithDetails = await enrichMoviesWithDetail(data.items, data.items.length);
        const newMovies = dataWithDetails;
        const batch = dbAdmin.batch();
        let notificationCount = 0;

        // 2. Duyệt từng phim mới
        for (const movie of newMovies) {
            const { slug, name, poster_url } = movie;

            // Xử lý tên tập an toàn
            let episodeInfo = movie.episode_current;
            if (!episodeInfo) {
                if (movie.quality) episodeInfo = `Bản ${movie.quality}`;
                else episodeInfo = "Mới cập nhật";
            }
            const episodeString = String(episodeInfo);

            // Tìm user đang theo dõi
            const querySnapshot = await dbAdmin.collectionGroup("watch_later")
                .where("slug", "==", slug)
                .get();

            if (querySnapshot.empty) continue;

            for (const doc of querySnapshot.docs) {
                const userId = doc.ref.parent.parent?.id;

                if (userId) {
                    // Tạo ID duy nhất cho tập này
                    const safeIdContent = episodeString.replace(/[^a-zA-Z0-9]/g, '-');
                    const notificationId = `${userId}_${slug}_${safeIdContent}`;

                    const notiRef = dbAdmin.collection("notifications").doc(notificationId);

                    // Kiểm tra xem thông báo này đã tồn tại chưa
                    const notiSnap = await notiRef.get();

                    if (notiSnap.exists) {
                        console.log(`Skip: Đã báo ${name} - ${episodeString} cho user ${userId}`);
                        continue;
                    }

                    // Nếu chưa có thì mới thêm vào batch để tạo mới
                    batch.set(notiRef, {
                        userId: userId,
                        movieSlug: slug,
                        movieName: name,
                        title: "Phim hóng có tập mới!",
                        message: `Vừa cập nhật ${episodeString}`,
                        poster: poster_url || "",
                        type: "new_episode",
                        isRead: false,
                        createdAt: new Date()
                    }); 

                    notificationCount++;
                }
            }
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