
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Привязка к 0.0.0.0 обязательна для Render, чтобы открыть порт наружу
    host: '0.0.0.0',
    port: 3000,
    // Разрешаем доступ с вашего домена Render
    allowedHosts: [
      'ti-9xyy.onrender.com',
      '.onrender.com' // Разрешить любые поддомены onrender
    ]
  }
});
