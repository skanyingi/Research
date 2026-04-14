import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env': {},
      'import.meta.env.VITE_OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY || ''),
      'import.meta.env.VITE_OPENROUTER_MODEL': JSON.stringify(env.OPENROUTER_MODEL || env.VITE_OPENROUTER_MODEL || 'mistralai/mistral-small-3.2-24b-instruct'),
      'import.meta.env.VITE_APP_URL': JSON.stringify(env.APP_URL || env.VITE_APP_URL || 'https://researc.netlify.app'),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.API_BASE_URL || env.VITE_API_BASE_URL || ''),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
