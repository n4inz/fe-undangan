'use client';
import { useState, useEffect, useCallback } from 'react';
import { DebounceInput } from 'react-debounce-input';
import DataTable from 'react-data-table-component';
import Link from 'next/link';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';

const Customer = () => {
  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [resetPagination, setResetPagination] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [saving, setSaving] = useState(false);
  const [roleError, setRoleError] = useState('');

  const fetchData = useCallback(async (page, limit, searchQuery, signal) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/customer`, {
        params: { page, limit, search: searchQuery },
        withCredentials: true,
        signal,
      });
      setData(response.data.data);
      setTotalRows(response.data.total);
    } catch (error) {
      if (!axios.isCancel(error)) {
        setError('Gagal memuat customer. Silakan coba lagi.');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(currentPage, perPage, search, controller.signal);
    return () => controller.abort();
  }, [currentPage, perPage, search, fetchData]);

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
    setResetPagination(value => !value);
  };

  const handleRoleAction = (row) => {
    setSelectedRow(row);
    setRoleError('');
    setOpen(true);
  };

  const handleRoleChange = async (event) => {
    event.preventDefault();
    if (!selectedRow || saving) return;
    setSaving(true);
    setRoleError('');

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/${selectedRow.id}/role`,
        { role: selectedRow.role === 'reseller' ? 'user' : 'reseller' },
        { withCredentials: true }
      );
      toast({ title: response.data.message });
      setOpen(false);
      setSelectedRow(null);
      await fetchData(currentPage, perPage, search);
    } catch (error) {
      setRoleError(error.response?.data?.message || 'Gagal mengubah role customer. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      name: '#',
      selector: (row, index) => (currentPage - 1) * perPage + index + 1,
      width: '70px',
    },
    {
      name: 'Nama',
      selector: row => row.name,
      sortable: true,
    },
    {
      name: 'Email',
      selector: row => row.email,
      sortable: true,
      wrap: true,
      minWidth: '200px',
    },
    {
      name: 'Role',
      selector: row => row.role,
      cell: row => (
        <Badge variant={row.role === 'reseller' ? 'default' : 'secondary'}>
          {row.isAdmin === 1 || row.role === 'admin' ? 'Admin' : row.role === 'reseller' ? 'Reseller' : 'User'}
        </Badge>
      ),
      width: '120px',
    },
    {
      name: 'Brand',
      selector: row => row.brandName || row.brandSlug || '-',
      wrap: true,
    },
    {
      name: 'Jumlah Undangan',
      selector: row => row.formCount,
      sortable: true,
      cell: row => (
        <Link href={`/admin/customer/${row.id}`} className="text-blue-600 hover:underline">
          {row.formCount} Undangan
        </Link>
      ),
    },
    {
      name: 'Aksi',
      minWidth: '210px',
      cell: row => row.isAdmin !== 1 && row.role !== 'admin' ? (
        <Button variant="outline" size="sm" disabled={saving} onClick={() => handleRoleAction(row)}>
          {row.role === 'reseller' ? 'Kembalikan ke User' : 'Jadikan Reseller'}
        </Button>
      ) : null,
    },
  ];

  return (
    <>
      <div className="h-10 fixed bg-white border-b w-full"></div>
      <div className="flex min-h-screen pt-10">
        <div className="fixed md:relative z-40 w-64 h-full bg-gray-800 md:block hidden"></div>
        <div className="flex flex-col flex-grow w-full md:pl-24">
          <AlertDialog open={open} onOpenChange={value => { if (!saving) setOpen(value); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {selectedRow?.role === 'reseller' ? 'Kembalikan menjadi User?' : 'Jadikan Reseller?'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {selectedRow?.name} ({selectedRow?.email})
                  {selectedRow?.role === 'reseller'
                    ? ' akan kehilangan akses Panel Reseller. Data brand dan relasi undangan tetap tersimpan.'
                    : ' akan mendapatkan akses Panel Reseller untuk melihat form miliknya dan mengatur brand. Aktivasi undangan tetap dilakukan oleh Admin.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {roleError && <p role="alert" className="text-sm text-red-600">{roleError}</p>}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={saving}>Batal</AlertDialogCancel>
                <AlertDialogAction disabled={saving} onClick={handleRoleChange}>
                  {saving ? 'Menyimpan...' : 'Ubah Role'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="p-4">
            <h1 className="py-4">Customer</h1>
            <DebounceInput
              minLength={2}
              debounceTimeout={300}
              placeholder="Cari nama atau email customer"
              aria-label="Cari customer"
              value={search}
              onChange={handleSearch}
              className="border border-gray-300 rounded-md p-2 w-full md:w-1/2"
            />
            {error && (
              <div role="alert" className="my-4 flex items-center gap-3 text-sm text-red-600">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={() => fetchData(currentPage, perPage, search)}>Coba Lagi</Button>
              </div>
            )}
            <DataTable
              columns={columns}
              data={data}
              progressPending={loading}
              progressComponent={<p className="py-6 text-sm text-gray-500">Memuat customer...</p>}
              noDataComponent={<p className="py-6 text-sm text-gray-500">Customer tidak ditemukan.</p>}
              pagination
              paginationServer
              paginationPerPage={perPage}
              paginationDefaultPage={1}
              paginationResetDefaultPage={resetPagination}
              paginationTotalRows={totalRows}
              onChangePage={setCurrentPage}
              onChangeRowsPerPage={(newPerPage, page) => {
                setPerPage(newPerPage);
                setCurrentPage(page);
              }}
              className="rdt_TableCol"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Customer;
