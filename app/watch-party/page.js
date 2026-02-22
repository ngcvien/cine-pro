"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, rtdb } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, set, onValue } from "firebase/database";
import { searchMoviesHybrid, getMovieData } from "@/lib/movieService"; 

// =====================================================================
// COMPONENT CON: THẺ PHÒNG — Design system: dark + #22FF00 + Be Vietnam Pro / IBM Plex Mono
// =====================================================================
function RoomCard({ room, onClick }) {
    const [imageUrl, setImageUrl] = useState("");
    const isScheduled = room.mode === "scheduled";
    const timeString = isScheduled
        ? new Date(room.scheduledTime).toLocaleString('vi-VN', { hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit' })
        : "Đang phát trực tiếp";

    useEffect(() => {
        if (!room.movieSlug) return;
        const fetchImage = async () => {
            try {
                const data = await getMovieData(`phim/${room.movieSlug}`);
                if (data && data.status && data.movie) {
                    setImageUrl(data.movie.thumb_url || data.movie.poster_url);
                }
            } catch (error) {
                console.error("Lỗi lấy ảnh phim:", error);
            }
        };
        fetchImage();
    }, [room.movieSlug]);

    return (
        <div
            onClick={onClick}
            className="room-card"
            style={{
                background: 'rgba(3,8,3,0.85)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14,
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
            }}
        >
            {/* ẢNH BÌA */}
            <div style={{position:'relative',width:'100%',height:150,background:'rgba(255,255,255,0.03)',overflow:'hidden',flexShrink:0}}>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={room.movieName}
                        className="card-img"
                        style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.75}}
                    />
                ) : (
                    <div className="shimmer" style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="m8 21 4-4 4 4"/><path d="M12 17v4"/></svg>
                    </div>
                )}
                {/* Gradient overlay */}
                <div style={{position:'absolute',inset:0,background:'linear-gradient(to top, rgba(3,8,3,1) 0%, rgba(3,8,3,0.5) 40%, transparent 100%)'}}></div>

                {/* Badge */}
                <div style={{position:'absolute',top:10,left:10,zIndex:2}}>
                    <span style={{
                        fontFamily:'IBM Plex Mono, monospace',
                        fontSize:9,
                        fontWeight:700,
                        letterSpacing:'0.15em',
                        textTransform:'uppercase',
                        padding:'3px 9px',
                        borderRadius:999,
                        background: isScheduled ? 'rgba(234,179,8,0.15)' : 'rgba(34,255,0,0.15)',
                        color: isScheduled ? '#EAB308' : '#22FF00',
                        border: `1px solid ${isScheduled ? 'rgba(234,179,8,0.3)' : 'rgba(34,255,0,0.3)'}`,
                        display:'inline-flex',alignItems:'center',gap:5
                    }}>
                        <span style={{width:5,height:5,borderRadius:'50%',background: isScheduled ? '#EAB308' : '#22FF00',display:'inline-block',animation: isScheduled ? 'none' : 'live-pulse 1.8s ease-in-out infinite'}}></span>
                        {isScheduled ? 'Lên Lịch' : 'Live'}
                    </span>
                </div>
            </div>

            {/* NỘI DUNG */}
            <div style={{padding:'14px 16px 16px',flex:1,display:'flex',flexDirection:'column',gap:8}}>
                <div>
                    <p style={{fontFamily:'IBM Plex Mono, monospace',fontSize:10,color:'rgba(255,255,255,0.3)',marginBottom:5,letterSpacing:'0.05em'}}>
                        {timeString}
                    </p>
                    <h3
                        style={{fontFamily:'Be Vietnam Pro, sans-serif',fontWeight:700,color:'#fff',fontSize:14,lineHeight:1.35,marginBottom:6,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}
                        title={room.movieName || room.movieSlug}
                    >
                        {room.movieName || room.movieSlug}
                    </h3>
                    <p style={{fontFamily:'IBM Plex Mono, monospace',fontSize:10,color:'rgba(255,255,255,0.35)'}}>
                        Host: <span style={{color:'#22FF00'}}>{room.hostName}</span>
                    </p>
                </div>

                {/* CTA */}
                <div className="card-cta" style={{marginTop:'auto',paddingTop:12,borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',justifyContent:'space-between',alignItems:'center',opacity:0.5}}>
                    <span style={{fontFamily:'IBM Plex Mono, monospace',fontSize:10,color:'#22FF00',textTransform:'uppercase',letterSpacing:'0.12em'}}>Vào phòng chiếu</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22FF00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </div>
            </div>
        </div>
    );
}

// =====================================================================
// COMPONENT CHÍNH: SẢNH CHỜ
// =====================================================================
export default function WatchPartyHub() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [publicRooms, setPublicRooms] = useState([]);

    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState(null);

    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        isPrivate: false,
        mode: "now", 
        scheduledTime: "" 
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const roomsRef = ref(rtdb, 'rooms');
        const unsubscribe = onValue(roomsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const roomArray = Object.entries(data)
                    .map(([id, roomData]) => ({ id, ...roomData.info }))
                    .filter(room => room && !room.isPrivate && room.status !== "ended"); 
                
                roomArray.sort((a, b) => b.createdAt - a.createdAt);
                setPublicRooms(roomArray);
            } else {
                setPublicRooms([]);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!searchKeyword.trim()) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await searchMoviesHybrid(searchKeyword);
                if (res.status === 'success') {
                    setSearchResults(res.data.items || []);
                }
            } catch (error) {
                console.error("Lỗi tìm phim:", error);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchKeyword]);

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        if (!user) return alert("Vui lòng đăng nhập!");
        if (!selectedMovie) return alert("Vui lòng tìm và chọn một bộ phim!");
        
        if (formData.mode === "scheduled" && !formData.scheduledTime) {
            return alert("Vui lòng chọn thời gian công chiếu!");
        }

        setIsCreating(true);
        try {
            const newRoomId = "room_" + Math.random().toString(36).substr(2, 9);
            const startTime = formData.mode === "scheduled" ? new Date(formData.scheduledTime).getTime() : Date.now();

            await set(ref(rtdb, `rooms/${newRoomId}/info`), {
                hostId: user.uid,
                hostName: user.displayName || user.email.split('@')[0],
                movieSlug: selectedMovie.slug, 
                movieName: selectedMovie.name, 
                isPrivate: formData.isPrivate,
                mode: formData.mode,
                scheduledTime: startTime,
                status: "waiting", 
                createdAt: Date.now()
            });

            await set(ref(rtdb, `rooms/${newRoomId}/videoState`), {
                playing: false,
                currentTime: 0,
                updatedAt: Date.now()
            });

            router.push(`/watch-party/${newRoomId}`);
        } catch (error) {
            console.error("Lỗi tạo phòng:", error);
            alert("Có lỗi xảy ra, không thể tạo phòng.");
            setIsCreating(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050905] flex items-center justify-center">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;700&display=swap');
                @keyframes spin-g { to { transform: rotate(360deg); } }
                @keyframes fade-up { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
            `}</style>
            <div style={{animation:'fade-up 0.4s ease'}} className="flex flex-col items-center gap-4">
                <div style={{width:44,height:44,borderRadius:'50%',border:'2.5px solid transparent',borderTopColor:'#22FF00',borderRightColor:'rgba(34,255,0,0.3)',animation:'spin-g 0.75s linear infinite',boxShadow:'0 0 18px rgba(34,255,0,0.35)'}}></div>
                <p style={{fontFamily:'IBM Plex Mono',fontSize:11,color:'rgba(34,255,0,0.45)',letterSpacing:'0.3em',textTransform:'uppercase'}}>Đang kết nối...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050905] text-gray-300 pt-20 pb-16 px-4 md:px-8 relative overflow-x-hidden" style={{fontFamily:'IBM Plex Mono, monospace'}}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;700&display=swap');

                .bvp { font-family: 'Be Vietnam Pro', sans-serif; }
                .ibm { font-family: 'IBM Plex Mono', monospace; }

                /* AURORA BG */
                .lobby-aurora::before {
                    content: '';
                    position: fixed; inset: 0; pointer-events: none; z-index: 0;
                    background:
                        radial-gradient(ellipse 70% 50% at 10% 10%, rgba(34,255,0,0.05) 0%, transparent 60%),
                        radial-gradient(ellipse 50% 40% at 90% 90%, rgba(34,255,0,0.03) 0%, transparent 60%);
                }

                /* SCROLLBAR */
                .scroll-g::-webkit-scrollbar { width: 3px; }
                .scroll-g::-webkit-scrollbar-track { background: transparent; }
                .scroll-g::-webkit-scrollbar-thumb { background: #22FF00; border-radius: 999px; opacity:0.5; }

                /* CARD HOVER */
                .room-card { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
                .room-card:hover { transform: translateY(-3px); box-shadow: 0 8px 40px rgba(34,255,0,0.1); border-color: rgba(34,255,0,0.35) !important; }
                .room-card:hover .card-img { transform: scale(1.06); }
                .card-img { transition: transform 0.6s ease; }
                .room-card:hover .card-cta { opacity: 1; }
                .card-cta { transition: opacity 0.2s ease; }

                /* LIVE PULSE */
                @keyframes live-pulse {
                    0%,100% { box-shadow: 0 0 0 0 rgba(34,255,0,0.7); }
                    50% { box-shadow: 0 0 0 5px rgba(34,255,0,0); }
                }
                .live-dot { animation: live-pulse 1.8s ease-in-out infinite; }

                /* INPUT FOCUS GLOW */
                .input-g:focus { border-color: rgba(34,255,0,0.5) !important; box-shadow: 0 0 0 3px rgba(34,255,0,0.06); }
                .select-g:focus { border-color: rgba(34,255,0,0.5) !important; box-shadow: 0 0 0 3px rgba(34,255,0,0.06); }

                /* SPIN */
                @keyframes spin-g { to { transform: rotate(360deg); } }

                /* FADE UP */
                @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
                .fade-up { animation: fadeUp 0.45s ease forwards; }
                .fade-up-2 { animation: fadeUp 0.45s 0.1s ease both; }
                .fade-up-3 { animation: fadeUp 0.45s 0.2s ease both; }

                /* SHIMMER LOADING */
                @keyframes shimmer { from{background-position:-200% center} to{background-position:200% center} }
                .shimmer {
                    background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%);
                    background-size: 200% auto;
                    animation: shimmer 1.5s linear infinite;
                }
            `}</style>

            {/* AURORA */}
            <div className="lobby-aurora fixed inset-0 pointer-events-none z-0"></div>

            <div className="relative z-10 max-w-7xl mx-auto">

                {/* ===== HEADER ===== */}
                <div className="mb-10 fade-up">
                    <div className="flex items-center gap-3 mb-3">
                        <div style={{width:3,height:28,background:'linear-gradient(to bottom, #22FF00, rgba(34,255,0,0.2))',borderRadius:999}}></div>
                        <h1 className="bvp font-black text-white" style={{fontSize:'clamp(1.6rem,4vw,2.5rem)',letterSpacing:'-0.02em'}}>
                            Phòng <span style={{color:'#22FF00'}}>Công Chiếu</span>
                        </h1>
                    </div>
                    <p className="ibm text-[11px] text-gray-600 uppercase tracking-[0.2em] pl-5">
                        Tạo phòng xem phim hoặc tham gia cùng mọi người
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-7">

                    {/* ===== CỘT TRÁI: FORM TẠO PHÒNG ===== */}
                    <div className="md:col-span-1 fade-up-2">
                        <div style={{background:'rgba(3,8,3,0.92)',border:'1px solid rgba(34,255,0,0.1)',borderRadius:16,backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',overflow:'hidden'}}>
                            {/* Header form */}
                            <div style={{padding:'18px 22px',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',gap:10}}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22FF00" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                                <span className="ibm text-[11px] font-bold uppercase tracking-[0.2em]" style={{color:'#22FF00'}}>Khởi Tạo Phòng</span>
                            </div>

                            <div style={{padding:'22px'}}>
                                {!user ? (
                                    <div className="text-center py-8 space-y-4">
                                        <div style={{width:48,height:48,borderRadius:'50%',background:'rgba(34,255,0,0.06)',border:'1px solid rgba(34,255,0,0.15)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto'}}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22FF00" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                        </div>
                                        <p className="ibm text-[10px] text-gray-600 uppercase tracking-widest">Yêu cầu đăng nhập</p>
                                        <button onClick={() => router.push('/login')}
                                            className="ibm font-bold text-[11px] uppercase tracking-widest"
                                            style={{background:'#22FF00',color:'#000',padding:'10px 24px',borderRadius:10,border:'none',cursor:'pointer',transition:'opacity 0.2s'}}
                                            onMouseOver={e=>e.target.style.opacity=0.85} onMouseOut={e=>e.target.style.opacity=1}
                                        >Đăng nhập ngay</button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleCreateRoom} style={{display:'flex',flexDirection:'column',gap:20}}>

                                        {/* CHỌN PHIM */}
                                        <div style={{display:'flex',flexDirection:'column',gap:8}}>
                                            <label className="ibm text-[10px] uppercase tracking-[0.18em]" style={{color:'rgba(255,255,255,0.4)'}}>Chọn Phim</label>
                                            {!selectedMovie ? (
                                                <div style={{position:'relative'}}>
                                                    <input
                                                        type="text"
                                                        value={searchKeyword}
                                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                                        placeholder="Gõ tên phim để tìm..."
                                                        className="input-g ibm"
                                                        style={{width:'100%',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',padding:'11px 14px',fontSize:13,color:'#fff',outline:'none',borderRadius:10,transition:'border-color 0.2s, box-shadow 0.2s',boxSizing:'border-box',caretColor:'#22FF00'}}
                                                    />
                                                    {isSearching && (
                                                        <div style={{position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',width:15,height:15,border:'2px solid rgba(34,255,0,0.3)',borderTopColor:'#22FF00',borderRadius:'50%',animation:'spin-g 0.7s linear infinite'}}></div>
                                                    )}
                                                    {searchResults.length > 0 && (
                                                        <div className="scroll-g" style={{position:'absolute',top:'calc(100% + 8px)',left:0,right:0,background:'rgba(5,10,5,0.98)',border:'1px solid rgba(34,255,0,0.15)',borderRadius:10,maxHeight:220,overflowY:'auto',zIndex:30,boxShadow:'0 16px 40px rgba(0,0,0,0.6)'}}>
                                                            {searchResults.map((movie) => (
                                                                <div
                                                                    key={movie.slug}
                                                                    onClick={() => { setSelectedMovie({name:movie.name,slug:movie.slug}); setSearchKeyword(""); setSearchResults([]); }}
                                                                    style={{padding:'10px 14px',borderBottom:'1px solid rgba(255,255,255,0.04)',cursor:'pointer',transition:'background 0.15s'}}
                                                                    onMouseOver={e=>e.currentTarget.style.background='rgba(34,255,0,0.06)'}
                                                                    onMouseOut={e=>e.currentTarget.style.background='transparent'}
                                                                >
                                                                    <p className="bvp font-bold text-white" style={{fontSize:13,marginBottom:2,lineHeight:1.3}}>{movie.name}</p>
                                                                    <p className="ibm" style={{fontSize:10,color:'rgba(255,255,255,0.3)',textTransform:'uppercase'}}>{movie.origin_name || movie.slug}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div style={{background:'rgba(34,255,0,0.05)',border:'1px solid rgba(34,255,0,0.2)',borderRadius:10,padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:10}}>
                                                    <div style={{minWidth:0,flex:1}}>
                                                        <p className="ibm" style={{fontSize:10,color:'#22FF00',textTransform:'uppercase',marginBottom:4,letterSpacing:'0.1em'}}>Đã chọn</p>
                                                        <p className="bvp font-bold text-white" style={{fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selectedMovie.name}</p>
                                                    </div>
                                                    <button type="button" onClick={() => setSelectedMovie(null)}
                                                        className="ibm"
                                                        style={{fontSize:10,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',background:'rgba(255,255,255,0.05)',padding:'5px 10px',borderRadius:6,border:'none',cursor:'pointer',whiteSpace:'nowrap',transition:'color 0.15s'}}
                                                        onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='rgba(255,255,255,0.4)'}
                                                    >Đổi phim</button>
                                                </div>
                                            )}
                                        </div>

                                        {/* QUYỀN RIÊNG TƯ */}
                                        <div style={{display:'flex',flexDirection:'column',gap:8}}>
                                            <label className="ibm text-[10px] uppercase tracking-[0.18em]" style={{color:'rgba(255,255,255,0.4)'}}>Quyền Riêng Tư</label>
                                            <div style={{display:'flex',flexDirection:'column',gap:8}}>
                                                {[
                                                    {value:false, label:'Công Khai', desc:'Hiện trong sảnh chờ', icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>},
                                                    {value:true, label:'Kín', desc:'Chỉ qua link mời', icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                                                ].map(opt => {
                                                    const active = formData.isPrivate === opt.value;
                                                    return (
                                                        <label key={String(opt.value)} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',border:`1px solid ${active ? 'rgba(34,255,0,0.3)' : 'rgba(255,255,255,0.06)'}`,borderRadius:10,background: active ? 'rgba(34,255,0,0.05)' : 'rgba(255,255,255,0.02)',cursor:'pointer',transition:'all 0.2s'}}>
                                                            <input type="radio" name="privacy" checked={active} onChange={() => setFormData({...formData, isPrivate: opt.value})} style={{display:'none'}} />
                                                            <div style={{width:16,height:16,borderRadius:'50%',border:`2px solid ${active ? '#22FF00' : 'rgba(255,255,255,0.2)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'border-color 0.2s'}}>
                                                                {active && <div style={{width:7,height:7,borderRadius:'50%',background:'#22FF00'}}></div>}
                                                            </div>
                                                            <div style={{color: active ? '#22FF00' : 'rgba(255,255,255,0.35)',flexShrink:0}}>{opt.icon}</div>
                                                            <div>
                                                                <p className="bvp font-bold" style={{fontSize:13,color: active ? '#fff' : 'rgba(255,255,255,0.7)',marginBottom:1}}>{opt.label}</p>
                                                                <p className="ibm" style={{fontSize:10,color:'rgba(255,255,255,0.3)'}}>{opt.desc}</p>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* THỜI GIAN PHÁT */}
                                        <div style={{display:'flex',flexDirection:'column',gap:8}}>
                                            <label className="ibm text-[10px] uppercase tracking-[0.18em]" style={{color:'rgba(255,255,255,0.4)'}}>Thời Gian Phát</label>
                                            <select
                                                value={formData.mode}
                                                onChange={(e) => setFormData({...formData, mode: e.target.value})}
                                                className="select-g ibm"
                                                style={{width:'100%',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',padding:'11px 14px',fontSize:12,color:'#fff',outline:'none',borderRadius:10,cursor:'pointer',transition:'border-color 0.2s, box-shadow 0.2s',appearance:'none',backgroundImage:`url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 7L11 1' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,backgroundRepeat:'no-repeat',backgroundPosition:'right 14px center'}}
                                            >
                                                <option value="now">Xem Ngay Lập Tức</option>
                                                <option value="scheduled">Lên Lịch Công Chiếu</option>
                                            </select>
                                        </div>

                                        {/* GIỜ G (nếu scheduled) */}
                                        {formData.mode === "scheduled" && (
                                            <div style={{display:'flex',flexDirection:'column',gap:8}}>
                                                <label className="ibm text-[10px] uppercase tracking-[0.18em]" style={{color:'#22FF00'}}>Chọn Giờ G</label>
                                                <input
                                                    type="datetime-local"
                                                    required
                                                    value={formData.scheduledTime}
                                                    onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
                                                    className="input-g ibm"
                                                    style={{width:'100%',background:'rgba(34,255,0,0.04)',border:'1px solid rgba(34,255,0,0.2)',padding:'11px 14px',fontSize:12,color:'#fff',outline:'none',borderRadius:10,transition:'border-color 0.2s, box-shadow 0.2s',boxSizing:'border-box',colorScheme:'dark'}}
                                                />
                                            </div>
                                        )}

                                        {/* SUBMIT */}
                                        <button
                                            type="submit"
                                            disabled={isCreating || !selectedMovie}
                                            className="bvp font-bold"
                                            style={{
                                                width:'100%',
                                                padding:'13px',
                                                background: isCreating || !selectedMovie ? 'rgba(34,255,0,0.15)' : '#22FF00',
                                                color: isCreating || !selectedMovie ? 'rgba(34,255,0,0.4)' : '#000',
                                                border: 'none',
                                                borderRadius: 12,
                                                fontSize: 13,
                                                letterSpacing: '0.1em',
                                                textTransform: 'uppercase',
                                                cursor: isCreating || !selectedMovie ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.2s',
                                                boxShadow: !isCreating && selectedMovie ? '0 0 20px rgba(34,255,0,0.2)' : 'none',
                                                marginTop: 4
                                            }}
                                        >
                                            {isCreating ? 'Đang khởi tạo...' : 'Bắt Đầu Xem Chung'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ===== CỘT PHẢI: DANH SÁCH PHÒNG ===== */}
                    <div className="md:col-span-2 fade-up-3">
                        {/* Header */}
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#22FF00] live-dot"></span>
                                <h2 className="bvp font-bold text-white" style={{fontSize:14,letterSpacing:'0.05em'}}>Phòng Đang Hoạt Động</h2>
                            </div>
                            <span className="ibm" style={{fontSize:10,border:'1px solid rgba(34,255,0,0.2)',color:'#22FF00',padding:'4px 12px',background:'rgba(34,255,0,0.05)',borderRadius:999,letterSpacing:'0.15em',textTransform:'uppercase'}}>
                                {publicRooms.length} phòng
                            </span>
                        </div>

                        {publicRooms.length === 0 ? (
                            <div style={{background:'rgba(3,8,3,0.6)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:16,padding:'64px 24px',textAlign:'center'}}>
                                <div style={{fontSize:36,marginBottom:16,opacity:0.15}}>🎬</div>
                                <p className="bvp font-bold" style={{color:'rgba(255,255,255,0.3)',fontSize:14,marginBottom:8}}>Sảnh đang trống</p>
                                <p className="ibm" style={{color:'rgba(255,255,255,0.15)',fontSize:11}}>Hãy là người đầu tiên tạo phòng công chiếu!</p>
                            </div>
                        ) : (
                            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))',gap:18}}>
                                {publicRooms.map((room) => (
                                    <RoomCard key={room.id} room={room} onClick={() => router.push(`/watch-party/${room.id}`)} />
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}