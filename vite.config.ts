
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Загружаем переменные окружения (VITE_API_KEY, API_KEY и т.д.)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // ЭТА ЧАСТЬ КРИТИЧЕСКИ ВАЖНА:
    // Мы заменяем 'process.env.API_KEY' в коде на реальное значение ключа при сборке.
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY)
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: [
        'ti-9xyy.onrender.com',
        '.onrender.com',
        'localhost'
      ]
    }
  };
});
