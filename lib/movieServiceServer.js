// lib/movieServiceServer.js
import "server-only"; // Dòng này giúp báo lỗi ngay nếu lỡ import vào Client
import { dbAdmin } from "@/lib/firebase-admin";
import { getMovieData } from "@/lib/movieService";

export async function getHeroMovies() {
  try {
    // 1. Lấy danh sách slug từ Firestore
    const docRef = dbAdmin.collection("configs").doc("hero_banner");
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.warn("Chưa cấu hình hero_banner trong Firebase!");
      return [];
    }

    const data = docSnap.data();
    
    // Ưu tiên lấy từ movies_data (cấu trúc mới với url_name_image)
    // Nếu không có, fallback sang movie_slugs (cấu trúc cũ)
    let moviesData = data.movies_data || [];
    
    if (moviesData.length === 0) {
      const movieSlugs = data.movie_slugs || [];
      moviesData = movieSlugs.map(slug => ({
        slug: slug,
        url_name_image: ""
      }));
    }

    // 2. Từ slug, gọi API lấy thông tin chi tiết
    const moviePromises = moviesData.map(async (movieData) => {
      try {
        const apiData = await getMovieData(`/phim/${movieData.slug}`);
        
        if (!apiData || !apiData.movie) return null;

        return {
          id: apiData.movie._id,
          name: apiData.movie.name,
          origin_name: apiData.movie.origin_name,
          slug: apiData.movie.slug,
          poster_url: apiData.movie.poster_url,
          thumb_url: apiData.movie.thumb_url,
          year: apiData.movie.year,
          content: apiData.movie.content,
          episode_current: apiData.movie.episode_current,
          url_name_image: movieData.url_name_image || "" // ← Thêm field mới
        };
      } catch (err) {
        console.error(`Lỗi lấy phim ${movieData.slug}:`, err);
        return null;
      }
    });

    const movies = (await Promise.all(moviePromises)).filter(m => m !== null);
    return movies;

  } catch (error) {
    console.error("Lỗi getHeroMovies:", error);
    return [];
  }
}

