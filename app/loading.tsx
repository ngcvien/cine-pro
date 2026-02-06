export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050505]">
      <div className="absolute w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-20 animate-pulse" />

      <div className="relative flex flex-col items-center gap-4">
        
        {/* LOGO ANIMATION */}
        <div className="relative">
            <h1 className="text-5xl md:text-7xl font-black font-display tracking-tighter animate-pulse">
              <span className="text-white">CINE</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">PRO</span>
            </h1>
            
            <h1 className="absolute top-full left-0 right-0 text-5xl md:text-7xl font-black font-display tracking-tighter scale-y-[-1] blur-sm opacity-50 select-none pointer-events-none">
              <span className="text-white/20">CINE</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary/20 to-green-400/20">PRO</span>
            </h1>
        </div>

        <div className="mt-8 flex gap-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
        </div>

      </div>
    </div>
  );
}