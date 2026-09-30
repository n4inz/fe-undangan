import NextTopLoader from 'nextjs-toploader';
import { requireCustomerRole } from '@/lib/serverAuth';
import ResellerSidebar from '@/components/reseller/ResellerSidebar';
import { ResellerProvider } from '@/components/reseller/ResellerProvider';
import { Toaster } from '@/components/ui/toaster';

export const metadata = {
  title: 'Panel Reseller | Undangan Digital',
  description: 'Kelola brand dan pantau undangan customer Anda.',
};

export default async function ResellerLayout({ children }) {
  const session = await requireCustomerRole('reseller');

  return (
    <ResellerProvider user={session.user}>
      <div className="min-h-screen bg-gray-50">
        <NextTopLoader showSpinner={false} />
        <ResellerSidebar />
        <main className="p-4 pt-20 md:p-8 md:pt-24 xl:ml-[300px] xl:pt-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
        <Toaster />
      </div>
    </ResellerProvider>
  );
}
