"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BiEnvelope, BiEnvelopeOpen, BiPhone, BiX } from "react-icons/bi";
import { usePathname } from 'next/navigation';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { Button } from '@/components/ui/button';
import { DialogModalForm } from '@/components/DialogModalForm';

const Result = ({ params }) => {
    const pathname = usePathname();
    const contactUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WA_NUMBER}?text=Halo,%0ASaya%20ingin%20memesan%20undangan%20dengan%20kode%20id%20:%20${params.formId}`;

    const [data, setData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [open, setOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [selectedRow, setSelectedRow] = useState({ id: null, idImage: null });
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [fullScreenImage, setFullScreenImage] = useState(null);
    const [form, setForm] = useState([]);

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
                    className="w-auto h-auto object-cover cursor-pointer"
                    onClick={() => handleImageClick(`${process.env.NEXT_PUBLIC_API_URL}/images/${row.images.fileImage}`)}
                />
            ),
        },
        {
            name: 'Bagian',
            cell: row => row.partName,
        },
    ];

    const handleImageClick = (imageUrl) => {
        setFullScreenImage(imageUrl);
        setIsFullScreen(true);
    };

    const handleCloseFullScreen = () => {
        setIsFullScreen(false);
        setFullScreenImage(null);
    };

    const fetchData = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/get-photo-order/${params.formId}/${params.phoneNumber}`);
            setData(response.data.images);
            setForm({
                ...response.data.form,
                slug: `${process.env.NEXT_PUBLIC_LINK_UNDANGAN}/${response.data.form.slug}` 
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (form.slug) {
            // The link will re-render whenever form.slug changes
            console.log('form.slug changed:', form.slug); 
        }
    }, [form.slug]); // Dependency: form.slug

    return (
        <div className="flex items-center justify-center bg-gray-100">
            <div className="h-full min-h-screen bg-white rounded-lg shadow-lg max-w-xl w-full flex items-center flex-col relative">
                <DialogModalForm open={open} onOpenChange={setOpen} index={selectedIndex} row={selectedRow} formId={params.formId} onDataUpdate={fetchData} />
                <div className="top-0 p-4 text-center">
                    <h1 className="text-3xl underline">Atur Foto</h1>
                </div>
                {form.isPaid == 1 && (
                <Link type="button" href={form.slug} target='_blank' className="bottom-4 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 p-4 my-4">
                    <BiEnvelope className="h-6 w-6 mr-2 inline" />
                    Link Undangan
                </Link>
                )}
                <DataTable
                    columns={columns}
                    data={data}
                    pagination
                    paginationTotalRows={data.length}
                    onChangePage={setCurrentPage}
                    onChangeRowsPerPage={setRowsPerPage}
                    className=""
                />
                <Link type="button" href={contactUrl} target='_blank' className="bottom-4 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 p-4 my-4">
                    <BiPhone className="h-6 w-6 mr-2 inline" />
                    Hubungi Admin
                </Link>
            </div>

            {isFullScreen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
                    <Image
                        src={fullScreenImage}
                        alt="Full Screen Image"
                        width={800}
                        height={800}
                        className="max-w-full max-h-full object-contain"
                    />
                    <Button
                        onClick={handleCloseFullScreen}
                        className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-2"
                    >
                        <BiX className="h-6 w-6" />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default Result;