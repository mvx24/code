import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react-swc';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact({ prerender: { enabled: true, renderTarget: '#root' } }), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      react: fileURLToPath(new URL('./node_modules/preact/compat/', import.meta.url)),
      'react/jsx-runtime': fileURLToPath(
        new URL('./node_modules/preact/jsx-runtime', import.meta.url),
      ),
      'react-dom': fileURLToPath(new URL('./node_modules/preact/compat/', import.meta.url)),
      'react-dom/*': fileURLToPath(new URL('./node_modules/preact/compat/*', import.meta.url)),
    },
  },
});
