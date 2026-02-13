import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { getMovieData } from "@/lib/movieService";

export const dynamic = 'force-dynamic';

export async function GET(request) {
    // 1. Bảo mật API
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Quét 3 trang đầu để lấy danh sách phim mới cập nhật
        const PAGES_TO_SCAN = [1, 2, 3];
        const responses = await Promise.all(
            PAGES_TO_SCAN.map(page => getMovieData(`/danh-sach/phim-moi-cap-nhat?page=${page}`))
        );

        // Gộp và lọc trùng dựa trên slug
        const rawMovies = responses
            .flatMap(res => res?.items || [])
            .filter((movie, index, self) => self.findIndex(m => m.slug === movie.slug) === index);

        if (!rawMovies.length) {
            return NextResponse.json({ message: "Không lấy được danh sách phim" });
        }

        let notificationCount = 0;
        const batch = dbAdmin.batch();

        for (const rawMovie of rawMovies) {
            const { slug } = rawMovie;

            // Kiểm tra xem có người dùng nào theo dõi phim này không
            const followersSnapshot = await dbAdmin.collectionGroup("watch_later")
                .where("slug", "==", slug)
                .get();

            if (followersSnapshot.empty) continue;

            // Lấy thông tin chi tiết để có tên tập mới nhất chính xác
            const detailData = await getMovieData(`/phim/${slug}`);
            const movieDetail = detailData?.movie || rawMovie;
            const latestEpisode = movieDetail.episode_current || "tập mới";
            
            // Tạo ID an toàn cho Notification (slug + episode)
            const safeEpisodeId = String(latestEpisode).replace(/[^a-zA-Z0-9]/g, '-');

            for (const doc of followersSnapshot.docs) {
                const userId = doc.ref.parent.parent?.id;
                if (!userId) continue;

                const notificationId = `${userId}_${slug}_${safeEpisodeId}`;
                const notiRef = dbAdmin.collection("notifications").doc(notificationId);

                // Kiểm tra xem đã gửi thông báo tập này chưa (tránh spam)
                const notiSnap = await notiRef.get();
                if (notiSnap.exists) continue;

                batch.set(notiRef, {
                    userId,
                    movieSlug: slug,
                    movieName: movieDetail.name,
                    title: "Phim bạn hóng có tập mới!",
                    message: `${movieDetail.name} vừa cập nhật ${latestEpisode}`,
                    poster: movieDetail.poster_url || movieDetail.thumb_url || "",
                    type: "new_episode",
                    isRead: false,
                    createdAt: new Date()
                });

                notificationCount++;
            }
        }

        if (notificationCount > 0) await batch.commit();

        return NextResponse.json({
            success: true,
            scanned: rawMovies.length,
            sent: notificationCount
        });

    } catch (error) {
        console.error("Cron Job Failure:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}