import Link from "next/link";

export default function Pagination({ currentPage, totalPages, basePath }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const items = [];

    // Tính toán dải số trang ở giữa dựa trên delta
    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    for (let i = start; i <= end; i++) range.push(i);

    // Xử lý trang đầu và dấu "..."
    if (currentPage - delta > 2) items.push(1, "...");
    else items.push(1);

    items.push(...range);

    // Xử lý trang cuối và dấu "..."
    if (currentPage + delta < totalPages - 1) items.push("...", totalPages);
    else if (totalPages > 1) items.push(totalPages);

    return items;
  };

  const pages = getPageNumbers();
  const navClass = "w-10 h-10 flex items-center justify-center rounded-lg border transition-all";

  return (
    <div className="flex justify-center items-center gap-2 mt-12 select-none">
      {/* Nút Previous */}
      <Link
        href={currentPage > 1 ? `${basePath}?page=${currentPage - 1}` : "#"}
        className={`${navClass} ${
          currentPage > 1 
            ? "border-white/10 bg-white/5 text-white hover:bg-primary hover:text-black hover:border-primary" 
            : "border-transparent text-gray-600 cursor-not-allowed"
        }`}
        aria-disabled={currentPage <= 1}
      >
        <ChevronIcon direction="left" />
      </Link>

      {/* Danh sách các số trang */}
      {pages.map((page, idx) => (
        page === "..." ? (
          <span key={`dots-${idx}`} className="text-gray-500 px-1">...</span>
        ) : (
          <Link
            key={page}
            href={`${basePath}?page=${page}`}
            className={`${navClass} text-sm font-bold ${
              page === currentPage
                ? "bg-primary text-black border-primary shadow-[0_0_10px_rgba(0,255,65,0.4)] scale-110"
                : "border-transparent text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {page}
          </Link>
        )
      ))}

      {/* Nút Next */}
      <Link
        href={currentPage < totalPages ? `${basePath}?page=${currentPage + 1}` : "#"}
        className={`${navClass} ${
          currentPage < totalPages 
            ? "border-white/10 bg-white/5 text-white hover:bg-primary hover:text-black hover:border-primary" 
            : "border-transparent text-gray-600 cursor-not-allowed"
        }`}
        aria-disabled={currentPage >= totalPages}
      >
        <ChevronIcon direction="right" />
      </Link>
    </div>
  );
}

// Sub-component cho icon để tránh lặp mã SVG
function ChevronIcon({ direction }) {
  const isLeft = direction === "left";
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d={isLeft ? "M15.75 19.5L8.25 12l7.5-7.5" : "M8.25 4.5l7.5 7.5-7.5 7.5"} />
    </svg>
  );
}