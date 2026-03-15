import { db } from "@/lib/firebase";
import { collection, doc, addDoc, serverTimestamp, getDocs, query, where, collectionGroup, writeBatch } from "firebase/firestore";

// Hàm gửi thông báo cho những người đang theo dõi phim
export async function sendNotificationToFollowers({ movieSlug, movieName, episodeName, link, image }) {
    try {
        console.log(`🔍 Đang quét user theo dõi phim: ${movieSlug}...`);

        // 1. Dùng Collection Group để tìm trong TOÀN BỘ database
        // Tìm tất cả user có phim này trong 'watch_later' (Tủ phim)
        // Lưu ý: Bạn cần tạo Index trong Firebase Console cho query này (xem hướng dẫn bên dưới)
        const q = query(
            collectionGroup(db, 'watch_later'),
            where('slug', '==', movieSlug)
        );

        const querySnapshot = await getDocs(q);

        // 2. Lọc ra danh sách UID (User ID) duy nhất
        const userIds = new Set();
        querySnapshot.forEach((doc) => {
            // Cấu trúc: users/{uid}/watch_later/{slug}
            // doc.ref.parent = watch_later collection
            // doc.ref.parent.parent = user document (chứa ID)
            const userDoc = doc.ref.parent.parent;
            if (userDoc) {
                userIds.add(userDoc.id);
            }
        });

        if (userIds.size === 0) {
            console.log("⚠️ Không có ai theo dõi phim này.");
            return 0;
        }

        console.log(`  Tìm thấy ${userIds.size} người theo dõi. Đang gửi thông báo...`);

        // 3. Gửi thông báo cho từng User (Dùng Batch để ghi nhanh hơn)
        const batch = writeBatch(db);
        let count = 0;

        userIds.forEach((uid) => {
            const notifRef = doc(collection(db, "users", uid, "notifications")); // Tạo ID tự động
            batch.set(notifRef, {
                title: `Phim ${movieName || "Mới"} có tập mới!`,
                message: `${movieName} vừa được cập nhật ${episodeName}. Xem ngay!`,
                // link: `/xem-phim/${slug}?tap=${epSlug}`,
                link: link,
                image: image,
                is_read: false,
                created_at: serverTimestamp(),
                type: "new_episode"
            });
            count++;
        });

        // Thực thi lệnh ghi
        await batch.commit();
        console.log(`🚀 Đã gửi thành công ${count} thông báo.`);
        return count;

    } catch (error) {
        console.error("❌ Lỗi gửi thông báo:", error);
        // Nếu lỗi "The query requires an index", hãy copy link trong console để tạo Index
        throw error;
    }
}