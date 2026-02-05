"use client";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import HistoryItem from "../../components/HistoryItem";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/"); // Chưa đăng nhập thì đá về trang chủ
      }
      setUser(currentUser);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        // Lấy danh sách lịch sử từ Collection 'history' của User
        const q = query(
            collection(db, "users", user.uid, "history"), 
            orderBy("last_watched", "desc") // Sắp xếp cái nào mới xem lên đầu
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => doc.data());
        setHistory(data);
      } catch (error) {
        console.error("Lỗi lấy lịch sử:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
        fetchHistory();
    }
  }, [user]);

  if (loading) return (
      <div className="min-h-screen pt-32 text-center">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 md:px-8 min-h-screen">
      <div className="mb-8 border-b border-white/10 pb-4 flex items-end justify-between">
        <div>
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
                TỦ PHIM <span className="text-primary">CÁ NHÂN</span>
            </h1>
            <p className="text-gray-500 text-sm mt-2 font-mono">
                DANH SÁCH CÁC BỘ PHIM BẠN ĐANG THEO DÕI
            </p>
        </div>
        <div className="text-right">
            <span className="text-4xl font-black text-white">{history.length}</span>
            <span className="text-gray-500 text-xs block">ĐANG XEM</span>
        </div>
      </div>

      {history.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {history.map((item, index) => (
            <HistoryItem key={index} item={item} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border border-dashed border-white/10 rounded-lg">
          <p className="text-gray-500 mb-4">Bạn chưa xem bộ phim nào cả.</p>
          <a href="/" className="bg-primary text-black font-bold px-6 py-2 rounded hover:bg-white transition-colors">
            KHÁM PHÁ NGAY
          </a>
        </div>
      )}
    </div>
  );
}