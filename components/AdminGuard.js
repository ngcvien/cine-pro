"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",");

export default function AdminGuard({ children }) {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Kiểm tra xem email user có nằm trong danh sách Admin không
        if (ADMIN_EMAILS.includes(user.email)) {
          setAuthorized(true);
        } else {
          // Đã đăng nhập nhưng không phải Admin -> Về trang chủ
          alert("Bạn không có quyền truy cập trang này!");
          router.push("/");
        }
      } else {
        // Chưa đăng nhập -> Về trang login
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Đang kiểm tra quyền Admin...
      </div>
    );
  }

  // Nếu không được cấp quyền, không hiển thị gì cả (hoặc null)
  if (!authorized) return null;

  // Nếu ok, hiển thị nội dung trang Admin
  return <>{children}</>;
}