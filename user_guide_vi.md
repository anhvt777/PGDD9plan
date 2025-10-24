# Hướng dẫn sử dụng trang “Kế hoạch PGD Đường 9”

Trang web này được xây dựng với mục tiêu giúp Phòng Giao dịch Đường 9 (PGD Đₑ) lập và theo dõi kế hoạch công việc năm/quý/tháng/tuần theo dạng bảng Kanban. Các cột mặc định là **To‑Do → Doing → Block → Done** như hướng dẫn từ phương pháp Kanban【559982002976551†L162-L169】. Người dùng có thể kéo thả thẻ công việc giữa các cột để cập nhật trạng thái, thêm công việc mới, giao việc cho cán bộ khác bằng email và xuất báo cáo CSV.

## 1. Chuẩn bị trước khi sử dụng

1. **Tạo project Supabase**. Nếu chưa có, hãy đăng nhập vào Supabase và tạo một dự án mới. Trong phần “Project Settings” lấy **Project URL** và **Anon key**. Đây là thông tin cần để kết nối từ trang web.
2. **Tạo bảng dữ liệu “tasks”** bằng SQL Editor trên Supabase. Bảng này lưu các công việc. Mẫu lệnh:

   ```sql
   create table if not exists public.tasks (
     id uuid primary key default gen_random_uuid(),
     title text not null,
     description text,
     due_date date,
     status text not null default 'todo',
     created_by_email text not null,
     assigned_email text not null,
     created_at timestamp with time zone default current_timestamp
   );

   -- Bật RLS
   alter table public.tasks enable row level security;

   -- Chính sách cho phép người dùng xem và cập nhật công việc của chính mình
   create policy "users can select their tasks"
     on public.tasks
     for select
     using (
       assigned_email = auth.jwt()->> 'email' or
       created_by_email = auth.jwt()->> 'email'
     );

   create policy "users can update status of their tasks"
     on public.tasks
     for update
     using (
       assigned_email = auth.jwt()->> 'email' or
       created_by_email = auth.jwt()->> 'email'
     );
   ```

   Bảng có các cột:
   - `title`: tiêu đề công việc
   - `description`: mô tả chi tiết
   - `due_date`: hạn hoàn thành (kiểu ngày)
   - `status`: trạng thái (`todo`, `doing`, `block`, `done`)
   - `created_by_email`: email người khởi tạo công việc
   - `assigned_email`: email người được giao việc (mặc định chính người khởi tạo)
   - `created_at`: thời gian tạo

3. **Kích hoạt xác thực email & mật khẩu** trong mục Authentication của Supabase để cho phép đăng ký và đăng nhập bằng email.

4. **Cài đặt môi trường trong tệp `app.js`**. Mở file `app.js` và thay thế các hằng số `YOUR_SUPABASE_URL` và `YOUR_SUPABASE_ANON_KEY` bằng URL và Anon key của dự án Supabase. Ví dụ:

   ```js
   const SUPABASE_URL = 'https://abcdxyz.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1...';
   ```

5. **Triển khai lên GitHub Pages/Vercel**. Bạn có thể tạo repo mới (ví dụ `PGDD9plan`) và đưa toàn bộ thư mục lên. Với GitHub Pages, chỉ cần commit các file và bật Pages ở nhánh `main` (trong thư mục gốc). Với Vercel, tạo project mới và liên kết với repo; Vercel sẽ phục vụ file tĩnh tự động.

## 2. Đăng ký và đăng nhập

1. Mở website, bạn sẽ thấy trang đăng nhập/đăng ký.
2. **Đăng ký tài khoản**: nhập email và mật khẩu > chọn “Đăng ký”. Supabase sẽ gửi email xác nhận. Xác nhận xong, bạn có thể đăng nhập.
3. **Đăng nhập**: nhập email và mật khẩu > chọn “Đăng nhập”. Nếu thành công, ứng dụng sẽ hiện bảng Kanban.
4. **Đăng xuất**: bấm nút “Đăng xuất” trên góc phải.

## 3. Tạo công việc mới

1. Phần “Tạo công việc mới” nằm trên cùng của trang. Nhập:
   - **Tiêu đề công việc** (bắt buộc).
   - **Mô tả** (tùy chọn).
   - **Ngày hạn (due date)** – có thể chọn ngày.
   - **Giao cho (Email cán bộ)** – nhập email người nhận. Nếu để trống, công việc sẽ tự động giao cho bạn.
2. Nhấn **“Thêm công việc”**. Công việc mới sẽ xuất hiện ở cột **To‑Do** với màu sắc mặc định.

## 4. Kéo thả thay đổi trạng thái

* Mỗi công việc được hiển thị dưới dạng một thẻ trong bảng Kanban. Bạn có thể kéo thẻ giữa các cột **To‑Do**, **Doing**, **Block** và **Done**. Sau khi thả, trạng thái sẽ được cập nhật trong cơ sở dữ liệu.
* Màu sắc của thẻ phản ánh trạng thái: thẻ To‑Do có dải màu xanh dương, Doing màu vàng, Block màu đỏ và Done màu xanh ngọc (tương tự sắc màu của BIDV). Khái niệm chia trạng thái này được tham khảo từ hướng dẫn Kanban trong bài viết “Yes you Kanban” – một bảng Kanban cơ bản được chia thành ba cột **To‑Do**, **Doing** và **Done**, và thẻ được di chuyển từ trái qua phải khi tiến độ thay đổi【559982002976551†L162-L170】. Ở đây chúng ta bổ sung thêm trạng thái **Block** để đánh dấu các công việc bị trì hoãn.

## 5. Xem và chỉnh sửa công việc

* Ứng dụng tự động tải công việc mà bạn tạo ra hoặc được giao (dựa vào trường `created_by_email` và `assigned_email`).
* Khi một công việc đã quá hạn và chưa chuyển sang cột **Done**, thẻ vẫn giữ màu trạng thái nhưng bạn có thể dễ dàng nhận biết nhờ ngày hạn hiển thị dưới tiêu đề.
* Để sửa mô tả hay hạn công việc, hiện tại bạn cần vào Supabase Table Editor. Có thể phát triển thêm tính năng này sau.

## 6. Xuất báo cáo CSV

* Nhấn nút **“Xuất CSV”** dưới bảng để tải về file `tasks.csv` chứa toàn bộ công việc của bạn (cả công việc bạn tạo và công việc được giao). File bao gồm các cột: tiêu đề, mô tả, ngày hạn, trạng thái, người tạo, người được giao và thời gian tạo.

## 7. Phân quyền giám đốc

* Trong giai đoạn đầu, ứng dụng chỉ kiểm tra email của người tạo và người được giao để hiển thị công việc. Để vai trò **Giám đốc phòng** có thể xem toàn bộ công việc của phòng, bạn có thể thêm trường `role` trong bảng `auth.users` (trong `app_metadata`) rồi chỉnh sửa câu lệnh SQL policy để cho phép email của giám đốc đọc tất cả các hàng. Ngoài ra, có thể thêm điều kiện trong hàm `loadTasks()` để nếu `currentUser.email` thuộc danh sách giám đốc thì bỏ bộ lọc `or`. Những tính năng nâng cao này tương tự như khả năng tùy biến trong ClickUp – nền tảng quản lý dự án cho phép cấu hình các trường tùy chỉnh, bảng điều khiển, biểu mẫu và nhiều chế độ xem khác nhau để đáp ứng nhu cầu của từng đội nhóm【64340204942671†L94-L134】.

## 8. Cấu phần kế hoạch (chưa triển khai)

Cấu phần thứ hai dùng để phân bổ kế hoạch năm/quý/tháng và liên kết với công việc hằng tuần. Bạn có thể mở rộng cơ sở dữ liệu bằng bảng `plans` chứa các chỉ tiêu năm/quý và bảng liên kết `plan_tasks` để gán công việc vào chỉ tiêu. Tương lai có thể bổ sung biểu đồ/tổng hợp để giám đốc xem tiến độ tổng thể – tương tự chức năng **Dashboards** trong ClickUp, nơi người dùng có thể thêm các widget báo cáo thời gian thực về số lượng công việc, tiến độ sprint, điểm năng lực, v.v.【64340204942671†L286-L290】.

## 9. Gợi ý sử dụng và mở rộng

1. **Cải tiến giao diện**: trang hiện tại ưu tiên hiển thị tốt trên thiết bị di động với bố cục linh hoạt (flex‑wrap). Bạn có thể thêm CSS để điều chỉnh kích thước cột, màu sắc, biểu tượng.
2. **Thông báo email**: Supabase hỗ trợ webhook/functions để gửi email khi có công việc mới hoặc thay đổi trạng thái.
3. **Bộ lọc thời gian**: thêm tuỳ chọn lọc công việc theo tuần/tháng, hoặc hiển thị lịch dạng calendar.
4. **Liên kết với module kế hoạch**: khi tạo công việc, cho phép chọn kế hoạch (năm/quý). Sau đó dashboard có thể tổng hợp số lượng công việc hoàn thành theo kế hoạch.

## 10. Tham khảo thêm

* **Hướng dẫn Supabase với React** – tài liệu chính thức hướng dẫn cách tạo ứng dụng React, cài đặt thư viện `@supabase/supabase-js` và khai báo biến môi trường【167201099633932†L203-L225】.
* **Phương pháp Kanban** – bài viết trên Todoist mô tả rõ cách cấu trúc bảng Kanban với các cột “To‑Do → Doing → Done” và lý do Kanban giúp theo dõi tiến độ hiệu quả【559982002976551†L162-L170】.
* **Tùy biến trong ClickUp** – ClickUp nổi tiếng nhờ khả năng tùy chỉnh linh hoạt, cho phép người dùng thêm trường tùy chỉnh, tự động hóa, bảng điều khiển thời gian thực và nhiều chế độ xem khác nhau【64340204942671†L94-L134】【64340204942671†L286-L290】. Những điểm này là nguồn cảm hứng để xây dựng sản phẩm PGDD9.
