"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Film, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden flex flex-col items-center justify-center font-sans selection:bg-primary selection:text-black">
      
      {/* 1. BACKGROUND EFFECTS */}
      {/* Đèn chiếu Spotlight từ trên cao */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[150px] opacity-40 pointer-events-none animate-pulse" />
      
      {/* Noise Texture (Lớp nhiễu hạt) */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none mix-blend-overlay"></div>

      {/* Các hạt bụi trôi nổi (Floating Particles) */}
      <FloatingParticles />

      {/* 2. MAIN CONTENT */}
      <div className="relative z-10 text-center px-4">
        
        {/* Số 404 Khổng Lồ */}
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
        >
            <h1 className="text-[120px] md:text-[200px] font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-white/5 select-none relative z-10">
                404
            </h1>
            
            {/* Bóng đổ / Hiệu ứng Glitch giả */}
            <h1 className="absolute top-1 left-1 text-[120px] md:text-[200px] font-black tracking-tighter leading-none text-primary/20 select-none blur-sm z-0">
                404
            </h1>
        </motion.div>

        {/* Thông báo lỗi */}
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-6 mt-6"
        >
            <div className="flex items-center justify-center gap-2 text-primary font-bold tracking-widest uppercase text-sm md:text-base">
                <AlertTriangle size={18} />
                <span>Cắt! Cảnh này không có trong kịch bản</span>
            </div>

            <h2 className="text-2xl md:text-4xl font-bold text-gray-200 max-w-2xl mx-auto">
                Có vẻ như bạn đã đi lạc vào hậu trường hoặc phim đã bị xóa.
            </h2>

            <p className="text-gray-500 max-w-md mx-auto">
                Đừng lo, hãy quay lại rạp chiếu chính để tiếp tục thưởng thức những bộ phim bom tấn.
            </p>

            {/* Nút hành động */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
                <Link 
                    href="/" 
                    className="group relative px-8 py-4 bg-primary text-black font-black rounded-full overflow-hidden transition-all hover:scale-105 shadow-[0_0_20px_rgba(74,222,128,0.4)]"
                >
                    <div className="absolute inset-0 w-full h-full bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
                    <span className="flex items-center gap-2 relative z-10">
                        <Home size={20} /> QUAY VỀ TRANG CHỦ
                    </span>
                </Link>

                <Link 
                    href="/danh-sach/phim-moi-cap-nhat" 
                    className="px-8 py-4 border border-white/20 text-white font-bold rounded-full hover:bg-white/10 transition-all flex items-center gap-2"
                >
                    <Film size={20} /> TÌM PHIM MỚI
                </Link>
            </div>
        </motion.div>
      </div>

      {/* 3. FOOTER DECORATION */}
      <div className="absolute bottom-10 text-xs text-gray-600 font-mono">
        ERROR_CODE: SCENE_MISSING | DIRECTOR: CINEPRO_BOT
      </div>
    </div>
  );
}

// 1. Định nghĩa kiểu dữ liệu cho hạt bụi
interface Particle {
    x: number;
    y: number;
    duration: number;
    delay: number;
}

function FloatingParticles() {
    // 2. Gán kiểu dữ liệu cho useState: <Particle[]>
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        const newParticles: Particle[] = Array.from({ length: 15 }).map(() => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            duration: Math.random() * 10 + 10,
            delay: Math.random() * 5
        }));
        setParticles(newParticles);
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((particle, i) => (
                <motion.div
                    key={i}
                    initial={{ 
                        x: `${particle.x}vw`, 
                        y: `${particle.y}vh`,
                        opacity: 0 
                    }}
                    animate={{ 
                        y: [null, -100], // Bay lên trên
                        opacity: [0, 0.5, 0] 
                    }}
                    transition={{ 
                        duration: particle.duration, 
                        repeat: Infinity, 
                        ease: "linear",
                        delay: particle.delay 
                    }}
                    className="absolute w-1 h-1 bg-primary rounded-full blur-[1px]"
                />
            ))}
        </div>
    );
}