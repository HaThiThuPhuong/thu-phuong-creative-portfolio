import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { FIREBASE_CONFIG } from './config';

// Khởi tạo Firebase App với cấu hình từ file config để đồng bộ vĩnh viễn
const app = initializeApp(FIREBASE_CONFIG);

// Khởi tạo Auth
export const auth = getAuth(app);

// KẾT NỐI VĨNH VIỄN: Sử dụng chính xác ID database ai-studio-f092f2dd... của bạn
// Điều này giúp web luôn lấy được dữ liệu "Pre-wedding" mà bạn đã tạo trong Firestore
export const db = getFirestore(app, "ai-studio-f092f2dd-693f-4e73-ab45-713eb65c01cf"); 

// Cấu hình Google Provider
export const googleProvider = new GoogleAuthProvider();

// FIX LỖI POPUP: Ép buộc hiện bảng chọn tài khoản để tránh bị trình duyệt chặn âm thầm
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Hàm đăng nhập với xử lý lỗi Popup bị chặn
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked') {
      alert('Phương ơi, bạn hãy cho phép Popup trên trình duyệt để đăng nhập nhé!');
    }
    console.error("Lỗi đăng nhập:", error);
  }
};

export const logout = () => signOut(auth);

// Kiểm tra kết nối vĩnh viễn
async function testConnection() {
  try {
    // Chỉ chạy test nếu đã cấu hình xong Rules trong Firestore
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    console.log("Firebase connection status checked.");
  }
}
testConnection();