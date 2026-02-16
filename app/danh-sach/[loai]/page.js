import MovieCard from "../../../components/MovieCard";
import Pagination from "../../../components/Pagination";
import { getMovieData,getImageUrl } from "@/lib/movieService";

const TITLES = {
    "phim-moi-cap-nhat": "PHIM MỚI CẬP NHẬT",
    "phim-le": "PHIM LẺ",
    "phim-bo": "PHIM BỘ",
    "hoat-hinh": "PHIM HOẠT HÌNH",
    "tv-shows": "CHƯƠNG TRÌNH TV",
    "phim-chieu-rap": "PHIM CHIẾU RẠP",
};

async function getMoviesByCategory(category, page = 1) {
    if (category === "phim-moi-cap-nhat") {
        return await getMovieData(`/danh-sach/${category}?page=${page}&limit=24`);
    } else {
        return await getMovieData(`/v1/api/danh-sach/${category}?page=${page}&limit=24`);
    }
}

export default async function CategoryPage({ params, searchParams }) {
    const { loai } = await params;
    const search = await searchParams;
    const currentPage = Number(search?.page) || 1;

    const data = await getMoviesByCategory(loai, currentPage);

    let movies = [];
    let totalPages = 1;

    if (loai === "phim-moi-cap-nhat") {
        movies = data?.items || [];
        const pagination = data?.pagination || {};
        totalPages = Math.ceil((pagination.totalItems || 0) / (pagination.totalItemsPerPage || 10));
    } else {
        movies = data?.data?.items || [];
        const pagination = data?.data?.params?.pagination || {};
        totalPages = Math.ceil((pagination.totalItems || 0) / (pagination.totalItemsPerPage || 10));
    }

    // Fallback an toàn
    if (totalPages < 1) totalPages = 1;

    const title = TITLES[loai] || loai.toUpperCase().replace("-", " ");

    return (
        <div className="container mx-auto px-4 py-8 md:px-8 pt-24">
            {/* Header */}
            <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase font-display">
                        KHO <span className="text-primary text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">{title}</span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-2 font-mono uppercase tracking-widest">
                        Tổng hợp phim chất lượng cao
                    </p>
                </div>
                {/* Hiển thị số trang nhỏ gọn ở góc */}
                <div className="hidden md:block text-right">
                    <span className="text-xs text-gray-500 font-bold bg-white/5 px-3 py-1 rounded-full border border-white/10">
                        PAGE {currentPage} / {totalPages}
                    </span>
                </div>
            </div>

            {/* Movie Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {movies.map((movie) => {
                    const posterUrl = getImageUrl(movie.poster_url);

                    return (
                        <MovieCard
                            key={movie._id}
                            movie={{
                                ...movie,
                                poster_url: posterUrl
                            }}
                        />
                    );
                })}
            </div>

            {/* Empty State */}
            {movies.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    Không tìm thấy phim nào.
                </div>
            )}

            {/* --- THANH PHÂN TRANG MỚI --- */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath={`/danh-sach/${loai}`}
            />
        </div>
    );
}