"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // Hapus localStorage
    localStorage.removeItem("formData");

    // Redirect ke halaman forms/new
    router.replace("/forms/new");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Menghapus data...</p>
    </div>
  );
}