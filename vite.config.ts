// import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
// 必须引入这个 /vite 路径
import path from 'path'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  // assetsInclude: [
  //   '**/*.glb',
  //   '**/*.gltf',
  //   '**/*.fbx',
  //   '**/*.hdr',
  //   '**/*.json',
  //   '**/*.mp4',
  //   '**/*.mov',
  // ],
  plugins: [
    react(),
    UnoCSS(),
    // legacy({
    //   // targets: ['Chrome 64'],
    //   // iphone 6/7/8 ios8-ios11  android 8 => chromeAndroid 64  android 7.1 >= chromeAndroid 56
    //   targets: 'edge>=80, firefox>=72, chrome>=64, safari>=11, chromeAndroid>=64, iOS>=11',
    //   modernPolyfills: true,
    //   // targets: ['defaults', 'not IE 11'],
    //   // default: 'edge>=80, firefox>=72, chrome>=80, safari>=13.1, chromeAndroid>=80, iOS>=13.1'
    //   // modernTargets: 'edge>=80, firefox>=72, chrome>=64, safari>=11, chromeAndroid>=64, iOS>=11',
    // }),
  ],
  resolve: {
    alias: {
      // 设置 @ 指向 src 目录
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0',
  },
})
