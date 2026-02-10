import { getMovieData } from "@/lib/movieService";

export default async function MovieDetail({ params }) {
  const { slug } = params;
  
  // Thay thế fetch bằng getMovieData
  const movieData = await getMovieData(`/phim/${slug}`);

  if (!movieData || !movieData.movie) {
    return <div>Không tìm thấy phim</div>;
  }
  
}