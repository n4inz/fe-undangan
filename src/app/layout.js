import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import { Inter } from "next/font/google";
import Providers from './providers';
import './styles/globals.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Login | Undangan Digital",
  description: "Masuk untuk mengelola undangan digital Anda dengan mudah dan cepat.",
};

export default async function AppLayout({ children }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="id">
      <body>
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
