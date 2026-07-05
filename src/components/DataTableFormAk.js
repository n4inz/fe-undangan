"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import DataTable from "react-data-table-component";
import { DebounceInput } from "react-debounce-input";
import {
  Banknote,
  Copy,
  Eye,
  Link2,
  MoreVertical,
  RotateCcw,
} from "lucide-react";

import "@/components/DataTable.css";
import DialogCancelPaymentAk from "@/components/admin/DialogCancelPaymentAk";
import DialogModalLinkUndanganAk from "@/components/admin/DialogModalLinkUndanganAk";
import DialogModalPaymentAk from "@/components/admin/DialogModalPaymentAk";
import DialogModalProofPaymentAk from "@/components/admin/DialogModalProofPaymentAk";
import StatusSelectAk from "@/components/admin/StatusSelectAk";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Makassar",
  }).format(date);
};

const formatRupiah = (value) =>
  `Rp ${new Intl.NumberFormat("id-ID").format(Number(value || 0))}`;

export default function DataTableFormAk() {
  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAdmin, setIsAdmin] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [cancelPaymentModalOpen, setCancelPaymentModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  const fetchData = useCallback(async (page, limit, searchQuery, selectedStatus) => {
    setLoading(true);

    try {
      const response = await axios.get(
        `${apiUrl}/admin/forms/aqiqah-khitan`,
        {
          params: {
            page,
            limit,
            search: searchQuery,
            statusForm:
              selectedStatus === "all" ? undefined : selectedStatus,
          },
          withCredentials: true,
        }
      );

      setData(response.data?.data || []);
      setTotalRows(response.data?.total || 0);
      setIsAdmin(response.data?.isAdmin || 0);
    } catch (error) {
      console.error("Gagal memuat list Aqiqah/Khitan:", error);
      setData([]);
      setTotalRows(0);
      toast({
        title: "Data gagal dimuat",
        description:
          error.response?.data?.error ||
          "Tidak dapat memuat form Aqiqah/Khitan.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(currentPage, perPage, search, statusFilter);
  }, [currentPage, fetchData, perPage, search, statusFilter]);

  const copyInvitationLink = useCallback(async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      toast({ title: "Link undangan disalin." });
    } catch {
      toast({
        title: "Link gagal disalin",
        variant: "destructive",
      });
    }
  }, []);

  const openPaymentModal = useCallback((row) => {
    setSelectedRow(row);
    setPaymentModalOpen(true);
  }, []);

  const openCancelPaymentModal = useCallback((row) => {
    setSelectedRow(row);
    setCancelPaymentModalOpen(true);
  }, []);

  const openLinkModal = useCallback((row) => {
    setSelectedRow(row);
    setLinkModalOpen(true);
  }, []);

  const handlePaymentUpdated = useCallback(
    (message) => {
      toast({
        title: "Berhasil",
        description: message || "Status pembayaran berhasil diperbarui.",
      });
      fetchData(currentPage, perPage, search, statusFilter);
    },
    [currentPage, fetchData, perPage, search, statusFilter]
  );

  const handleStatusUpdated = useCallback(
    (message) => {
      toast({
        title: "Berhasil",
        description: message || "Status form berhasil diperbarui.",
      });
      fetchData(currentPage, perPage, search, statusFilter);
    },
    [currentPage, fetchData, perPage, search, statusFilter]
  );

  const handleLinkUpdated = useCallback(
    (message) => {
      toast({
        title: "Berhasil",
        description: message || "Link undangan berhasil diperbarui.",
      });
      fetchData(currentPage, perPage, search, statusFilter);
    },
    [currentPage, fetchData, perPage, search, statusFilter]
  );

  const columns = useMemo(
    () => [
      {
        name: "ID",
        selector: (row) => row.id,
        width: "80px",
      },
      ...(isAdmin === 1
        ? [
            {
              name: "Nomor WA",
              selector: (row) => row.nomorWhatsapp || "-",
              wrap: true,
            },
          ]
        : []),
      {
        name: "Nama Anak",
        cell: (row) => (
          <div className="py-2">
            <p className="font-medium">{row.namaPanggilanAnak || "-"}</p>
            <p className="text-xs text-gray-500">
              {row.namaLengkapAnak || "-"}
            </p>
          </div>
        ),
        selector: (row) => row.namaPanggilanAnak,
        wrap: true,
      },
      {
        name: "Acara",
        cell: (row) => (
          <div className="py-2">
            <p>{row.namaAcara || "-"}</p>
            <p className="text-xs text-gray-500">
              {row.tanggalAcara || "-"}
            </p>
          </div>
        ),
        selector: (row) => row.namaAcara,
        wrap: true,
      },
      {
        name: "Status",
        cell: (row) => (
          <StatusSelectAk
            row={row}
            disabled={isAdmin !== 1}
            onDataUpdate={handleStatusUpdated}
          />
        ),
        width: "155px",
      },
      {
        name: "Dibuat",
        selector: (row) => row.createdAt,
        cell: (row) => formatDate(row.createdAt),
        wrap: true,
      },
      {
        name: "Aksi",
        cell: (row) => (
          <div className="flex items-center gap-2 py-2">
            <Button asChild size="sm" className="h-8 bg-black hover:bg-black/80">
              <Link href={`/admin/list/aqiqah-khitan/${row.uuid || row.id}`}>
                <Eye className="h-4 w-4" />
                Detail
              </Link>
            </Button>
            {row.linkUndangan ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="Salin link undangan"
                onClick={() => copyInvitationLink(row.linkUndangan)}
              >
                <Copy className="h-4 w-4" />
                <span className="sr-only">Salin link undangan</span>
              </Button>
            ) : null}
            {isAdmin === 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    title="Aksi form"
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Aksi form</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => openLinkModal(row)}>
                    <Link2 className="mr-2 h-4 w-4" />
                    {row.linkUndangan ? "Edit Link" : "Tambah Link"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => openPaymentModal(row)}
                  >
                    <Banknote className="mr-2 h-4 w-4" />
                    {row.isPaid === 1
                      ? "Ubah Nominal Pembayaran"
                      : "Lunas"}
                  </DropdownMenuItem>
                  {row.isPaid === 1 ? (
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onSelect={() => openCancelPaymentModal(row)}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Batalkan Status Lunas
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            <div className="flex flex-col items-center gap-1">
              {row.isPaid === 1 ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      title="Lihat jumlah pembayaran"
                      className="rounded-md p-1 text-green-600 transition-colors hover:bg-green-50 hover:text-green-700"
                    >
                      <Banknote className="h-4 w-4" />
                      <span className="sr-only">
                        Lihat jumlah pembayaran
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2 text-center text-xs">
                    {formatRupiah(row.paymentAmount)}
                  </PopoverContent>
                </Popover>
              ) : null}
              {row.idPayment ? (
                <DialogModalProofPaymentAk
                  formId={row.uuid || row.id}
                />
              ) : null}
            </div>
          </div>
        ),
        minWidth: "225px",
      },
    ],
    [
      copyInvitationLink,
      handleStatusUpdated,
      isAdmin,
      openCancelPaymentModal,
      openLinkModal,
      openPaymentModal,
    ]
  );

  const handleSearch = (event) => {
    setCurrentPage(1);
    setSearch(event.target.value);
  };

  const handlePerRowsChange = (newPerPage, page) => {
    setPerPage(newPerPage);
    setCurrentPage(page);
  };

  const handleStatusFilterChange = (value) => {
    setCurrentPage(1);
    setStatusFilter(value);
  };

  return (
    <div className="space-y-4">
      <DialogModalPaymentAk
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        row={selectedRow}
        onDataUpdate={handlePaymentUpdated}
      />
      <DialogCancelPaymentAk
        open={cancelPaymentModalOpen}
        onOpenChange={setCancelPaymentModalOpen}
        row={selectedRow}
        onDataUpdate={handlePaymentUpdated}
      />
      <DialogModalLinkUndanganAk
        open={linkModalOpen}
        onOpenChange={setLinkModalOpen}
        row={selectedRow}
        onDataUpdate={handleLinkUpdated}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <DebounceInput
          minLength={0}
          debounceTimeout={500}
          placeholder="Cari ID, nama anak, acara, atau nomor WA"
          value={search}
          onChange={handleSearch}
          className="w-full rounded-md border border-gray-300 p-2 sm:max-w-md"
        />
        <Select
          value={statusFilter}
          onValueChange={handleStatusFilterChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="0">Todo</SelectItem>
            <SelectItem value="1">In Progress</SelectItem>
            <SelectItem value="2">Review</SelectItem>
            <SelectItem value="3">Done</SelectItem>
            <SelectItem value="4">Cancel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0 overflow-x-auto rounded-lg border bg-white">
        <DataTable
          columns={columns}
          data={data}
          pagination
          paginationServer
          paginationTotalRows={totalRows}
          progressPending={loading}
          progressComponent={
            <p className="p-8 text-sm text-gray-500">Memuat data...</p>
          }
          noDataComponent={
            <p className="p-8 text-sm text-gray-500">
              Belum ada data form Aqiqah/Khitan.
            </p>
          }
          onChangePage={setCurrentPage}
          onChangeRowsPerPage={handlePerRowsChange}
          className="rdt_TableCol"
        />
      </div>
    </div>
  );
}
