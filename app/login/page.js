"use client";

import { useState, useEffect } from "react";
import { 
  signInWithPopup, 
  fetchSignInMethodsForEmail, 
  linkWithCredential, 
  OAuthProvider 
} from "firebase/auth";
import { auth, googleProvider, facebookProvider } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Xử lý đăng nhập Google (Đơn giản nhất)
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/"); // Về trang chủ thành công
    } catch (err) {
      console.error(err);
      setError("Đăng nhập Google thất bại. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  // Xử lý đăng nhập Facebook (Có logic liên kết tài khoản)
  const handleFacebookLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, facebookProvider);
      router.push("/");
    } catch (err) {
      // --- LOGIC QUAN TRỌNG: XỬ LÝ TRÙNG EMAIL ---
      if (err.code === "auth/account-exists-with-different-credential") {
        try {
          // 1. Lấy thông tin credential của Facebook đang bị treo
          const pendingCred = OAuthProvider.credentialFromError(err);
          // 2. Lấy email bị trùng
          const email = err.customData.email;
          
          // 3. Thông báo cho người dùng
          const userConfirmed = confirm(
            `Email ${email} đã được sử dụng bởi tài khoản Google. Bạn có muốn liên kết Facebook với tài khoản Google này không?`
          );

          if (userConfirmed) {
            // 4. Đăng nhập lại bằng Google để xác thực quyền sở hữu
            const googleResult = await signInWithPopup(auth, googleProvider);
            
            // 5. Liên kết credential Facebook vào tài khoản Google vừa đăng nhập
            await linkWithCredential(googleResult.user, pendingCred);
            
            // 6. Thành công!
            router.push("/");
            return;
          } else {
            setLoading(false);
            return;
          }
        } catch (linkError) {
          console.error("Lỗi liên kết:", linkError);
          setError("Không thể liên kết tài khoản. Vui lòng thử lại.");
        }
      } else {
        console.error(err);
        setError("Đăng nhập Facebook thất bại. Hãy chắc chắn bạn đã tắt chặn Pop-up.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] relative overflow-hidden font-sans">
      
      {/* BACKGROUND EFFECTS */}
      {/* Quả cầu Gradient trôi nổi */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      
      {/* Background Image mờ */}
      <div className="absolute inset-0 bg-[url('https://assets.nflxext.com/ffe/siteui/vlv3/c38a2d52-138e-48a3-ab68-36787ece46b3/eeb03fc9-99bf-4188-8441-2dd6bfd4611f/VN-en-20240101-popsignuptwoweeks-perspective_alpha_website_large.jpg')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>

      {/* LOGIN CARD */}
      <div className="relative z-10 w-full max-w-md p-8 mx-4">
        {/* Glassmorphism Container */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl"></div>
        
        <div className="relative z-20 flex flex-col items-center text-center p-4">
          
          {/* Logo */}
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(74,222,128,0.4)] transform rotate-3 hover:rotate-0 transition-all duration-500">
            <span className="text-black font-black text-3xl">C</span>
          </div>
          
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Chào mừng trở lại</h1>
          <p className="text-gray-400 mb-8 text-sm">Đăng nhập để tiếp tục xem kho phim bất tận.</p>

          {/* Error Message */}
          {error && (
            <div className="w-full bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6 flex items-start gap-3 text-left">
              <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
              <p className="text-red-400 text-xs font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Social Buttons */}
          <div className="w-full space-y-4">
            
            {/* Google Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none group"
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

            {/* Facebook Button */}
            <button
              onClick={handleFacebookLogin}
              disabled={loading}
              className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none shadow-lg shadow-blue-900/20"
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

          <div className="mt-8 text-xs text-gray-500">
            Bằng việc đăng nhập, bạn đồng ý với <Link href="#" className="text-gray-400 hover:text-primary underline">Điều khoản sử dụng</Link> của chúng tôi.
          </div>
        </div>
      </div>
    </div>
  );
}