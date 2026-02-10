"use client";

import { useState, useEffect } from "react";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  linkWithCredential,
  OAuthProvider
} from "firebase/auth";
import { auth, googleProvider, facebookProvider } from "../../lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import TermsModal from "../../components/TermsModal";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  const [showTerms, setShowTerms] = useState(false);

  // --- HÀM KIỂM TRA THIẾT BỊ ---
  // Trả về true nếu là Mobile, Tablet hoặc TV
  const isMobileOrTV = () => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|SmartTV|BRAVIA|NetCast|Tizen/i.test(ua);
  };

  // --- 1. XỬ LÝ KẾT QUẢ TỪ REDIRECT (Dành cho Mobile/TV quay lại) ---
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log("Redirect Login thành công!");
          // useEffect số 2 sẽ lo việc chuyển trang
        }
        setRedirecting(false);
      })
      .catch((error) => {
        console.error("Lỗi Redirect:", error);
        // Bỏ qua lỗi account-exists (để xử lý sau nếu cần) hoặc báo lỗi chung
        if (error.code !== "auth/account-exists-with-different-credential") {
          setError("Đăng nhập thất bại. Vui lòng thử lại.");
        }
        setRedirecting(false);
      });
  }, []);

  // --- 2. THEO DÕI TRẠNG THÁI USER ĐỂ CHUYỂN TRANG ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setRedirecting(true); // Hiện màn hình chờ
        router.push(redirectUrl);
      } else {
        // Nếu không có user, tắt loading redirect (để hiện form đăng nhập)
        // Timeout nhẹ để tránh chớp nháy
        setTimeout(() => setRedirecting(false), 500);
      }
    });
    return () => unsub();
  }, [router, redirectUrl]);

  // --- 3. XỬ LÝ ĐĂNG NHẬP GOOGLE (HYBRID: POPUP vs REDIRECT) ---
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      if (isMobileOrTV()) {
        // Nếu là Mobile/TV -> Dùng Redirect (An toàn, không bị chặn)
        await signInWithRedirect(auth, googleProvider);
      } else {
        // Nếu là PC -> Dùng Popup (Nhanh, mượt, fix lỗi localhost)
        await signInWithPopup(auth, googleProvider);
      }
    } catch (err) {
      console.error(err);
      setError("Đăng nhập Google thất bại.");
      setLoading(false);
    }
  };

  // --- 4. XỬ LÝ FACEBOOK (HYBRID) ---
  const handleFacebookLogin = async () => {
    if (redirecting) return;
    setError("");
    setLoading(true);

    try {
      if (isMobileOrTV()) {
        // Mobile/TV dùng Redirect cho chắc
        await signInWithRedirect(auth, facebookProvider);
      } else {
        // PC dùng Popup để xử lý Link Account dễ hơn
        await signInWithPopup(auth, facebookProvider);
      }
    } catch (err) {
      // LOGIC XỬ LÝ TRÙNG EMAIL (Chỉ hoạt động tốt nhất với Popup trên PC)
      if (err.code === "auth/account-exists-with-different-credential") {
        try {
          const pendingCred = OAuthProvider.credentialFromError(err);
          const email = err.customData.email;

          const userConfirmed = confirm(
            `Email ${email} đã liên kết với Google. Bạn có muốn gộp tài khoản không?`
          );

          if (userConfirmed) {
            // Xác thực lại bằng Google (Dùng Popup cho nhanh)
            const googleResult = await signInWithPopup(auth, googleProvider);
            await linkWithCredential(googleResult.user, pendingCred);
            return;
          }
        } catch (linkError) {
          console.error("Lỗi liên kết:", linkError);
          setError("Không thể liên kết tài khoản.");
        }
      } else {
        console.error(err);
        setError("Đăng nhập Facebook thất bại.");
      }
      setLoading(false);
    }
  };

  // UI LOADING TOÀN MÀN HÌNH
  if (redirecting) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#050505]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  // --- GIAO DIỆN CHÍNH (GIỮ NGUYÊN CSS CŨ CỦA BẠN) ---
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] relative overflow-hidden font-sans">

      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      <div className="absolute inset-0 bg-[url('https://assets.nflxext.com/ffe/siteui/vlv3/c38a2d52-138e-48a3-ab68-36787ece46b3/eeb03fc9-99bf-4188-8441-2dd6bfd4611f/VN-en-20240101-popsignuptwoweeks-perspective_alpha_website_large.jpg')] bg-cover bg-center opacity-10 mix-blend-overlay pointer-events-none"></div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-6 mx-4">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)]"></div>

        <div className="relative z-20 flex flex-col items-center text-center p-6 md:p-8">

          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(74,222,128,0.4)] transform rotate-6 hover:rotate-0 transition-all duration-500 group cursor-pointer">
            <span className="text-black font-black text-4xl group-hover:scale-110 transition-transform">C</span>
          </div>

          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Chào mừng trở lại</h1>
          <p className="text-gray-400 mb-8 text-sm max-w-xs">Đăng nhập để đồng bộ Tủ Phim.</p>

          {error && (
            <div className="w-full bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3 text-left animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-red-400 text-xs font-bold leading-relaxed">{error}</p>
            </div>
          )}

          <div className="w-full space-y-4">
            {/* GOOGLE BUTTON */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none group shadow-lg"
            >
              {loading ? (
                <Loader2 className="animate-spin text-gray-500" size={20} />
              ) : (
                <>
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
                  <span>Tiếp tục với Google</span>
                </>
              )}
            </button>

            {/* FACEBOOK BUTTON */}
            {/* <button
              onClick={handleFacebookLogin}
              disabled={loading}
              className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none shadow-lg shadow-blue-900/20"
            >
              {loading ? (
                <Loader2 className="animate-spin text-white/50" size={20} />
              ) : (
                <>
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Tiếp tục với Facebook</span>
                </>
              )}
            </button> */}
          </div>

          <div className="mt-8 text-xs text-gray-500/60 font-medium">
            Bằng việc đăng nhập, bạn đồng ý với{" "}
            <button
              onClick={() => setShowTerms(true)}
              className="text-gray-400 hover:text-primary cursor-pointer underline decoration-primary/50 transition-colors focus:outline-none"
            >
              Điều khoản sử dụng
            </button>{" "}
            của CinePro.
          </div>
        </div>
      </div>
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  );
}