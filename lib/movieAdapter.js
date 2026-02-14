// lib/movieAdapter.js

// 1. Adapter cho Chi Tiết Phim
export function normalizeMovieDetail(data) {
  if (!data || !data.movie) return null;
  const m = data.movie;
  const eps = m.episodes?.[0]?.items || []; // NguonC để tập trong items

  return {
    id: m.id,
    name: m.name,
    origin_name: m.original_name, // Map từ original_name
    slug: m.slug,
    content: m.description,       // Map từ description
    poster_url: m.poster_url,     // NguonC trả full link
    thumb_url: m.thumb_url,       // NguonC trả full link
    time: m.time,
    year: m.category?.['3']?.list?.[0]?.name || 2024, // Lấy năm từ category
    quality: m.quality,
    lang: m.language,
    episode_current: m.current_episode,
    type: "series", 
    trailer_url: null, // NguonC ko có trailer
    actor: [],         // NguonC ko có actor
    
    // Cấu trúc tập phim chuẩn cho VideoPlayer.js
    episodes: [{
        server_name: "Vietsub #1",
        server_data: eps.map(e => ({
            name: e.name, // "1", "2"
            slug: e.slug, // "tap-1"
            link_m3u8: e.m3u8,
            link_embed: e.embed
        }))
    }]
  };
}

// 2. Adapter cho Danh Sách Phim (Home, Thể loại...)
export function normalizeMovieList(data) {
  if (!data || !data.items) return { items: [], pagination: {} };

  // Map từng item trong danh sách
  const items = data.items.map(m => ({
      _id: m.id || m.slug,
      name: m.name,
      slug: m.slug,
      origin_name: m.original_name,
      poster_url: m.poster_url, // Full link
      thumb_url: m.thumb_url,   // Full link
      year: 2024, // List NguonC thiếu năm, để mặc định hoặc ẩn đi
      quality: m.quality,
      lang: m.language,
      time: m.time,
      episode_current: m.current_episode
  }));

  // Map phân trang (Pagination) để khớp với code cũ
  const pagination = {
      totalItems: data.paginate?.total_items || 100,
      totalItemsPerPage: data.paginate?.items_per_page || 24,
      currentPage: data.paginate?.current_page || 1,
      totalPages: data.paginate?.total_page || 1
  };

  return { items, pagination };
}