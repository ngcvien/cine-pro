import fs from "fs";
import path from "path";
import MovieCard from "../components/MovieCard";
import HeroSection from "../components/HeroSection";
import WatchingNow from "../components/WatchingNow";
import ContinueWatching from "../components/ContinueWatching";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import RankedMovieCard from "../components/RankedMovieCard";
import CircularMovieCard from '../components/CircularMovieCard';
import MagazineMovieCard from '../components/MagazineMovieCard';
import StackedMovieCard from '../components/StackedMovieCard';
import VietnameseCinemaSection from "../components/VietnameseCinemaSection";
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

// Lấy chi tiết phim theo slug từ API, trả về đúng format HeroSection cần
async function getHeroMovies(): Promise<any[]> {
  const slugs = getHeroSlugs();
  if (slugs.length === 0) return [];

  const results = await Promise.all(
    slugs.map(async (slug) => {
      try {
        const res = await fetch(`https://phimapi.com/phim/${slug}`, {
          next: { revalidate: 3600 },
        });
        if (!res.ok) return null;
        const data = await res.json();
        const movie = data?.movie;
        if (!movie?.slug) return null;
        const normalized = normalizePosterUrl({
          ...movie,
          _id: movie._id || movie.slug,
        });
        return normalized;
      } catch {
        return null;
      }
    })
  );

  return results.filter(Boolean);
}

// Bổ sung quality + episode_current cho các phim hero (API danh sách không trả về 2 trường này)
export async function enrichMoviesWithDetail(movies: any[], limit: number = 5): Promise<any[]> {
  const toEnrich = movies.slice(0, limit);
  const enriched = await Promise.all(
    toEnrich.map(async (movie) => {
      if (!movie?.slug) return movie;
      try {
        const res = await fetch(`https://phimapi.com/phim/${movie.slug}`, {
          next: { revalidate: 3600 },
        });
        if (!res.ok) return movie;
        const data = await res.json();
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
  try {
    const res = await fetch(`https://phimapi.com/v1/api/the-loai/${category}?page=1`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

// lấy phim theo danh sách
async function getCatalog(category: string) {
  try {
    const res = await fetch(`https://phimapi.com/v1/api/danh-sach/${category}?page=1`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

// 1. Lấy Phim Mới (Dùng cho Hero Section + List Phim Mới)
async function getNewMovies() {
  try {
    const res = await fetch("https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1", {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error("Failed");
    return res.json();
  } catch (error) {
    return null;
  }
}

// 2. Lấy Phim Lẻ
async function getSingleMovies() {
  try {
    const res = await fetch("https://phimapi.com/v1/api/danh-sach/phim-le?page=1", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

async function getVietnamMovies() {
  try {
    const res = await fetch("https://phimapi.com//v1/api/quoc-gia/viet-nam?page=1", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

// 3. Lấy Phim Bộ
async function getSeriesMovies() {
  try {
    const res = await fetch("https://phimapi.com/v1/api/danh-sach/phim-bo?page=1", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

// 4. Lấy Hoạt Hình
async function getCartoonMovies() {
  try {
    const res = await fetch("https://phimapi.com/v1/api/danh-sach/hoat-hinh?page=1", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export default async function Home() {
  // Gọi song song tất cả API để tiết kiệm thời gian
  const [newData, singleData, seriesData, cartoonData, vietnamData, documentData, horrorData, lovesData] = await Promise.all([
    getNewMovies(),
    getSingleMovies(),
    getSeriesMovies(),
    getCartoonMovies(),
    getVietnamMovies(),
    getCategories("tai-lieu"),
    getCategories("kinh-di"),
    getCategories("tinh-cam"),
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

  return (
    <div className="container mx-auto px-4 md:px-1 space-y-16 pb-20">

      {/* 1. HERO SECTION (Truyền danh sách đã bổ sung quality, episode_current) */}
      {newMoviesWithHeroDetail.length > 0 && (
        <HeroSection movies={newMoviesWithHeroDetail as any} />
      )}

      {/* 2. WATCHING NOW (Phim đang xem - Client Component) */}
      <WatchingNow />

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
        CardComponent={StackedMovieCard}
      />


      {/* 5. PHIM LẺ */}
      <MovieSection
        title="ĐÁNH NHANH"
        subtitle="THẮNG GỌN"
        description="90 phút thăng hoa cảm xúc cùng phim lẻ."
        link="/danh-sach/phim-le"
        movies={singleMovies}
      // CardComponent={StackedMovieCard}
      />


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
      <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
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
          className="
    relative group inline-flex items-center gap-2
    rounded-xl px-3 py-2
    border border-white/15
    bg-white/5 backdrop-blur-md
    overflow-hidden
    transition-all duration-300
    hover:border-primary/60 hover:bg-white/10
  "
        >
          {/* Glow layer */}
          <span
            className="
      absolute inset-0 rounded-xl opacity-0
      bg-gradient-to-r from-primary/30 via-transparent to-primary/30
      group-hover:opacity-100 transition-opacity duration-300
    "
          />

          <span
            className="
      relative overflow-hidden max-w-0
      group-hover:max-w-[8rem]
      transition-[max-width] duration-300 ease-out
      whitespace-nowrap text-xs font-bold
      text-gray-400 group-hover:text-primary
    "
          >
            XEM TẤT CẢ
          </span>

          <ChevronRight
            className="
      relative w-4 h-4
      text-gray-400 group-hover:text-primary
      transition-transform duration-300
      group-hover:translate-x-1
    "
          />
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