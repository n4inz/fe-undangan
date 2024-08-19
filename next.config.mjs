// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// export default nextConfig;


// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'export',
    eslint: {
      // Warning: This allows production builds to successfully complete even if
      // your project has ESLint errors.
      ignoreDuringBuilds: true,
    },
    experimental: {
      missingSuspenseWithCSRBailout: false,
    },
    images: {
      remotePatterns: [
        {
          protocol: 'http',
          hostname: process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).hostname : 'localhost',
        },
      ],
    },
  
    async rewrites() {
      return [
        {
          source: '/',
          destination: '/',
        },
      ];
    },
  
  };
  
  export default nextConfig;