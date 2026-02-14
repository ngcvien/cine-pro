"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Tv, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

// Component con để bọc trong Suspense (Bắt buộc khi dùng useSearchParams trong Next.js)
function TVAuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Loading trạng thái Auth
  const [processing, setProcessing] = useState(false); // Loading khi bấm nút
  const [status, setStatus] = useState("idle"); // idle | success | error

  // 1. Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        // Chưa đăng nhập -> Chuyển hướng sang trang Login
        // Kèm theo tham số redirect để login xong quay lại đây
        const currentPath = `/tv-auth?session_id=${sessionId}`;
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      }
    });

    return () => unsubscribe();
  }, [router, sessionId]);

  // 2. Xử lý khi bấm nút "Xác nhận"
  const handleConfirm = async () => {
    if (!user || !sessionId) return;

    setProcessing(true);
    try {
      // Lấy ID Token hiện tại để gửi lên server xác thực
      const idToken = await user.getIdToken();

      // Gọi API Route chúng ta vừa tạo ở Bước 1
      const res = await fetch("/api/tv-auth/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, idToken }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Lỗi server");

      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
    } finally {
      setProcessing(false);
    }
  };

  // --- GIAO DIỆN ---

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <div className="text-center p-6 bg-[#121212] rounded-xl border border-red-500/30">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p>Thiếu mã Session ID. Vui lòng quét lại mã QR trên TV.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121212] border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
        
        {/* TRẠNG THÁI: THÀNH CÔNG */}
        {status === "success" ? (
          <div className="space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Thành công!</h2>
            <p className="text-gray-400">
              TV của bạn đang tự động đăng nhập. <br />
              Bạn có thể tắt trang này.
            </p>
          </div>
        ) : (
          /* TRẠNG THÁI: XÁC NHẬN */
          <div className="space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto relative">
              <Tv className="w-10 h-10 text-primary" />
              <div className="absolute -bottom-1 -right-1 bg-[#121212] rounded-full p-1">
                 <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            <div>
              <h1 className="text-xl font-bold text-white mb-2">
                Đăng nhập trên TV?
              </h1>
              <p className="text-gray-400 text-sm">
                Tài khoản: <span className="text-white font-medium">{user.email}</span>
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Vui lòng xác nhận nếu bạn đang cố gắng đăng nhập vào ứng dụng trên Android TV.
              </p>
            </div>

            {status === "error" && (
              <p className="text-red-500 text-sm bg-red-500/10 p-2 rounded">
                Có lỗi xảy ra. Vui lòng thử lại.
              </p>
            )}

            <button
              onClick={handleConfirm}
              disabled={processing}
              className="w-full bg-primary hover:bg-green-400 text-black font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận đăng nhập"
              )}
            </button>
            
            <button 
                onClick={() => router.push("/")}
                className="text-gray-500 text-sm hover:text-white transition-colors"
            >
                Hủy bỏ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Page Component
export default function TVAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <TVAuthContent />
    </Suspense>
  );
}