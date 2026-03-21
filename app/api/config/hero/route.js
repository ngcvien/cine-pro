import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin"; // Đảm bảo import đúng
import { getMovieData } from "@/lib/movieService"; // Hàm lấy data từ API

// Hàm logic core (bạn có thể để ở file service hoặc viết thẳng vào đây)
async function getHeroMoviesHybrid() {
    try {
        console.log("[API] Starting getHeroMoviesHybrid...");
        
        const docRef = dbAdmin.collection("configs").doc("hero_banner");
        const docSnap = await docRef.get();

        console.log("[API] Firestore query completed, doc exists:", docSnap.exists);
        
        if (!docSnap.exists) {
            console.log("[API] hero_banner document does not exist!");
            return [];
        }
        
        const data = docSnap.data();
        console.log("[API] Firestore hero_banner data keys:", Object.keys(data));
        console.log("[API] movies_data exists:", !!data.movies_data);
        console.log("[API] movie_slugs exists:", !!data.movie_slugs);
        
        // Ưu tiên lấy từ movies_data (cấu trúc mới với url_name_image)
        // Nếu không có, khởi tạo từ movie_slugs (cấu trúc cũ) và thêm empty url_name_image
        let moviesData = data.movies_data || [];
        
        console.log("[API] Initial moviesData length:", moviesData.length);
        
        // Nếu movies_data trống, tạo từ movie_slugs
        if (moviesData.length === 0) {
            const movieSlugs = data.movie_slugs || [];
            console.log("[API] Converting movie_slugs to moviesData, count:", movieSlugs.length);
            moviesData = movieSlugs.map(slug => ({
                slug: slug,
                url_name_image: ""
            }));
        }

        // Dùng Promise.all để tải song song
        const movies = await Promise.all(moviesData.map(async (movieData) => {
            const slug = movieData.slug;
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
                        url_name_image: movieData.url_name_image || "", // Lấy từ movieData
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
                        url_name_image: movieData.url_name_image || "", // Lấy từ movieData
                        is_custom: false
                    };
                }
                return null;
            } catch (err) {
                console.error(`Lỗi fetch phim ${slug}:`, err);
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
    
    console.log("[API] Hero Movies Response:", JSON.stringify(movies, null, 2));
    
    return NextResponse.json(movies);
}