import { URL } from 'url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  images: {
    remotePatterns: process.env.NEXT_PUBLIC_IMAGE_HOSTS
      ? process.env.NEXT_PUBLIC_IMAGE_HOSTS.split(',').map((host) => {
          const url = new URL(host);
          console.log('Configuring remote host:', url.hostname); // Debugging line
          return {
            protocol: url.protocol.replace(':', ''), // remove the trailing colon from the protocol
            hostname: url.hostname,
            port: url.port || '', // If no port is provided, leave it empty
            pathname: '/images/**', // Adjust if necessary
          };
        })
      : [],
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
