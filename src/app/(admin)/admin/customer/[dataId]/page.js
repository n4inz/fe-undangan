'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { DebounceInput } from 'react-debounce-input';
import { Button } from '@/components/ui/button'; // pastikan ini mengarah ke komponen `shadcn/ui`
import Link from 'next/link';

const CustomerTablePage = ({ params }) => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/customer/${params.dataId}`, {
        withCredentials: true,
      });
      const forms = response.data.form || [];
      setData(forms);
      setFilteredData(forms);
      setTotalRows(forms.length);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.dataId]);

  const handleSearch = (e) => {
    const keyword = e.target.value.toLowerCase();
    setSearch(e.target.value);
    const filtered = data.filter(item =>
      `${item.namaPanggilanPria} ${item.namaPanggilanWanita}`.toLowerCase().includes(keyword)
    );
    setFilteredData(filtered);
    setTotalRows(filtered.length);
  };

  const handlePageChange = () => {};
  const handlePerRowsChange = () => {};

  const columns = [
    {
      name: 'ID',
      selector: row => `${row.id}`,
      sortable: true,
    },    
    {
      name: 'Name',
      selector: row => `${row.namaPanggilanPria} & ${row.namaPanggilanWanita}`,
      sortable: true,
    },
    {
      name: 'Comments',
      selector: row => row.commentCount,
      center: true,
    },
    {
      name: 'Music',
      selector: row => row.music?.name || '-',
    },
    {
      name: 'Aksi',
      cell: row => (
        <Link href={`/admin/detail/${row.id}`}>
          <Button variant="outline">Detail</Button>
        </Link>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  return (
    <>
      <div className="h-10 fixed bg-white border-b w-full"></div>
      <div className="flex min-h-screen pt-10">
        {/* Sidebar Placeholder */}
        <div className="fixed md:relative z-40 w-64 h-full bg-gray-800 md:block hidden"></div>

        <div className="flex flex-col flex-grow w-full md:pl-24">
          <div className="p-4">
            <div className="py-4 text-xl font-semibold">Customer</div>

            <DebounceInput
              minLength={2}
              debounceTimeout={300}
              placeholder="Search"
              value={search}
              onChange={handleSearch}
              className="border border-gray-300 rounded-md p-2 w-1/2"
            />

            <div className="mt-4">
              <DataTable
                columns={columns}
                data={filteredData}
                pagination
                paginationServer
                paginationTotalRows={totalRows}
                onChangePage={handlePageChange}
                onChangeRowsPerPage={handlePerRowsChange}
                className="rdt_TableCol"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerTablePage;
