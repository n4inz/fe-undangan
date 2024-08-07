// components/DataTable.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import "@/components/DataTable.css";
import Link from 'next/link';
import { Button } from './ui/button';

const DataTableForm = () => {

  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchData(currentPage, perPage);
  }, [currentPage, perPage]);

  const fetchData = async (page, limit) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/forms`, {
        params: { page, limit },
      });
      setData(response.data.data);
      setTotalRows(response.data.total);
      // console.log(response.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
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
    {
      name: 'Action',
      cell: row => <Link href={`/detail/${row.id}`}><Button className="w-10 h-6 text-xs bg-opacity-80 bg-black">View</Button></Link>,
    },
  ];

  const handleAction = (row) => {
    alert(`Action for ${row.name}`);
  };


  return (
    <DataTable
      title="Daftar Pesanan Undangan"
      columns={columns}
      data={data}
      pagination
      paginationServer
      paginationTotalRows={totalRows}
      onChangePage={handlePageChange}
      onChangeRowsPerPage={handlePerRowsChange}
      className="rdt_TableCol" // {{ edit_1 }} Add a custom class
    />
  );
};

export default DataTableForm;
