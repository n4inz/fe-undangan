'use client';

import { useState } from 'react';
import Link from 'next/link';
import DataTable from 'react-data-table-component';
import { DebounceInput } from 'react-debounce-input';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useResellerResource } from '@/components/reseller/api';
import { formatResellerDate, InvitationLink, resellerStatuses, ResellerError, ResellerStatus } from '@/components/reseller/ResellerShared';
import FormDetailDialog from '@/components/reseller/FormDetailDialog';
import AddInvitationButton from '@/components/reseller/AddInvitationButton';

export default function ResellerCustomer() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [resetPagination, setResetPagination] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const { data, loading, error, reload } = useResellerResource('/forms', {
    page, limit, search,
    ...(status !== 'all' ? { status } : {}),
    ...(type !== 'all' ? { type } : {}),
  });

  const changeFilter = (setter, value) => {
    setter(value);
    setPage(1);
    setResetPagination(value => !value);
  };

  const columns = [
    { name: 'ID Pesanan', selector: row => row.id, width: '105px' },
    { name: 'Aksi', cell: row => <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setSelectedForm(row)}>Detail</Button><Button size="sm" variant="outline" asChild><Link href={`/reseller/customer/${encodeURIComponent(row.type)}/${encodeURIComponent(row.id)}/edit`}>Edit</Link></Button></div>, width: '160px' },
    { name: 'Nama customer', selector: row => row.customerName || '-', minWidth: '145px', wrap: true },
    { name: 'Mempelai / judul', selector: row => row.title || '-', minWidth: '180px', wrap: true, grow: 2 },
    { name: 'Jenis undangan', selector: row => row.invitationType || (row.type === 'wedding' ? 'Wedding' : 'Aqiqah / Khitan'), minWidth: '140px', wrap: true },
    { name: 'Status', cell: row => <ResellerStatus status={row.status} label={row.statusLabel} />, minWidth: '160px' },
    { name: 'Tanggal dibuat', selector: row => formatResellerDate(row.createdAt), minWidth: '135px' },
    { name: 'Link undangan', cell: row => <InvitationLink href={row.linkUndangan} />, minWidth: '150px' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">Customer / Form Masuk</h1><p className="mt-2 text-sm text-muted-foreground">Semua form yang tercatat atas brand Anda. Aktivasi undangan dilakukan oleh Admin.</p></div><AddInvitationButton /></div>
      {error && <ResellerError message={error} onRetry={reload} />}
      <Card>
        <CardHeader><CardTitle className="text-lg">Daftar Form Masuk</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2"><Label htmlFor="reseller-search">Cari customer / undangan</Label><DebounceInput id="reseller-search" debounceTimeout={300} value={search} onChange={event => changeFilter(setSearch, event.target.value)} placeholder="ID, nama, email, atau judul undangan" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
            <div className="space-y-2"><Label htmlFor="reseller-status">Status</Label><Select value={status} onValueChange={value => changeFilter(setStatus, value)}><SelectTrigger id="reseller-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua status</SelectItem>{resellerStatuses.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="reseller-type">Jenis undangan</Label><Select value={type} onValueChange={value => changeFilter(setType, value)}><SelectTrigger id="reseller-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua jenis</SelectItem><SelectItem value="wedding">Wedding</SelectItem><SelectItem value="aqiqah-khitan">Aqiqah / Khitan</SelectItem></SelectContent></Select></div>
          </div>
          <DataTable
            columns={columns}
            data={(data?.data || []).map(row => ({ ...row, rowKey: `${row.type}-${row.id}` }))}
            keyField="rowKey"
            pagination
            paginationServer
            paginationTotalRows={data?.total || 0}
            paginationPerPage={limit}
            paginationDefaultPage={1}
            paginationResetDefaultPage={resetPagination}
            onChangePage={setPage}
            onChangeRowsPerPage={newLimit => { setLimit(newLimit); setPage(1); setResetPagination(value => !value); }}
            paginationComponentOptions={{ rowsPerPageText: 'Baris per halaman:', rangeSeparatorText: 'dari' }}
            progressPending={loading}
            progressComponent={<div role="status" className="flex items-center gap-2 py-10 text-sm"><Loader2 className="h-5 w-5 animate-spin" />Memuat form...</div>}
            noDataComponent={<p className="py-10 text-sm text-muted-foreground">{error ? 'Data belum dapat ditampilkan.' : 'Belum ada form yang sesuai.'}</p>}
            highlightOnHover
          />
        </CardContent>
      </Card>
      {selectedForm && <FormDetailDialog key={`${selectedForm.type}-${selectedForm.id}`} form={selectedForm} onClose={() => setSelectedForm(null)} />}
    </div>
  );
}
