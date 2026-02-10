// lib/movieService.js

const API_SOURCES = [
  process.env.NEXT_PUBLIC_MOVIE_API_URL 
];

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_DOMAIN;

export async function getAllAPISources() {
  return { sources: API_SOURCES , imageBaseUrl: IMAGE_BASE_URL };
}

// Hàm fetch có timeout
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function getMovieData(endpoint, options = {}) {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // Kiểm tra xem đang chạy ở Server hay Client
  const isServer = typeof window === 'undefined';

  const defaultOptions = {
    next: { revalidate: 3600 },
    ...options
  };

 
  if (isServer) {
      defaultOptions.headers = {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Compatible; CineProBot/1.0)",
          ...options.headers
      };
  }


  for (const domain of API_SOURCES) {
    try {
      const url = `${domain}${path}`;
      const res = await fetchWithTimeout(url, defaultOptions);

      if (!res.ok) {
        if (res.status === 404) continue;
        throw new Error(`Status ${res.status}`);
      }

      const data = await res.json();
      
      // Xử lý mảng (cho /the-loai, /quoc-gia)
      if (Array.isArray(data)) {
        return data;
      }

      // Xử lý object
      if (data.status === false && !data.items && !data.movie) {
        throw new Error("Invalid Data Structure");
      }

      return data; 

    } catch (error) {
      // console.warn(`[MovieService] Failed ${domain}:`, error.message);
      continue; 
    }
  }

  console.error(`[MovieService] All sources failed for endpoint: ${path}`);
  return null; 
}

/**
 * Hàm chuẩn hóa URL ảnh
 * @param {string} path - Đường dẫn ảnh từ API (vd: "the-loai/hanh-dong.jpg")
 * @returns {string} - URL đầy đủ (vd: "https://phimimg.com/the-loai/hanh-dong.jpg")
 */
export function getImageUrl(path) {
  if (!path) return "https://placehold.co/400x600?text=No+Image"; 
  if (path.startsWith("http")) return path; 
  
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${IMAGE_BASE_URL}/${cleanPath}`;
}

/**
 * Hàm chuẩn hóa toàn bộ object phim (Poster + Thumb)
 * Dùng để map() trong các trang danh sách
 */
export function normalizeMovieData(movie) {
  if (!movie) return null;
  return {
    ...movie,
    poster_url: getImageUrl(movie.poster_url),
    thumb_url: getImageUrl(movie.thumb_url),
    _id: movie._id || movie.slug 
  };
}