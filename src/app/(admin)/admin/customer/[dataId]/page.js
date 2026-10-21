'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { DebounceInput } from 'react-debounce-input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import StatusSelect from '@/components/StatusSelect';
import CustomerAccountForm from '@/components/admin/CustomerAccountForm';
import { DialogModalPayment } from '@/components/admin/DialogModalPayment';
import { DialogCancelPayment } from '@/components/admin/DialogCancelPayment';
import { toast } from '@/components/ui/use-toast';

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const CustomerTablePage = ({ params }) => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resetPagination, setResetPagination] = useState(false);
  const [paymentRow, setPaymentRow] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [cancelPaymentOpen, setCancelPaymentOpen] = useState(false);
  const latestRequest = useRef(0);
  const activeCustomer = useRef(params.dataId);

  const fetchData = useCallback(async ({ signal, updateCustomer = true } = {}) => {
    if (activeCustomer.current !== params.dataId) return;
    const requestId = ++latestRequest.current;
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/customer/${params.dataId}`, {
        withCredentials: true,
        signal,
      });
      if (signal?.aborted || requestId !== latestRequest.current || activeCustomer.current !== params.dataId) return;
      setData(response.data.form || []);
      if (updateCustomer) setCustomer(response.data.user);
      setIsAdmin(response.data.isAdmin || 0);
    } catch (error) {
      if (!signal?.aborted && requestId === latestRequest.current && activeCustomer.current === params.dataId && !axios.isCancel(error)) {
        setError(error.response?.data?.message || 'Gagal memuat detail customer. Silakan coba lagi.');
      }
    } finally {
      if (!signal?.aborted && requestId === latestRequest.current && activeCustomer.current === params.dataId) setLoading(false);
    }
  }, [params.dataId]);

  useEffect(() => {
    const controller = new AbortController();
    activeCustomer.current = params.dataId;
    setCustomer(null);
    setData([]);
    setSearch('');
    setPaymentRow(null);
    setPaymentDialogOpen(false);
    setCancelPaymentOpen(false);
    fetchData({ signal: controller.signal });
    return () => {
      activeCustomer.current = null;
      controller.abort();
    };
  }, [fetchData, params.dataId]);

  const handlePayment = row => {
    if (isAdmin !== 1 || loading) return;
    setPaymentRow(row);
    if (row.isPaid === 1) setCancelPaymentOpen(true);
    else setPaymentDialogOpen(true);
  };

  const handlePaymentUpdate = async () => {
    if (activeCustomer.current !== params.dataId) return;
    toast({ title: paymentRow?.isPaid === 1 ? 'Status lunas berhasil dibatalkan.' : 'Undangan berhasil ditandai lunas.' });
    await fetchData({ updateCustomer: false });
  };

  const filteredData = data.filter(item =>
    `${item.id} ${item.namaPanggilanPria || ''} ${item.namaPanggilanWanita || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      name: 'ID',
      selector: row => row.id,
      sortable: true,
      width: '90px',
    },
    {
      name: 'Nama Mempelai',
      selector: row => `${row.namaPanggilanPria || '-'} & ${row.namaPanggilanWanita || '-'}`,
      sortable: true,
      wrap: true,
      minWidth: '200px',
    },
    {
      name: 'Komentar',
      selector: row => row.commentCount,
      center: true,
    },
    {
      name: 'Status',
      cell: row => <StatusSelect status={row} onDataUpdate={() => fetchData({ updateCustomer: false })} />,
      wrap: true,
      minWidth: '180px',
    },
    {
      name: 'Pembayaran',
      selector: row => row.isPaid,
      minWidth: '150px',
      cell: row => (
        <div className="space-y-1 py-2">
          <Badge variant="outline" className={row.isPaid === 1 ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-200 bg-slate-50 text-slate-500'}>
            {row.isPaid === 1 ? 'Lunas' : 'Belum Lunas'}
          </Badge>
          {row.isPaid === 1 && isAdmin === 1 && <p className="text-xs text-slate-500">{rupiah.format(row.paymentAmount || 0)}</p>}
        </div>
      ),
    },
    {
      name: 'Aksi',
      cell: row => (
        <div className="flex flex-wrap items-center gap-2 py-2">
          <Button asChild variant="outline" size="sm"><Link href={`/admin/detail/${row.id}`}>Detail Undangan</Link></Button>
          {isAdmin === 1 && (
            <Button type="button" variant="outline" size="sm" className={row.isPaid === 1 ? 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700' : 'border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800'} disabled={loading} onClick={() => handlePayment(row)} aria-label={`${row.isPaid === 1 ? 'Batalkan lunas' : 'Tandai lunas'} undangan ${row.id}`}>
              {row.isPaid === 1 ? 'Batalkan Lunas' : 'Lunas'}
            </Button>
          )}
        </div>
      ),
      minWidth: '290px',
    },
  ];

  return (
    <>
      {paymentRow && isAdmin === 1 && (
        <>
          <DialogModalPayment open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen} row={paymentRow} onDataUpdate={handlePaymentUpdate} />
          <DialogCancelPayment open={cancelPaymentOpen} onOpenChange={setCancelPaymentOpen} row={paymentRow} onDataUpdate={handlePaymentUpdate} />
        </>
      )}
      <div className="h-10 fixed bg-white border-b w-full"></div>
      <div className="flex min-h-screen pt-10">
        <div className="fixed md:relative z-40 w-64 h-full bg-gray-800 md:block hidden"></div>
        <div className="flex flex-col flex-grow w-full md:pl-24">
          <div className="space-y-6 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
              <div>
                <h1 className="text-xl font-semibold">Detail Customer</h1>
                {customer && <p className="mt-1 text-sm text-muted-foreground">ID {customer.id} · {customer.email}</p>}
              </div>
              <Button asChild variant="outline" size="sm"><Link href="/admin/customer">Kembali ke Customer</Link></Button>
            </div>
            {error && (
              <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-red-600">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={() => fetchData({ updateCustomer: !customer })} disabled={loading}>Coba Lagi</Button>
              </div>
            )}
            {loading && !customer && <p className="py-6 text-sm text-muted-foreground">Memuat detail customer...</p>}
            {customer && (
              <>
                <CustomerAccountForm key={customer.id} customer={customer} onSaved={setCustomer} />
                <Card>
                  <CardHeader><CardTitle className="text-lg">Daftar Undangan Customer</CardTitle></CardHeader>
                  <CardContent>
                    <DebounceInput
                      minLength={1}
                      debounceTimeout={300}
                      placeholder="Cari ID atau nama mempelai"
                      aria-label="Cari undangan customer"
                      value={search}
                      onChange={event => { setSearch(event.target.value); setResetPagination(current => !current); }}
                      className="mb-4 w-full rounded-md border border-gray-300 p-2 md:w-1/2"
                    />
                    <DataTable
                      columns={columns}
                      data={filteredData}
                      progressPending={loading}
                      progressComponent={<p className="py-6 text-sm text-muted-foreground">Memuat undangan...</p>}
                      noDataComponent={<p className="py-6 text-sm text-muted-foreground">Undangan tidak ditemukan.</p>}
                      pagination
                      paginationResetDefaultPage={resetPagination}
                      className="rdt_TableCol"
                    />
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerTablePage;
