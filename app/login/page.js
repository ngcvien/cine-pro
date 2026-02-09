"use client";

import { useState, useEffect } from "react";
import { 
  signInWithPopup, 
  linkWithCredential, 
  OAuthProvider,
  fetchSignInMethodsForEmail 
} from "firebase/auth";
import { auth, googleProvider, facebookProvider } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Loading cho nút bấm
  const [redirecting, setRedirecting] = useState(false); // Loading khi đang chuyển trang
  const router = useRouter();

  // --- 1. LOGIC CHUYỂN TRANG DUY NHẤT (QUAN TRỌNG) ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        // Nếu thấy có user -> Bật màn hình chờ -> Chuyển về trang chủ
        setRedirecting(true);
        router.push("/");
      }
    });
    return () => unsub();
  }, [router]);

  // --- 2. XỬ LÝ GOOGLE ---
  const handleGoogleLogin = async () => {
    if (redirecting) return; // Đang chuyển trang thì không cho bấm
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // THÀNH CÔNG: Không làm gì cả! Để useEffect tự bắt sự kiện và chuyển trang.
      // Giữ nguyên loading để người dùng không bấm lung tung.
    } catch (err) {
      console.error(err);
      setError("Đăng nhập Google thất bại. Vui lòng thử lại.");
      setLoading(false); // Thất bại mới tắt loading
    }
  };

  // --- 3. XỬ LÝ FACEBOOK (SỬA LỖI) ---
  const handleFacebookLogin = async () => {
    if (redirecting) return;
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, facebookProvider);
      // THÀNH CÔNG: Cũng không làm gì cả! Để useEffect tự xử lý.
    } catch (err) {
      // --- NẾU TRÙNG EMAIL ---
      if (err.code === "auth/account-exists-with-different-credential") {
        try {
          const pendingCred = OAuthProvider.credentialFromError(err);
          const email = err.customData.email;
          
          const userConfirmed = confirm(
            `Email ${email} đã liên kết với Google. Bạn có muốn gộp tài khoản Facebook vào không?`
          );

          if (userConfirmed) {
            // Đăng nhập Google để xác thực
            const googleResult = await signInWithPopup(auth, googleProvider);
            // Link Facebook vào
            await linkWithCredential(googleResult.user, pendingCred);
            
            // LINK THÀNH CÔNG: useEffect sẽ tự thấy user update và chuyển trang.
            return; 
          } else {
            setLoading(false);
            return;
          }
        } catch (linkError) {
          console.error("Lỗi liên kết:", linkError);
          setError("Không thể liên kết tài khoản. Vui lòng thử lại.");
          setLoading(false);
        }
      } else {
        console.error(err);
        setError("Đăng nhập Facebook thất bại (Popup bị chặn hoặc lỗi mạng).");
        setLoading(false);
      }
    }
  };

  // Nếu đang trong quá trình redirect, hiện màn hình chờ full
  if (redirecting) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#050505]">
          <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] relative overflow-hidden font-sans">
      
      {/* BACKGROUND EFFECTS */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      <div className="absolute inset-0 bg-[url('https://assets.nflxext.com/ffe/siteui/vlv3/c38a2d52-138e-48a3-ab68-36787ece46b3/eeb03fc9-99bf-4188-8441-2dd6bfd4611f/VN-en-20240101-popsignuptwoweeks-perspective_alpha_website_large.jpg')] bg-cover bg-center opacity-10 mix-blend-overlay pointer-events-none"></div>

      {/* LOGIN CARD */}
      <div className="relative z-10 w-full max-w-md p-6 mx-4">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)]"></div>
        
        <div className="relative z-20 flex flex-col items-center text-center p-6 md:p-8">
          
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(74,222,128,0.4)] transform rotate-6 hover:rotate-0 transition-all duration-500 group cursor-pointer">
            <span className="text-black font-black text-4xl group-hover:scale-110 transition-transform">C</span>
          </div>
          
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Chào mừng trở lại</h1>
          <p className="text-gray-400 mb-8 text-sm max-w-xs">Đăng nhập để đồng bộ Tủ Phim và tiếp tục trải nghiệm điện ảnh đỉnh cao.</p>

          {error && (
            <div className="w-full bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3 text-left animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-red-400 text-xs font-bold leading-relaxed">{error}</p>
            </div>
          )}

          <div className="w-full space-y-4">
            
            <button
              onClick={handleGoogleLogin}
              disabled={loading || redirecting}
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

            <button
              onClick={handleFacebookLogin}
              disabled={loading || redirecting}
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
            </button>
          </div>

          <div className="mt-8 text-xs text-gray-500/60 font-medium">
            Bằng việc đăng nhập, bạn đồng ý với <Link href="#" className="text-gray-400 hover:text-primary underline decoration-primary/50">Điều khoản sử dụng</Link> của CinePro.
          </div>
        </div>
      </div>
    </div>
  );
}