import { defineConfig, loadEnv, type Plugin } from 'vite'
import path from 'path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import adminUsersHandler from './api/admin-users'
import communityHandler from './api/community'
import directoryAvatarsHandler from './api/directory-avatars'

const rootDirectory = path.dirname(fileURLToPath(import.meta.url))

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(rootDirectory, 'src/assets', filename)
      }
    },
  }
}

function localApiFunctions(): Plugin {
  const handlers = new Map([
    ['/api/admin-users', adminUsersHandler],
    ['/api/community', communityHandler],
    ['/api/directory-avatars', directoryAvatarsHandler],
  ])

  return {
    name: 'local-api-functions',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = request.url ? new URL(request.url, 'http://localhost').pathname : ''
        const handler = handlers.get(pathname)
        if (!handler) {
          next()
          return
        }

        try {
          const body = await readRequestBody(request)
          const apiRequest = Object.assign(request, { body })
          const apiResponse = createApiResponse(response)
          await handler(apiRequest, apiResponse)
        } catch (error) {
          if (!response.headersSent) response.statusCode = 500
          response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Error local de API.' }))
        }
      })
    },
  }
}

async function readRequestBody(request: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  if (chunks.length === 0) return undefined
  const raw = Buffer.concat(chunks).toString('utf8')
  const contentType = request.headers['content-type'] ?? ''
  return contentType.includes('application/json') ? JSON.parse(raw) : raw
}

function createApiResponse(response: ServerResponse) {
  return Object.assign(response, {
    status(code: number) {
      response.statusCode = code
      return this
    },
    json(payload: unknown) {
      if (!response.hasHeader('Content-Type')) response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(JSON.stringify(payload))
      return this
    },
  })
}

export default defineConfig(({ mode }) => {
  const serverEnv = loadEnv('admin', process.cwd(), '')
  for (const [key, value] of Object.entries(serverEnv)) {
    if (!process.env[key]) process.env[key] = value
  }

  return {
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    localApiFunctions(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(rootDirectory, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})
