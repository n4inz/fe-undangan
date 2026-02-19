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
    return [
      {
        source: "/",
        destination: "/",
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

      // console.log("🖼️ Allowed remote image hosts:");
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

export default nextConfig;
