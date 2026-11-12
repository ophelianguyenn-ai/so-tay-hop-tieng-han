# GitHub Pages — Nhi’s Learning Corner

## Trạng thái và địa chỉ dự kiến

- Kho: `ophelianguyenn-ai/so-tay-hop-tieng-han`.
- Nhánh mã nguồn: `main`.
- Workflow tự triển khai: `.github/workflows/deploy-pages.yml`.
- URL sau khi triển khai thành công: **https://ophelianguyenn-ai.github.io/so-tay-hop-tieng-han/**.
- Mã nguồn, dữ liệu `lessons.json`, tệp ảnh, Hán tự, âm thanh sẵn có và giao diện được giữ nguyên.
- GitHub Pages là trang tĩnh; chức năng đồng bộ Firebase chỉ hoạt động khi người học đã cấu hình Firebase như trước.

## Kích hoạt lần đầu

**Chú ý quyền riêng tư:** Ngày 12/11/2026 kho này vẫn đang ở chế độ **Private**. GitHub Free chỉ cho dùng GitHub Pages trên kho **Public**. Không tự ý công khai kho nếu các câu công việc, nội dung học và lịch sử mã nguồn không nên xuất hiện công khai. Nếu tài khoản có GitHub Pro/Team thì có thể xuất bản Pages từ kho Private theo điều kiện của GitHub.

1. Nếu đang dùng GitHub Free và chấp nhận công khai toàn bộ kho: vào **Settings → General → Danger Zone → Change repository visibility → Public**. Đây là một quyết định chia sẻ dữ liệu, không thực hiện tự động.
2. Vào **Settings → Pages → Build and deployment → Source**, chọn **GitHub Actions**.
3. Mở **Actions → Publish Nhi's Learning Corner to GitHub Pages** và chọn **Run workflow → main → Run workflow** nếu chưa có lượt chạy thành công.
4. Kiểm tra mục **Actions** cho đến khi lượt chạy báo `success`, sau đó mở URL ở trên. Nếu chưa sẵn sàng, xem bước báo lỗi trong run.

## Giữ dữ liệu khi chuyển tên miền

Vì `nhi-245.netlify.app` và `ophelianguyenn-ai.github.io` là hai tên miền khác nhau, dữ liệu lưu trong `localStorage` không tự chuyển theo; điều này áp dụng cho mức độ thuộc, từ khó, bài tự tạo, ảnh riêng và ngày học. **Không xóa dữ liệu tại Netlify cũ trước khi chuyển!**

**Nếu đã bật đồng bộ Firebase trên Netlify:**
1. Mở trang Netlify cũ (đường dẫn cũ vẫn có thể hoạt động dù dừng deploy), chọn **Cài đặt → Nâng cao · Đồng bộ thiết bị**.
2. Bấm **Đồng bộ ngay** và **Sao chép link liên kết**.
3. Link này có phần `#lk=...`. Hãy chỉ thay URL phía trước dấu `#` bằng `https://ophelianguyenn-ai.github.io/so-tay-hop-tieng-han/` và **giữ nguyên phần `#lk=...`**. Không chia sẻ link vì phần đó chứa mã đồng bộ.
4. Mở link vừa chỉnh trên GitHub Pages, sau đó kiểm tra danh sách bài tự tạo và tiến độ.

**Nếu chưa bật Firebase trên trang cũ:**
- Trong Netlify cũ, mục **Cài đặt → Dữ liệu → Xuất tiến độ** có thể xuất tiến độ của bộ thẻ cổ điển. Trên GitHub Pages có thể dùng **Nhập tiến độ** hoặc **Nhập bản sao lưu** để đọc tệp này.
- Dữ liệu bài học theo ngày và ảnh tự chọn vẫn nằm trong bộ nhớ riêng của tên miền cũ; công cụ xuất tiến độ cũ không bao gồm tất cả dữ liệu này. Cần sao lưu thủ công từ trình duyệt cũ hoặc thiết lập đồng bộ trước khi rời Netlify. Không được coi một tệp `Xuất tiến độ` cổ điển là bản sao lưu đầy đủ.

**Trên GitHub Pages từ bản cập nhật này:**
- Mở **Cài đặt → Dữ liệu → Sao lưu toàn bộ dữ liệu → Xuất toàn bộ JSON** để tạo bản sao lưu gồm lịch theo ngày, tiến độ, thẻ tự tạo, ảnh và tùy chỉnh.
- Dùng **Nhập bản sao lưu** để khôi phục tệp định dạng mới hoặc tệp `Xuất tiến độ` cũ.
- Bản sao lưu **không chứa** mã API AI và cấu hình/mã ghép Firebase; hãy liên kết lại Firebase trên thiết bị mới nếu cần.

## Quy tắc triển khai

Workflow sao chép những tệp cần thiết vào thư mục `_site`, không phát hành file cấu hình Netlify, các script chạy nội bộ hoặc thư mục GitHub Actions. Sử dụng đường dẫn tương đối và `.nojekyll` để website chạy đúng ở `/so-tay-hop-tieng-han/`.

Để cập nhật website những lần sau, chỉ cần đẩy mã lên nhánh `main`. GitHub Actions sẽ chạy lại workflow; MP3 mới được đưa lên khi `audio/` đã có tệp.
