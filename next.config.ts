import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'export',
  distDir: 'build-tmp',
  images: {
    unoptimized: true,
  },
  assetPrefix: '/',
  trailingSlash: true,
  optimizeFonts: false,
};

export default config;