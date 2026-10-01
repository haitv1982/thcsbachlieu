/* ============================================================================
   CẤU HÌNH KẾT NỐI — TRƯỜNG THCS BẠCH LIÊU

   ⚠️ THẦY CHỈ CẦN SỬA ĐÚNG 2 DÒNG TRONG TỆP NÀY.

   Lấy 2 giá trị đó ở đâu:
     Supabase → dự án của thầy → Settings (bánh răng) → API
       · "Project URL"        →  dán vào DIA_CHI
       · "anon public" key    →  dán vào KHOA_CONG_KHAI

   Hai giá trị này CÔNG KHAI được, không phải mật khẩu. Người khác biết cũng
   không lấy được dữ liệu, vì hàng rào bảo vệ nằm ở phía máy chủ (RLS).

   Khi hai dòng này còn để trống, trang web chạy ở chế độ xem thử — không đòi
   đăng nhập, dùng dữ liệu mẫu trong trang. Điền vào là trang tự chuyển sang
   chế độ thật, bắt buộc đăng nhập. Hiện hai dòng đã điền đủ, trang đang chạy
   ở chế độ thật.
   ============================================================================ */

const CAU_HINH = {

  DIA_CHI: 'https://hovzvtgvaxyulcdssmne.supabase.co',

  KHOA_CONG_KHAI: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhvdnp2dGd2YXh5dWxjZHNzbW5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MjMzODcsImV4cCI6MjEwNTk5OTM4N30.RQE_vb_CDWB3s56o4qgZHzUqG4Y2jWJO9ZtcofQAn2w',

  TEN_TRUONG: 'Trường THCS Bạch Liêu',
  NAM_HOC: '2026-2027',

  /* ------------------------------------------------------------------------
     THƯ MỤC GOOGLE DRIVE CỦA TRƯỜNG
     Dán đường dẫn thư mục Google Drive của nhà trường vào đây (dạng:
     https://drive.google.com/drive/folders/...).
     Khi một minh chứng chưa gán link riêng, bấm 📂 sẽ mở thư mục Drive này.
     ------------------------------------------------------------------------ */
  LINK_DRIVE_TONG: '',

  /* ------------------------------------------------------------------------
     THÔNG TIN IN RA VĂN BẢN — sửa ở ĐÂY, một chỗ duy nhất.

     Trước đây mấy giá trị này gõ thẳng vào từng tệp kết xuất. Đến khi Hiệu
     trưởng đổi người, hay sĩ số đổi, thì mỗi tệp Word in ra một con số khác
     nhau mà không ai biết nên tin bản nào. Nay chỉ có một nguồn.

     Đơn vị chủ quản ghi theo hành chính 2 cấp: chỉ Tỉnh và Xã, không còn cấp
     huyện, không còn Phòng Giáo dục và Đào tạo.
     ------------------------------------------------------------------------ */
  DON_VI_CHU_QUAN: 'UBND XÃ YÊN THÀNH',
  DIA_DANH: 'Yên Thành',                       // đứng trước ngày tháng trong văn bản
  DIA_CHI_TRUONG: 'Xã Yên Thành, tỉnh Nghệ An',
  CO_QUAN_QUAN_LY: 'Sở Giáo dục và Đào tạo Nghệ An',
  HIEU_TRUONG: 'Nguyễn Phúc Lộc',

  /* Biểu 1 Phụ lục V Thông tư 57 đòi mục "b) Địa chỉ, THÔNG TIN LIÊN HỆ".
     Để trống thì báo cáo chỉ in địa chỉ, không in hai dòng này. */
  DIEN_THOAI: '',
  EMAIL_TRUONG: '',

  /* Quy mô nhà trường — CHỈ dùng khi đếm từ cơ sở dữ liệu không ra số nào.
     Báo cáo tự đánh giá đếm số lớp và số học sinh từ bảng hoc_sinh_lop của năm
     học đang chọn, số CBGV-NV từ danh sách CBGV-NV, để bản Word không bao giờ
     lệch số với các màn hình khác của chính hệ thống này. */
  SO_LOP: 16,
  SO_HOC_SINH: 466,
  SO_CBGV: 38
};

/* Trang có đang chạy ở chế độ thật (đã nối cơ sở dữ liệu) hay không */
try {
  const customUrl = localStorage.getItem('THCS_SUPABASE_URL');
  const customKey = localStorage.getItem('THCS_SUPABASE_KEY');
  const customDrive = localStorage.getItem('THCS_LINK_DRIVE_TONG');
  if (customUrl && customKey) {
    CAU_HINH.DIA_CHI = customUrl.trim();
    CAU_HINH.KHOA_CONG_KHAI = customKey.trim();
  }
  if (customDrive) {
    CAU_HINH.LINK_DRIVE_TONG = customDrive.trim();
  }
} catch (e) {}

if (CAU_HINH.DIA_CHI) {
  CAU_HINH.DIA_CHI = CAU_HINH.DIA_CHI.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

CAU_HINH.DA_NOI = Boolean(CAU_HINH.DIA_CHI && CAU_HINH.KHOA_CONG_KHAI);
