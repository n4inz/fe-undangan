import { URL } from 'url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Ignores ESLint errors during the build process
  },
  experimental: {
    missingSuspenseWithCSRBailout: false, // Keep the experimental flag as defined
  },

  async rewrites() {
    return [
      {
        source: '/',
        destination: '/',
      },
    ];
  },

  // Image optimization configuration with dynamic hostnames
  images: {
    remotePatterns: process.env.NEXT_PUBLIC_IMAGE_HOSTS
      ? process.env.NEXT_PUBLIC_IMAGE_HOSTS.split(',').map((host) => {
          try {
            const url = new URL(host);
            console.log('Configuring remote host:', url.hostname); // For debugging purposes
            return {
              protocol: url.protocol.replace(':', ''), // Removes colon from protocol (http, https)
              hostname: url.hostname, // Hostname extracted from the URL
              port: url.port || '', // Use provided port or leave empty
              pathname: '/**', // Matches any path, adjust as needed
            };
          } catch (error) {
            console.error(`Invalid host URL: ${host}`, error); // Log any errors for invalid hosts
            return null; // Return null for invalid hosts
          }
        }).filter(Boolean) // Filters out any invalid hosts (null values)
      : [],
  },
};

export default nextConfig;
