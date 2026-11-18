import { build } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

async function runBuild() {
  console.log('🚀 Starting ApplyOnce AI Build...');

  // 1. Clean dist directory
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // 2. Build HTML Pages (Popup, Dashboard, Test Portal)
  console.log('📦 Building Extension Pages (Popup, Dashboard, Test Portal)...');
  await build({
    configFile: path.resolve(rootDir, 'vite.config.ts'),
    build: {
      outDir: distDir,
      emptyOutDir: false,
    }
  });

  // 3. Build Content Script (IIFE for standalone execution in web pages)
  console.log('📦 Building Content Script (IIFE bundle)...');
  await build({
    configFile: false,
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    resolve: {
      alias: {
        '@': path.resolve(rootDir, 'src')
      }
    },
    build: {
      outDir: distDir,
      emptyOutDir: false,
      lib: {
        entry: path.resolve(rootDir, 'src/content/contentScript.ts'),
        name: 'ApplyOnceContentScript',
        formats: ['iife'],
        fileName: () => 'content.js'
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true
        }
      }
    }
  });

  // 4. Build Background Service Worker (ES Module for MV3 service worker)
  console.log('📦 Building Background Service Worker (ES module)...');
  await build({
    configFile: false,
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    resolve: {
      alias: {
        '@': path.resolve(rootDir, 'src')
      }
    },
    build: {
      outDir: distDir,
      emptyOutDir: false,
      lib: {
        entry: path.resolve(rootDir, 'src/background/serviceWorker.ts'),
        name: 'ApplyOnceBackground',
        formats: ['es'],
        fileName: () => 'background.js'
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true
        }
      }
    }
  });

  // 5. Copy manifest.json, icons, and worker assets to dist/
  console.log('📋 Copying Manifest and static assets to dist/...');
  fs.copyFileSync(
    path.resolve(rootDir, 'public/manifest.json'),
    path.resolve(distDir, 'manifest.json')
  );

  const workerFile = path.resolve(rootDir, 'public/pdf.worker.min.mjs');
  if (fs.existsSync(workerFile)) {
    fs.copyFileSync(workerFile, path.resolve(distDir, 'pdf.worker.min.mjs'));
  }

  const iconsDir = path.resolve(rootDir, 'public/icons');
  const distIconsDir = path.resolve(distDir, 'icons');
  if (fs.existsSync(iconsDir)) {
    fs.mkdirSync(distIconsDir, { recursive: true });
    for (const file of fs.readdirSync(iconsDir)) {
      fs.copyFileSync(path.join(iconsDir, file), path.join(distIconsDir, file));
    }
  }

  console.log('✨ ApplyOnce AI Build Complete! Ready for Chrome loading from dist/.');
}

runBuild().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
