// components/DataTable.js

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
import { BiArrowToRight, BiDotsVertical, BiRightArrow } from 'react-icons/bi';

const DataTableForm = ({ initialStatus, onDataUpdate }) => {

  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(initialStatus);

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
      // console.log(response.data.data);
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
      width: '100px', // {{ edit_1 }} Set a smaller width for the ID column
    },
    {
      name: 'Nomor Whatsapp',
      selector: row => row.nomorWa,
      sortable: true,
    },
    {
      name: 'Nama',
      selector: row => row.name,
      sortable: true,
    },
    {
      name: 'Pengantin',
      selector: row => row.namaPanggilanPria + " & " + row.namaPanggilanWanita,
      sortable: true,
    },
    {
      name: 'Tanggal',
      selector: row => new Date(row.createdAt).toLocaleString(), // {{ edit_1 }} Convert to simple date and time
      sortable: true,
    },
    ...(isAdmin === 1 && status === 1 ? [{
      name: 'Staff',
      selector: row => row.user.name,
      sortable: true,
    }] : []), // Tambahkan kolom Staff jika isAdmin == 1
    {
      name: 'Action',
      cell: row => <>
        <Link href={`/admin/detail/${row.id}`}><Button className="w-10 h-6 text-xs bg-opacity-80 bg-black">View</Button></Link>

        <DropdownMenu>
          <DropdownMenuTrigger className='ml-4' asChild>
            <span className="cursor-pointer"><BiDotsVertical className="h-4 w-4" /></span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem onClick={() => handleAction(row)}>
              <BiArrowToRight className="mr-2 h-4 w-4" />
              <span>Move to {initialStatus === 1 ? "List" : "MyList"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>,
    },
  ];

  const handleAction = (row) => {
    // alert(`Action for ${row.name}`);
    try {
      const response = axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/forms/${row.id}`,
        {
          type: initialStatus === 1 ? "toList" : "toMyList"
        },
        {
          withCredentials: true // Menambahkan kredensial
        }
      )
        .then(response => {
          console.log('Response', response);
          fetchData(currentPage, perPage, search);
          // setIsLoading(false)
          if (onDataUpdate && typeof onDataUpdate === 'function') {
            onDataUpdate(response.data.message);
          }
        })
        .catch(error => {
          console.error('Error:', error);
        });
    } catch (error) {
      console.error('Error:', error);
    }


  };


  return (
    <>
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
