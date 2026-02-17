import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin"; // Đảm bảo import đúng
import { getMovieData } from "@/lib/movieService"; // Hàm lấy data từ API

// Hàm logic core (bạn có thể để ở file service hoặc viết thẳng vào đây)
async function getHeroMoviesHybrid() {
    try {
        const docRef = dbAdmin.collection("configs").doc("hero_banner");
        const docSnap = await docRef.get();

        if (!docSnap.exists) return [];
        const slugs = docSnap.data().movie_slugs || [];

        // Dùng Promise.all để tải song song
        const movies = await Promise.all(slugs.map(async (slug) => {
            try {
                // 1. Ưu tiên tìm trong Custom Movies (Firebase) trước
                const customDoc = await dbAdmin.collection("custom_movies").doc(slug).get();
                if (customDoc.exists) {
                    const data = customDoc.data();
                    return {
                        _id: customDoc.id,
                        name: data.name || data.movie?.name,
                        slug: data.slug || data.movie?.slug,
                        poster_url: data.poster_url || data.movie?.poster_url,
                        thumb_url: data.thumb_url || data.movie?.thumb_url,
                        year: data.year || data.movie?.year,
                        is_custom: true // Đánh dấu
                    };
                }

                // 2. Nếu không có, gọi API PhimApi
                const data = await getMovieData(`/phim/${slug}`);
                if (data?.movie) {
                    return {
                        _id: data.movie._id,
                        name: data.movie.name,
                        slug: data.movie.slug,
                        poster_url: data.movie.poster_url,
                        thumb_url: data.movie.thumb_url,
                        year: data.movie.year,
                        is_custom: false
                    };
                }
                return null;
            } catch (err) {
                return null;
            }
        }));

        return movies.filter(m => m !== null);
    } catch (error) {
        console.error("Lỗi getHeroMovies:", error);
        return [];
    }
}

export async function GET() {
    const movies = await getHeroMoviesHybrid();
    return NextResponse.json(movies);
}