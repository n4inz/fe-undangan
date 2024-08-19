"use client"
import { useEffect, useState } from 'react';
import Image from 'next/image';
// import { Button } from '@/components/ui/button';
import Link from 'next/link';
// import { ArrowLeftIcon, PhoneIcon } from '@heroicons/react/24/solid';
import { BiArrowBack, BiPhone, BiPhotoAlbum } from "react-icons/bi";
import { usePathname } from 'next/navigation'; // Add this import
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { Button } from '@/components/ui/button';

const TableFoto = ({ params }) => {

  const pathname = usePathname()

  const contactUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WA_NUMBER}?text=Halo,%0ASaya%20ingin%20memesan%20undangan%20dengan%20kode%20id%20:%20${params.formId}`; // Use formId in the URL

  const [data, setData] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const columns = [
    {
      name: '#',
      selector: (row, index) => (currentPage - 1) * rowsPerPage + index + 1,
      width: '80px',
    },
    {
      name: 'Foto',
      cell: row => (
        <Image
          src={`${process.env.NEXT_PUBLIC_API_URL}/images/${row.images.fileImage}`}
          alt="Foto"
          width={100}
          height={100}
          priority
          className="w-auto h-auto object-cover"
        />
      ),
      // sortable: true,
    },
    {
      name: 'Action',
      selector: row => <>
        <Link href={`#`}><Button className="w-10 h-6 text-xs bg-opacity-80 bg-black">Edit</Button></Link>
      </>,
      // sortable: true,
    },
  ];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePerRowsChange = (newPerPage, page) => {
    setRowsPerPage(newPerPage);
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/image-order/${params.formId}`);
      setData(response.data.imageOrder);

      // console.log(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex items-center justify-center bg-gray-100">
      <div className="h-full min-h-screen bg-white rounded-lg shadow-lg max-w-xl w-full flex items-center flex-col relative">
        <div className="top-0 p-4 text-center">
          <h1 className="text-3xl underline">Atur Foto</h1>


        </div>
        <DataTable
          columns={columns}
          data={data}
          pagination
          paginationTotalRows={data.length}
          onChangePage={handlePageChange}
          onChangeRowsPerPage={handlePerRowsChange}
          className=""
        />
        <Link type="button" href={contactUrl} target='_blank' className="bottom-4 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 p-4 my-4">
          <BiPhone className="h-6 w-6 mr-2 inline" />
          Hubungi Admin
        </Link>
      </div>

    </div>
  );
}

export default TableFoto;