'use client';
import { useState, useEffect, useCallback } from 'react'

import DataTableForm from "@/components/DataTableForm";
import { DebounceInput } from 'react-debounce-input';
import DataTable from 'react-data-table-component';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BiDotsVertical, BiTrash } from 'react-icons/bi';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from '@/components/ui/use-toast';

const Expending = () => {

  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    fetchData(currentPage, perPage, search);
  }, [currentPage, perPage, search]);

  const fetchData = useCallback(async (page, limit, searchQuery) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/expend`, {
        params: { page, limit, search: searchQuery },
        withCredentials: true,
      });
      setData(response.data.data);
      setTotalRows(response.data.total);
      console.log(response.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, []);

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
      name: '#',
      selector: (row, index) => index + 1,
      width: '80px',
    },
    {
      name: 'Name',
      selector: row => row.name,
      sortable: true,
    },
    {
      name: 'Total Spending',
      selector: row => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(row.totalSpending),
      sortable: true,
    },
    
    {
      name: 'Tanggal',
      selector: row => new Date(row.createdAt).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }),
      sortable: true,
    },
    
    {
      name: 'Action',
      cell: row => <>
        <Link href={`/admin/expending/edit/${row.id}`}><Button className="w-10 h-6 text-xs bg-opacity-80 bg-black">Edit</Button></Link>
        <DropdownMenu>
          <DropdownMenuTrigger className='ml-4' asChild>
            <span className="cursor-pointer"><BiDotsVertical className="h-4 w-4" /></span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem onClick={() => handleAction(row)}>
              <BiTrash className="h-4 w-4 mr-2" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>,
    },
  ];

  const handleDelete = () => {
    // alert(`Action for ${row.name}`);
    try {
      axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/expend/${selectedRow.id}`, {
        withCredentials: true,
      })
        .then(response => {
          // console.log('Response', response);
          toast({
            title: "Expend Deleted",
          });
          fetchData(currentPage, perPage, search);
        })
        .catch(error => {
          console.error('Error', error);
        });
    } catch (error) {
      console.error('Error', error);
    }
  };

    const handleAction = (row) => {
    setSelectedRow(row);
    setOpen(true);
  };


  return (
    <>
      <div className="h-10 fixed bg-white border-b w-full"></div>
      <div className="flex min-h-screen pt-10">
        {/* Sidebar */}
        <div className="fixed md:relative z-40 w-64 h-full bg-gray-800 md:block hidden">
          {/* <Sidebar /> */}
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-grow w-full md:pl-24">
        <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
          <div className="p-4">
            <div className="py-4">
              Expending
            </div>
            <div className='mb-2'>
              <Link href="/admin/expending/add/0"><Button className="bg-black">Add</Button></Link>

            </div>
            {/* TABLE USERS */}
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
          </div>
        </div>
      </div>
    </>
  );


}

export default Expending;


