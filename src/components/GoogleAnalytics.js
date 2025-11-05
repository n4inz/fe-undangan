"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Script from "next/script";

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track route changes
  useEffect(() => {
    if (typeof window.gtag === "function") {
      window.gtag("config", "G-41G31BCFDC", {
        page_path: pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ""),
      });
    }
  }, [pathname, searchParams]);

  return (
    <>
      {/* Load the Google Analytics library */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-41G31BCFDC"
        strategy="afterInteractive"
      />

      {/* Initialize GA */}
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-41G31BCFDC', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}
