import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on the mode (e.g., VITE_API_KEY, API_KEY)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // CRITICAL: We map 'process.env.API_KEY' in the code to the actual value from the environment.
    // This allows the Gemini SDK (which looks for process.env.API_KEY or takes a key in constructor) to work.
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY)
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: [
        '.onrender.com',
        'localhost'
      ]
    }
  };
});
