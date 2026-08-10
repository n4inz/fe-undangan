import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import "@/components/DataTable.css";
import Link from 'next/link';
import { Button } from './ui/button';
import { DebounceInput } from 'react-debounce-input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BiArrowToRight, BiCopy, BiDotsVertical, BiLink, BiMoneyWithdraw, BiPlusCircle, BiRightArrow, BiTime, BiTrash, BiX } from 'react-icons/bi';
import StatusSelect from './StatusSelect';
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { DialogModalPayment } from './admin/DialogModalPayment';
import { DialogModalLinkUndangan } from './admin/DialogModalLinkUndangan';
import { toast } from './ui/use-toast';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import DialogModalProofPayment from './admin/DialogModalProofPayment';
import { DialogModalWaktuDemo } from './admin/DialogModalWaktuDemo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
// import DialogModalProofPayment from './admin/DialogModalProofPayment';

const isBulkDeleteProtected = (row) => Number(row?.statusForm) === 3;

const DataTableForm = ({ initialStatus, onDataUpdate }) => {

  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [filterStatusForm, setFilterStatusForm] = useState(null);

  const [updatedStatus, setUpdatedStatus] = useState(null);
  // const [showTooltip, setShowTooltip] = useState(false);


  const [selectedRow, setSelectedRow] = useState({ id: null, paymentAmount: null });
  const [open, setOpen] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [openDemo, setOpenDemo] = useState(false);

  const [isAdmin, setIsAdmin] = useState(0);
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [clearSelectedRows, setClearSelectedRows] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const clearBulkDeleteSelection = useCallback(() => {
    setSelectedRows([]);
    setClearSelectedRows((currentValue) => !currentValue);
  }, []);

  const fetchData = useCallback(async (page, limit, searchQuery, statusForm) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/forms`, {
        params: { page, limit, search: searchQuery, status: status, statusForm: statusForm },
        withCredentials: true, // Menambahkan kredensial
      });
      setData(response.data.data);
      setIsAdmin(response.data.isAdmin);
      setTotalRows(response.data.total);
      console.log(response.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [status]);

  useEffect(() => {
    fetchData(currentPage, perPage, search, filterStatusForm);
  }, [currentPage, perPage, search, filterStatusForm, fetchData]);

  useEffect(() => {
    if (isBulkDeleteMode) clearBulkDeleteSelection();
  }, [
    clearBulkDeleteSelection,
    currentPage,
    filterStatusForm,
    isBulkDeleteMode,
    perPage,
    search,
  ]);

  const handleSearch = (event) => {
    setSearch(event.target.value);
  };

  const handlePageChange = page => {
    setCurrentPage(page);
  };

  // const handlePerRowsChange = async (newPerPage, page) => {
  //   setPerPage(newPerPage);
  //   fetchData(page, newPerPage);
  // };

  const handlePerRowsChange = async (newPerPage, page) => {
    setPerPage(newPerPage);
    fetchData(page, newPerPage, search, filterStatusForm);
  };


  const handleFilterStatusChange = (value) => {
    // If "All Status" is selected, set the filter to an empty string
    const statusValue = value === null ? '' : value;
    setFilterStatusForm(statusValue);
    console.log(statusValue);  // Logging to ensure it's properly set
  };

  const columns = [
    {
      name: 'ID',
      selector: row => row.id,
      sortable: true,
    },
    ...(isAdmin === 1 ? [
      {
        name: 'Nomor WA',
        selector: row => row.nomorWa,
        sortable: true,
        wrap: true, // Enables text wrapping to prevent overflow
      }
    ] : []),
    {
      name: 'Nama',
      selector: row => row.name,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Pengantin',
      selector: row => row.namaPanggilanPria + " & " + row.namaPanggilanWanita,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Tanggal',
      selector: row => (

        <p>{new Date(row.createdAt).toLocaleString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,    // ⬅️ pakai AM/PM
          timeZone: 'UTC', // ⬅️ penting
        })
        }</p>
      ),
      sortable: true,
      wrap: true,
    },
    {
      name: 'Link Undangan',
      selector: row => row.linkUndangan ? (
        <>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigator.clipboard.writeText(row.linkUndangan);
              toast({ title: "Link copied!" });
            }}
          >
            {row.linkUndangan}
          </a>
        </>
      ) : '-',
      wrap: true,
    },

    ...(isAdmin === 1 ? [
      {
        name: 'Copy Link Edit',
        cell: row => (
          <span
            className="flex items-center gap-1 cursor-pointer hover:underline"
            onClick={() => {
              const origin = window.location.origin;
              const formIdCopy = (row.uuid && row.uuid !== 'null' && row.uuid !== '') ? row.uuid : row.id;

              const textToCopy = `Edit Foto:\n${origin}/forms/${formIdCopy}/${row.nomorWa}/atur-foto/\n\nEdit Data:\n${origin}/forms/${formIdCopy}/${row.nomorWa}/atur-foto/success/result/edit`;

              navigator.clipboard.writeText(textToCopy);

              toast({ title: "Copied to clipboard!" });
            }}
          >
            <BiCopy size={16} />
            <span>Copy Link Edit</span>
          </span>
        ),
        wrap: true,
      },
      {
        name: 'Status',
        cell: row => (
          <StatusSelect
            status={row}
            onDataUpdate={handleStatusUpdate}
          />
        ),
        wrap: true, // Allows text to wrap and avoid overflow
      }
    ] : [
      {
        name: 'Status',
        cell: row => (
          <select value={row.statusForm} disabled>
            {/* Add options for different status values */}
            <option value="0">Todo</option>
            <option value="1">In Progress</option>
            <option value="2">Review</option>
            <option value="3">Done</option>
            <option value="4">Cancel</option>
            {/* ... more options */}
          </select>
        ),
        wrap: true, // Allows text to wrap and avoid overflow
      }
    ]),
    {
      name: 'Action',
      cell: row => (
        <>
          <Link href={`/admin/detail/${row.id}`}>
            <Button className="w-10 h-6 text-xs bg-opacity-80 bg-black">View</Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className='ml-4' asChild>
              <span className="cursor-pointer"><BiDotsVertical className="h-4 w-4" /></span>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" forceMount={false}>
              <DropdownMenuItem onClick={() => handleAction(row)}>
                <BiArrowToRight className="mr-2 h-4 w-4" />
                <span>Move to {initialStatus === 1 ? "List" : "MyList"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLinkUndangan(row)}>
                <BiLink className="mr-2 h-4 w-4" />
                <span>Tambahkan Link</span>
              </DropdownMenuItem>

              {isAdmin === 1 && (
                <>
                  {row.isPaid === 0 ? (
                    <DropdownMenuItem onClick={() => handlePayment(row)}>
                      {/* <DropdownMenuItem> */}
                      <BiMoneyWithdraw className="mr-2 h-4 w-4" />
                      <span>Lunas</span>
                      {/* <DialogModalPayment row={selectedRow} onDataUpdate={handleDataUpdate} /> */}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => { setOpen(false); handlePayment(row); }}>
                      <BiMoneyWithdraw className="mr-2 h-4 w-4" />
                      <span>Batalkan Status Lunas</span>
                    </DropdownMenuItem>
                  )}
                  {row.isPaid === 0 && (
                    <DropdownMenuItem onClick={() => handleTambahDemo(row)}>
                      <BiTime className="mr-2 h-4 w-4" />
                      <span>Tambah Waktu Demo</span>
                    </DropdownMenuItem>
                  )}
                </>

              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className='flex-row items-center gap-x-2'>
            {row.isPaid === 1 && (
              <Popover>
                <PopoverTrigger>
                  <BiMoneyWithdraw className="mr-2 h-4 w-4 text-green-600" />
                </PopoverTrigger>
                {isAdmin === 1 && (
                  <PopoverContent className="w-20 p-2 text-xs text-center">
                    {row.paymentAmount}
                  </PopoverContent>
                )}
              </Popover>

            )}
            {row.idPayment != null && (
              <DialogModalProofPayment formId={row.id} phoneNumber={row.nomorWa} />
            )}
          </div>
        </>
      ),
      wrap: true, // Ensures content wraps and fits within the container
    },
  ];


  const handleAction = async (row) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/forms/${row.id}`,
        {
          type: initialStatus === 1 ? "toList" : "toMyList"
        },
        {
          withCredentials: true
        }
      );

      console.log('Response', response);

      if (response.status === 200) {
        // Only fetch data if the request was successful
        fetchData(currentPage, perPage, search, filterStatusForm);
        if (onDataUpdate && typeof onDataUpdate === 'function') {
          onDataUpdate(response.data.message);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleStatusUpdate = (updatedStatus) => {
    setUpdatedStatus(updatedStatus);
    fetchData(currentPage, perPage, search, filterStatusForm); // Refetch the data with the updated status
  };

  // const handlePayment = async (row) => {
  //   try {
  //     const response = await axios.post(
  //       `${process.env.NEXT_PUBLIC_API_URL}/update-payment/${row.id}`,
  //       {
  //         isPaid: row.isPaid
  //       },
  //       {
  //         withCredentials: true
  //       }
  //     );

  //     if (response.status === 200) {
  //       // Only fetch data if the request was successful
  //       fetchData(currentPage, perPage, search);
  //       if (onDataUpdate && typeof onDataUpdate === 'function') {
  //         onDataUpdate(response.data.message);
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error:', error);
  //   }
  // };

  const handlePayment = async (row) => {
    setSelectedRow({
      id: row.id,
      isPaid: row.isPaid,
      paymentAmount: row.paymentAmount,
    });

    // Jika belum bayar → buka modal
    if (row.isPaid === 0) {
      setOpen(true);
      console.log(row);
    } else {

      // Ambil datetime device
      const paidAt = new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/update-payment/${row.id}`,
        {
          isPaid: row.isPaid,
          paymentAmount: 0,
          paidAt: paidAt, // ← FORMAT READY
        },
        {
          withCredentials: true
        }
      );

      handleDataUpdate(response.data.message);
    }
  };


  const handleLinkUndangan = async (row) => {
    setSelectedRow({
      id: row.id,
      linkUndangan: row.linkUndangan,
    });
    setOpenLink(true)
  }

  const handleTambahDemo = async (row) => {
    setSelectedRow({
      id: row.id,
    });
    setOpenDemo(true)
  }

  const handleDataUpdate = (msg) => {
    if (isBulkDeleteMode) clearBulkDeleteSelection();
    fetchData(currentPage, perPage, search, filterStatusForm); // Re-fetch the data after it has been updated
    onDataUpdate(msg);
  };

  const handleBulkDeleteMode = () => {
    if (isDeleting) return;

    if (isBulkDeleteMode) {
      clearBulkDeleteSelection();
      setDeleteDialogOpen(false);
    }

    setIsBulkDeleteMode((currentValue) => !currentValue);
  };

  const handleBulkDelete = async () => {
    const ids = selectedRows
      .filter((row) => !isBulkDeleteProtected(row))
      .map((row) => row.id);

    if (ids.length === 0 || isDeleting) return;

    setIsDeleting(true);

    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/forms/bulk-delete`,
        {
          data: { ids },
          withCredentials: true,
        }
      );

      const result = response.data;
      const notices = [`${result.deletedCount} data berhasil dihapus.`];

      if (result.protectedIds?.length > 0) {
        notices.push(
          `${result.protectedIds.length} data berstatus Done tidak dapat dihapus.`
        );
      }

      if (result.notFoundIds?.length > 0) {
        notices.push(`${result.notFoundIds.length} ID tidak ditemukan.`);
      }

      if (result.fileCleanup?.failed?.length > 0) {
        notices.push(
          `${result.fileCleanup.failed.length} file gagal dihapus; periksa log server.`
        );
      }

      if (result.fileCleanup?.skipped?.length > 0) {
        notices.push(
          `${result.fileCleanup.skipped.length} file dilewati demi keamanan.`
        );
      }

      toast({
        title: 'Bulk delete berhasil',
        description: notices.join(' '),
      });

      clearBulkDeleteSelection();
      setIsBulkDeleteMode(false);
      setDeleteDialogOpen(false);
      await fetchData(currentPage, perPage, search, filterStatusForm);
    } catch (error) {
      const errorData = error.response?.data;
      const statusCode = error.response?.status;
      const defaultMessage = statusCode === 401
        ? 'Sesi Anda sudah berakhir. Silakan login kembali.'
        : statusCode === 403
          ? 'Anda tidak memiliki izin untuk menghapus data ini.'
          : 'Bulk delete gagal dilakukan.';
      const notices = [errorData?.message || defaultMessage];

      if (errorData?.protectedIds?.length > 0) {
        notices.push(
          `${errorData.protectedIds.length} data berstatus Done tidak dapat dihapus.`
        );
      }

      if (errorData?.notFoundIds?.length > 0) {
        notices.push(`${errorData.notFoundIds.length} ID tidak ditemukan.`);
      }

      toast({
        title: 'Bulk delete gagal',
        description: notices.join(' '),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };



  return (
    <>
      <DialogModalPayment open={open} onOpenChange={setOpen} row={selectedRow} onDataUpdate={handleDataUpdate} />
      <DialogModalLinkUndangan open={openLink} onOpenChange={setOpenLink} row={selectedRow} onDataUpdate={handleDataUpdate} />
      <DialogModalWaktuDemo open={openDemo} onOpenChange={setOpenDemo} row={selectedRow} onDataUpdate={handleDataUpdate} />
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(nextOpen) => !isDeleting && setDeleteDialogOpen(nextOpen)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus {selectedRows.length} data yang dipilih?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {selectedRows.length} data yang dipilih?{' '}
              Data dan foto yang terkait akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting || selectedRows.length === 0}
              onClick={(event) => {
                event.preventDefault();
                handleBulkDelete();
              }}
            >
              {isDeleting ? 'Menghapus...' : `Hapus ${selectedRows.length} Data`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="flex flex-wrap items-center gap-4"> {/* Add a flex container to arrange elements side by side */}
        <DebounceInput
          minLength={2}
          debounceTimeout={500}
          placeholder="Search"
          value={search}
          onChange={handleSearch}
          className="border border-gray-300 rounded-md p-2 w-1/2"
        />
        <Select
          value={filterStatusForm}  // Bind the state to the Select component
          onValueChange={handleFilterStatusChange}  // Use onValueChange instead of onChange
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Status</SelectLabel>
              <SelectItem value={null}>All Status</SelectItem>
              <SelectItem value="0">Todo</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="1">In progress</SelectItem>
              <SelectItem value="2">Review</SelectItem>
              <SelectItem value="3">Done</SelectItem>
              <SelectItem value="4">Cancel</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        {isAdmin === 1 && (
          <div className="ml-auto shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  aria-label="Buka menu aksi tabel"
                  title="Aksi tabel"
                  disabled={isDeleting}
                >
                  <BiDotsVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-60 max-w-[calc(100vw-2rem)]"
              >
                {!isBulkDeleteMode ? (
                  <DropdownMenuItem onSelect={handleBulkDeleteMode}>
                    <BiTrash className="mr-2 h-4 w-4" />
                    <span>Bulk Delete</span>
                  </DropdownMenuItem>
                ) : (
                  <>
                    {selectedRows.length > 0 && (
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => setDeleteDialogOpen(true)}
                      >
                        <BiTrash className="mr-2 h-4 w-4" />
                        <span>Hapus {selectedRows.length} data terpilih</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onSelect={handleBulkDeleteMode}>
                      <BiX className="mr-2 h-4 w-4" />
                      <span>Batalkan Bulk Select</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      {isBulkDeleteMode && (
        <p className="mt-2 text-sm text-muted-foreground">
          Pilih data yang akan dihapus. Data berstatus Done tidak dapat dipilih.
        </p>
      )}
      <div className="w-full min-w-0 max-w-full overflow-x-auto">
        <DataTable
          columns={columns}
          data={data}
          selectableRows={isBulkDeleteMode}
          selectableRowDisabled={isBulkDeleteProtected}
          selectableRowsHighlight
          clearSelectedRows={clearSelectedRows}
          onSelectedRowsChange={({ selectedRows: nextSelectedRows }) => {
            setSelectedRows(nextSelectedRows.filter((row) => !isBulkDeleteProtected(row)));
          }}
          pagination
          paginationServer
          paginationTotalRows={totalRows}
          onChangePage={handlePageChange}
          onChangeRowsPerPage={handlePerRowsChange}
          className="rdt_TableCol" // {{ edit_1 }} Add a custom class
        />
      </div>
    </>
  );
};

export default DataTableForm;
