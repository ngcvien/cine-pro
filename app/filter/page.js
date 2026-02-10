"use client";

import { useState, useEffect } from "react";
import MovieCard from "../../components/MovieCard";
import { Filter, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";

export default function FilterPage() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    // State phân trang
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

    // State bộ lọc (Bỏ phần lọc điểm số)
    const initialFilterState = {
        type_list: "phim-le",     // Mặc định
        category: "",
        country: "",
        year: "",
        sort_field: "modified.time",
        sort_type: "desc",
        sort_lang: "",
    };

    const [filters, setFilters] = useState(initialFilterState);

    // State data cho select options
    const [categories, setCategories] = useState([]);
    const [countries, setCountries] = useState([]);

    // State toggle mobile menu
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // 1. Fetch danh sách Thể loại & Quốc gia
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [catRes, countryRes] = await Promise.all([
                    fetch("https://phimapi.com/the-loai"),
                    fetch("https://phimapi.com/quoc-gia")
                ]);
                const catData = await catRes.json();
                const countryData = await countryRes.json();
                setCategories(catData || []);
                setCountries(countryData || []);
            } catch (error) {
                console.error("Lỗi lấy options:", error);
            }
        };
        fetchOptions();
    }, []);

    // 2. Fetch Phim (Chạy khi filter hoặc page thay đổi)
    useEffect(() => {
        const fetchMovies = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    page: pagination.currentPage,
                    limit: 24,
                    sort_field: filters.sort_field,
                    sort_type: filters.sort_type,
                });

                if (filters.category) params.append("category", filters.category);
                if (filters.country) params.append("country", filters.country);
                if (filters.year) params.append("year", filters.year);
                if (filters.sort_lang) params.append("sort_lang", filters.sort_lang);

                const res = await fetch(`https://phimapi.com/v1/api/danh-sach/${filters.type_list}?${params.toString()}`);
                const data = await res.json();

                if (data.status === "success" || data.status === true) {
                    setMovies(data.data.items || []);

                    setPagination({
                        currentPage: data.data.params.pagination.currentPage,
                        totalPages: Math.ceil(data.data.params.pagination.totalItems / data.data.params.pagination.totalItemsPerPage)
                    });
                } else {
                    setMovies([]);
                }
            } catch (error) {
                console.error("Lỗi lấy phim:", error);
                setMovies([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMovies();
    }, [filters, pagination.currentPage]); // Dependency: Chạy lại khi filters hoặc page đổi

    // Handler thay đổi filter
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset về trang 1
    };

    // Handler Reset
    const handleReset = () => {
        setFilters(initialFilterState);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        setIsFilterOpen(false); // Đóng menu mobile nếu đang mở
    };

    // Handler chuyển trang (Client-side)
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, currentPage: newPage }));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Generate Year Options
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1970 + 1 }, (_, i) => currentYear - i);

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-20 font-sans">
            <div className="container mx-auto px-4 md:px-8">

                {/* HEADER */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
                            <Filter className="text-primary" size={32} />
                            BỘ LỌC <span className="text-primary">PHIM</span>
                        </h1>
                        <p className="text-gray-400 mt-2 font-mono text-sm">TÌM KIẾM PHIM THEO SỞ THÍCH</p>
                    </div>

                    {/* Mobile Filter Toggle Button */}
                    <button
                        className="md:hidden flex items-center gap-2 bg-primary text-black px-4 py-2 rounded-lg font-bold hover:scale-105 transition-transform"
                        onClick={() => setIsFilterOpen(true)}
                    >
                        <SlidersHorizontal size={18} /> Mở bộ lọc
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 relative">

                    {/* --- SIDEBAR FILTERS (ĐÃ SỬA GIAO DIỆN MOBILE) --- */}
                    {/* Overlay nền đen cho mobile */}
                    {isFilterOpen && (
                        <div className="fixed inset-0 bg-black/80 z-40 lg:hidden" onClick={() => setIsFilterOpen(false)} />
                    )}

                    <div className={`
              lg:w-1/4 lg:block 
              fixed inset-y-0 left-0 w-[80%] max-w-[300px] bg-[#121212] z-50 p-6 overflow-y-auto transition-transform duration-300 ease-in-out lg:static lg:bg-transparent lg:p-0 lg:z-auto lg:transform-none lg:overflow-visible
              ${isFilterOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
          `}>

                        {/* Header Mobile Menu */}
                        <div className="flex justify-between items-center mb-2 lg:hidden">
                            <h3 className="font-bold text-xl text-white mt-13">Bộ lọc</h3>
                            <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-white/10 mt-13 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="bg-[#121212] lg:p-6 lg:rounded-xl lg:border lg:border-white/10 lg:sticky lg:top-24 space-y-4">

                            {/* 1. Loại Phim */}
                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Loại Phim</label>
                                <select
                                    name="type_list"
                                    value={filters.type_list}
                                    onChange={handleFilterChange}
                                    className="w-full bg-black border border-white/20 rounded px-3 py-2 text-white focus:border-primary outline-none"
                                >
                                    <option value="phim-le">Phim Lẻ</option>
                                    <option value="phim-bo">Phim Bộ</option>
                                    <option value="hoat-hinh">Hoạt Hình</option>
                                    <option value="tv-shows">TV Shows</option>
                                </select>
                            </div>

                            {/* 2. Thể Loại */}
                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Thể Loại</label>
                                <select
                                    name="category"
                                    value={filters.category}
                                    onChange={handleFilterChange}
                                    className="w-full bg-black border border-white/20 rounded px-3 py-2 text-white focus:border-primary outline-none"
                                >
                                    <option value="">-- Tất cả --</option>
                                    {categories.map((cat) => (
                                        <option key={cat._id} value={cat.slug}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 3. Quốc Gia */}
                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Quốc Gia</label>
                                <select
                                    name="country"
                                    value={filters.country}
                                    onChange={handleFilterChange}
                                    className="w-full bg-black border border-white/20 rounded px-3 py-2 text-white focus:border-primary outline-none"
                                >
                                    <option value="">-- Tất cả --</option>
                                    {countries.map((c) => (
                                        <option key={c._id} value={c.slug}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 4. Năm Phát Hành */}
                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Năm</label>
                                <select
                                    name="year"
                                    value={filters.year}
                                    onChange={handleFilterChange}
                                    className="w-full bg-black border border-white/20 rounded px-3 py-2 text-white focus:border-primary outline-none"
                                >
                                    <option value="">-- Tất cả --</option>
                                    {years.map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 5. Ngôn ngữ */}
                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Ngôn Ngữ</label>
                                <select
                                    name="sort_lang"
                                    value={filters.sort_lang}
                                    onChange={handleFilterChange}
                                    className="w-full bg-black border border-white/20 rounded px-3 py-2 text-white focus:border-primary outline-none"
                                >
                                    <option value="">-- Tất cả --</option>
                                    <option value="vietsub">Vietsub</option>
                                    <option value="thuyet-minh">Thuyết Minh</option>
                                    <option value="long-tieng">Lồng Tiếng</option>
                                </select>
                            </div>

                            {/* 6. Sắp xếp */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Sắp xếp</label>
                                    <select
                                        name="sort_field"
                                        value={filters.sort_field}
                                        onChange={handleFilterChange}
                                        className="w-full bg-black border border-white/20 rounded px-3 py-2 text-white text-xs focus:border-primary outline-none"
                                    >
                                        <option value="modified.time">Ngày cập nhật</option>
                                        <option value="year">Năm sản xuất</option>
                                        <option value="_id">ID Phim</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Thứ tự</label>
                                    <select
                                        name="sort_type"
                                        value={filters.sort_type}
                                        onChange={handleFilterChange}
                                        className="w-full bg-black border border-white/20 rounded px-3 py-2 text-white text-xs focus:border-primary outline-none"
                                    >
                                        <option value="desc">Mới nhất</option>
                                        <option value="asc">Cũ nhất</option>
                                    </select>
                                </div>
                            </div>

                            {/* Reset Button */}
                            <button
                                onClick={handleReset}
                                className="w-full mt-6 bg-white/5 hover:bg-white/10 text-white font-bold py-2 rounded transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                <X size={16} /> Đặt lại mặc định
                            </button>

                        </div>
                    </div>

                    {/* --- MAIN CONTENT --- */}
                    <div className="lg:w-3/4 w-full">

                        {/* Loading */}
                        {loading ? (
                            <div className="h-96 flex flex-col items-center justify-center">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-gray-500 mt-4 animate-pulse">Đang tìm phim...</p>
                            </div>
                        ) : (
                            <>
                                {/* Kết quả */}
                                {movies.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {movies.map((movie) => (
                                            <MovieCard key={movie._id} movie={movie} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
                                        <h3 className="text-xl font-bold text-gray-300">Không tìm thấy phim phù hợp</h3>
                                        <p className="text-gray-500 mt-2">Hãy thử thay đổi điều kiện lọc.</p>
                                    </div>
                                )}

                                {/* --- PAGINATION (CLIENT-SIDE) ĐÃ SỬA LỖI --- */}
                                {movies.length > 0 && pagination.totalPages > 1 && (
                                    <div className="mt-12 flex justify-center items-center gap-2">

                                        {/* Nút Prev */}
                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                                            disabled={pagination.currentPage === 1}
                                            className="p-2 rounded bg-white/5 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/5 transition-colors"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>

                                        {/* Số trang */}
                                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded font-mono text-sm">
                                            <span className="text-primary font-bold">{pagination.currentPage}</span>
                                            <span className="text-gray-500">/</span>
                                            <span>{pagination.totalPages}</span>
                                        </div>

                                        {/* Nút Next */}
                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                                            disabled={pagination.currentPage === pagination.totalPages}
                                            className="p-2 rounded bg-white/5 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/5 transition-colors"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}