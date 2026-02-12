import Link from "next/link";

export default function Pagination({ currentPage, totalPages, basePath }) {
  // --- SỬA LỖI Ở ĐÂY: Ép kiểu dữ liệu sang Number ---
  const current = Number(currentPage);
  const total = Number(totalPages);

  if (total <= 1) return null;

  const getPageNumbers = () => {
    const delta = 2;
    const items = [];

    // Luôn hiển thị trang 1
    items.push(1);

    // Tính toán khoảng giữa
    const left = current - delta;
    const right = current + delta;

    // Hiển thị dấu "..." bên trái nếu cần
    if (left > 2) {
      items.push("...");
    }

    // Vòng lặp các trang ở giữa
    // Sửa logic: Chỉ lặp từ trang 2 đến trang (total - 1)
    // để tránh trùng lặp với trang đầu và trang cuối đã add thủ công
    for (let i = 2; i < total; i++) {
      if (i >= left && i <= right) {
        items.push(i);
      }
    }

    // Hiển thị dấu "..." bên phải nếu cần
    if (right < total - 1) {
      items.push("...");
    }

    // Luôn hiển thị trang cuối (nếu tổng > 1)
    if (total > 1) {
      items.push(total);
    }

    return items;
  };

  const pages = getPageNumbers();
  const navClass = "w-10 h-10 flex items-center justify-center rounded-lg border transition-all";

  return (
    <div className="flex justify-center items-center gap-2 mt-12 select-none flex-wrap">
      {/* Nút Previous */}
      <Link
        href={current > 1 ? `${basePath}?page=${current - 1}` : "#"}
        className={`${navClass} ${
          current > 1 
            ? "border-white/10 bg-white/5 text-white hover:bg-primary hover:text-black hover:border-primary" 
            : "border-transparent text-gray-600 cursor-not-allowed pointer-events-none"
        }`}
        aria-disabled={current <= 1}
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
              page === current
                ? "bg-primary text-black border-primary shadow-[0_0_10px_rgba(0,255,65,0.4)] scale-110 pointer-events-none"
                : "border-transparent text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {page}
          </Link>
        )
      ))}

      {/* Nút Next */}
      <Link
        href={current < total ? `${basePath}?page=${current + 1}` : "#"}
        className={`${navClass} ${
          current < total
            ? "border-white/10 bg-white/5 text-white hover:bg-primary hover:text-black hover:border-primary" 
            : "border-transparent text-gray-600 cursor-not-allowed pointer-events-none"
        }`}
        aria-disabled={current >= total}
      >
        <ChevronIcon direction="right" />
      </Link>
    </div>
  );
}

// Icon component
function ChevronIcon({ direction }) {
  const isLeft = direction === "left";
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d={isLeft ? "M15.75 19.5L8.25 12l7.5-7.5" : "M8.25 4.5l7.5 7.5-7.5 7.5"} />
    </svg>
  );
}