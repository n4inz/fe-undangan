'use client';

import Link from 'next/link';
import { Users, Clock, CheckCircle2, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useResellerResource } from '@/components/reseller/api';
import { ResellerError } from '@/components/reseller/ResellerShared';
import AddInvitationButton from '@/components/reseller/AddInvitationButton';

const statistics = [
  { key: 'total', label: 'Total Customer / Form Masuk', icon: Users },
  { key: 'waiting', label: 'Menunggu Aktivasi', icon: Clock },
  { key: 'active', label: 'Undangan Aktif', icon: CheckCircle2 },
  { key: 'draft', label: 'Draft', icon: FileText },
];

export default function ResellerDashboard() {
  const { data, loading, error, reload } = useResellerResource('/dashboard');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">Dashboard</h1><p className="mt-2 text-sm text-muted-foreground">Ringkasan form dan undangan customer milik Anda.</p></div><AddInvitationButton /></div>
      {error && <ResellerError message={error} onRetry={reload} />}
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {statistics.map(({ key, label, icon: Icon }) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3"><CardTitle className="text-sm font-medium">{label}</CardTitle><Icon className="h-5 w-5 shrink-0 text-muted-foreground" /></CardHeader>
            <CardContent>{loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-semibold">{data ? Number(data[key] || 0).toLocaleString('id-ID') : '-'}</p>}</CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-lg">Pantau undangan customer</CardTitle><CardDescription>Lihat detail dan status setiap form masuk. Aktivasi undangan dilakukan oleh Admin.</CardDescription></CardHeader>
        <CardContent><Button asChild><Link href="/reseller/customer">Lihat Form Masuk</Link></Button></CardContent>
      </Card>
    </div>
  );
}
