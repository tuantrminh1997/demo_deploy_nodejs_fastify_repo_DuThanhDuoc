/**
 * LUỒNG HOẠT ĐỘNG KHI CHẠY: pm2 start ecosystem.config.cjs
 * 1. PM2 dùng Node.js để đọc và thực thi file cấu hình này.
 * 2. Node.js xác định môi trường từ tên thư mục cha và kiểm tra tính hợp lệ.
 * 3. Nếu là development, Node.js đọc thêm .env để lấy cấu hình còn thiếu.
 * 4. File xuất ra thông tin tên process, lệnh khởi động, thư mục chạy và PORT.
 * 5. PM2 nhận cấu hình, tạo/quản lý process rồi thực thi lệnh npm run start.
 * 6. npm tìm package.json trong thư mục dự án và chạy script "start" ở đó.
 * 7. Ứng dụng được khởi động với PORT đã truyền vào (nếu có).
 *
 * LƯU Ý: File này chỉ cấu hình cách PM2 khởi chạy ứng dụng; không tự build code.
 * Tên thư mục chỉ dùng để nhận diện môi trường, không tự đặt NODE_ENV hay APP_ENV.
 */

// Nạp module path có sẵn trong Node.js để xử lý đường dẫn đúng trên Windows và Linux.
const path = require('node:path')

// __dirname là thư mục chứa file này, ví dụ: /home/ubuntu/staging/frontend-nextjs.
// path.dirname(...) lấy thư mục cha; path.basename(...) lấy tên cuối cùng: "staging".
// Nhờ vậy, cùng một file có thể tự nhận diện development / staging / production.
const environment = path.basename(path.dirname(__dirname))

// Khai báo các tên thư mục môi trường được phép sử dụng trên VPS.
const allowedEnvironments = ['development', 'staging', 'production']

// Nếu tên vừa lấy không có trong danh sách, coi như cấu trúc thư mục đang sai.
if (!allowedEnvironments.includes(environment)) {
  // Báo lỗi và dừng việc nạp cấu hình; PM2 không khởi chạy app bằng cấu hình sai.
  throw new Error(`Tên môi trường "${environment}" không hợp lệ!`)
}

// Chỉ ở development mới thử đọc file .env; staging/production dùng biến do hệ thống deploy truyền vào.
if (environment === 'development') {
  // dotenv đọc file .env và đưa các giá trị vào process.env của tiến trình đang nạp cấu hình.
  // Biến đã tồn tại trong process.env sẽ được giữ nguyên (không bị .env ghi đè mặc định).
  require('dotenv').config({
    // Xác định chính xác file .env nằm cùng thư mục với ecosystem.config.cjs.
    path: path.join(__dirname, '.env')
  })
}

// Xuất đối tượng cấu hình cho PM2; đây không phải đoạn code trực tiếp chạy Next.js.
module.exports = {
  // PM2 đọc mảng apps để biết cần khởi chạy và quản lý những ứng dụng nào.
  apps: [
    // Đối tượng này mô tả một ứng dụng frontend Next.js cần chạy bằng PM2.
    {
      // Ghép tên app với môi trường đã nhận diện để hiển thị riêng trong pm2 ls.
      // Ví dụ: frontend_nextjs_staging; tên này KHÔNG tự thiết lập biến APP_ENV/NODE_ENV.
      name: `Fastify_server_${environment}`,

      // "script" cho PM2 biết CHƯƠNG TRÌNH nào cần khởi chạy, chưa phải lệnh đầy đủ.
      // process.platform là tên hệ điều hành do Node.js cung cấp; "win32" nghĩa là Windows.
      // Trên Windows, npm thường được gọi thông qua file npm.cmd nên dùng cmd.exe
      // (trình thực thi lệnh của Windows) để gọi npm như khi gõ lệnh trong Terminal.
      // Trên Linux, npm là lệnh có thể gọi trực tiếp từ PATH nên không cần cmd.exe.
      // PM2 sẽ ghép chương trình được chọn ở đây với tham số "args" bên dưới.
      script: process.platform === 'win32' ? 'cmd.exe' : 'npm',

      // "args" là những tham số PM2 truyền tiếp cho chương trình đã chọn ở "script".
      // Windows: tạo lệnh "cmd.exe /c npm run start"; /c bảo cmd.exe chạy câu lệnh
      // phía sau rồi thoát KHI lệnh đó kết thúc (app còn chạy thì lệnh chưa kết thúc).
      // Linux: tạo lệnh "npm run start"; "run start" là hai tham số của npm.
      // Sau đó, npm tìm package.json trong "cwd" và chạy nội dung scripts.start,
      // ví dụ "start": "next start" để khởi động bản build Next.js.
      args: process.platform === 'win32' ? '/c npm run start' : 'run start',

      // "cwd" (current working directory) là THƯ MỤC LÀM VIỆC của chương trình PM2 sắp chạy.
      // "__dirname" luôn trỏ tới thư mục chứa ecosystem.config.cjs, ví dụ: /home/ubuntu/staging/frontend-nextjs.
      // Vì thế, dù gõ lệnh pm2 từ thư mục nào, PM2 vẫn khởi chạy npm TẠI thư mục dự án này.
      // Khi nhận "npm run start", npm sẽ đọc package.json trong thư mục đó, tìm scripts.start
      // (ví dụ "next start") rồi chạy ứng dụng với đúng ngữ cảnh/thư mục của dự án.
      // "cwd" không đổi vị trí file và không khởi chạy app; nó chỉ xác định nơi lệnh chạy.
      cwd: __dirname,

      // "interpreter" quy định PM2 có dùng trình thông dịch để chạy "script" hay không.
      // Với file JavaScript (ví dụ server.js), PM2 thường dùng Node.js để chạy file đó.
      // Nhưng "script" ở trên là lệnh hệ điều hành (cmd.exe hoặc npm), không phải file
      // JavaScript của ứng dụng; dùng "none" để PM2 gọi thẳng lệnh ấy cùng với "args".
      // Lưu ý: "none" chỉ bỏ lớp thông dịch do PM2 thêm; npm và Next.js vẫn dùng Node.js.
      interpreter: 'none',

      // "env" là nhóm biến môi trường PM2 cấp cho chương trình được chọn ở "script".
      // Khi PM2 chạy npm, npm nhận các biến này; ứng dụng Next.js do npm khởi động
      // tiếp tục kế thừa chúng. Đây là cách chuyển cấu hình từ môi trường deploy vào app.
      env: {
        // BƯỚC 1: Lúc Node.js đọc file ecosystem, process.env.PORT là giá trị PORT hiện có.
        // Staging/production: giá trị này nên được inject từ lệnh deploy, CI/CD hoặc hệ thống.
        // Development: đoạn dotenv ở phía trên có thể bổ sung PORT từ file .env nếu chưa có.
        // BƯỚC 2: Gán giá trị đó vào "env.PORT" để PM2 truyền xuống tiến trình npm.
        // BƯỚC 3: npm chạy scripts.start; Next.js nhận PORT và dùng làm cổng lắng nghe
        // nếu lệnh khởi động hỗ trợ PORT (ví dụ "next start").
        // Nếu process.env.PORT chưa được cấp, dòng này không tự tạo ra số cổng;
        // ứng dụng có thể dùng cổng mặc định hoặc báo lỗi tùy cách cấu hình.
        // PORT chỉ là cấu hình của ứng dụng: không mở cổng trên UFW và không cấu hình Nginx.
        PORT: process.env.PORT
      }
    }
  ]
}
