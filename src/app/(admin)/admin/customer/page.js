'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { DebounceInput } from 'react-debounce-input';
import DataTable from 'react-data-table-component';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { BRAND_SLUG_PATTERN, createBrandSlug, hasCustomBrandSlug, sanitizeBrandSlugInput, validateAdminResellerBrand } from '@/lib/adminResellerBrand';
import { brandSubdomainUrl } from '@/lib/resellerBrand';

const tableStyles = {
  table: { style: { minWidth: '970px' } },
  headRow: { style: { minHeight: '48px', backgroundColor: '#f8fafc', borderBottomColor: '#e2e8f0' } },
  headCells: { style: { paddingLeft: '16px', paddingRight: '16px', fontSize: '12px', fontWeight: 600, color: '#64748b' } },
  rows: { style: { minHeight: '84px', fontSize: '14px', color: '#0f172a', '&:not(:last-of-type)': { borderBottomColor: '#f1f5f9' } }, highlightOnHoverStyle: { backgroundColor: '#f8fafc', outline: 'none' } },
  cells: { style: { paddingLeft: '16px', paddingRight: '16px' } },
  pagination: { style: { borderTopColor: '#e2e8f0', color: '#64748b', fontSize: '12px' } },
};

const Customer = () => {
  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [resetPagination, setResetPagination] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [saving, setSaving] = useState(false);
  const [roleError, setRoleError] = useState('');
  const [brandValues, setBrandValues] = useState({ brandName: '', brandSlug: '' });
  const [slugEdited, setSlugEdited] = useState(false);
  const latestRequest = useRef(0);
  const isPromotion = selectedRow && selectedRow.role !== 'reseller';
  const brandError = isPromotion ? validateAdminResellerBrand(brandValues) : '';
  const subdomainUrl = brandSubdomainUrl(brandValues.brandSlug);

  const fetchData = useCallback(async (page, limit, searchQuery, role, signal) => {
    const requestId = ++latestRequest.current;
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/customer`, {
        params: { page, limit, search: searchQuery, role },
        withCredentials: true,
        signal,
      });
      if (signal?.aborted || requestId !== latestRequest.current) return;
      const lastPage = Math.max(1, Math.ceil(response.data.total / limit));
      if (page > lastPage) {
        setCurrentPage(lastPage);
        setResetPagination(value => !value);
      }
      setData(response.data.data);
      setTotalRows(response.data.total);
    } catch (error) {
      if (!signal?.aborted && requestId === latestRequest.current && !axios.isCancel(error)) {
        setError('Gagal memuat customer. Silakan coba lagi.');
      }
    } finally {
      if (!signal?.aborted && requestId === latestRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(currentPage, perPage, search, roleFilter, controller.signal);
    return () => controller.abort();
  }, [currentPage, perPage, search, roleFilter, fetchData]);

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
    setResetPagination(value => !value);
  };

  const handleRoleFilter = (role) => {
    setRoleFilter(role);
    setCurrentPage(1);
    setResetPagination(value => !value);
  };

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setCurrentPage(1);
    setResetPagination(value => !value);
  };

  const handleRoleAction = (row) => {
    setSelectedRow(row);
    setBrandValues({ brandName: row.brandName || '', brandSlug: row.brandSlug || createBrandSlug(row.brandName || '') });
    setSlugEdited(hasCustomBrandSlug(row));
    setRoleError('');
    setOpen(true);
  };

  const handleBrandNameChange = event => {
    const brandName = event.target.value;
    setBrandValues(current => ({ ...current, brandName, brandSlug: slugEdited ? current.brandSlug : createBrandSlug(brandName) }));
    setRoleError('');
  };

  const handleBrandSlugChange = event => {
    const brandSlug = sanitizeBrandSlugInput(event.target.value);
    if (brandSlug === brandValues.brandSlug) return;
    setSlugEdited(Boolean(brandSlug));
    setBrandValues(current => ({ ...current, brandSlug: brandSlug || createBrandSlug(current.brandName) }));
    setRoleError('');
  };

  const handleRoleChange = async (event) => {
    event.preventDefault();
    if (!selectedRow || saving) return;
    if (brandError) {
      setRoleError(brandError);
      return;
    }
    setSaving(true);
    setRoleError('');

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/${selectedRow.id}/role`,
        isPromotion
          ? { role: 'reseller', brandName: brandValues.brandName.trim(), brandSlug: brandValues.brandSlug.trim().toLowerCase() }
          : { role: 'user' },
        { withCredentials: true }
      );
      toast({ title: response.data.message });
      setOpen(false);
      setSelectedRow(null);
      await fetchData(currentPage, perPage, search, roleFilter);
    } catch (error) {
      setRoleError(error.response?.data?.message || 'Gagal mengubah role customer. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      name: 'No.',
      selector: (row, index) => (currentPage - 1) * perPage + index + 1,
      width: '60px',
    },
    {
      name: 'Customer',
      selector: row => row.name,
      cell: row => (
        <div className="min-w-0 py-4">
          <Link href={`/admin/customer/${row.id}`} className="block break-words font-medium text-slate-900 hover:text-blue-700 hover:underline">
            {row.name}
          </Link>
          <span className="mt-1 block break-all text-xs leading-5 text-slate-500">{row.email}</span>
        </div>
      ),
      wrap: true,
      minWidth: '240px',
      grow: 2,
    },
    {
      name: 'Role',
      selector: row => row.role,
      cell: row => (
        <Badge variant="outline" className={row.isAdmin === 1 || row.role === 'admin' ? 'border-violet-100 bg-violet-50 text-violet-700' : row.role === 'reseller' ? 'border-blue-100 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-600'}>
          {row.isAdmin === 1 || row.role === 'admin' ? 'Admin' : row.role === 'reseller' ? 'Reseller' : 'User'}
        </Badge>
      ),
      width: '110px',
    },
    {
      name: 'Brand',
      selector: row => row.brandName || row.brandSlug || '-',
      cell: row => (
        <div className="min-w-0 py-4">
          {row.brandName || row.brandSlug ? (
            <>
              <p className="break-words font-medium">{row.brandName || row.brandSlug}</p>
              {row.brandSlug && <p className="mt-1 break-all text-xs text-slate-500">/{row.brandSlug}</p>}
            </>
          ) : <span className="text-xs text-slate-400">Belum ada brand</span>}
        </div>
      ),
      wrap: true,
      minWidth: '170px',
    },
    {
      name: 'Undangan',
      selector: row => row.formCount,
      width: '140px',
      cell: row => (
        <Link href={`/admin/customer/${row.id}`} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 font-medium text-blue-700 hover:bg-blue-50 hover:underline" aria-label={`Lihat ${row.formCount} undangan ${row.name}`}>
          {row.formCount} <span className="text-xs font-normal">undangan</span>
        </Link>
      ),
    },
    {
      name: 'Aksi',
      minWidth: '250px',
      cell: row => (
        <div className="flex items-center gap-2 py-3">
          <Button asChild variant="outline" size="sm" className="border-slate-200 text-xs">
            <Link href={`/admin/customer/${row.id}`} aria-label={`Detail ${row.name}`}>Detail</Link>
          </Button>
          {row.isAdmin !== 1 && row.role !== 'admin' && (
            <Button variant="ghost" size="sm" className={row.role === 'reseller' ? 'text-xs text-amber-700 hover:bg-amber-50 hover:text-amber-800' : 'text-xs text-blue-700 hover:bg-blue-50 hover:text-blue-800'} disabled={saving} onClick={() => handleRoleAction(row)}>
              {row.role === 'reseller' ? 'Kembalikan ke User' : 'Jadikan Reseller'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <AlertDialog open={open} onOpenChange={value => { if (!saving) setOpen(value); }}>
        <AlertDialogContent>
          <form onSubmit={handleRoleChange} className="space-y-4">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {selectedRow?.role === 'reseller' ? 'Kembalikan menjadi User?' : 'Jadikan Reseller?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {selectedRow?.name} ({selectedRow?.email})
                {selectedRow?.role === 'reseller'
                  ? ' akan dikembalikan menjadi user.'
                  : ' akan dijadikan reseller.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {isPromotion && (
              <fieldset disabled={saving} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reseller-brand-name">Nama Brand</Label>
                  <Input id="reseller-brand-name" name="brandName" value={brandValues.brandName} onChange={handleBrandNameChange} maxLength={100} required placeholder="Toko Bunga" autoFocus />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reseller-brand-slug">Subdomain Brand</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex min-w-0 flex-1">
                      <Input id="reseller-brand-slug" name="brandSlug" value={brandValues.brandSlug} onChange={handleBrandSlugChange} minLength={3} maxLength={63} pattern={BRAND_SLUG_PATTERN} autoCapitalize="none" autoCorrect="off" spellCheck={false} required placeholder="toko-bunga" className="min-w-0 rounded-r-none" aria-describedby="reseller-brand-domain reseller-brand-slug-hint" />
                      <span id="reseller-brand-domain" className="inline-flex shrink-0 items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">.sewaundangan.com</span>
                    </div>
                    {subdomainUrl && <Button asChild variant="outline" size="icon" className="shrink-0"><a href={subdomainUrl} target="_blank" rel="noopener noreferrer" aria-label="Buka subdomain brand" title={subdomainUrl}><ExternalLink className="h-4 w-4" aria-hidden="true" /></a></Button>}
                  </div>
                  <p id="reseller-brand-slug-hint" className="text-xs text-muted-foreground">Digunakan sebagai alamat link brand.</p>
                </div>
              </fieldset>
            )}
            {roleError && <p role="alert" className="text-sm text-red-600">{roleError}</p>}
            <AlertDialogFooter>
              <AlertDialogCancel type="button" disabled={saving}>Batal</AlertDialogCancel>
              <Button type="submit" disabled={saving || Boolean(brandError)}>
                {saving ? 'Menyimpan...' : isPromotion ? 'Jadikan Reseller' : 'Ubah Role'}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      <main className="min-h-[calc(100vh-4rem)] min-w-0 bg-slate-50/70 p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Customer</h1>
            <p className="mt-1 text-sm text-slate-500">Kelola akun customer, reseller, dan brand dalam satu tempat.</p>
          </div>
          <Badge variant="outline" className="bg-white px-3 py-1.5 font-medium text-slate-600" aria-live="polite">
            {loading ? 'Memuat data...' : error ? 'Data tidak tersedia' : `${totalRows.toLocaleString('id-ID')} ${roleFilter === 'reseller' ? 'reseller' : roleFilter === 'user' ? 'user' : 'customer'}`}
          </Badge>
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-end sm:p-5">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="customer-search" className="text-xs font-medium text-slate-600">Cari customer</Label>
              <div className="relative">
                <svg aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg>
                <DebounceInput
                  id="customer-search"
                  type="search"
                  debounceTimeout={300}
                  placeholder="Cari nama, email, ID, atau brand..."
                  value={search}
                  onChange={handleSearch}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                />
              </div>
            </div>
            <div className="space-y-2 sm:w-48">
              <Label htmlFor="customer-role-filter" className="text-xs font-medium text-slate-600">Role customer</Label>
              <Select value={roleFilter} onValueChange={handleRoleFilter}>
                <SelectTrigger id="customer-role-filter" className="border-slate-200">
                  <SelectValue placeholder="Semua role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua role</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="reseller">Reseller</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(search || roleFilter !== 'all') && <Button type="button" variant="ghost" onClick={resetFilters} className="text-slate-500">Reset filter</Button>}
          </div>
          {error && (
            <div role="alert" className="m-4 flex flex-wrap items-center gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => fetchData(currentPage, perPage, search, roleFilter)}>Coba Lagi</Button>
            </div>
          )}
          <DataTable
            columns={columns}
            data={error ? [] : data}
            progressPending={loading}
            progressComponent={<p role="status" className="py-16 text-sm text-slate-500">Memuat customer...</p>}
            noDataComponent={<div className="px-4 py-16 text-center"><p className="font-medium text-slate-700">{error ? 'Data customer belum dapat ditampilkan.' : 'Customer tidak ditemukan.'}</p>{!error && <p className="mt-1 text-sm text-slate-500">Coba kata kunci lain atau ubah filter role.</p>}</div>}
            pagination
            paginationServer
            paginationPerPage={perPage}
            paginationDefaultPage={currentPage}
            paginationResetDefaultPage={resetPagination}
            paginationTotalRows={totalRows}
            onChangePage={setCurrentPage}
            onChangeRowsPerPage={(newPerPage, page) => {
              setPerPage(newPerPage);
              setCurrentPage(page);
            }}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            paginationComponentOptions={{ rowsPerPageText: 'Baris per halaman:', rangeSeparatorText: 'dari' }}
            customStyles={tableStyles}
            highlightOnHover
            responsive
          />
        </div>
      </main>
    </>
  );
};

export default Customer;
