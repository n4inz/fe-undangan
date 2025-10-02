'use client';
import { useState, useEffect, useCallback } from 'react'
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

const Customer = () => {

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
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/customer`, {
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
      name: 'Nama',
      selector: row => row.name,
      sortable: true,
    },
    {
      name: 'Email',
      selector: row => row.email,
      sortable: true,
    },
    {
      name: 'Jumlah Undangan',
      sortable: true,
      cell: row => (
        <Link href={`/admin/customer/${row.id}`} className="text-blue-600 hover:underline">
          {row.formCount} Undangan
        </Link>
      ),
    },
    {
      name: 'Action',
      cell: row => <>

      </>,
    },
  ];



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
          <div className="p-4">
            <div className="py-4">
              Customer
            </div>
            {/* <div className='mb-2'>
              <Link href="/admin/staff/add/0"><Button className="bg-black">Add</Button></Link>

            </div> */}
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

export default Customer;


