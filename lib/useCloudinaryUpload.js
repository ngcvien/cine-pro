/**
 * Custom Hook: useCloudinaryUpload
 * Handles Cloudinary file uploads with Firebase authentication
 */

import { useState } from "react";
import { getAuth } from "firebase/auth";

export function useCloudinaryUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadFile = async (file, folder = "cine-pro/hero-names") => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // 1. Validate file
      if (!file) {
        throw new Error("Vui lòng chọn một tệp");
      }

      if (!file.type.startsWith("image/")) {
        throw new Error("Chỉ chấp nhận tệp hình ảnh");
      }

      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_SIZE) {
        throw new Error("Kích thước tệp không được vượt quá 5MB");
      }

      // 2. Get Firebase token
      const auth = getAuth();
      if (!auth.currentUser) {
        throw new Error("Vui lòng đăng nhập");
      }

      const token = await auth.currentUser.getIdToken();

      // 3. Create FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      // 4. Upload to server
      const response = await fetch("/api/upload/cloudinary", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload thất bại");
      }

      const result = await response.json();
      setProgress(100);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        size: result.size,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Lỗi không xác định";
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    progress,
    error,
    uploadFile,
    reset: () => {
      setUploading(false);
      setProgress(0);
      setError(null);
    },
  };
}
