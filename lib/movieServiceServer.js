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

    const slugs = docSnap.data().movie_slugs || [];

    // 2. Từ slug, gọi API lấy thông tin chi tiết
    const moviePromises = slugs.map(async (slug) => {
      try {
        const data = await getMovieData(`/phim/${slug}`);
        
        if (!data || !data.movie) return null;

        return {
          id: data.movie._id,
          name: data.movie.name,
          origin_name: data.movie.origin_name,
          slug: data.movie.slug,
          poster_url: data.movie.poster_url,
          thumb_url: data.movie.thumb_url,
          year: data.movie.year,
          content: data.movie.content,
          episode_current: data.movie.episode_current
        };
      } catch (err) {
        console.error(`Lỗi lấy phim ${slug}:`, err);
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

