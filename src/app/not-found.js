import Link from "next/link"
import { Heart } from "lucide-react"
 
export default async function NotFound() {

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <Heart className="mx-auto h-12 w-12 text-pink-300" />
        <h1 className="mt-6 text-3xl font-extrabold text-gray-900 sm:text-4xl">Halaman Tidak Ditemukan</h1>
        <p className="mt-2 text-sm text-gray-600">
          Ups! Sepertinya halaman yang Anda cari telah kabur bersama pasangannya.
        </p>
        <div className="mt-8">
          <Link href="/" className="text-base font-medium text-pink-600 hover:text-pink-500">
            Kembali ke halaman utama
            <span aria-hidden="true"> &rarr;</span>
          </Link>
        </div>
      </div>
      <div className="mt-16 border-t border-gray-200 pt-8 text-center">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} <a href="https://sewaundangan.com">SewaUndangan.com</a>.
        </p>
      </div>
    </div>
  )
}
