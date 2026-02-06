import { ImageResponse } from 'next/og'
 
export const size = {
  width: 64,
  height: 64,
}
export const contentType = 'image/png'
 
export default function Icon() {
  return new ImageResponse(
    (
      // Container nền trong suốt
      <div
        style={{
          background: 'transparent',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // Giảm size xuống một chút để nhường chỗ cho phần viền thêm vào
                fontSize: '48px', 
                // Ưu tiên dùng font Impact hoặc Arial Black (những font mặc định dày nhất trên các HDH)
                fontFamily: 'Impact, "Arial Black", "Franklin Gothic Heavy", sans-serif',
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: '-4px', // Dính chữ vào nhau
                // Thêm drop-shadow để chữ trắng nổi bật nếu trình duyệt nền sáng
                filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))'
            }}
        >
            {/* CHỮ C TRẮNG */}
            <span style={{ 
                color: 'white',
                // THỦ THUẬT: Thêm viền 2.5px cùng màu để làm chữ mập lên đáng kể
                WebkitTextStroke: '2.5px white', 
                 // Đảm bảo góc viền tròn trịa, không bị gai
                strokeLinejoin: 'round',
            }}>C</span>

            {/* CHỮ P XANH */}
            <span style={{ 
                color: '#4ade80',
                // THỦ THUẬT: Thêm viền 2.5px cùng màu
                WebkitTextStroke: '2.5px #4ade80',
                strokeLinejoin: 'round',
            }}>P</span>
        </div>
      </div>
    ),
    { ...size }
  )
}