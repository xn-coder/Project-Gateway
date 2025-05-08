import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      // Allow up to 10MB for file uploads (adjust as needed)
      // This should be more than MAX_FILE_SIZE in schemas.ts * max number of files (5MB * 5 = 25MB)
      // Body parser limits are in bytes or string units (e.g. '10mb')
      bodySizeLimit: '30mb',
    },
  },
};

export default nextConfig;
