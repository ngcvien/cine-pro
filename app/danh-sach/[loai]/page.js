import MovieCard from "../../../components/MovieCard";

const TITLES = {
    "phim-le": "PHIM LẺ",
    "phim-bo": "PHIM BỘ",
    "hoat-hinh": "PHIM HOẠT HÌNH",
    "tv-shows": "CHƯƠNG TRÌNH TV"
};

async function getMoviesByCategory(category) {
    try {
        const res = await fetch(`https://phimapi.com/v1/api/danh-sach/${category}?limit=24`, { next: { revalidate: 3600 } });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        return null;
    }
}

export default async function CategoryPage({ params }) {
    const { loai } = await params;
    const data = await getMoviesByCategory(loai);
    const movies = data?.data?.items || [];
    
    const title = TITLES[loai] || loai.toUpperCase().replace("-", " ");

    return (
        <div className="container mx-auto px-4 py-8 md:px-8">
            <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase">
                        KHO <span className="text-primary">{title}</span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-2 font-mono">
                        CẬP NHẬT MỚI NHẤT TỪ HỆ THỐNG
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {movies.map((movie) => (
                    <MovieCard 
                        key={movie._id} 
                        movie={{
                            ...movie,
                            poster_url: `https://phimimg.com/${movie.poster_url}` 
                        }} 
                    />
                ))}
            </div>
        </div>
    );
}