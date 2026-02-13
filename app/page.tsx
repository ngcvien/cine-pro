import fs from "fs";
import { getMovieData } from "@/lib/movieService";
import { getHeroMovies } from "@/lib/movieServiceServer";
import path from "path";

import MovieCard from "../components/MovieCard";
import HeroSection from "../components/HeroSection";
import WatchingNow from "../components/WatchingNow";
import ContinueWatching from "../components/ContinueWatching";
import Link from "next/link";
import RankedMovieCard from "../components/RankedMovieCard";
import CircularMovieCard from '../components/CircularMovieCard';
import MagazineMovieCard from '../components/MagazineMovieCard';
import StackedMovieCard from '../components/StackedMovieCard';
import VietnameseCinemaSection from "../components/VietnameseCinemaSection";
import { ChevronRight, Flame, TrendingUp, Clock, Star, Sparkles } from "lucide-react";

import {
  NeonGlowSection,
  BrutalistSection,
  GradientMeshSection,
  GlassMorphismSection
} from "../components/MovieSections"


// Hàm chuẩn hóa URL ảnh (để tránh lỗi ảnh 404)
function normalizePosterUrl(movie: any) {
  return {
    ...movie,
    poster_url: movie.poster_url?.startsWith('http')
      ? movie.poster_url
      : `https://phimimg.com/${movie.poster_url}`,
    thumb_url: movie.thumb_url?.startsWith('http')
      ? movie.thumb_url
      : `https://phimimg.com/${movie.thumb_url}`
  };
}

// Đọc danh sách slug phim "hot" từ file JSON (bạn chỉnh file data/hero-slugs.json để đổi phim hiển thị)
function getHeroSlugs(): string[] {
  try {
    const filePath = path.join(process.cwd(), "data", "hero-slugs.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string" && s.trim()) : [];
  } catch {
    return [];
  }
}



// Bổ sung quality + episode_current cho các phim hero (API danh sách không trả về 2 trường này)
export async function enrichMoviesWithDetail(movies: any[], limit: number = 5): Promise<any[]> {
  // console.log("Enriching movies with detail for first", limit, "movies.");
  // console.log("Movies to enrich:", movies.slice(0, limit).map(m => m.slug));
  const toEnrich = movies.slice(0, limit);
  const enriched = await Promise.all(
    toEnrich.map(async (movie) => {
      if (!movie?.slug) return movie;
      try {

        const data = await getMovieData(`phim/${movie.slug}`, {
          next: { revalidate: 3600 },
        })
        const detail = data?.movie;
        if (!detail) return movie;
        return {
          ...movie,
          quality: detail.quality ?? movie.quality,
          episode_current: detail.episode_current ?? movie.episode_current,
          content: detail.content ?? movie.content,
        };
      } catch {
        return movie;
      }
    })
  );
  return [...enriched, ...movies.slice(limit)];
}

// Lấy phim theo thể loại
async function getCategories(category: string) {
  return await getMovieData(`/v1/api/the-loai/${category}?page=1`);
}

// lấy phim theo danh sách
async function getCatalog(category: string) {
  return await getMovieData(`/v1/api/danh-sach/${category}?page=1`);
}
// 1. Lấy Phim Mới (Dùng cho Hero Section + List Phim Mới)
async function getNewMovies() {
  return await getMovieData("/danh-sach/phim-moi-cap-nhat?page=1", {
    next: { revalidate: 60 }
  });
}

// 2. Lấy Phim Lẻ
async function getSingleMovies() {
  return await getMovieData("/v1/api/danh-sach/phim-le?page=1");
}

async function getVietnamMovies() {
  return await getMovieData("/v1/api/quoc-gia/viet-nam?page=1");
}

// 3. Lấy Phim Bộ
async function getSeriesMovies() {
  return await getMovieData("/v1/api/danh-sach/phim-bo?page=1");
}

// 4. Lấy Hoạt Hình
async function getCartoonMovies() {
  return await getMovieData("/v1/api/danh-sach/hoat-hinh?page=1");
}

export default async function Home() {
  // Gọi song song tất cả API để tiết kiệm thời gian
  const [newData, singleData, seriesData, cartoonData, vietnamData, documentData, horrorData, lovesData, heroMovies] = await Promise.all([
    getNewMovies(),
    getSingleMovies(),
    getSeriesMovies(),
    getCartoonMovies(),
    getVietnamMovies(),
    getCategories("tai-lieu"),
    getCategories("kinh-di"),
    getCategories("tinh-cam"),
    getHeroMovies()
  ]);

  // Chuẩn hóa dữ liệu
  const newMovies = newData?.items?.map(normalizePosterUrl) || [];
  const singleMovies = singleData?.data?.items?.map(normalizePosterUrl) || [];
  const seriesMovies = seriesData?.data?.items?.map(normalizePosterUrl) || [];
  const cartoonMovies = cartoonData?.data?.items?.map(normalizePosterUrl) || [];
  const vietnamMovies = vietnamData?.data?.items?.map(normalizePosterUrl) || [];
  const documentMovies = documentData?.data?.items?.map(normalizePosterUrl) || [];
  const horrorMovies = horrorData?.data?.items?.map(normalizePosterUrl) || [];
  const lovesMovies = lovesData?.data?.items?.map(normalizePosterUrl) || [];

  // 5 phim đầu (cho Hero) gọi thêm API chi tiết để có quality + episode_current (API danh sách không trả về)
  const newMoviesWithHeroDetail: any[] =
    newMovies.length > 0 ? await enrichMoviesWithDetail(newMovies, 5) : [];

  // console.log("Hero Movies:", heroMovies);

  return (
    <div className="container mx-auto px-4 md:px-1 space-y-16 pb-20">

      {/* 1. HERO SECTION (Truyền danh sách đã bổ sung quality, episode_current) */}
      {heroMovies.length > 0 && (
        <HeroSection movies={heroMovies as any} />
      )}

      {/* 2. WATCHING NOW (Phim đang xem - Client Component) */}
      {/* <WatchingNow /> */}

      {/* 3. CONTINUE WATCHING (Tiếp tục xem - Client Component) */}
      <ContinueWatching />

      {/* 4. PHIM MỚI CẬP NHẬT */}
      {/* <MovieSection
        title="NÓNG HỔI"
        subtitle="VỪA THỔI VỪA XEM"
        description="DANH SÁCH CÁC BỘ PHIM VỪA ĐƯỢC THÊM VÀO HỆ THỐNG."
        link="/danh-sach/phim-moi-cap-nhat"
        movies={(newMoviesWithHeroDetail.length > 0 ? newMoviesWithHeroDetail : newMovies) as any}
      /> */}
      <GlassMorphismSection
        title="NÓNG HỔI"
        subtitle="VỪA THỔI VỪA XEM"
        description="DANH SÁCH CÁC BỘ PHIM VỪA ĐƯỢC THÊM VÀO HỆ THỐNG."
        link="/danh-sach/phim-moi-cap-nhat"
        movies={(newMoviesWithHeroDetail.length > 0 ? newMoviesWithHeroDetail : newMovies) as any}
        // CardComponent={StackedMovieCard}
      />


      {/* 5. PHIM LẺ */}
      {/* <MovieSection
        title="ĐÁNH NHANH"
        subtitle="THẮNG GỌN"
        description="90 phút thăng hoa cảm xúc cùng phim lẻ."
        link="/danh-sach/phim-le"
        movies={singleMovies}
      // CardComponent={StackedMovieCard}
      /> */}


      <VietnameseCinemaSection
        title="PHIM"
        subtitle="VIỆT NAM"
        description="Tự hào điện ảnh Việt Nam - Xem ngay những bộ phim Việt xuất sắc nhất."
        link="/quoc-gia/viet-nam"
        movies={vietnamMovies}
        CardComponent={MovieCard}
      />

      {/* 6. PHIM BỘ */}
      <MovieSection
        title="CÀY XUYÊN ĐÊM"
        subtitle="TEAM MẮT GẤU TRÚC"
        description="Chuẩn bị sẵn khăn giấy và thuốc nhỏ mắt. Một khi đã nhấn Play là không thể lối thoát."
        link="/danh-sach/phim-bo"
        movies={seriesMovies}
      />

      {/* 7. HOẠT HÌNH */}
      <NeonGlowSection
        title="WIBU LAND"
        subtitle="THẾ GIỚI 2D"
        description="Khi thế giới thực quá áp lực, hãy trốn vào đây. Waifu và Husbandu đang chờ bạn."
        link="/danh-sach/hoat-hinh"
        movies={cartoonMovies}
        CardComponent={MagazineMovieCard}
      />

        {/* test */}
      {/* <GradientMeshSection
        title="WIBU LAND"
        subtitle="THẾ GIỚI 2D"
        description="Khi thế giới thực quá áp lực, hãy trốn vào đây. Waifu và Husbandu đang chờ bạn."
        link="/danh-sach/hoat-hinh"
        movies={cartoonMovies}
        CardComponent={RankedMovieCard}
      /> */}

      <MovieSection
        title="XEM"
        subtitle="ĐỂ HIỂU"
        description="SỰ THẬT, KIẾN THỨC VÀ GÓC NHÌN THỰC TẾ."
        link="/the-loai/tai-lieu"
        movies={documentMovies}
      />

      <MovieSection
        title="TẮT ĐÈN"
        subtitle="ĐỪNG NHÌN RA SAU"
        description="Khuyến cáo không xem khi ở nhà một mình. Chúng tôi không chịu trách nhiệm nếu bạn mất ngủ."
        link="/the-loai/kinh-di"
        movies={horrorMovies}
      />

      <MovieSection
        title="TÌNH BỂ BÌNH"
        subtitle="NGỌT HƠN ĐƯỜNG"
        description="Cẩu lương ngập mặt. Chống chỉ định cho hội FA lâu năm vì xem xong sẽ muốn có người yêu."
        link="/the-loai/tinh-cam"
        movies={lovesMovies}
        CardComponent={StackedMovieCard}
      />

    </div>
  );
}

// --- Component phụ để tái sử dụng giao diện Section ---
function MovieSection({ title, subtitle, description, link, movies }: any) {
  if (!movies || movies.length === 0) return null;

  return (
    <div>
      <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4 items-end">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
            {title} <span className="text-primary">{subtitle}</span>
          </h2>
          <p className="text-gray-500 text-[10px] md:text-sm mt-2 font-mono uppercase tracking-widest">
            {description}
          </p>
        </div>

        <Link
          href={link}
          className="group px-2 mt-2 sm:px-2.5 py-2 sm:py-2.5 md:py-3  bg-white/10 hover:bg-white/20 border border-white/20 hover:border-primary rounded-xl sm:rounded-2xl transition-all duration-300 self-start sm:self-auto hover:px-4 sm:hover:px-5 md:hover:px-6"
        >
          <span className="flex items-center gap-1.5 sm:gap-2 text-white group-hover:text-primary font-black text-xs sm:text-sm whitespace-nowrap">
            <span className="hidden group-hover:inline transition-all duration-300">XEM TẤT CẢ</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link> 

      </div>

      <div className="-mx-4 px-4 md:-mx-8 md:px-8">
        {/* Thanh cuộn ngang ẩn scrollbar */}
        <div className="flex gap-4 overflow-x-auto pb-8 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {movies.map((movie: any) => (
            <div key={movie._id} className="flex-shrink-0 w-[160px] md:w-[200px]">
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}