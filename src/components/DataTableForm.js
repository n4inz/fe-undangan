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
import { BiArrowToRight, BiDotsVertical, BiLink, BiMoneyWithdraw, BiPlusCircle, BiRightArrow } from 'react-icons/bi';
import StatusSelect from './StatusSelect';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { DialogModalPayment } from './admin/DialogModalPayment';
import { DialogModalLinkUndangan } from './admin/DialogModalLinkUndangan';
import { toast } from './ui/use-toast';

const DataTableForm = ({ initialStatus, onDataUpdate }) => {

  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(initialStatus);

  const [updatedStatus, setUpdatedStatus] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);


  const [selectedRow, setSelectedRow] = useState({ id: null, paymentAmount: null });
  const [open, setOpen] = useState(false);
  const [openLink, setOpenLink] = useState(false);

  const [isAdmin, setIsAdmin] = useState(0);

  useEffect(() => {
    fetchData(currentPage, perPage, search);
  }, [currentPage, perPage, search]);

  const fetchData = useCallback(async (page, limit, searchQuery) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/forms`, {
        params: { page, limit, search: searchQuery, status: status },
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

  const handleSearch = (event) => {
    setSearch(event.target.value);
  };

  const handlePageChange = page => {
    setCurrentPage(page);
  };

  const handlePerRowsChange = async (newPerPage, page) => {
    setPerPage(newPerPage);
    fetchData(page, newPerPage);
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
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        })}</p>
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
              e.preventDefault(); // Prevent opening a link
              navigator.clipboard.writeText(row.linkUndangan);
              toast({
                title: "Link copied!",
              });
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
        name: 'Staff',
        selector: row => row.user?.name ?? '-',
        sortable: true,
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
    ] : []),
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
            <DropdownMenuContent className="w-56">
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
                      <BiMoneyWithdraw className="mr-2 h-4 w-4" />
                      <span>Lunas</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => handlePayment(row)}>
                      <BiMoneyWithdraw className="mr-2 h-4 w-4" />
                      <span>Batalkan Status Lunas</span>
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {row.isPaid === 1 && (
            <Popover>
              <PopoverTrigger>
                <BiMoneyWithdraw className="mr-2 h-4 w-4 text-green-600" />
              </PopoverTrigger>
              <PopoverContent className="w-20 p-2 text-xs text-center">
                {row.paymentAmount}
              </PopoverContent>
            </Popover>
          )}
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
        fetchData(currentPage, perPage, search);
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
    fetchData(currentPage, perPage, search); // Refetch the data with the updated status
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
    if (row.isPaid === 0) {
      setOpen(true)
      console.log(row)
    } else {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/update-payment/${row.id}`,
        {
          isPaid: row.isPaid,
          paymentAmount: 0
        },
        {
          withCredentials: true // This should be inside the config object (third argument)
        }
      );
      handleDataUpdate(response.data.message);
    }
  }

  const handleLinkUndangan = async (row) => {
    setSelectedRow({
      id: row.id,
      linkUndangan: row.linkUndangan,
    });
    setOpenLink(true)
    // const response = await axios.post(
    //   `${process.env.NEXT_PUBLIC_API_URL}/update-link/${row.id}`,
    //   {
    //     linkUndangan: row.linkUndangan,
    //   },
    //   {
    //     withCredentials: true // This should be inside the config object (third argument)
    //   }
    // );
    // handleDataUpdate(response.data.message);
  }

  const handleDataUpdate = (msg) => {
    fetchData(currentPage, perPage, search); // Re-fetch the data after it has been updated
    onDataUpdate(msg);
  };

  return (
    <>
      <DialogModalPayment open={open} onOpenChange={setOpen} row={selectedRow} onDataUpdate={handleDataUpdate} />
      <DialogModalLinkUndangan open={openLink} onOpenChange={setOpenLink} row={selectedRow} onDataUpdate={handleDataUpdate} />
      <DebounceInput
        minLength={2}
        debounceTimeout={300}
        placeholder="Search"
        value={search}
        onChange={handleSearch}
        className="border border-gray-300 rounded-md p-2 w-1/2" // {{ edit_1 }} Adjusted width to be shorter
      />
      <DataTable
        columns={columns}
        data={data}
        pagination
        paginationServer
        paginationTotalRows={totalRows}
        onChangePage={handlePageChange}
        onChangeRowsPerPage={handlePerRowsChange}
        className="rdt_TableCol" // {{ edit_1 }} Add a custom class
      />
    </>
  );
};

export default DataTableForm;
