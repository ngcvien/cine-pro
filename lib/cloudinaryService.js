/**
 * Cloudinary Service (Client-side helper)
 * IMPORTANT: This file contains NO sensitive keys
 * All sensitive operations (actual upload) happen on the backend
 */

/**
 * Upload image to Cloudinary via our secure backend endpoint
 * @param {File} file - The image file to upload
 * @param {string} folder - Cloudinary folder name (e.g., "cine-pro/hero-names")
 * @returns {Promise<{url: string, public_id: string}>}
 */
export async function uploadImageToCloudinary(file, folder = "cine-pro/hero-names") {
  if (!file) {
    throw new Error("Không có tệp tải lên");
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw new Error("Chỉ chấp nhận tệp hình ảnh");
  }

  // Validate file size (max 5MB)
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Kích thước tệp không được vượt quá 5MB");
  }

  // Create FormData
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  try {
    const response = await fetch("/api/upload/cloudinary", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Upload thất bại");
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      public_id: data.public_id,
    };
  } catch (error) {
    console.error("Lỗi tải lên Cloudinary:", error);
    throw error;
  }
}

/**
 * Validate image URL format
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
export function isValidImageUrl(url) {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("//")
    );
  } catch {
    return false;
  }
}

/**
 * Get Cloudinary image optimized URL
 * @param {string} url - Original Cloudinary URL
 * @param {Object} options - Transformation options
 * @returns {string}
 */
export function getOptimizedCloudinaryUrl(url, options = {}) {
  if (!url) return "";
  
  const {
    width = 200,
    height = 300,
    quality = "auto",
    fetch_format = "auto"
  } = options;

  // Check if it's a Cloudinary URL
  if (!url.includes("cloudinary.com")) {
    return url;
  }

  // Insert transformation parameters
  const urlParts = url.split("/upload/");
  if (urlParts.length !== 2) return url;

  const transformation = `w_${width},h_${height},c_fill,q_${quality},f_${fetch_format}`;
  return `${urlParts[0]}/upload/${transformation}/${urlParts[1]}`;
}
