/**
 * Secure Cloudinary Upload Endpoint
 * IMPORTANT: This endpoint runs on the server side ONLY
 * Sensitive API keys are NEVER exposed to the client
 * 
 * Admin authentication is required
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/firebase";
import { getAuth } from "firebase/auth";

// Get Cloudinary credentials from environment (server-side only)
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const ADMIN_UIDS = (process.env.NEXT_PUBLIC_ADMIN_UIDS || "").split(",").filter(Boolean);

/**
 * Verify if user is admin via Firebase ID token
 * @param {string} token - Firebase ID token from client
 * @returns {Promise<{isAdmin: boolean, uid: string}>}
 */
async function verifyAdminToken(token) {
  try {
    // Use native Firebase Admin SDK to verify token
    const decodedToken = await require("firebase-admin").auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const isAdmin = ADMIN_UIDS.includes(uid);
    
    return { isAdmin, uid };
  } catch (error) {
    console.error("Token verification failed:", error);
    return { isAdmin: false, uid: null };
  }
}

/**
 * Generate Cloudinary signature for unsigned upload
 * (More secure approach using timestamps and signatures)
 * 
 * IMPORTANT: Signature should NOT include api_key in the string to sign
 */
function generateCloudinarySignature(params) {
  const crypto = require("crypto");
  
  // Create query string from params (sorted by key)
  // IMPORTANT: Do NOT include 'api_key' in the signature calculation
  const sortedParams = Object.keys(params)
    .filter(key => key !== "api_key") // Exclude api_key from signature
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join("&");

  // Sign with API secret
  const signature = crypto
    .createHash("sha256")
    .update(sortedParams + CLOUDINARY_API_SECRET)
    .digest("hex");

  return signature;
}

export async function POST(request) {
  try {
    // 1. VERIFY ADMIN (REQUIRED)
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Yêu cầu xác thực" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { isAdmin, uid } = await verifyAdminToken(token);

    if (!isAdmin) {
      return NextResponse.json(
        { message: "Chỉ quản trị viên mới có thể tải hình ảnh" },
        { status: 403 }
      );
    }

    // 2. VALIDATE CLOUDINARY CONFIG
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      console.error("Cloudinary configuration missing");
      return NextResponse.json(
        { message: "Cấu hình Cloudinary không hợp lệ" },
        { status: 500 }
      );
    }

    // 3. PARSE REQUEST
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") || "cine-pro/hero-names";

    if (!file) {
      return NextResponse.json(
        { message: "Không có tệp tải lên" },
        { status: 400 }
      );
    }

    // 4. VALIDATE FILE
    const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "Loại tệp không hợp lệ. Chỉ chấp nhận JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "Kích thước tệp không được vượt quá 5MB" },
        { status: 400 }
      );
    }

    // 5. CONVERT FILE TO BUFFER
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // 6. PREPARE CLOUDINARY UPLOAD
    const timestamp = Math.floor(Date.now() / 1000);
    const uploadParams = {
      file: `data:${file.type};base64,${base64}`,
      public_id: `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}`,
      folder: folder,
      resource_type: "auto",
      upload_preset: undefined, // Will use API key auth instead
    };

    // 7. UPLOAD TO CLOUDINARY
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    
    // Generate signature FIRST (before adding to formData)
    // NOTE: api_key should NOT be included in signature calculation
    const signatureParams = {
      folder: uploadParams.folder,
      public_id: uploadParams.public_id,
      timestamp: timestamp,
    };
    const signature = generateCloudinarySignature(signatureParams);

    // NOW add to formData (signature is already calculated)
    const formDataToSend = new FormData();
    formDataToSend.append("file", uploadParams.file);
    formDataToSend.append("public_id", uploadParams.public_id);
    formDataToSend.append("folder", uploadParams.folder);
    formDataToSend.append("api_key", CLOUDINARY_API_KEY);
    formDataToSend.append("timestamp", timestamp);
    formDataToSend.append("signature", signature);

    const cloudinaryResponse = await fetch(cloudinaryUrl, {
      method: "POST",
      body: formDataToSend,
    });

    if (!cloudinaryResponse.ok) {
      const error = await cloudinaryResponse.json();
      console.error("Cloudinary error:", error);
      return NextResponse.json(
        { message: `Lỗi Cloudinary: ${error.error?.message || "Upload thất bại"}` },
        { status: 400 }
      );
    }

    const cloudinaryData = await cloudinaryResponse.json();

    console.log(`[ADMIN: ${uid}] Uploaded image to Cloudinary: ${cloudinaryData.public_id}`);

    // 8. RETURN RESPONSE (Only public data)
    return NextResponse.json(
      {
        success: true,
        secure_url: cloudinaryData.secure_url,
        public_id: cloudinaryData.public_id,
        width: cloudinaryData.width,
        height: cloudinaryData.height,
        size: cloudinaryData.bytes,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { message: `Lỗi server: ${error.message}` },
      { status: 500 }
    );
  }
}

// Disable other methods
export async function GET() {
  return NextResponse.json(
    { message: "Phương thức không được phép" },
    { status: 405 }
  );
}
