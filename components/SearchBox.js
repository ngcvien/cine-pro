"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMovieData } from "@/lib/movieService";

export default function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const router = useRouter();

  // Xử lý tìm kiếm (Debounce 500ms)
  useEffect(() => {
    // Nếu xóa hết chữ thì reset
    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setShowDropdown(true);
      try {
        // Gọi API tìm kiếm
        const data = await getMovieData(`/v1/api/tim-kiem?keyword=${encodeURIComponent(query)}&limit=10`, { cache: "no-store" });
        
        if (data.status === "success") {
          setResults(data.data.items || []);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
      } finally {
        setIsLoading(false);
      }
    }, 500); // Đợi 500ms sau khi ngừng gõ mới gọi API

    return () => clearTimeout(timer); // Xóa timer cũ nếu người dùng gõ tiếp
  }, [query]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      router.push(`/tim-kiem?keyword=${query}`);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      {/* FORM INPUT */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          placeholder="Tìm tên phim..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setShowDropdown(true)}
          className="w-full bg-black/50 border border-white/10 text-white text-sm rounded-full py-2 pl-4 pr-10 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-500"
        />
        
        {/* Nút Search hoặc Icon Loading */}
        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
            {isLoading ? (
                // Icon Loading xoay vòng
                <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                // Icon Kính lúp
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
            )}
        </button>
      </form>

      {/* DROPDOWN KẾT QUẢ GỢI Ý */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#121212] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50">
            {results.length > 0 ? (
                <ul className="max-h-[60vh] overflow-y-auto no-scrollbar py-2">
                    {results.map((movie) => {
                        // Xử lý link ảnh
                        const thumb = movie.poster_url.includes('http') 
                            ? movie.poster_url 
                            : `https://phimimg.com/${movie.poster_url}`;
                        
                        return (
                            <li key={movie._id}>
                                <Link 
                                    href={`/chi-tiet/${movie.slug}`} 
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors group"
                                    onClick={() => setShowDropdown(false)}
                                >
                                    {/* Ảnh nhỏ */}
                                    <div className="w-10 h-14 flex-shrink-0 rounded overflow-hidden relative">
                                        <img src={thumb} alt={movie.name} className="w-full h-full object-cover" />
                                    </div>
                                    
                                    {/* Thông tin */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white text-sm font-bold truncate group-hover:text-primary transition-colors">
                                            {movie.name}
                                        </h4>
                                        <p className="text-gray-500 text-xs truncate">
                                            {movie.origin_name} • {movie.year}
                                        </p>
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                    {/* Link xem tất cả */}
                    <li className="border-t border-white/10 mt-1">
                        <Link 
                            href={`/tim-kiem?keyword=${query}`}
                            className="block text-center text-xs text-primary py-3 hover:bg-white/5 font-bold uppercase tracking-wider"
                            onClick={() => setShowDropdown(false)}
                        >
                            Xem tất cả kết quả
                        </Link>
                    </li>
                </ul>
            ) : (
                // Không tìm thấy
                !isLoading && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                        Không tìm thấy phim nào.
                    </div>
                )
            )}
        </div>
      )}
    </div>
  );
}