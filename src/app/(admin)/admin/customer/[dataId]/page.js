'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { DebounceInput } from 'react-debounce-input';
import { Button } from '@/components/ui/button'; // pastikan ini mengarah ke komponen `shadcn/ui`
import Link from 'next/link';
import StatusSelect from '@/components/StatusSelect';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BiMoneyWithdraw } from 'react-icons/bi';

const CustomerTablePage = ({ params }) => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [customer, setCustomer] = useState(null);
  const [updatedStatus, setUpdatedStatus] = useState(null);
  const [isAdmin, setIsAdmin] = useState(0);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/customer/${params.dataId}`, {
        withCredentials: true,
      });
      const forms = response.data.form || [];
      setData(forms);
      setFilteredData(forms);
      setTotalRows(forms.length);
      setCustomer(response.data.user); // <-- store the whole customer object
      setIsAdmin(response.data.isAdmin || 0); // <-- store the admin status
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

  const handleStatusUpdate = (updatedStatus) => {
    setUpdatedStatus(updatedStatus);
    fetchData();
  };


  const handlePageChange = () => { };
  const handlePerRowsChange = () => { };

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
      name: 'Status',
      cell: row => (
        <StatusSelect
          status={row}
          onDataUpdate={handleStatusUpdate}
        />
      ),
      wrap: true, // Allows text to wrap and avoid overflow
    },

    {
      name: 'Aksi',
      cell: row => (
        <>
          <Link href={`/admin/detail/${row.id}`}>
            <Button variant="outline">Detail</Button>
          </Link>
          <div className='flex-row items-center gap-x-2 ml-2'>
            {row.isPaid === 1 && (
              <Popover className="inline-block">
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
          </div>
        </>
      )},
  ];

  return (
    <>
      <div className="h-10 fixed bg-white border-b w-full"></div>
      <div className="flex min-h-screen pt-10">
        {/* Sidebar Placeholder */}
        <div className="fixed md:relative z-40 w-64 h-full bg-gray-800 md:block hidden"></div>

        <div className="flex flex-col flex-grow w-full md:pl-24">
          <div className="p-4">
            <div className="py-4 text-xl font-semibold">
              Customer : {customer?.email || '-'}
            </div>

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
