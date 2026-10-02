// Import the framework and instantiate it
import envConfig, { API_URL } from '@/config'
import { errorHandlerPlugin } from '@/plugins/errorHandler.plugins'
import validatorCompilerPlugin from '@/plugins/validatorCompiler.plugins'
import accountRoutes from '@/routes/account.route'
import authRoutes from '@/routes/auth.route'
import fastifyAuth from '@fastify/auth'
import fastifyCookie from '@fastify/cookie'
import fastifyHelmet from '@fastify/helmet'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import path from 'path'
import { createFolder } from '@/utils/helpers'
import mediaRoutes from '@/routes/media.route'
import staticRoutes from '@/routes/static.route'
import productRoutes from '@/routes/product.route'
import testRoutes from '@/routes/test.route'

const fastify = Fastify({
  logger: true
})

// Run the server!
const start = async () => {
  try {
    createFolder(path.resolve(envConfig.UPLOAD_FOLDER))
    const whitelist = ['*']
    fastify.register(cors, {
      origin: whitelist, // Cho phép tất cả các domain gọi API
      credentials: true // Cho phép trình duyệt gửi cookie đến server
    })

    fastify.register(fastifyAuth, {
      defaultRelation: 'and'
    })
    fastify.register(fastifyHelmet, {
      crossOriginResourcePolicy: {
        policy: 'cross-origin'
      }
    })
    fastify.register(fastifyCookie)
    fastify.register(validatorCompilerPlugin)
    fastify.register(errorHandlerPlugin)
    fastify.register(authRoutes, {
      prefix: '/auth'
    })
    fastify.register(accountRoutes, {
      prefix: '/account'
    })
    fastify.register(mediaRoutes, {
      prefix: '/media'
    })
    fastify.register(staticRoutes, {
      prefix: '/static'
    })
    fastify.register(productRoutes, {
      prefix: '/products'
    })
    fastify.register(testRoutes, {
      prefix: '/test'
    })
    await fastify.listen({
      port: envConfig.PORT,
      // Chú ý quan trọng: Bản chất là host quyết định server sẽ “lắng nghe” kết nối mạng trên interface nào.
      // - host: 'localhost' → server chỉ nhận kết nối từ chính máy đó. Trên VPS thì chỉ VPS tự gọi được, ví dụ http://127.0.0.1:4000.
      // Máy bên ngoài gần như không truy cập trực tiếp được.
      // - host: '0.0.0.0' → server lắng nghe trên tất cả IPv4 network interfaces của máy. Khi đó máy ngoài có thể gọi qua IP VPS,
      // ví dụ http://103.140.249.209:4000, miễn là firewall/port cho phép.

      // Có thể nhớ cực ngắn:
      // - localhost = chỉ nghe bên trong máy
      // - 0.0.0.0   = nghe từ mọi interface của máy

      // Vì vậy đoạn: host: envConfig.IS_PRODUCTION ? '0.0.0.0' : 'localhost'

      // có nghĩa là:
      // - development  → chỉ localhost
      // - production   → cho phép nhận traffic từ bên ngoài

      // Lưu ý: 0.0.0.0 không phải IP để client gọi tới. Nó chỉ là địa chỉ bind. Client vẫn gọi bằng IP thật/domain của VPS.
      host: envConfig.IS_PRODUCTION ? '0.0.0.0' : 'localhost'
    })
    console.log(`Server đang chạy dưới local tại: ${API_URL}`)
    if (envConfig.IS_PRODUCTION) {
      console.log(`Đang ở mode production với domain: ${envConfig.PRODUCTION_URL}`)
    }
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
