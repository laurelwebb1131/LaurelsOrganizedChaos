import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { handleCompanion } from './server/companion'

function companionApi(): Plugin {
  return {
    name: 'hearthwise-companion-api',
    configureServer(server) {
      server.middlewares.use('/api/companion', (request, response) => {
        void handleCompanion(request, response)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), companionApi()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
  server: {
    watch: {
      ignored: ['**/*.glb', '**/*.gltf', '**/*.bin', '**/textures/**'],
    },
  },
})
