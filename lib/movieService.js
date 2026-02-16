// lib/movieService.js
import he from "he";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";


const API_SOURCES = [
  process.env.NEXT_PUBLIC_MOVIE_API_URL
];
const API_URL = process.env.NEXT_PUBLIC_MOVIE_API_URL;

function normalizeStr(str) {
  return str ? str.toLowerCase().trim() : "";
}

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_DOMAIN;

export async function getAllAPISources() {
  return { sources: API_SOURCES, imageBaseUrl: IMAGE_BASE_URL };
}


function deepDecode(obj) {
  if (typeof obj === "string") {
    return he.decode(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(deepDecode);
  }

  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        deepDecode(value),
      ])
    );
  }

  return obj;
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

// Hàm hỗ trợ merge episodes
function mergeEpisodes(apiEpisodes, customEpisodes) {
  if (!customEpisodes) return apiEpisodes;
  if (!apiEpisodes) return customEpisodes;

  let merged = [...apiEpisodes]; // Clone mảng gốc API

  customEpisodes.forEach(customServer => {
    const customName = normalizeStr(customServer.server_name);

    // 1. TÌM SERVER TRÙNG (Logic trùng 1 phần)
    // Ví dụ: API là "Vietsub #1", Custom là "Vietsub" -> Khớp
    const existingServerIndex = merged.findIndex(s => {
      const apiName = normalizeStr(s.server_name);
      return apiName.includes(customName) || customName.includes(apiName);
    });

    if (existingServerIndex !== -1) {
      // ==> TÌM THẤY SERVER KHỚP
      const existingData = merged[existingServerIndex].server_data;
      const customData = customServer.server_data;

      customData.forEach(customEp => {
        // Tìm xem tập này đã có trong API chưa (theo slug)
        const epIndex = existingData.findIndex(e => e.slug === customEp.slug);

        if (epIndex !== -1) {
          // A. TẬP ĐÃ TỒN TẠI
          // Kiểm tra cờ ưu tiên (priority)
          if (customEp.priority === true) {
            // Nếu ưu tiên -> Ghi đè link của API bằng link Custom
            existingData[epIndex] = {
              ...existingData[epIndex], // Giữ lại tên, slug cũ
              link_m3u8: customEp.link_m3u8,
              link_embed: customEp.link_embed,
              source: "custom_override" // Đánh dấu để biết
            };
          }
          // Nếu không ưu tiên -> Giữ nguyên API (dùng cho trường hợp phimApi đã có tập đó rồi)
        } else {
          // B. TẬP CHƯA CÓ -> Thêm mới (Cập nhật tập mới hơn API chưa có)
          existingData.push(customEp);
        }
      });

      // (Tùy chọn) Sắp xếp lại danh sách tập nếu cần (theo slug hoặc tên)
      // existingData.sort((a, b) => ...);

    } else {
      // ==> KHÔNG KHỚP SERVER -> Thêm nguyên server mới (Ví dụ: Lồng Tiếng)
      merged.push(customServer);
    }
  });

  return merged;
}

export async function getMovieData(endpoint, options = {}) {
  // 1. KIỂM TRA: Đây có phải là request lấy DANH SÁCH không?
  // Các API danh sách của PhimApi thường chứa các từ khóa này
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const isListRequest = path.includes("/danh-sach/") ||
    path.includes("/the-loai/") ||
    path.includes("/quoc-gia/") ||
    path.includes("/moi-cap-nhat") ||
    path.includes("tim-kiem") ||
    path.includes("/v1/api/"); // Các đường dẫn raw API

  // === TRƯỜNG HỢP 1: LẤY DANH SÁCH ===
  if (isListRequest) {
    try {
      // Chỉ gọi API, không gọi Firestore (tránh lỗi Invalid document reference)
      const url = path.startsWith("http") ? path : `${API_URL}${path}`;
      const res = await fetch(url, options);

      if (!res.ok) throw new Error("Fetch list failed");
      return await res.json();
    } catch (e) {
      console.error(`Lỗi lấy danh sách (${path}):`, e.message);
      return null;
    }
  }

  // === TRƯỜNG HỢP 2: LẤY CHI TIẾT PHIM ===
  // Chỉ khi vào chi tiết phim, ta mới có slug sạch (vd: "dao-hai-tac") để query Firestore
  const slug = path.replace("/phim/", "").replace("/", "").split("?")[0];

  // A. Fetch từ PhimApi
  let apiData = null;
  let rawApiData = null;
  try {
    const res = await fetch(`${API_URL}/phim/${slug}`, options);
    if (res.ok) rawApiData = await res.json();
    apiData = rawApiData ? deepDecode(rawApiData) : null;
  } catch (e) { console.error("API Error", e); }

  // B. Fetch từ Firebase (Chỉ tìm document có ID là slug ngắn gọn)
  let customData = null;
  let rawCustomData = null;
  try {
    const docRef = doc(db, "custom_movies", slug);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) rawCustomData = docSnap.data();
    customData = rawCustomData ? deepDecode(rawCustomData) : null;
  } catch (e) {
    // Nếu lỗi Firestore thì bỏ qua, không làm sập web
    console.warn("Firebase Custom Movie Check:", e.message);
  }

  // C. Logic Gộp
  if (apiData?.status && customData) {
    const mergedEpisodes = mergeEpisodes(apiData.episodes, customData.episodes);
    let newCurrentEpisode = apiData.movie.episode_current;
    if (mergedEpisodes.length > 0) {
      // Thường lấy server đầu tiên (Vietsub #1) làm chuẩn
      const mainServer = mergedEpisodes[0];
      if (mainServer.server_data && mainServer.server_data.length > 0) {
        const lastEp = mainServer.server_data[mainServer.server_data.length - 1];
        newCurrentEpisode = lastEp.name;   // Ví dụ: "Tập 11" hoặc "Full"
      }
    }
    const mergedMovie = {
      ...apiData.movie, // 1. Lấy toàn bộ thông tin gốc từ API làm nền

      // 2. Ghi đè bằng thông tin Custom (nếu có)
      poster_url: customData.poster_url || apiData.movie.poster_url,

      // Ưu tiên Custom Thumb -> Nếu không có thì lấy Custom Poster -> Nếu không có thì lấy API Thumb -> API Poster
      thumb_url: customData.thumb_url || customData.poster_url || apiData.movie.thumb_url || apiData.movie.poster_url,

      // (Tùy chọn) Nếu bạn muốn ghi đè tên phim hay nội dung thì thêm vào đây
      episode_current: newCurrentEpisode,
    };

    return {
      status: true,
      movie: mergedMovie,
      episodes: mergedEpisodes
    };
  }

  if (apiData?.status) {
    return {
      status: true,
      movie: apiData.movie,
      episodes: apiData.episodes
    };
  }

  if (customData) {
    return {
      status: true,
      movie: {
        _id: customData.slug,
        name: customData.name,
        slug: customData.slug,
        origin_name: customData.name,
        content: "Phim được thêm thủ công.",
        poster_url: customData.poster_url || "",
        thumb_url: customData.thumb_url || customData.poster_url || "",
        year: 2024
      },
      episodes: customData.episodes
    };
  }

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

// Thêm hàm searchMoviesHybrid vào lib/movieService.js
export async function searchMoviesHybrid(keyword) {
  // 1. Tìm trên API
  let apiResults = [];
  try {
    const res = await fetch(`https://phimapi.com/v1/api/tim-kiem?keyword=${keyword}&limit=10`);
    const data = await res.json();
    if (data.status === 'success') apiResults = data.data.items || [];
  } catch (e) { }

  // 2. Tìm trên Firebase (Custom)
  // Lưu ý: Firestore tìm kiếm text khá yếu, đây là cách đơn giản check slug hoặc name
  let customResults = [];
  try {
    // Cách đơn giản nhất: Lấy hết custom movies về lọc (Chỉ ổn khi số lượng custom ít < 100)
    // Nếu nhiều cần giải pháp như Algolia hoặc tạo field keywords mảng.
    const q = query(collection(db, "custom_movies"));
    const querySnapshot = await getDocs(q);
    let i = 0;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.name.toLowerCase().includes(keyword.toLowerCase()) ||
        data.slug.includes(keyword.toLowerCase())) {
        customResults.push({
          _id: data.slug,
          name: data.name,
          slug: data.slug,
          origin_name: data.name,
          poster_url: data.poster_url || apiResults[i]?.poster_url || "",
          thumb_url: data.thumb_url || data.poster_url || "",
          year: 2024
        });
        i++;
      }
    });
  } catch (e) { }

  // 3. Gộp kết quả (Loại bỏ trùng lặp dựa trên slug)
  const combined = [...customResults];
  apiResults.forEach(apiItem => {
    if (!combined.find(c => c.slug === apiItem.slug)) {
      combined.push(apiItem);
    }
  });

  return { status: "success", data: { items: combined } };
}