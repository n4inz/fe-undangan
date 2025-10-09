'use client'
// import '../styles/globals.css' // pastikan path sesuai ke file globals.css
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Home, RefreshCcw, MessageCircle, Globe } from 'lucide-react'

export default function GlobalError({ error, reset }) {
  console.error('🔥 Global Error Caught:', error)

  const [currentPath, setCurrentPath] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname + window.location.search)
    }
  }, [])

  const adminContact = `https://wa.me/${process.env.NEXT_PUBLIC_WA_NUMBER || '6281234567890'
    }?text=${encodeURIComponent(
      `Halo Admin, saya mengalami error di website.\n\nURL: ${currentPath}\nPesan: ${error?.message || 'Unknown error'
      }\n\nMohon bantuannya 🙏`
    )}`

  return (
    <html>
      <body className="font-sans bg-[#f9fafb] text-[#111] flex flex-col items-center justify-center min-h-screen text-center p-6">
        <div className="max-w-2xl bg-white rounded-2xl shadow-xl p-8 border border-gray-200 animate-fadeIn">
          <h1 className="text-3xl font-bold mb-2 text-red-600">
            Terjadi Kesalahan 😢
          </h1>

          {/* URL path */}
          <p className="text-sm text-gray-500 mb-6">
            <Globe className="inline w-4 h-4 mr-1 text-gray-400" />
            <span>{currentPath || '(URL tidak tersedia)'}</span>
          </p>

          {/* Pesan error */}
          <p className="mb-6 text-lg text-gray-800">
            <strong className="text-red-500">Pesan:</strong>{' '}
            {error?.message || 'Unknown error'}
          </p>

          {/* Stack trace */}
          <div className="text-left">
            <h3 className="text-lg font-semibold mb-2 text-blue-600">
              Stack Trace:
            </h3>
            <pre className="bg-gray-100 text-gray-700 p-4 rounded-lg overflow-x-auto text-sm leading-relaxed mb-6 border border-gray-200">
              {error?.stack}
            </pre>
          </div>

          {/* Tombol aksi */}
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            {/* <button
              onClick={() => reset()}
              className="flex items-center gap-2 bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 active:scale-95 transition-all shadow-sm"
            >
              <RefreshCcw className="w-4 h-4" />
              Coba Lagi
            </button> */}

            <Link
              href="/"
              className="flex items-center gap-2 bg-gray-200 text-gray-800 px-5 py-2 rounded-lg hover:bg-gray-300 active:scale-95 transition-all shadow-sm"
            >
              <Home className="w-4 h-4" />
              Beranda
            </Link>

            <a
              href={adminContact}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600 active:scale-95 transition-all shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Hubungi Admin
            </a>
          </div>
        </div>

        {/* Animasi masuk */}
        <style jsx global>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.4s ease-out;
          }
        `}</style>
      </body>
    </html>
  )
}
