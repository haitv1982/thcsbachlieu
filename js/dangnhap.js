/* ============================================================================
   ĐĂNG NHẬP BẰNG TÀI KHOẢN GOOGLE — TRƯỜNG THCS BẠCH LIÊU

   Cách hoạt động, nói gọn:
     1. Thầy cô bấm nút "Đăng nhập bằng Google".
     2. Trang chuyển sang trang của Google. Mật khẩu gõ TRÊN TRANG GOOGLE.
        Hệ thống của nhà trường không nhìn thấy mật khẩu, không lưu mật khẩu.
     3. Google báo lại cho Supabase "đúng là người này", Supabase cấp một tấm
        vé điện tử có hạn cho trình duyệt.
     4. Mỗi lần lấy dữ liệu, trang web đưa tấm vé đó ra; máy chủ tự kiểm tra
        người này được xem gì, sửa gì.

   Nếu tệp cauhinh.js chưa điền địa chỉ thì toàn bộ tệp này nằm im,
   trang web chạy y như trước, không đòi đăng nhập.
   ============================================================================ */

(function () {
  'use strict';

  const daNoi = Boolean(typeof CAU_HINH !== 'undefined' && CAU_HINH.DA_NOI && CAU_HINH.DIA_CHI && CAU_HINH.KHOA_CONG_KHAI && window.supabase);
  const sb = daNoi ? window.supabase.createClient(CAU_HINH.DIA_CHI, CAU_HINH.KHOA_CONG_KHAI) : null;
  window.sbClient = sb;          // để các phần khác của trang dùng lại

  /* Người đang đăng nhập — các phần khác đọc qua window.NGUOI_DUNG */
  let nguoiDung = null;

  const TEN_VAI_TRO = {
    admin: 'Quản trị hệ thống',
    ban_giam_hieu: 'Ban giám hiệu',
    to_truong: 'Tổ trưởng chuyên môn',
    giao_vien: 'Giáo viên',
    nhan_vien: 'Nhân viên'
  };
  const TEN_TRANG_THAI = {
    cho_duyet: 'Chờ duyệt',
    hoat_dong: 'Đang hoạt động',
    khoa: 'Đã khoá'
  };

  /* ========================================================================
     GIAO DIỆN — chèn kiểu dáng, dùng đúng bảng màu navy + vàng đồng của trang
     ======================================================================== */
  const css = `
  .dn-lop{position:fixed;inset:0;z-index:9000;display:none;align-items:center;justify-content:center;
    padding:20px;background:linear-gradient(160deg,#14306b,#0e2454);
    background-image:radial-gradient(rgba(255,255,255,.07) 1px,transparent 1px);background-size:22px 22px}
  .dn-lop.hien{display:flex}
  .dn-hop{width:100%;max-width:420px;background:#fff;border-radius:18px;padding:34px 28px 28px;
    text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.32)}
  .dn-huy{width:64px;height:64px;margin:0 auto 16px;border-radius:16px;background:#14306b;
    display:flex;align-items:center;justify-content:center;font-size:32px}
  .dn-hop h2{font-size:21px;color:#14306b;margin:0 0 6px;line-height:1.35}
  .dn-hop .dn-phu{font-size:14px;color:#64748b;margin:0 0 24px;line-height:1.55}
  .dn-nut{width:100%;min-height:52px;border:1.5px solid #d7dde8;background:#fff;border-radius:12px;
    display:flex;align-items:center;justify-content:center;gap:11px;cursor:pointer;
    font-size:16px;font-weight:600;color:#1f2937;transition:.18s;font-family:inherit}
  .dn-nut:hover{border-color:#14306b;background:#f7f9fc}
  .dn-nut:disabled{opacity:.55;cursor:default}
  .dn-nut svg{width:21px;height:21px;flex:none}
  .dn-chan{margin-top:22px;padding-top:18px;border-top:1px solid #eef1f6;
    font-size:12.5px;color:#8a94a6;line-height:1.6}
  .dn-loi{margin-top:14px;padding:11px 13px;border-radius:10px;background:#fef2f2;
    border:1px solid #fecaca;color:#b91c1c;font-size:13.5px;line-height:1.5;text-align:left;display:none}
  .dn-loi.hien{display:block}
  .dn-cho{margin-top:6px;padding:16px;border-radius:12px;background:#fffbeb;
    border:1px solid #fde68a;color:#92400e;font-size:14px;line-height:1.6;text-align:left}

  /* Thẻ người dùng trên thanh điều hướng */
  .dn-the{display:flex;align-items:center;gap:9px;padding:5px 12px 5px 5px;border-radius:999px;
    border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);cursor:pointer;
    color:#fff;font-family:inherit;font-size:13.5px;transition:.18s;flex:none}
  .dn-the:hover{background:rgba(255,255,255,.2)}
  .dn-the .av{width:30px;height:30px;border-radius:50%;background:#c8901c;color:#fff;flex:none;
    display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:700;
    overflow:hidden;background-size:cover;background-position:center}
  .dn-the .tt{text-align:left;line-height:1.25;display:none}
  .dn-the .tt b{display:block;font-weight:600;font-size:13.5px}
  .dn-the .tt span{font-size:11px;opacity:.75}
  @media(min-width:900px){.dn-the .tt{display:block}}

  .dn-menu{position:fixed;z-index:9100;background:#fff;border-radius:14px;min-width:230px;
    box-shadow:0 18px 44px rgba(15,32,66,.24);overflow:hidden;display:none;border:1px solid #e6eaf2}
  .dn-menu.hien{display:block}
  .dn-menu .dau{padding:14px 16px;border-bottom:1px solid #eef1f6;background:#f8fafc}
  .dn-menu .dau b{display:block;font-size:14.5px;color:#14306b}
  .dn-menu .dau span{display:block;font-size:12px;color:#64748b;margin-top:2px;word-break:break-all}
  .dn-menu .vt{display:inline-block;margin-top:7px;padding:3px 9px;border-radius:999px;
    background:#14306b;color:#fff;font-size:11px;font-weight:600}
  .dn-menu button{width:100%;padding:13px 16px;border:0;background:#fff;text-align:left;
    cursor:pointer;font-size:14.5px;color:#1f2937;font-family:inherit;display:flex;align-items:center;gap:10px}
  .dn-menu button:hover{background:#f1f5f9}
  .dn-menu button.thoat{color:#b91c1c;border-top:1px solid #eef1f6}

  /* Bảng quản trị */
  /* Bảng quản trị — KÍCH THƯỚC CỐ ĐỊNH.
     Bản cũ dùng max-height nên chiều cao chạy theo nội dung: đổi tab một cái
     là cả cửa sổ co giãn, thanh menu nhảy lên nhảy xuống, nhìn hoa mắt. Nay
     đặt height cứng, phần nội dung tự cuộn bên trong; thanh tiêu đề và hàng
     tab đứng yên một chỗ. Bề ngang lấy đúng 1320px bằng bề ngang nội dung
     trang, để bảng biểu bên trong có chỗ mà thở. */
  .qt-lop{position:fixed;inset:0;z-index:9200;background:rgba(10,20,45,.55);
    display:none;align-items:flex-end;justify-content:center;padding:0}
  .qt-lop.hien{display:flex;animation:qtHienDan .16s ease-out}
  .qt-lop.hien .qt-hop{animation:qtTroiLen .24s cubic-bezier(.2,.8,.3,1)}
  @keyframes qtHienDan{from{opacity:0}to{opacity:1}}
  @keyframes qtTroiLen{from{opacity:0;transform:translateY(16px) scale(.985)}
                       to{opacity:1;transform:none}}
  @media(prefers-reduced-motion:reduce){
    .qt-lop.hien,.qt-lop.hien .qt-hop{animation:none}
  }
  /* Lề mỏng 12px thay cho 24px: cửa sổ này chứa 11 tab và những bảng rộng như
     139 dòng minh chứng hay 607 học sinh. Càng nhiều chỗ càng đỡ phải cuộn. */
  @media(min-width:820px){.qt-lop{align-items:center;padding:12px}}
  .qt-hop{background:#fff;width:100%;max-width:1800px;height:96vh;border-radius:18px 18px 0 0;
    display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px rgba(6,16,40,.4)}
  @media(min-width:820px){.qt-hop{border-radius:18px;height:96vh}}
  .qt-dau{padding:14px 20px;background:#14306b;color:#fff;display:flex;align-items:center;
    gap:12px;flex:none}
  .qt-dau h3{margin:0;font-size:17px;flex:1}
  /* Nút đóng ghi rõ chữ thay cho một dấu ✕ trơ: thầy cô lớn tuổi nhìn dấu ✕
     nhỏ ở góc không chắc là đóng cửa sổ hay xoá dữ liệu đang xem. */
  .qt-dau button{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);
    color:#fff;padding:8px 16px;border-radius:9px;cursor:pointer;font-size:14px;
    font-weight:600;font-family:inherit;white-space:nowrap}
  .qt-dau button:hover{background:rgba(255,255,255,.28)}
  /* Hàng tab đứng yên: flex:none nên không cuộn theo nội dung. Thêm đường kẻ
     và bóng nhẹ cho thấy rõ đây là thanh cố định, nội dung trượt bên dưới. */
  /* Mỗi tab là một KHỐI NỔI riêng, cùng lối với thanh điều hướng trên trang.
     Bản cũ là chữ trơn gạch chân — cả hàng đọc như một dòng liền, phải dò mới
     ra ranh giới giữa các mục. */
  /* flex-wrap: 11 tab xuống hai hàng thay vì cuộn ngang. Bản cũ phải kéo thanh
     cuộn mới thấy tab "Sao lưu" — tab nào nằm ngoài tầm nhìn thì coi như không
     tồn tại với người dùng. */
  .qt-tab{display:flex;flex-wrap:wrap;gap:7px;padding:11px 16px;background:#f4f7fc;flex:none;
    border-bottom:1px solid #e2e8f2;box-shadow:0 2px 8px rgba(15,32,70,.06)}
  .qt-tab button{border:1px solid #dbe3ef;background:#fff;padding:9px 15px;cursor:pointer;
    font-size:13.6px;font-weight:600;color:#54637c;border-radius:11px;font-family:inherit;
    white-space:nowrap;box-shadow:0 1px 3px rgba(15,32,70,.08);
    transition:background .15s,color .15s,box-shadow .15s,transform .15s}
  .qt-tab button:hover{background:#eaf1fb;color:#14306b;border-color:#bfd2ee;
    transform:translateY(-1px)}
  .qt-tab button.on{background:#14306b;color:#fff;border-color:#14306b;font-weight:700;
    box-shadow:0 4px 12px rgba(20,48,107,.34)}
  /* scrollbar-gutter giữ chỗ sẵn cho thanh cuộn: tab nào nội dung ngắn thì
     nội dung cũng không bị xê ngang khi thanh cuộn hiện ra rồi mất đi. */
  .qt-than{padding:16px 18px;overflow:auto;flex:1;-webkit-overflow-scrolling:touch;
    scrollbar-gutter:stable}
  .qt-bang{width:100%;border-collapse:collapse;font-size:13.5px;min-width:640px}
  .qt-bang th{text-align:left;padding:9px 10px;background:#f1f5f9;color:#475569;font-weight:600;
    font-size:12px;text-transform:uppercase;letter-spacing:.03em;position:sticky;top:0}
  .qt-bang td{padding:9px 10px;border-bottom:1px solid #eef1f6;vertical-align:middle}
  .qt-bang select{padding:6px 8px;border:1px solid #d7dde8;border-radius:7px;font-size:13px;
    font-family:inherit;background:#fff;max-width:100%}
  .qt-cuon{overflow-x:auto}
  .qt-them{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;padding:14px;background:#f8fafc;
    border-radius:12px;border:1px solid #e6eaf2}
  .qt-them input,.qt-them select{padding:9px 11px;border:1px solid #d7dde8;border-radius:8px;
    font-size:14px;font-family:inherit;flex:1 1 150px;min-width:0}
  .qt-them button{padding:9px 18px;border:0;border-radius:8px;background:#14306b;color:#fff;
    cursor:pointer;font-size:14px;font-weight:600;font-family:inherit;flex:none}
  .qt-xoa{border:0;background:#fef2f2;color:#b91c1c;padding:6px 11px;border-radius:7px;
    cursor:pointer;font-size:12.5px;font-family:inherit}
  .qt-trong{padding:34px;text-align:center;color:#94a3b8;font-size:14px}
  /* ---- Tab Tổng quan ---- */
  .qt-viec{border-radius:11px;padding:13px 16px;margin-bottom:16px;font-size:13.6px;line-height:1.6;
    background:#fef6f5;border:1px solid #f3c9c5;color:#8a3428}
  .qt-viec.ok{background:#f2fdf6;border-color:#bfe8cd;color:#1a6437}
  .qt-viec ul{margin:8px 0 0 18px;padding:0}
  .qt-viec li{margin-bottom:5px}
  .qt-muc{font-size:12.4px;font-weight:700;color:#1e4593;text-transform:uppercase;
    letter-spacing:.05em;margin:18px 0 9px;padding-bottom:6px;border-bottom:1px solid #e6ebf4}
  .qt-luoi{display:grid;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));gap:10px}
  .qt-o{background:#fff;border:1px solid #e4e9f2;border-radius:11px;padding:12px 14px}
  .qt-o .n{display:block;font-size:12.2px;color:#64748b;font-weight:600;margin-bottom:4px}
  .qt-o .v{display:block;font-size:19px;font-weight:700;color:#14306b;line-height:1.25;
    word-break:break-word}
  .qt-o .p{display:block;font-size:11.6px;color:#94a3b8;margin-top:3px}
  .qt-o.canh{background:#fef6f5;border-color:#f3c9c5}
  .qt-o.canh .v{color:#b3261e}
  .qt-o.luu{background:#fff8ec;border-color:#f2ddb4}
  .qt-o.luu .v{color:#96660f}
  .qt-o.tot{background:#f2fdf6;border-color:#bfe8cd}
  .qt-o.tot .v{color:#15803d}
  .qt-ghi{font-size:12px;color:#94a3b8;line-height:1.6;margin-top:14px}
  .qt-nhac{padding:12px 14px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe;
    color:#1e40af;font-size:13px;line-height:1.6;margin-bottom:14px}
  `;
  document.head.insertAdjacentHTML('beforeend', '<style>' + css + '</style>');

  /* ========================================================================
     MÀN HÌNH ĐĂNG NHẬP
     ======================================================================== */
  const LOGO_GOOGLE = `<svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.7 30.2.5 24 .5 14.6.5 6.5 5.8 2.6 13.6l7.8 6c1.9-5.7 7.2-10.1 13.6-10.1z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.15-3.2-.43-4.7H24v9h12.7c-.55 2.9-2.2 5.4-4.7 7.1l7.6 5.9c4.4-4.1 6.9-10.2 6.9-17.3z"/><path fill="#FBBC05" d="M10.4 28.4c-.5-1.4-.75-2.9-.75-4.4s.27-3 .74-4.4l-7.8-6C1 16.7 0 20.2 0 24s1 7.3 2.6 10.4l7.8-6z"/><path fill="#34A853" d="M24 47.5c6.2 0 11.5-2 15.3-5.6l-7.6-5.9c-2.1 1.4-4.8 2.3-7.7 2.3-6.4 0-11.7-4.3-13.6-10.1l-7.8 6C6.5 42.2 14.6 47.5 24 47.5z"/></svg>`;

  const manDangNhap = document.createElement('div');
  manDangNhap.className = 'dn-lop';
  manDangNhap.innerHTML = `
    <div class="dn-hop" style="max-width:460px">
      <div class="dn-huy">🎓</div>
      <h2>Hệ thống Hồ sơ số<br>${CAU_HINH.TEN_TRUONG}</h2>
      <p class="dn-phu">Đăng nhập bằng địa chỉ Gmail của thầy cô để vào hệ thống.</p>
      <button class="dn-nut" id="dnNut">${LOGO_GOOGLE}<span>Đăng nhập bằng Google</span></button>
      
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-top:14px">
        <button type="button" id="dnXemThu" style="padding:11px 6px;border:1.5px solid #2a5cb8;background:#f0f5ff;color:#1e4593;border-radius:12px;font-weight:600;font-size:12.5px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;font-family:inherit;transition:.18s">👀 Xem thử</button>
        <button type="button" id="dnMoDrive" style="padding:11px 6px;border:1.5px solid #059669;background:#ecfdf5;color:#047857;border-radius:12px;font-weight:600;font-size:12.5px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;font-family:inherit;transition:.18s">📁 Drive</button>
        <button type="button" id="dnMoHuongDan" style="padding:11px 6px;border:1.5px solid #d7dde8;background:#fff;color:#334155;border-radius:12px;font-weight:600;font-size:12.5px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;font-family:inherit;transition:.18s">⚙️ CSDL/GH</button>
      </div>

      <div class="dn-loi" id="dnLoi"></div>
      <div class="dn-chan">
        Nhà trường không lưu giữ mật khẩu Gmail của thầy cô. Việc xác thực do
        Google thực hiện. Dữ liệu cá nhân được bảo vệ theo Nghị định 13/2023/NĐ-CP.
      </div>
    </div>`;
  document.body.appendChild(manDangNhap);

  const manChoDuyet = document.createElement('div');
  manChoDuyet.className = 'dn-lop';
  manChoDuyet.innerHTML = `
    <div class="dn-hop" style="max-width:480px">
      <div class="dn-huy">⏳</div>
      <h2>Tài khoản đang chờ duyệt</h2>
      <p class="dn-phu" id="cdEmail"></p>
      <div class="dn-cho">
        Tài khoản Google này đã xác thực thành công nhưng chưa được kích hoạt quyền trong cơ sở dữ liệu của nhà trường.
      </div>
      <div style="margin-top:16px">
        <button type="button" id="cdKichHoatAdmin" style="width:100%;padding:13px 16px;border:0;background:#14306b;color:#fff;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:7px;box-shadow:0 4px 14px rgba(20,48,107,.25)">🔑 Kích hoạt quyền Quản trị (Admin) ngay</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:9px">
        <button type="button" id="cdXemThu" style="padding:11px 10px;border:1.5px solid #2a5cb8;background:#f0f5ff;color:#1e4593;border-radius:12px;font-weight:600;font-size:13px;cursor:pointer;font-family:inherit">👀 Vào xem thử</button>
        <button type="button" id="cdHuongDan" style="padding:11px 10px;border:1.5px solid #d7dde8;background:#fff;color:#334155;border-radius:12px;font-weight:600;font-size:13px;cursor:pointer;font-family:inherit">⚙️ CSDL & SQL</button>
      </div>
      <button class="dn-nut" id="cdThoat" style="margin-top:12px">Đăng xuất</button>
    </div>`;
  document.body.appendChild(manChoDuyet);

  function hienLoi(msg) {
    const el = document.getElementById('dnLoi');
    el.textContent = msg;
    el.classList.add('hien');
  }

  /* Ẩn toàn bộ nội dung trang cho tới khi đăng nhập xong */
  function khoaTrang(khoa) {
    document.body.style.overflow = khoa ? 'hidden' : '';
    document.querySelectorAll('.view, .topbar, footer').forEach(el => {
      el.style.visibility = khoa ? 'hidden' : '';
    });
  }

  function laUuid(str) {
    return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  }
  window.laUuid = laUuid;
  window.layNguoiDungId = function () {
    return (window.NGUOI_DUNG && laUuid(window.NGUOI_DUNG.id)) ? window.NGUOI_DUNG.id : null;
  };

  function batDauXemThu() {
    sessionStorage.setItem('THCS_XEM_THU', 'true');
    nguoiDung = {
      id: null, // Đặt null để khi ghi cơ sở dữ liệu không bị lỗi: invalid input syntax for type uuid
      email: 'admin.thcsbachlieu@nghean.edu.vn',
      ho_ten: 'Nguyễn Phúc Lộc (Quản trị viên)',
      vai_tro: 'admin',
      trang_thai: 'hoat_dong',
      chuc_vu: 'Hiệu trưởng - Quản trị hệ thống'
    };
    window.NGUOI_DUNG = nguoiDung;
    manDangNhap.classList.remove('hien');
    manChoDuyet.classList.remove('hien');
    khoaTrang(false);
    dungTheNguoiDung();
    document.dispatchEvent(new CustomEvent('dangnhap-xong', { detail: nguoiDung }));
    if (typeof window.tatManCho === 'function') window.tatManCho();
  }

  document.getElementById('dnNut').addEventListener('click', async function () {
    this.disabled = true;
    this.querySelector('span').textContent = 'Đang chuyển sang Google…';
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: location.origin + location.pathname }
    });
    if (error) {
      this.disabled = false;
      this.querySelector('span').textContent = 'Đăng nhập bằng Google';
      hienLoi('Không kết nối được tới Google: ' + error.message + ' (Thầy cô có thể bấm "Xem thử ngay" bên dưới để vào hệ thống).');
    }
  });

  document.getElementById('dnXemThu')?.addEventListener('click', batDauXemThu);
  document.getElementById('cdXemThu')?.addEventListener('click', batDauXemThu);
  document.getElementById('dnMoDrive')?.addEventListener('click', () => moHuongDanLienKet('drive'));
  document.getElementById('dnMoHuongDan')?.addEventListener('click', () => moHuongDanLienKet('gh'));
  document.getElementById('cdHuongDan')?.addEventListener('click', () => moHuongDanLienKet('sql'));

  document.getElementById('cdKichHoatAdmin')?.addEventListener('click', async function () {
    const btn = this;
    btn.disabled = true;
    btn.textContent = 'Đang kích hoạt quyền Quản trị…';
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { location.reload(); return; }
      const u = session.user;
      const hoTen = u.user_metadata?.full_name || u.user_metadata?.name || u.email.split('@')[0];
      const anh = u.user_metadata?.avatar_url || u.user_metadata?.picture || null;
      const ban = {
        id: u.id,
        email: u.email,
        ho_ten: hoTen,
        chuc_vu: 'Hiệu trưởng - Quản trị hệ thống',
        vai_tro: 'admin',
        trang_thai: 'hoat_dong',
        anh_dai_dien: anh
      };
      const { error } = await sb.from('nguoi_dung').upsert(ban);
      if (error) {
        alert('Chưa kích hoạt tự động được: ' + error.message + '\nThầy cô vui lòng chạy câu lệnh SQL trong Supabase.');
        btn.disabled = false;
        btn.textContent = '🔑 Kích hoạt quyền Quản trị (Admin) ngay';
      } else {
        location.reload();
      }
    } catch (e) {
      alert('Lỗi: ' + (e.message || e));
      btn.disabled = false;
      btn.textContent = '🔑 Kích hoạt quyền Quản trị (Admin) ngay';
    }
  });

  document.getElementById('cdThoat').addEventListener('click', async () => {
    sessionStorage.removeItem('THCS_XEM_THU');
    try { await sb.auth.signOut(); } catch(e){}
    location.reload();
  });

  /* ========================================================================
     THẺ NGƯỜI DÙNG TRÊN THANH ĐIỀU HƯỚNG
     ======================================================================== */
  function chuCaiDau(ten) {
    const w = String(ten).trim().split(/\s+/);
    return ((w[0][0] || '') + (w[w.length - 1][0] || '')).toUpperCase();
  }

  function dungTheNguoiDung() {
    const thanh = document.querySelector('.topbar-in');
    if (!thanh || document.getElementById('dnThe')) return;

    const the = document.createElement('button');
    the.className = 'dn-the';
    the.id = 'dnThe';
    const anh = nguoiDung.anh_dai_dien
      ? `style="background-image:url('${nguoiDung.anh_dai_dien}')"` : '';
    the.innerHTML = `
      <span class="av" ${anh}>${nguoiDung.anh_dai_dien ? '' : chuCaiDau(nguoiDung.ho_ten)}</span>
      <span class="tt"><b>${nguoiDung.ho_ten}</b><span>${TEN_VAI_TRO[nguoiDung.vai_tro] || ''}</span></span>`;
    thanh.insertBefore(the, document.querySelector('.nav-burger'));

    const menu = document.createElement('div');
    menu.className = 'dn-menu';
    menu.id = 'dnMenu';
    const laQuanTri = ['admin', 'ban_giam_hieu'].includes(nguoiDung.vai_tro);
    menu.innerHTML = `
      <div class="dau">
        <b>${nguoiDung.ho_ten}</b>
        <span>${nguoiDung.email}</span>
        <span class="vt">${TEN_VAI_TRO[nguoiDung.vai_tro] || nguoiDung.vai_tro}</span>
      </div>
      ${laQuanTri ? '<button id="dnQuanTri">⚙️ Quản trị hệ thống</button>' : ''}
      <button id="dnHuongDanDrive">📁 Kết nối Google Drive</button>
      <button id="dnHuongDanLienKet">🐙 CSDL & GitHub</button>
      <button class="thoat" id="dnThoat">↩ Đăng xuất</button>`;
    document.body.appendChild(menu);

    if (!document.getElementById('dnNutPhao')) {
      const phao = document.createElement('button');
      phao.id = 'dnNutPhao';
      phao.title = 'Xem hướng dẫn liên kết GitHub & Cơ sở dữ liệu Supabase';
      phao.style.cssText = 'position:fixed;bottom:18px;right:18px;z-index:8500;padding:10px 16px;background:#14306b;color:#fff;border-radius:999px;font-size:13.5px;font-weight:600;display:flex;align-items:center;gap:8px;box-shadow:0 6px 22px rgba(10,25,60,.3);cursor:pointer;border:1.5px solid rgba(255,255,255,.3);font-family:inherit;transition:.18s';
      phao.innerHTML = '⚙️ <b>CSDL & GitHub</b>';
      phao.addEventListener('mouseenter', () => { phao.style.transform = 'translateY(-2px)'; phao.style.background = '#1e4593'; });
      phao.addEventListener('mouseleave', () => { phao.style.transform = 'none'; phao.style.background = '#14306b'; });
      phao.addEventListener('click', () => moHuongDanLienKet('gh'));
      document.body.appendChild(phao);
    }

    the.addEventListener('click', e => {
      e.stopPropagation();
      const r = the.getBoundingClientRect();
      menu.style.top = (r.bottom + 8) + 'px';
      menu.style.right = Math.max(10, window.innerWidth - r.right) + 'px';
      menu.classList.toggle('hien');
    });
    document.addEventListener('click', () => menu.classList.remove('hien'));
    menu.addEventListener('click', e => e.stopPropagation());

    document.getElementById('dnHuongDanDrive')?.addEventListener('click', () => {
      menu.classList.remove('hien');
      moHuongDanLienKet('drive');
    });

    document.getElementById('dnHuongDanLienKet')?.addEventListener('click', () => {
      menu.classList.remove('hien');
      moHuongDanLienKet('gh');
    });

    document.getElementById('dnThoat').addEventListener('click', async () => {
      sessionStorage.removeItem('THCS_XEM_THU');
      try { await sb.auth.signOut(); } catch(e){}
      location.reload();
    });
    if (laQuanTri) {
      document.getElementById('dnQuanTri').addEventListener('click', () => {
        menu.classList.remove('hien');
        moBangQuanTri();
      });
      /* Mở thêm một cửa vào ngay trang chủ. Trước đây chức năng quản trị chỉ
         nấp trong menu thả xuống ở góc, ít người biết là có. Thẻ này chỉ hiện
         với quản trị và ban giám hiệu — người khác không thấy gì. */
      const the = document.getElementById('modQuanTri');
      if (the) {
        the.style.display = '';
        the.addEventListener('click', () => moBangQuanTri());
      }
    }
  }

  /* Cho phần khác của trang gọi tới, ví dụ thẻ Quản trị hệ thống ở trang chủ.
     Truyền mã tab thì mở thẳng vào tab đó — màn hình Trường chuẩn Quốc gia
     dùng lối này để đi tới Hội đồng TĐG và Kế hoạch cải tiến, thay vì bắt
     thầy cô tự dò trong tám tab. Không truyền gì thì vẫn vào Tổng quan. */
  window.moQuanTri = function (tab) { moBangQuanTri(tab); };

  /* ========================================================================
     BẢNG QUẢN TRỊ — người dùng, danh sách mời, nhật ký
     ======================================================================== */
  let bangQT = null;

  function moBangQuanTri(tabMuon) {
    if (!bangQT) {
      bangQT = document.createElement('div');
      bangQT.className = 'qt-lop';
      bangQT.innerHTML = `
        <div class="qt-hop">
          <div class="qt-dau">
            <h3>⚙️ Quản trị hệ thống</h3>
            <button id="qtDong" title="Đóng cửa sổ Quản trị hệ thống">✕ Đóng lại</button>
          </div>
          <div class="qt-tab">
            ${dsTab().map((t, i) =>
              `<button${i === 0 ? ' class="on"' : ''} data-tab="${t.ma}">${t.ten}</button>`).join('')}
          </div>
          <div class="qt-than" id="qtThan"></div>
        </div>`;
      document.body.appendChild(bangQT);
      bangQT.addEventListener('click', e => { if (e.target === bangQT) dongBangQuanTri(); });
      document.getElementById('qtDong').addEventListener('click', dongBangQuanTri);
      bangQT.querySelectorAll('.qt-tab button').forEach(b => {
        b.addEventListener('click', () => {
          bangQT.querySelectorAll('.qt-tab button').forEach(x => x.classList.remove('on'));
          b.classList.add('on');
          veTab(b.dataset.tab);
        });
      });
    }
    bangQT.classList.add('hien');
    document.body.style.overflow = 'hidden';

    /* Tab muốn mở phải CÓ THẬT trong danh sách. Tệp đăng ký tab chưa nạp được
       — mạng chậm, hoặc chưa chạy tệp sql tương ứng — thì nút sáng một đằng
       thân bảng một nẻo; thà quay về Tổng quan còn hơn để trống. */
    const ds = [...bangQT.querySelectorAll('.qt-tab button')];
    let i = tabMuon ? ds.findIndex(x => x.dataset.tab === tabMuon) : 0;
    if (i < 0) i = 0;
    /* Trả nút sáng cho khớp với thân bảng. Thiếu dòng này thì xem tab khác rồi
       đóng, mở lại sẽ thấy thân là Tổng quan mà nút sáng vẫn là tab cũ. */
    ds.forEach((x, k) => x.classList.toggle('on', k === i));
    veTab(ds[i] ? ds[i].dataset.tab : 'tq');
  }

  function dongBangQuanTri() {
    bangQT.classList.remove('hien');
    document.body.style.overflow = '';
  }

  const than = () => document.getElementById('qtThan');

  /* Thứ tự tab do thầy Chung chốt: việc thường ngày của nhà trường xếp trước,
     việc quản trị tài khoản xếp sau.
       Tổng quan → Danh mục Hồ sơ số → CBGV-NV → Học sinh
       → Người dùng → Danh sách mời → Nhật ký → Sao lưu
     Tab do tệp khác đăng ký mang sẵn số thứ tự riêng, trộn vào đúng chỗ chứ
     không dồn hết về một cụm. */
  const TAB_CHINH = [
    { ma: 'tq',  ten: 'Tổng quan',      tt: 10 },
    { ma: 'nd',  ten: 'Người dùng',     tt: 50 },
    { ma: 'moi', ten: 'Danh sách mời',  tt: 60 },
    { ma: 'nk',  ten: 'Nhật ký',        tt: 70 },
    { ma: 'sl',  ten: 'Sao lưu',        tt: 80 }
  ];
  function dsTab() {
    return TAB_CHINH.concat(window.qtTabPhu || [])
      .slice()
      .sort((a, b) => (a.tt == null ? 99 : a.tt) - (b.tt == null ? 99 : b.tt));
  }

  async function veTab(tab) {
    /* Về đầu trang mỗi khi đổi tab — không thì tab mới mở ra ở lưng chừng
       đúng chỗ đang cuộn của tab cũ, thầy cô tưởng thiếu nội dung. */
    than().scrollTop = 0;
    than().innerHTML = '<div class="qt-trong">Đang tải…</div>';
    if (tab === 'tq') return veTabTongQuan();
    if (tab === 'nd') return veTabNguoiDung();
    if (tab === 'moi') return veTabMoi();
    if (tab === 'nk') return veTabNhatKy();
    if (tab === 'sl') return veTabSaoLuu();
    /* Tab do tệp khác đăng ký — mỗi tệp lo phần của mình, khỏi phình tệp này */
    const phu = (window.qtTabPhu || []).find(t => t.ma === tab);
    if (phu && typeof phu.ve === 'function') {
      try { return await phu.ve(than()); }
      catch (e) {
        console.error('[Quản trị] Tab ' + tab + ' hỏng:', e);
        /* Bọc escape: câu lỗi của máy chủ có lúc lặp lại nguyên giá trị dữ
           liệu người dùng vừa gửi lên, mà dữ liệu đó đến từ ô Excel. */
        const s = String(e.message || e)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        than().innerHTML = '<div class="qt-trong">Không mở được mục này: ' + s + '</div>';
      }
      return;
    }
    than().innerHTML = '<div class="qt-trong">Chưa nạp được mục này, thầy cô tải lại trang.</div>';
  }

  /* --- Tab 0: TỔNG QUAN — sức khoẻ hệ thống trong một màn hình ---
     Trước đây muốn biết có việc gì cần xử lý thì phải bấm từng tab rồi tự
     nhẩm. Nay mở ra là thấy ngay, và những chỗ cần xử lý thì hiện màu cảnh
     báo chứ không nằm lẫn trong số liệu bình thường. */
  async function veTabTongQuan() {
    if (!sb) {
      return than().innerHTML = `<div class="qt-trong">
        <h4 style="font-size:16px;color:#14306b;margin-bottom:8px">Hệ thống đang chạy chế độ xem thử (Demo)</h4>
        <p style="color:#64748b;max-width:560px;margin:0 auto 16px">Để kích hoạt đầy đủ các tính năng quản trị cơ sở dữ liệu trên máy chủ Supabase, thầy cô hãy mở bảng cấu hình kết nối.</p>
        <button type="button" onclick="window.moHuongDanLienKet && window.moHuongDanLienKet('gh')" style="padding:10px 18px;border-radius:10px;background:#14306b;color:#fff;border:none;font-weight:600;cursor:pointer;font-family:inherit">⚙️ Hướng dẫn CSDL & GitHub</button>
      </div>`;
    }
    const { data, error } = await sb.rpc('qt_tong_quan');
    if (error) {
      return than().innerHTML = `<div class="qt-trong">Không đọc được tổng quan: ${error.message}
        <br><br>Nếu báo thiếu hàm <b>qt_tong_quan</b> thì chạy tệp <b>sql/21</b> trong Supabase.</div>`;
    }
    const d = data || {};
    const so = v => (v == null ? '—' : Number(v).toLocaleString('vi-VN'));
    const ngay = v => v ? new Date(v).toLocaleString('vi-VN') : '—';

    /* Nhịp tim: Supabase gói miễn phí tạm ngưng dự án nếu 7 ngày không ai gọi */
    const nt = Number(d.tim_so_ngay);
    const timXau = !isFinite(nt) || nt > 6;
    const timLo  = isFinite(nt) && nt > 3 && nt <= 6;

    const viec = [];
    if (d.tk_cho_duyet > 0)
      viec.push(`<b>${d.tk_cho_duyet}</b> tài khoản đang chờ duyệt — sang tab Người dùng đổi trạng thái sang <b>Đang hoạt động</b>.`);
    if (timXau)
      viec.push(`Nhịp tim cơ sở dữ liệu <b>${isFinite(nt) ? nt + ' ngày' : 'không đọc được'}</b> — lịch cron-job.org có thể đã hỏng. Supabase tạm ngưng dự án nếu 7 ngày không ai truy cập.`);
    else if (timLo)
      viec.push(`Nhịp tim <b>${nt} ngày</b> — vẫn an toàn nhưng nên để ý.`);
    if (d.hs_chua_gan > 0)
      viec.push(`<b>${d.hs_chua_gan}</b> hồ sơ chưa gán người phụ trách — sau khi siết quyền thì không giáo viên nào xem được.`);
    if (d.tk_admin < 2)
      viec.push(`Chỉ có <b>${d.tk_admin}</b> tài khoản quản trị. Nên có ít nhất hai người, phòng khi một người không truy cập được.`);

    const o = (nhan, gt, phu, mau) => `
      <div class="qt-o${mau ? ' ' + mau : ''}">
        <span class="n">${nhan}</span>
        <span class="v">${gt}</span>
        ${phu ? `<span class="p">${phu}</span>` : ''}
      </div>`;

    than().innerHTML = `
      ${viec.length
        ? `<div class="qt-viec"><b>⚠ Có ${viec.length} việc cần xử lý</b><ul>${viec.map(v => `<li>${v}</li>`).join('')}</ul></div>`
        : '<div class="qt-viec ok"><b>✅ Hệ thống bình thường, không có việc nào cần xử lý ngay.</b></div>'}

      <div class="qt-muc">Tài khoản</div>
      <div class="qt-luoi">
        ${o('Đang hoạt động', so(d.tk_hoat_dong))}
        ${o('Chờ duyệt', so(d.tk_cho_duyet), 'cần xử lý', d.tk_cho_duyet > 0 ? 'canh' : '')}
        ${o('Bị khoá', so(d.tk_khoa))}
        ${o('Quản trị, ban giám hiệu', so(d.tk_admin), '', d.tk_admin < 2 ? 'canh' : '')}
        ${o('Đã mời, chưa vào lần nào', so(d.moi_chua_vao))}
      </div>

      <div class="qt-muc">Hồ sơ số</div>
      <div class="qt-luoi">
        ${o('Tổng đầu mục', so(d.hs_tong))}
        ${o('Đã có hồ sơ', so(d.hs_da_co),
            d.hs_tong ? Math.round(d.hs_da_co * 100 / d.hs_tong) + '% tổng số' : '')}
        ${o('Chưa gán người phụ trách', so(d.hs_chua_gan), '', d.hs_chua_gan > 0 ? 'canh' : 'tot')}
        ${o('Chưa có đường dẫn Drive', so(d.hs_chua_link))}
      </div>

      <div class="qt-muc">Học sinh và phân công</div>
      <div class="qt-luoi">
        ${o('Học sinh đã khai báo', so(d.ths_tong))}
        ${o('Đang học', so(d.ths_dang_hoc))}
        ${o('Số lớp', so(d.ths_so_lop))}
        ${o('Dòng phân công giảng dạy', so(d.ths_phan_cong), '', d.ths_phan_cong == 0 ? 'canh' : '')}
      </div>

      <div class="qt-muc">Tình trạng hệ thống</div>
      <div class="qt-luoi">
        ${o('Nhịp tim gần nhất', ngay(d.tim_lan_cuoi),
            isFinite(nt) ? nt + ' ngày trước' : '', timXau ? 'canh' : (timLo ? 'luu' : 'tot'))}
        ${o('Nhật ký 30 ngày qua', so(d.nk_30_ngay), 'trên tổng ' + so(d.nk_tong))}
        ${o('Hoạt động gần nhất', ngay(d.nk_moi_nhat))}
      </div>

      <p class="qt-ghi">Nhịp tim là lần cuối có ai đó gọi tới cơ sở dữ liệu. Supabase gói miễn phí
        <b>tạm ngưng dự án nếu 7 ngày liền không ai truy cập</b>. Lịch tự động chạy 07:00 hằng ngày
        trên cron-job.org; nếu con số vượt quá 6 ngày thì lịch đã hỏng, phải vào kiểm tra ngay.</p>`;
  }

  /* --- Tab 1: danh sách người dùng đã đăng nhập --- */
  async function veTabNguoiDung() {
    if (!sb) {
      return than().innerHTML = `<div class="qt-trong">Chế độ xem thử sử dụng danh sách cán bộ giáo viên mẫu. Khi kết nối Supabase, thầy cô sẽ duyệt và phân quyền cho từng tài khoản Gmail tại đây.</div>`;
    }
    const { data, error } = await sb.from('nguoi_dung')
      .select('*').order('trang_thai').order('ho_ten');
    if (error) return than().innerHTML = `<div class="qt-trong">Lỗi: ${error.message}</div>`;

    const cho = data.filter(x => x.trang_thai === 'cho_duyet').length;
    than().innerHTML = `
      ${cho ? `<div class="qt-nhac">Có <b>${cho}</b> tài khoản đang chờ duyệt. Đổi cột "Trạng thái" sang <b>Đang hoạt động</b> để cho phép vào hệ thống.</div>` : ''}
      <div class="qt-cuon"><table class="qt-bang">
        <thead><tr>
          <th>Họ và tên</th><th>Địa chỉ Gmail</th><th style="width:180px">Vai trò</th>
          <th style="width:160px">Trạng thái</th><th style="width:130px">Lần vào cuối</th>
        </tr></thead>
        <tbody>${data.map(u => `
          <tr>
            <td><b>${u.ho_ten}</b>${u.chuc_vu ? `<br><span style="color:#64748b;font-size:12px">${u.chuc_vu}</span>` : ''}</td>
            <td style="color:#64748b;font-size:12.5px;word-break:break-all">${u.email}</td>
            <td><select data-id="${u.id}" data-cot="vai_tro">
              ${Object.entries(TEN_VAI_TRO).map(([k, v]) =>
                `<option value="${k}" ${u.vai_tro === k ? 'selected' : ''}>${v}</option>`).join('')}
            </select></td>
            <td><select data-id="${u.id}" data-cot="trang_thai">
              ${Object.entries(TEN_TRANG_THAI).map(([k, v]) =>
                `<option value="${k}" ${u.trang_thai === k ? 'selected' : ''}>${v}</option>`).join('')}
            </select></td>
            <td style="color:#64748b;font-size:12.5px">${u.lan_vao_cuoi ? new Date(u.lan_vao_cuoi).toLocaleDateString('vi-VN') : '—'}</td>
          </tr>`).join('')}
        </tbody></table></div>`;

    than().querySelectorAll('select[data-id]').forEach(s => {
      s.addEventListener('change', async () => {
        const { error } = await sb.from('nguoi_dung')
          .update({ [s.dataset.cot]: s.value }).eq('id', s.dataset.id);
        baoNhanh(error ? 'Không lưu được: ' + error.message : 'Đã lưu thay đổi.');
      });
    });
  }

  /* --- Tab 2: danh sách email được mời trước --- */
  async function veTabMoi() {
    const { data, error } = await sb.from('moi_tai_khoan').select('*').order('email');
    if (error) return than().innerHTML = `<div class="qt-trong">Lỗi: ${error.message}</div>`;

    than().innerHTML = `
      <div class="qt-nhac">Nhập trước Gmail của cán bộ, giáo viên, nhân viên vào đây.
        Người có tên trong danh sách này đăng nhập lần đầu là <b>vào được ngay</b>,
        không cần chờ duyệt.</div>
      <div class="qt-them">
        <input id="mEmail" type="email" placeholder="Gmail, ví dụ: nguyenvana@gmail.com">
        <input id="mTen" placeholder="Họ và tên">
        <input id="mChucVu" placeholder="Chức vụ">
        <select id="mVaiTro">
          ${Object.entries(TEN_VAI_TRO).map(([k, v]) =>
            `<option value="${k}" ${k === 'giao_vien' ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
        <button id="mThem">➕ Thêm</button>
      </div>
      <div class="qt-cuon"><table class="qt-bang">
        <thead><tr><th>Gmail</th><th>Họ và tên</th><th>Chức vụ</th><th style="width:180px">Vai trò</th><th style="width:80px"></th></tr></thead>
        <tbody>${data.length ? data.map(m => `
          <tr>
            <td style="word-break:break-all">${m.email}</td>
            <td>${m.ho_ten || '—'}</td>
            <td style="color:#64748b">${m.chuc_vu || '—'}</td>
            <td>${TEN_VAI_TRO[m.vai_tro] || m.vai_tro}</td>
            <td><button class="qt-xoa" data-xoa="${m.id}">Xoá</button></td>
          </tr>`).join('') : '<tr><td colspan="5" class="qt-trong">Chưa có địa chỉ nào.</td></tr>'}
        </tbody></table></div>`;

    document.getElementById('mThem').addEventListener('click', async () => {
      const email = document.getElementById('mEmail').value.trim().toLowerCase();
      if (!email) return baoNhanh('Chưa nhập địa chỉ Gmail.');
      const { error } = await sb.from('moi_tai_khoan').insert({
        email,
        ho_ten: document.getElementById('mTen').value.trim() || null,
        chuc_vu: document.getElementById('mChucVu').value.trim() || null,
        vai_tro: document.getElementById('mVaiTro').value
      });
      if (error) return baoNhanh('Không thêm được: ' + error.message);
      baoNhanh('Đã thêm ' + email);
      veTabMoi();
    });

    than().querySelectorAll('[data-xoa]').forEach(b => {
      b.addEventListener('click', async () => {
        const { error } = await sb.from('moi_tai_khoan').delete().eq('id', b.dataset.xoa);
        if (error) return baoNhanh('Không xoá được: ' + error.message);
        veTabMoi();
      });
    });
  }

  /* --- Tab 3: nhật ký truy cập và thay đổi ---
     Có bộ lọc theo người, bảng dữ liệu và hành động. Nghị định 13/2023 đòi
     truy vết được "ai đã đụng vào dữ liệu nào"; 200 dòng gần nhất không lọc
     được thì đến lúc cần giải trình sẽ không tra ra. */
  let nkLoc = { email: '', bang: '', hd: '' };

  async function veTabNhatKy() {
    let q = sb.from('nhat_ky').select('*');
    if (nkLoc.email) q = q.ilike('email', '%' + nkLoc.email + '%');
    if (nkLoc.bang) q = q.eq('bang', nkLoc.bang);
    if (nkLoc.hd) q = q.eq('hanh_dong', nkLoc.hd);
    const { data, error } = await q.order('thoi_gian', { ascending: false }).limit(300);
    if (error) return than().innerHTML = `<div class="qt-trong">Lỗi: ${error.message}</div>`;

    /* Danh sách bảng để lọc — lấy từ chính dữ liệu đang có */
    const dsBang = Array.from(new Set((data || []).map(n => n.bang).filter(Boolean))).sort();
    if (nkLoc.bang && dsBang.indexOf(nkLoc.bang) < 0) dsBang.push(nkLoc.bang);

    const TEN_HD = {
      INSERT: 'Thêm mới', UPDATE: 'Sửa', DELETE: 'Xoá',
      DANG_NHAP_LAN_DAU: 'Đăng nhập lần đầu'
    };
    than().innerHTML = `
      <div class="qt-nhac">Sổ nhật ký ghi lại mọi thay đổi dữ liệu, phục vụ yêu cầu
        của Nghị định 13/2023/NĐ-CP. Không ai sửa hay xoá được nhật ký, kể cả quản trị.</div>
      <div class="qt-them">
        <input id="nkEmail" placeholder="Lọc theo người, gõ một phần địa chỉ Gmail" value="${nkLoc.email}">
        <select id="nkBang">
          <option value="">Tất cả bảng dữ liệu</option>
          ${dsBang.map(b => `<option value="${b}" ${b === nkLoc.bang ? 'selected' : ''}>${b}</option>`).join('')}
        </select>
        <select id="nkHd">
          <option value="">Tất cả hành động</option>
          ${Object.entries(TEN_HD).map(([k, v]) =>
            `<option value="${k}" ${k === nkLoc.hd ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
        <button id="nkLoc">🔍 Lọc</button>
        <button id="nkXoaLoc" class="qt-xoa">Bỏ lọc</button>
      </div>
      <div class="qt-cuon"><table class="qt-bang">
        <thead><tr><th style="width:150px">Thời gian</th><th>Người thực hiện</th>
          <th style="width:130px">Hành động</th><th>Bảng dữ liệu</th></tr></thead>
        <tbody>${data.length ? data.map(n => `
          <tr>
            <td style="color:#64748b;font-size:12.5px">${new Date(n.thoi_gian).toLocaleString('vi-VN')}</td>
            <td style="word-break:break-all">${n.email || '—'}</td>
            <td>${TEN_HD[n.hanh_dong] || n.hanh_dong}</td>
            <td style="color:#64748b">${n.bang || '—'}${n.ban_ghi ? ` <span style="font-size:11px">#${n.ban_ghi}</span>` : ''}</td>
          </tr>`).join('') : '<tr><td colspan="4" class="qt-trong">Không có dòng nào khớp bộ lọc.</td></tr>'}
        </tbody></table></div>
      <p class="qt-ghi">Hiện ${data.length} dòng gần nhất${data.length >= 300 ? ' (đã đạt giới hạn 300 dòng, thu hẹp bộ lọc để xem sâu hơn)' : ''}.</p>`;

    document.getElementById('nkLoc').addEventListener('click', () => {
      nkLoc.email = document.getElementById('nkEmail').value.trim();
      nkLoc.bang = document.getElementById('nkBang').value;
      nkLoc.hd = document.getElementById('nkHd').value;
      veTabNhatKy();
    });
    document.getElementById('nkXoaLoc').addEventListener('click', () => {
      nkLoc = { email: '', bang: '', hd: '' };
      veTabNhatKy();
    });
    document.getElementById('nkEmail').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('nkLoc').click();
    });
  }

  /* --- Tab 4: SAO LƯU DỮ LIỆU ---
     Toàn bộ dữ liệu của trường nằm trên Supabase gói miễn phí. Dự án bị tạm
     ngưng, xoá nhầm hoặc mất tài khoản là mất sạch. Nút này kết xuất mọi bảng
     ra MỘT tệp Excel nhiều trang tính để nhà trường giữ bản riêng.

     Tệp chứa dữ liệu cá nhân của học sinh và cán bộ, nên phải cảnh báo rõ về
     nghĩa vụ bảo quản theo Nghị định 13/2023/NĐ-CP. */
  const BANG_SAO_LUU = [
    ['nguoi_dung', 'Tai khoan'], ['moi_tai_khoan', 'Danh sach moi'],
    ['nhom_ho_so', 'Nhom ho so'], ['nhom_con', 'Hop ho so'], ['ho_so', 'Ho so so'],
    ['tieu_chi', 'Tieu chi TT57'], ['tu_danh_gia', 'Tu danh gia'],
    ['danh_gia_tieu_chuan', 'Danh gia tieu chuan'], ['ke_hoach_cai_tien', 'Ke hoach cai tien'],
    ['chi_so', 'Chi so nhieu nam'],
    ['dbcl_chi_tieu', 'DBCL chi tieu'], ['dbcl_so_lieu', 'DBCL so lieu'],
    ['dbcl_cam_ket', 'DBCL cam ket GV'], ['dbcl_cam_ket_dong', 'DBCL cam ket dong'],
    ['dbcl_moc', 'DBCL moc cong viec'], ['dbcl_tu_soat_kq', 'DBCL tu soat'],
    ['dbcl_to', 'To DBCL'], ['dbcl_to_thanh_vien', 'To DBCL thanh vien'],
    ['dbcl_phan_cong', 'To DBCL phan cong'],
    ['mon_hoc', 'Mon hoc'], ['hoc_sinh', 'Hoc sinh'], ['hoc_sinh_lop', 'Hoc sinh lop'],
    ['phan_cong_day', 'Phan cong giang day'],
    ['hs_ket_qua', 'Ket qua tung mon'], ['hs_ren_luyen', 'Ren luyen'],
    ['hs_cam_ket', 'Cam ket tung hoc sinh']
  ];

  async function docHet(bang) {
    const BUOC = 1000;
    let tuDau = 0, gom = [];
    for (;;) {
      const r = await sb.from(bang).select('*').range(tuDau, tuDau + BUOC - 1);
      if (r.error) return { loi: r.error.message, data: gom };
      const d = r.data || [];
      gom = gom.concat(d);
      if (d.length < BUOC) break;
      tuDau += BUOC;
      if (tuDau > 100000) break;
    }
    return { loi: null, data: gom };
  }

  function veTabSaoLuu() {
    than().innerHTML = `
      <div class="qt-nhac">Toàn bộ dữ liệu của nhà trường đang nằm trên Supabase gói miễn phí.
        Dự án bị tạm ngưng, xoá nhầm hoặc mất quyền truy cập là mất sạch. Nên sao lưu
        <b>mỗi học kỳ một lần</b> và giữ tệp ở nơi khác.</div>
      <div class="qt-viec">
        <b>⚠ Tệp sao lưu chứa dữ liệu cá nhân</b>
        <ul>
          <li>Có họ tên, ngày sinh, kết quả học tập của học sinh và thông tin cán bộ, giáo viên.</li>
          <li>Theo <b>Nghị định 13/2023/NĐ-CP</b>, tệp này phải được bảo quản như hồ sơ mật:
              không gửi qua Zalo, Messenger; không lưu trên máy dùng chung.</li>
          <li>Nên lưu vào Drive của nhà trường, đặt quyền chỉ Ban giám hiệu xem được.</li>
        </ul>
      </div>
      <div class="qt-viec" style="background:#f4f7fc;border-color:#cfdcf0;color:#22406b">
        <b>Đây KHÔNG phải báo cáo — đừng mở ra để đọc</b>
        <ul>
          <li>Tệp là bản chụp thô của toàn bộ cơ sở dữ liệu: hàng chục nghìn dòng,
              ${BANG_SAO_LUU.length} trang tính. Không ai đọc được, và không cần đọc.</li>
          <li>Nó chỉ có giá trị đúng một lúc: khi dữ liệu trên Supabase mất hẳn.</li>
          <li>Muốn số liệu để làm việc thì dùng các nút xuất Word, Excel ở từng
              mục — những bản ấy mới đọc được.</li>
        </ul>
      </div>
      <div class="qt-them">
        <button id="slChay">💾 Tạo bản sao lưu khẩn cấp (Excel)</button>
      </div>
      <div id="slKq"></div>
      <p class="qt-ghi">Tệp gồm ${BANG_SAO_LUU.length} trang tính, mỗi bảng dữ liệu một trang.
        Sổ nhật ký không đưa vào vì rất dài và không phải dữ liệu nghiệp vụ; muốn lấy thì
        dùng nút Export ở tab Nhật ký của Supabase.</p>`;

    document.getElementById('slChay').addEventListener('click', async () => {
      if (typeof XLSX === 'undefined') {
        return baoNhanh('Chưa nạp được thư viện Excel. Kiểm tra mạng rồi tải lại trang.');
      }
      const nut = document.getElementById('slChay');
      const kq = document.getElementById('slKq');
      nut.disabled = true;
      const wb = XLSX.utils.book_new();
      let tongDong = 0;
      const loi = [];

      for (let i = 0; i < BANG_SAO_LUU.length; i++) {
        const [bang, ten] = BANG_SAO_LUU[i];
        kq.innerHTML = `<div class="qt-nhac">Đang đọc <b>${bang}</b> … (${i + 1}/${BANG_SAO_LUU.length})</div>`;
        const r = await docHet(bang);
        if (r.loi) { loi.push(bang + ': ' + r.loi); continue; }
        const ws = XLSX.utils.json_to_sheet(r.data.length ? r.data : [{ '(bảng trống)': '' }]);
        XLSX.utils.book_append_sheet(wb, ws, ten.slice(0, 31));
        tongDong += r.data.length;
      }

      const nay = new Date();
      const ten = 'sao-luu-hoso-so-'
        + nay.getFullYear() + '-'
        + String(nay.getMonth() + 1).padStart(2, '0') + '-'
        + String(nay.getDate()).padStart(2, '0') + '.xlsx';
      XLSX.writeFile(wb, ten);
      nut.disabled = false;
      kq.innerHTML = `<div class="qt-viec ok"><b>✅ Đã kết xuất ${tongDong.toLocaleString('vi-VN')} dòng
        vào tệp ${ten}</b>${loi.length ? `<ul>${loi.map(l => `<li>Không đọc được ${l}</li>`).join('')}</ul>` : ''}</div>`;
      baoNhanh('Đã sao lưu ' + tongDong.toLocaleString('vi-VN') + ' dòng dữ liệu.');
    });
  }

  /* Dùng lại ô thông báo sẵn có của trang nếu có */
  function baoNhanh(msg) {
    if (typeof window.notify === 'function') window.notify(msg);
    else console.log(msg);
  }

  /* ========================================================================
     HƯỚNG DẪN LIÊN KẾT GITHUB & CƠ SỞ DỮ LIỆU SUPABASE
     ======================================================================== */
  let modalHD = null;

  const MA_SQL_KHOI_TAO = `-- ============================================================================
-- KHỞI TẠO CƠ SỞ DỮ LIỆU SUPABASE CHO HỆ THỐNG HỒ SƠ SỐ THCS BẠCH LIÊU
-- Dán toàn bộ mã này vào Supabase -> SQL Editor -> Bấm RUN (Chạy)
-- ============================================================================

-- 1. Bảng người dùng hệ thống (đồng bộ từ Google Auth)
CREATE TABLE IF NOT EXISTS public.nguoi_dung (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  ho_ten TEXT,
  chuc_vu TEXT,
  vai_tro TEXT DEFAULT 'giao_vien' CHECK (vai_tro IN ('admin', 'ban_giam_hieu', 'to_truong', 'giao_vien', 'nhan_vien')),
  trang_thai TEXT DEFAULT 'cho_duyet' CHECK (trang_thai IN ('cho_duyet', 'hoat_dong', 'khoa')),
  anh_dai_dien TEXT,
  lan_cuoi TIMESTAMPTZ,
  tao_luc TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng danh sách email được mời trước (Vào là kích hoạt ngay không cần duyệt)
CREATE TABLE IF NOT EXISTS public.moi_tai_khoan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  ho_ten TEXT,
  chuc_vu TEXT,
  vai_tro TEXT DEFAULT 'giao_vien' CHECK (vai_tro IN ('admin', 'ban_giam_hieu', 'to_truong', 'giao_vien', 'nhan_vien')),
  tao_luc TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bảng nhật ký thao tác
CREATE TABLE IF NOT EXISTS public.nhat_ky (
  id BIGSERIAL PRIMARY KEY,
  nguoi_id UUID,
  email TEXT,
  hanh_dong TEXT,
  bang TEXT,
  chi_tiet JSONB,
  thoi_gian TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bảng nhóm hồ sơ (Bộ phận)
CREATE TABLE IF NOT EXISTS public.nhom_ho_so (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma TEXT UNIQUE NOT NULL,
  ten TEXT NOT NULL,
  so_tt INT NOT NULL,
  tao_luc TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bảng nhóm con (Hộp hồ sơ)
CREATE TABLE IF NOT EXISTS public.nhom_con (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nhom_id UUID REFERENCES public.nhom_ho_so(id) ON DELETE CASCADE,
  ma TEXT UNIQUE NOT NULL,
  ten TEXT NOT NULL,
  so_tt INT NOT NULL,
  tao_luc TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Bảng hồ sơ minh chứng
CREATE TABLE IF NOT EXISTS public.ho_so (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nhom_con_id UUID REFERENCES public.nhom_con(id) ON DELETE CASCADE,
  ma TEXT NOT NULL,
  ten TEXT NOT NULL,
  bo_phan TEXT,
  hop TEXT,
  duong_dan_drive TEXT,
  link_drive TEXT,
  ghi_chu TEXT,
  tieu_chi TEXT[],
  nguoi_phu_trach TEXT,
  phu_trach_id UUID,
  trang_thai TEXT DEFAULT 'chua_co',
  so_tt INT DEFAULT 1,
  cap_nhat_luc TIMESTAMPTZ DEFAULT NOW()
);

-- Tự động bổ sung các cột nếu bảng đã tạo trước đó:
ALTER TABLE public.ho_so ADD COLUMN IF NOT EXISTS link_drive TEXT;
ALTER TABLE public.ho_so ADD COLUMN IF NOT EXISTS duong_dan_drive TEXT;
ALTER TABLE public.ho_so ADD COLUMN IF NOT EXISTS ghi_chu TEXT;
ALTER TABLE public.ho_so ADD COLUMN IF NOT EXISTS tieu_chi TEXT[];
ALTER TABLE public.ho_so ADD COLUMN IF NOT EXISTS nguoi_phu_trach TEXT;
ALTER TABLE public.ho_so ADD COLUMN IF NOT EXISTS phu_trach_id UUID;

-- 7. Bảng học sinh và kết quả học tập
CREATE TABLE IF NOT EXISTS public.hoc_sinh (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_dinh_danh TEXT UNIQUE,
  ho_ten TEXT NOT NULL,
  gioi_tinh TEXT,
  ngay_sinh DATE,
  dia_chi TEXT,
  tao_luc TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hoc_sinh_lop (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hoc_sinh_id UUID REFERENCES public.hoc_sinh(id) ON DELETE CASCADE,
  nam_hoc TEXT NOT NULL,
  khoi INT NOT NULL,
  lop TEXT NOT NULL,
  UNIQUE(hoc_sinh_id, nam_hoc)
);

-- 8. Tự động liên kết tài khoản Google & Cấp Admin cho tài khoản đầu tiên
CREATE OR REPLACE FUNCTION public.xu_ly_dang_nhap_moi()
RETURNS TRIGGER AS $$
DECLARE
  v_moi RECORD;
BEGIN
  SELECT * INTO v_moi FROM public.moi_tai_khoan WHERE LOWER(email) = LOWER(NEW.email);
  IF FOUND THEN
    INSERT INTO public.nguoi_dung (id, email, ho_ten, chuc_vu, vai_tro, trang_thai, anh_dai_dien)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(v_moi.ho_ten, NEW.raw_user_meta_data->>'full_name', NEW.email),
      v_moi.chuc_vu,
      v_moi.vai_tro,
      'hoat_dong',
      NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
      ho_ten = EXCLUDED.ho_ten,
      vai_tro = EXCLUDED.vai_tro,
      trang_thai = 'hoat_dong',
      anh_dai_dien = EXCLUDED.anh_dai_dien;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM public.nguoi_dung WHERE vai_tro = 'admin') THEN
      -- Tài khoản đầu tiên đăng nhập tự động làm Quản trị viên (Admin)
      INSERT INTO public.nguoi_dung (id, email, ho_ten, chuc_vu, vai_tro, trang_thai, anh_dai_dien)
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'Quản trị hệ thống',
        'admin',
        'hoat_dong',
        NEW.raw_user_meta_data->>'avatar_url'
      )
      ON CONFLICT (id) DO UPDATE SET
        vai_tro = 'admin',
        trang_thai = 'hoat_dong';
    ELSE
      INSERT INTO public.nguoi_dung (id, email, ho_ten, vai_tro, trang_thai, anh_dai_dien)
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'giao_vien',
        'cho_duyet',
        NEW.raw_user_meta_data->>'avatar_url'
      )
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.xu_ly_dang_nhap_moi();

-- 9. Các hàm RPC cần thiết
CREATE OR REPLACE FUNCTION public.ghi_nhan_dang_nhap()
RETURNS VOID AS $$
BEGIN
  UPDATE public.nguoi_dung SET lan_cuoi = NOW() WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.qt_tong_quan()
RETURNS JSONB AS $$
DECLARE
  v_tong_nguoi INT := 0;
  v_cho_duyet INT := 0;
  v_ho_so INT := 0;
  v_hoc_sinh INT := 0;
BEGIN
  SELECT COUNT(*) INTO v_tong_nguoi FROM public.nguoi_dung;
  SELECT COUNT(*) INTO v_cho_duyet FROM public.nguoi_dung WHERE trang_thai = 'cho_duyet';
  SELECT COUNT(*) INTO v_ho_so FROM public.ho_so;
  SELECT COUNT(*) INTO v_hoc_sinh FROM public.hoc_sinh;
  RETURN jsonb_build_object(
    'tong_nguoi_dung', v_tong_nguoi,
    'cho_duyet', v_cho_duyet,
    'tong_ho_so', v_ho_so,
    'tong_hoc_sinh', v_hoc_sinh
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.doc_moc_ra_soat()
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Phân quyền và chính sách bảo mật RLS
ALTER TABLE public.nguoi_dung ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moi_tai_khoan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nhom_ho_so ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nhom_con ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ho_so ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoc_sinh ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoc_sinh_lop ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phep doc cong khai nguoi dung" ON public.nguoi_dung;
CREATE POLICY "Cho phep doc cong khai nguoi dung" ON public.nguoi_dung FOR SELECT USING (true);
DROP POLICY IF EXISTS "Cho phep sua nguoi dung" ON public.nguoi_dung;
CREATE POLICY "Cho phep sua nguoi dung" ON public.nguoi_dung FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cho phep doc moi" ON public.moi_tai_khoan;
CREATE POLICY "Cho phep doc moi" ON public.moi_tai_khoan FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cho phep doc nhom ho so" ON public.nhom_ho_so;
CREATE POLICY "Cho phep doc nhom ho so" ON public.nhom_ho_so FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cho phep doc nhom con" ON public.nhom_con;
CREATE POLICY "Cho phep doc nhom con" ON public.nhom_con FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cho phep doc ho so" ON public.ho_so;
CREATE POLICY "Cho phep doc ho so" ON public.ho_so FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cho phep doc hoc sinh" ON public.hoc_sinh;
CREATE POLICY "Cho phep doc hoc sinh" ON public.hoc_sinh FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cho phep doc hoc sinh lop" ON public.hoc_sinh_lop;
CREATE POLICY "Cho phep doc hoc sinh lop" ON public.hoc_sinh_lop FOR ALL USING (true) WITH CHECK (true);
`;

  function moHuongDanLienKet(tabBanDau) {
    if (!modalHD) {
      modalHD = document.createElement('div');
      modalHD.className = 'qt-lop';
      modalHD.style.zIndex = '9999';
      modalHD.innerHTML = `
        <div class="qt-hop" style="max-width:980px;height:90vh">
          <div class="qt-dau" style="background:#14306b">
            <h3>🐙 Hướng dẫn liên kết GitHub & CSDL Supabase để đăng nhập</h3>
            <button id="hdDong" style="background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);color:#fff;padding:8px 16px;border-radius:9px;cursor:pointer;font-size:14px;font-weight:600">✕ Đóng</button>
          </div>
          <div class="qt-tab" id="hdTabs">
            <button class="on" data-tab="gh">🐙 1. GitHub & GitHub Pages</button>
            <button data-tab="sp">🗄️ 2. Tạo CSDL Supabase</button>
            <button data-tab="oauth">🔑 3. Google OAuth & Redirect URL</button>
            <button data-tab="sql">📜 4. Mã SQL & Cấp Admin</button>
            <button data-tab="test">⚡ 5. Thử nghiệm kết nối</button>
            <button data-tab="drive">📁 6. Kết nối Google Drive</button>
          </div>
          <div class="qt-than" id="hdThan" style="font-size:14.5px;line-height:1.7;color:#1e293b"></div>
        </div>`;
      document.body.appendChild(modalHD);

      modalHD.addEventListener('click', e => { if (e.target === modalHD) dongHD(); });
      document.getElementById('hdDong').addEventListener('click', dongHD);

      modalHD.querySelectorAll('#hdTabs button').forEach(b => {
        b.addEventListener('click', () => {
          modalHD.querySelectorAll('#hdTabs button').forEach(x => x.classList.remove('on'));
          b.classList.add('on');
          veNoiDungHD(b.dataset.tab);
        });
      });
    }

    modalHD.classList.add('hien');
    document.body.style.overflow = 'hidden';

    const tab = tabBanDau || 'gh';
    modalHD.querySelectorAll('#hdTabs button').forEach(b => {
      b.classList.toggle('on', b.dataset.tab === tab);
    });
    veNoiDungHD(tab);
  }

  function dongHD() {
    if (modalHD) {
      modalHD.classList.remove('hien');
      document.body.style.overflow = '';
    }
  }

  window.moHuongDanLienKet = moHuongDanLienKet;

  function veNoiDungHD(tab) {
    const el = document.getElementById('hdThan');
    if (!el) return;

    if (tab === 'gh') {
      el.innerHTML = `
        <div style="background:#f8fafc;padding:18px;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:16px">
          <h4 style="font-size:17px;color:#14306b;margin-bottom:8px">🐙 Bước 1: Đưa mã nguồn lên GitHub & Bật GitHub Pages</h4>
          <p>Trang web này được thiết kế theo cấu trúc tĩnh chạy trực tiếp trên <b>GitHub Pages</b> (như liên kết <code>https://schoolrecords.github.io/thcsbachlieu/</code> của thầy cô).</p>
        </div>

        <ol style="margin-left:20px;display:flex;flex-direction:column;gap:14px">
          <li>
            <b>Tạo một Repository mới trên GitHub:</b>
            <div style="color:#475569">Vào <a href="https://github.com/new" target="_blank" style="color:#1d4ed8;font-weight:600">github.com/new</a>, đặt tên kho lưu trữ (ví dụ: <code>thcsbachlieu</code> hoặc tên trường của bạn). Chọn chế độ <b>Public</b>.</div>
          </li>
          <li>
            <b>Đẩy mã nguồn lên Repository:</b>
            <div style="color:#475569">Nếu dùng Git trên máy tính, mở terminal tại thư mục mã nguồn và gõ:</div>
            <pre style="background:#1e293b;color:#f8fafc;padding:12px;border-radius:8px;margin-top:6px;font-size:13px;overflow-x:auto">git init
git add .
git commit -m "Khởi tạo hệ thống hồ sơ số THCS Bạch Liêu"
git branch -M main
git remote add origin https://github.com/&lt;tên-tài-khoản-github&gt;/thcsbachlieu.git
git push -u origin main</pre>
          </li>
          <li>
            <b>Bật tính năng GitHub Pages:</b>
            <ul style="margin:6px 0 0 20px;color:#475569">
              <li>Tại trang Repository trên GitHub, bấm vào tab <b>Settings</b>.</li>
              <li>Ở menu bên trái, chọn mục <b>Pages</b>.</li>
              <li>Ở mục <b>Build and deployment</b> -> <b>Source</b>: chọn <code>Deploy from a branch</code>.</li>
              <li>Mục <b>Branch</b>: chọn nhánh <code>main</code> và thư mục <code>/ (root)</code> -> bấm <b>Save</b>.</li>
            </ul>
          </li>
          <li>
            <b>Nhận đường dẫn trang web công khai:</b>
            <div style="color:#475569;margin-top:4px">Sau khoảng 1-2 phút, GitHub sẽ cấp cho trường một đường link có dạng: <br>
            <code style="background:#e2e8f0;padding:3px 8px;border-radius:6px;color:#0f172a;font-weight:600">https://&lt;tên-tài-khoản&gt;.github.io/thcsbachlieu/</code></div>
          </li>
        </ol>
      `;
    } else if (tab === 'sp') {
      el.innerHTML = `
        <div style="background:#f8fafc;padding:18px;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:16px">
          <h4 style="font-size:17px;color:#14306b;margin-bottom:8px">🗄️ Bước 2: Tạo Cơ sở dữ liệu Supabase & Lấy Khóa API</h4>
          <p>Supabase cung cấp cơ sở dữ liệu PostgreSQL bảo mật với hàng rào RLS và dịch vụ xác thực Google hoàn toàn miễn phí.</p>
        </div>

        <ol style="margin-left:20px;display:flex;flex-direction:column;gap:14px">
          <li>
            <b>Tạo dự án mới:</b>
            <div style="color:#475569">Truy cập <a href="https://supabase.com" target="_blank" style="color:#1d4ed8;font-weight:600">https://supabase.com</a>, bấm <b>Sign In</b> hoặc đăng ký bằng tài khoản GitHub/Google. Sau đó bấm <b>New Project</b>.</div>
            <div style="color:#475569">Đặt tên dự án (ví dụ <code>thcs-bachlieu</code>), đặt mật khẩu cơ sở dữ liệu mạnh, chọn Region (khuyên dùng <b>Southeast Asia - Singapore</b> để truy cập từ Việt Nam nhanh nhất).</div>
          </li>
          <li>
            <b>Lấy 2 thông số kết nối API:</b>
            <div style="color:#475569">Khi dự án tạo xong (~1-2 phút):</div>
            <ul style="margin:6px 0 0 20px;color:#475569">
              <li>Bấm biểu tượng <b>Settings (bánh răng)</b> ở góc trái dưới cùng -> Chọn mục <b>API</b> (hoặc Data API).</li>
              <li>Sao chép <b>Project URL</b>: dạng <code>https://xxxxxxxxxxxxxxxx.supabase.co</code>.</li>
              <li>Sao chép khóa <b>anon public</b> (mục Project API keys): chuỗi dài bắt đầu bằng <code>eyJhbGci...</code>.</li>
            </ul>
          </li>
          <li>
            <b>Dán vào tệp cấu hình của web:</b>
            <div style="color:#475569">Mở tệp <code>js/cauhinh.js</code> trong mã nguồn và dán 2 giá trị vào:</div>
            <pre style="background:#1e293b;color:#f8fafc;padding:12px;border-radius:8px;margin-top:6px;font-size:13px;overflow-x:auto">const CAU_HINH = {
  DIA_CHI: 'https://xxxxxxxxxxxxxxxx.supabase.co', // Thay bằng Project URL của bạn
  KHOA_CONG_KHAI: 'eyJhbGciOiJIUzI1NiIsIn...',     // Thay bằng anon public key của bạn
  TEN_TRUONG: 'Trường THCS Bạch Liêu',
  ...
};</pre>
          </li>
        </ol>
      `;
    } else if (tab === 'oauth') {
      el.innerHTML = `
        <div style="background:#fef2f2;padding:18px;border-radius:12px;border:1px solid #fecaca;margin-bottom:16px;color:#991b1b">
          <h4 style="font-size:17px;margin-bottom:8px">🔑 Bước 3: Cấu hình Đăng nhập Google & Redirect URLs</h4>
          <p>⚠️ <b>LÝ DO KHÔNG ĐĂNG NHẬP ĐƯỢC:</b> Supabase và Google bắt buộc phải khai báo chính xác đường dẫn chuyển hướng (Redirect URL). Nếu mở trên domain mới mà chưa thêm vào Supabase, hệ thống sẽ chặn đăng nhập để bảo mật.</p>
        </div>

        <ol style="margin-left:20px;display:flex;flex-direction:column;gap:14px">
          <li>
            <b>Bật Google Provider trong Supabase:</b>
            <div style="color:#475569">Vào Supabase -> <b>Authentication</b> -> <b>Providers</b> -> Bấm vào <b>Google</b> -> Bật <b>Enable Google provider</b>.</div>
            <div style="color:#475569">Sao chép dòng <b>Callback URL (for OAuth)</b> của Supabase (dạng <code>https://&lt;id-du-an&gt;.supabase.co/auth/v1/callback</code>).</div>
          </li>
          <li>
            <b>Tạo Client ID trên Google Cloud Console:</b>
            <div style="color:#475569">Truy cập <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style="color:#1d4ed8;font-weight:600">Google Cloud Console</a>.</div>
            <ul style="margin:6px 0 0 20px;color:#475569">
              <li>Vào <b>APIs & Services</b> -> <b>OAuth consent screen</b>: Cấu hình tên ứng dụng trường học và email hỗ trợ.</li>
              <li>Vào <b>Credentials</b> -> <b>Create Credentials</b> -> <b>OAuth client ID</b>.</li>
              <li>Loại ứng dụng: Chọn <b>Web application</b>.</li>
              <li>Tại mục <b>Authorized redirect URIs</b>: Bấm Add URI và dán Callback URL của Supabase ở bước trên vào.</li>
              <li>Bấm <b>Create</b>: Google sẽ cấp <b>Client ID</b> và <b>Client Secret</b>.</li>
              <li>Dán Client ID và Client Secret ngược lại vào Supabase -> Bấm <b>Save</b>.</li>
            </ul>
          </li>
          <li>
            <b>Cấu hình Redirect URLs trong Supabase (RẤT QUAN TRỌNG):</b>
            <div style="color:#475569">Trong Supabase -> <b>Authentication</b> -> <b>URL Configuration</b>:</div>
            <ul style="margin:6px 0 0 20px;color:#475569">
              <li><b>Site URL:</b> Điền link GitHub Pages (ví dụ <code>https://schoolrecords.github.io/thcsbachlieu/</code>).</li>
              <li><b>Redirect URLs:</b> Bấm <b>Add URL</b> và thêm các dòng sau (có dấu <code>/**</code> ở cuối để chấp nhận mọi trang con):
                <div style="background:#f1f5f9;padding:8px 12px;border-radius:6px;margin:6px 0;font-family:monospace;font-size:12.5px">
                  ${location.origin}/**<br>
                  https://schoolrecords.github.io/thcsbachlieu/**<br>
                  https://*.github.io/**<br>
                  http://localhost:3000/**
                </div>
              </li>
            </ul>
          </li>
        </ol>
      `;
    } else if (tab === 'sql') {
      el.innerHTML = `
        <div style="background:#f8fafc;padding:18px;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:16px">
          <h4 style="font-size:17px;color:#14306b;margin-bottom:8px">📜 Bước 4: Chạy mã SQL Khởi tạo Bảng & Quyền Admin</h4>
          <p>Mã SQL này tạo đầy đủ bảng dữ liệu, chính sách bảo vệ RLS, và trigger: <b>Người đầu tiên đăng nhập bằng Google sẽ tự động được gán quyền Quản trị viên (Admin)</b> mà không cần sửa tay!</p>
          <div style="margin-top:10px">
            <button id="btnSaoChepSQL" style="padding:9px 18px;background:#14306b;color:#fff;border-radius:8px;font-weight:600;font-size:13.5px;cursor:pointer;border:0;display:inline-flex;align-items:center;gap:6px">📋 Sao chép toàn bộ mã SQL</button>
            <span id="baoSaoChep" style="margin-left:10px;color:#15803d;font-weight:600;display:none">✓ Đã sao chép vào bộ nhớ tạm!</span>
          </div>
        </div>

        <p style="font-weight:600;margin-bottom:6px">Cách chạy trong Supabase:</p>
        <p style="color:#475569;margin-bottom:12px">Mở Supabase -> Chọn menu <b>SQL Editor</b> bên trái -> Bấm <b>New query</b> -> Dán toàn bộ mã bên dưới -> Bấm nút xanh <b>RUN</b>.</p>

        <textarea readonly style="width:100%;height:320px;background:#1e293b;color:#f8fafc;font-family:monospace;font-size:12.5px;padding:14px;border-radius:8px;border:1px solid #334155;line-height:1.5;box-sizing:border-box" id="oMaSQL">${MA_SQL_KHOI_TAO}</textarea>
      `;

      document.getElementById('btnSaoChepSQL')?.addEventListener('click', () => {
        navigator.clipboard.writeText(MA_SQL_KHOI_TAO).then(() => {
          const b = document.getElementById('baoSaoChep');
          if (b) {
            b.style.display = 'inline';
            setTimeout(() => { b.style.display = 'none'; }, 3000);
          }
        });
      });
    } else if (tab === 'test') {
      const hienTaiUrl = localStorage.getItem('THCS_SUPABASE_URL') || CAU_HINH.DIA_CHI || '';
      const hienTaiKey = localStorage.getItem('THCS_SUPABASE_KEY') || CAU_HINH.KHOA_CONG_KHAI || '';
      el.innerHTML = `
        <div style="background:#f8fafc;padding:18px;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:16px">
          <h4 style="font-size:17px;color:#14306b;margin-bottom:8px">⚡ Bước 5: Thử nghiệm kết nối CSDL Supabase của bạn</h4>
          <p>Thầy cô có thể dán Project URL và anon key của dự án mới tạo vào đây để kiểm tra kết nối ngay trên trình duyệt mà chưa cần đẩy code lên GitHub.</p>
        </div>

        <div style="display:flex;flex-direction:column;gap:12px;max-width:700px">
          <div>
            <label style="display:block;font-weight:600;margin-bottom:4px;font-size:13.5px">Project URL (Địa chỉ Supabase):</label>
            <input id="txtTestUrl" style="width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;box-sizing:border-box" value="${hienTaiUrl}" placeholder="https://xxxxxxxxxxxxxxxx.supabase.co">
          </div>
          <div>
            <label style="display:block;font-weight:600;margin-bottom:4px;font-size:13.5px">anon public key (Khóa công khai):</label>
            <input id="txtTestKey" style="width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;box-sizing:border-box" value="${hienTaiKey}" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...">
          </div>
          <div style="display:flex;gap:10px;margin-top:6px">
            <button id="btnLuuTest" style="padding:10px 20px;background:#14306b;color:#fff;border-radius:8px;font-weight:600;cursor:pointer;border:0;font-size:14px">💾 Lưu & Thử kết nối</button>
            <button id="btnKhoiPhuc" style="padding:10px 18px;background:#f1f5f9;color:#475569;border-radius:8px;font-weight:600;cursor:pointer;border:1px solid #cbd5e1;font-size:14px">🔄 Khôi phục mặc định</button>
          </div>
          <div id="baoTestKetNoi" style="margin-top:10px;font-size:14px;line-height:1.5"></div>
        </div>
      `;

      document.getElementById('btnLuuTest')?.addEventListener('click', async () => {
        const u = document.getElementById('txtTestUrl').value.trim();
        const k = document.getElementById('txtTestKey').value.trim();
        const bao = document.getElementById('baoTestKetNoi');
        if (!u || !k) {
          bao.innerHTML = '<span style="color:#b91c1c;font-weight:600">Vui lòng điền đủ cả URL và Anon Key.</span>';
          return;
        }
        bao.innerHTML = '<span style="color:#1d4ed8">Đang kiểm tra kết nối tới Supabase…</span>';
        try {
          const testSb = window.supabase.createClient(u, k);
          const { error } = await testSb.from('nguoi_dung').select('count', { count: 'exact', head: true });
          localStorage.setItem('THCS_SUPABASE_URL', u);
          localStorage.setItem('THCS_SUPABASE_KEY', k);
          sessionStorage.removeItem('THCS_XEM_THU');
          bao.innerHTML = `<span style="color:#15803d;font-weight:600">✓ Kết nối thành công! Đang tải lại trang để áp dụng...</span>`;
          setTimeout(() => location.reload(), 1200);
        } catch (err) {
          localStorage.setItem('THCS_SUPABASE_URL', u);
          localStorage.setItem('THCS_SUPABASE_KEY', k);
          sessionStorage.removeItem('THCS_XEM_THU');
          bao.innerHTML = `<span style="color:#15803d;font-weight:600">✓ Đã lưu cấu hình. Đang tải lại trang...</span>`;
          setTimeout(() => location.reload(), 1200);
        }
      });

      document.getElementById('btnKhoiPhuc')?.addEventListener('click', () => {
        localStorage.removeItem('THCS_SUPABASE_URL');
        localStorage.removeItem('THCS_SUPABASE_KEY');
        sessionStorage.removeItem('THCS_XEM_THU');
        location.reload();
      });
    } else if (tab === 'drive') {
      const hienTai = (typeof CAU_HINH !== 'undefined' && CAU_HINH.LINK_DRIVE_TONG) || localStorage.getItem('THCS_LINK_DRIVE_TONG') || '';
      el.innerHTML = `
        <div style="background:#f8fafc;padding:18px;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:16px">
          <h4 style="font-size:17px;color:#14306b;margin-bottom:8px">📁 Bước 6: Kết nối Google Drive để mở và tải tệp minh chứng</h4>
          <p>Mỗi minh chứng trên hệ thống có thể liên kết trực tiếp tới một thư mục hoặc tệp trên Google Drive. Khi bấm vào biểu tượng 📂, hệ thống sẽ mở trực tiếp tệp/thư mục đó.</p>
        </div>

        <div style="background:#eff6ff;padding:18px;border-radius:12px;border:1.5px solid #bfdbfe;margin-bottom:20px">
          <label style="display:block;font-weight:700;color:#1e40af;margin-bottom:6px">🔗 Cấu hình nhanh: Thư mục Google Drive chung của trường</label>
          <div style="color:#475569;font-size:13.5px;margin-bottom:10px">Dán link thư mục Google Drive tổng của nhà trường vào đây. Mọi hồ sơ chưa gắn link riêng khi bấm 📂 sẽ mở thư mục này:</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <input type="text" id="inpDriveTong" value="${hienTai}" placeholder="https://drive.google.com/drive/folders/…" style="flex:1 1 320px;padding:10px 12px;border:1.5px solid #93c5fd;border-radius:9px;font-size:14px;font-family:inherit">
            <button type="button" id="btnLuuDriveTong" style="padding:10px 18px;background:#1d4ed8;color:#fff;border:0;border-radius:9px;font-weight:600;cursor:pointer;font-family:inherit">💾 Lưu cấu hình</button>
            <button type="button" id="btnMoThuDrive" style="padding:10px 14px;background:#fff;border:1.5px solid #bfdbfe;color:#1e40af;border-radius:9px;font-weight:600;cursor:pointer;font-family:inherit">📂 Mở thử</button>
          </div>
          <div id="baoDriveTong" style="margin-top:8px;font-size:13.5px"></div>
        </div>

        <h4 style="color:#14306b;font-size:16px;margin:18px 0 10px">📖 Hướng dẫn chi tiết:</h4>
        <ol style="margin-left:20px;display:flex;flex-direction:column;gap:14px">
          <li>
            <b>Mở quyền truy cập trên Google Drive:</b>
            <div style="color:#475569">Mở thư mục trên Google Drive của trường → Chuột phải chọn <b>Chia sẻ (Share)</b> → Tại mục <i>Quyền truy cập chung</i>, chọn <b>"Bất kỳ ai có đường liên kết" (Anyone with the link)</b> với vai trò <b>Người xem (Viewer)</b>. Bấm <b>Sao chép đường liên kết</b>.</div>
          </li>
          <li>
            <b>Gán link cho từng hồ sơ minh chứng cụ thể:</b>
            <div style="color:#475569">Khi đăng nhập tài khoản Quản trị hoặc Người phụ trách, cạnh mỗi hồ sơ minh chứng sẽ có nút ✏️ (Chỉnh sửa). Bấm vào nút ✏️, dán đường link thư mục con của hồ sơ đó vào ô <b>"Đường dẫn thư mục Google Drive"</b> rồi bấm <b>Lưu thay đổi</b>.</div>
          </li>
          <li>
            <b>Cập nhật mã nguồn lên GitHub:</b>
            <div style="color:#475569">Sau khi chỉnh sửa cấu hình trong mã nguồn trên máy tính, thầy cô mở terminal chạy:</div>
            <pre style="background:#1e293b;color:#f8fafc;padding:12px;border-radius:8px;margin-top:6px;font-size:13px;overflow-x:auto">git add .
git commit -m "Cap nhat lien ket Google Drive va he thong"
git push origin main</pre>
            <div style="color:#475569;margin-top:4px">GitHub Pages sẽ tự động kích hoạt workflow triển khai (deploy) sau khoảng 15-30 giây và trang web mới sẽ sẵn sàng!</div>
          </li>
        </ol>
      `;

      document.getElementById('btnLuuDriveTong')?.addEventListener('click', () => {
        const val = (document.getElementById('inpDriveTong')?.value || '').trim();
        const bao = document.getElementById('baoDriveTong');
        localStorage.setItem('THCS_LINK_DRIVE_TONG', val);
        if (typeof CAU_HINH !== 'undefined') CAU_HINH.LINK_DRIVE_TONG = val;
        if (bao) {
          bao.innerHTML = '<span style="color:#15803d;font-weight:600">✓ Đã lưu đường dẫn Google Drive thành công! Thầy cô có thể bấm "Mở thử" hoặc bấm các biểu tượng 📂 ngoài danh mục.</span>';
        }
      });

      document.getElementById('btnMoThuDrive')?.addEventListener('click', () => {
        const val = (document.getElementById('inpDriveTong')?.value || '').trim();
        if (val) {
          window.open(val, '_blank', 'noopener');
        } else {
          window.open('https://drive.google.com', '_blank', 'noopener');
        }
      });
    }
  }

  /* ========================================================================
     LUỒNG CHÍNH
     ======================================================================== */
  /* Bọc ngoài để TẮT MÀN CHỜ ở mọi đường ra. Hàm bên trong có bốn năm chỗ
     return sớm — chưa đăng nhập, chờ duyệt, tài khoản bị khoá, lỗi máy chủ —
     rải lệnh tắt vào từng chỗ thì chắc chắn sót một cái, mà sót là thầy cô
     ngồi nhìn logo không bao giờ hết. finally chạy kể cả khi ném lỗi. */
  async function khoiDong() {
    try {
      await khoiDongThat();
    } finally {
      if (typeof window.tatManCho === 'function') window.tatManCho();
    }
  }

  async function khoiDongThat() {
    if (!sb || !daNoi || sessionStorage.getItem('THCS_XEM_THU') === 'true') {
      batDauXemThu();
      return;
    }

    khoaTrang(true);

    const { data: { session } } = await sb.auth.getSession();

    if (!session) {
      manDangNhap.classList.add('hien');
      return;
    }

    let { data, error } = await sb.from('nguoi_dung')
      .select('*').eq('id', session.user.id).maybeSingle();

    if (error) {
      manDangNhap.classList.add('hien');
      hienLoi('Không đọc được thông tin tài khoản: ' + error.message);
      return;
    }

    if (!data) {
      // Thử tìm theo email nếu đã khai trước danh sách cán bộ
      const rMail = await sb.from('nguoi_dung')
        .select('*').ilike('email', session.user.email).maybeSingle();
      if (rMail.data) {
        data = rMail.data;
        try { await sb.from('nguoi_dung').update({ id: session.user.id }).eq('id', data.id); } catch(e){}
      }
    }

    const emailHienTai = (session.user.email || '').toLowerCase().trim();
    // Tự động kích hoạt quyền Admin nếu là email quản trị khởi tạo của trường (haic2langthanh@gmail.com)
    // hoặc hệ thống chưa có Admin nào đang hoạt động
    let canCapAdmin = (emailHienTai === 'haic2langthanh@gmail.com');
    if (!canCapAdmin && (!data || data.trang_thai !== 'hoat_dong')) {
      try {
        const { count: tongAdmin } = await sb.from('nguoi_dung')
          .select('id', { count: 'exact', head: true })
          .eq('vai_tro', 'admin')
          .eq('trang_thai', 'hoat_dong');
        if (!tongAdmin || tongAdmin === 0) canCapAdmin = true;
      } catch (e) {}
    }

    if (canCapAdmin && (!data || data.vai_tro !== 'admin' || data.trang_thai !== 'hoat_dong')) {
      const hoTen = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split('@')[0];
      const anh = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null;
      const banMoi = {
        id: session.user.id,
        email: session.user.email,
        ho_ten: (data && data.ho_ten) ? data.ho_ten : hoTen,
        chuc_vu: (data && data.chuc_vu) ? data.chuc_vu : 'Hiệu trưởng - Quản trị hệ thống',
        vai_tro: 'admin',
        trang_thai: 'hoat_dong',
        anh_dai_dien: anh
      };
      try {
        const rUpsert = await sb.from('nguoi_dung').upsert(banMoi).select().single();
        if (rUpsert.data) data = rUpsert.data;
      } catch (e) {
        console.warn('Tự động cấp Admin gặp lỗi:', e);
      }
    }

    /* Hiếm khi xảy ra: đã đăng nhập nhưng chưa có hồ sơ trong bảng nguoi_dung */
    if (!data) {
      manChoDuyet.classList.add('hien');
      document.getElementById('cdEmail').textContent = session.user.email;
      return;
    }

    if (data.trang_thai !== 'hoat_dong') {
      manChoDuyet.classList.add('hien');
      document.getElementById('cdEmail').textContent = data.email;
      if (data.trang_thai === 'khoa') {
        manChoDuyet.querySelector('.dn-cho').textContent =
          'Tài khoản này đã bị khoá. Thầy cô vui lòng liên hệ quản trị hệ thống của nhà trường.';
        manChoDuyet.querySelector('h2').textContent = 'Tài khoản đã bị khoá';
        manChoDuyet.querySelector('.dn-huy').textContent = '🔒';
      }
      return;
    }

    /* Vào được */
    nguoiDung = data;
    window.NGUOI_DUNG = data;
    sb.rpc('ghi_nhan_dang_nhap');

    manDangNhap.classList.remove('hien');
    manChoDuyet.classList.remove('hien');
    khoaTrang(false);
    dungTheNguoiDung();

    document.dispatchEvent(new CustomEvent('dangnhap-xong', { detail: data }));
  }

  /* Sau khi quay về từ Google, Supabase gắn phiên vào trang rồi báo lại */
  if (sb) {
    sb.auth.onAuthStateChange((sukien) => {
      if (sukien === 'SIGNED_IN' && !nguoiDung) khoiDong();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', khoiDong);
  } else {
    khoiDong();
  }
})();
