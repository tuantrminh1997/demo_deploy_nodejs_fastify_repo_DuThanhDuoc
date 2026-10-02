const path = require('node:path')
require('dotenv').config({
  path: path.join(__dirname, '.env')
})
// sáng 08/09/2026 - đang dừng ở 12:45
// Bản chất

// 1. Khi chạy "pm2 start ecosystem.config.cjs" -> PM2/Node đọc file config trước.

// 1.1. Trên Windows:
// process.platform === "win32"
// → true

// → nên thực tế chạy:
// cmd.exe /c npm run preview -- --host 0.0.0.0

// 1.2. Trên Ubuntu VPS:
// process.platform === "win32"
// → false

// nên thực tế chạy:
// → npm run preview -- --host 0.0.0.0

// 2. Còn:
// cwd: __dirname

// có nghĩa:
// → Dù Windows hay Ubuntu, hãy chạy lệnh tại chính thư mục đang chứa ecosystem.config.cjs.

// Vì vậy không cần kiểu hard-code:
// cwd: "C:\\Users\\..."

// hay:
// cwd: "/home/user/project"

// 3. Điểm rất quan trọng
// 3.1. File phải giữ đuôi:
// ecosystem.config.cjs

// 3.2. đặc biệt nếu project của bạn có:
// {
//   "type": "module"
// }

// Vì .cjs nói với Node:
// File này là CommonJS.

// Do đó những thứ này dùng bình thường:
// module.exports
// process
// __dirname

// Nếu trước đó bạn gặp:

// __dirname is not defined
// process is not defined

// thì thường là do file đang bị IDE/ESLint/TypeScript hiểu sai environment, hoặc bạn dùng .js dưới "type": "module".

// Chốt: cấu hình trên phù hợp để dùng chung cho:

// Windows local
//         ↓
// ecosystem.config.cjs
//         ↑
// Ubuntu VPS

// và không cần tạo riêng ecosystem.windows.cjs / ecosystem.linux.cjs.
module.exports = {
  apps: [
    {
      name: 'Project_Deploy_Fastify_Server',

      // Windows cần cmd.exe.
      // Linux chạy npm trực tiếp.
      script: process.platform === 'win32' ? 'cmd.exe' : 'npm',

      args:
        // Chú ý: ecosystem.config.cjs bản thân nó cũng là một deployment configuration, nên viết env: { PORT: 4000 } ở đó không sai.
        // -> Chỉ là nếu muốn một nguồn cấu hình duy nhất và dễ đổi Docker/PM2/Kubernetes sau này, thì để PORT được inject từ môi trường bên ngoài sẽ sạch hơn.
        process.platform === 'win32' ? '/c npm run start' : 'run start',

      // Chính là thư mục chứa file ecosystem.config.cjs.
      // Không cần hard-code đường dẫn Windows/Linux.
      cwd: __dirname,

      interpreter: 'none',
      env: {
        PORT: process.env.PORT
      }
    }
  ]
}
