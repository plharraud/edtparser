require('dotenv').config()
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [ vue() ],
  root: 'app/',
  base: process.env.APP_BASE,
  build: {
    outDir: '../dist/'
  }
})
