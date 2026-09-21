import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || ''
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || ''

  return {
    // Node 25 + React Refresh can stall the production transform in this repo.
    // JSX still uses Vite's React transform; refresh is only a dev convenience.
    plugins: [react({ fastRefresh: false })],
    define: {
      // Vercel's Supabase integration uses SUPABASE_* while the client code
      // intentionally reads VITE_* values.
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
    },
    server: {
      proxy: {
        // 개발 환경 CORS 우회: /api/tats/* → 공공데이터포털
        '/api/tats': {
          target: 'https://apis.data.go.kr',
          changeOrigin: true,
          secure: true,
          rewrite: (path) =>
            path.replace(/^\/api\/tats/, '/B551011/TatsCnctrRateService'),
        },
      },
    },
  }
})
