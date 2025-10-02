import { Inter } from "next/font/google";
import "@/app/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Form Pesanan Undangan - SewaUndangan",
  description: "Form Pemesanan Undangan di SewaUndangan.com",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
