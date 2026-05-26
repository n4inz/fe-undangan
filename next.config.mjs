import { withSentryConfig } from "@sentry/nextjs";
import { URL } from "url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    missingSuspenseWithCSRBailout: false,
  },

  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.sewaundangan.com";

    return [
      {
        source: "/",
        destination: "/",
      },
      {
        source: "/image-proxy/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: (() => {
      const envHosts = process.env.NEXT_PUBLIC_IMAGE_HOSTS;
      const defaultHosts = [
        "https://api.sewaundangan.com", // Production API
        "http://localhost:5000",        // Local API
      ];

      // Gunakan dari ENV jika ada, kalau tidak fallback ke default
      const hosts = envHosts
        ? envHosts.split(",").map((h) => h.trim())
        : defaultHosts;

      console.log("🖼️ Allowed remote image hosts:");
      console.table(hosts);

      // Ubah setiap host jadi pattern valid Next.js
      return hosts
        .map((host) => {
          try {
            const url = new URL(host);
            return {
              protocol: url.protocol.replace(":", ""),
              hostname: url.hostname,
              port: url.port || "",
              pathname: "/**", // bisa /asset/** kalau mau lebih ketat
            };
          } catch (err) {
            console.error(`❌ Invalid host in NEXT_PUBLIC_IMAGE_HOSTS: ${host}`, err);
            return null;
          }
        })
        .filter(Boolean);
    })(),
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "try333",

  project: "sewaundangan",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
