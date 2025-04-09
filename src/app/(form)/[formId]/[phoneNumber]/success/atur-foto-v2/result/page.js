"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BiEnvelope, BiPhone, BiX, BiArrowBack, BiEdit } from "react-icons/bi";
import { useRouter } from 'next/navigation';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { Button } from '@/components/ui/button';
import { DialogModalForm } from '@/components/DialogModalForm';
import { checkForm } from '@/utils/checkForm';
import ImageEditor from '@/components/atur-foto/ImageEditor'; // Import the ImageEditor component

const Result = ({ params }) => {
    const router = useRouter();
    const contactUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WA_NUMBER}?text=Halo,%0ASaya%20ingin%20memesan%20undangan%20dengan%20kode%20id%20:%20${params.formId}`;

    const [data, setData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [open, setOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [selectedRow, setSelectedRow] = useState({ id: null, idImage: null });
    const [pageLoading, setPageLoading] = useState(true);
    const [imageLoading, setImageLoading] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [fullScreenImage, setFullScreenImage] = useState(null);
    const [form, setForm] = useState([]);
    const [editingImage, setEditingImage] = useState(null);
    const [editingRow, setEditingRow] = useState(null);

    const columns = [
        {
            name: '#',
            selector: (row, index) => (currentPage - 1) * rowsPerPage + index + 1,
            width: '80px',
        },
        {
            name: 'Foto',
            cell: row => {
                const imageUrl = row.images?.fileImage
                    ? `${process.env.NEXT_PUBLIC_API_URL}/images/${row.images.fileImage}`
                    : row.asset?.file
                        ? `${process.env.NEXT_PUBLIC_API_URL}/asset/${row.asset.file}`
                        : '/placeholder-image.png';

                return (
                    <Image
                        src={imageUrl}
                        alt="Foto"
                        width={100}
                        height={100}
                        priority
                        className="w-auto h-auto object-cover cursor-pointer"
                        onClick={() => handleImageClick(imageUrl)}
                    />
                );
            },
        },
        {
            name: 'Bagian',
            selector: row => row.partName,
            sortable: true,
        },
        {
            name: 'Aksi',
            cell: row => {
                const imageUrl = row.images?.fileImage
                    ? `${process.env.NEXT_PUBLIC_API_URL}/images/${row.images.fileImage}`
                    : row.asset?.file
                        ? `${process.env.NEXT_PUBLIC_API_URL}/asset/${row.asset.file}`
                        : null;

                return (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                if (imageUrl) {
                                    setEditingImage(imageUrl);
                                    setEditingRow(row);
                                }
                            }}
                            disabled={!imageUrl}
                        >
                            <BiEdit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    </div>
                );
            },
            width: '150px',
        },
    ];

    const handleSaveEditedImage = async (base64Data) => {
        try {
            // Convert base64 to File
            const file = dataURLtoFile(base64Data, 'edited-image.jpg');
    
            // Create FormData and append the file
            const formData = new FormData();
            formData.append('file', file);
            formData.append('partName', editingRow.partName);
            formData.append('idImage', editingRow.id);
            formData.append('phoneNumber', params.phoneNumber);
    
            // Send to backend
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/upload-photo-v2/${params.formId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
    
            if (response.status === 200) {
                fetchData(); // Refresh the data
            }
        } catch (error) {
            console.error('Error saving edited image:', error);
        } finally {
            setEditingImage(null);
            setEditingRow(null);
        }
    };
    
    // Helper function to convert base64 to File
    const dataURLtoFile = (dataurl, filename) => {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        return new File([u8arr], filename, { type: mime });
    };

    const handleImageClick = (imageUrl) => {
        setFullScreenImage(imageUrl);
        setIsFullScreen(true);
        setImageLoading(true);
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
                slug: `${process.env.NEXT_PUBLIC_LINK_UNDANGAN}/${response.data.form.slug}?to=Nama Tamu`
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleImageLoadComplete = () => {
        setImageLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleBackButtonClick = () => {
        router.push(`/${params.formId}/${params.phoneNumber}/success/atur-foto-v2`);
    };

    useEffect(() => {
        const validateForm = async () => {
            const { data, error } = await checkForm(params.formId, params.phoneNumber);
            if (error) {
                console.error(error);
                router.replace('/');
            } else {
                setPageLoading(false);
            }
        };
        validateForm();
    }, [params.formId, params.phoneNumber, router]);

    if (pageLoading) {
        return null;
    }

    return (
        <div className="flex items-center justify-center bg-gray-100">
            <div className="h-full min-h-screen bg-white rounded-lg shadow-lg max-w-xl w-full flex items-center flex-col relative">

                {/* Back Button */}
                <Button
                    onClick={handleBackButtonClick}
                    className="absolute top-4 left-4 p-2 bg-gray-200 rounded-full text-gray-600 hover:bg-gray-300 focus:outline-none"
                >
                    <BiArrowBack className="h-6 w-6" />
                </Button>

                <DialogModalForm open={open} onOpenChange={setOpen} index={selectedIndex} row={selectedRow} formId={params.formId} onDataUpdate={fetchData} />

                <div className="top-0 p-4 text-center">
                    <h1 className="text-3xl underline">Daftar Foto</h1>
                </div>

                {form.slug && (
                    <Link href={form.slug} target='_blank' className="bottom-4 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 p-4 my-2">
                        <BiEnvelope className="h-6 w-6 mr-2 inline" />
                        Link Undangan
                    </Link>
                )}
                <Link type="button" href={contactUrl} target='_blank' className="bottom-4 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 p-4 my-2">
                    <BiPhone className="h-6 w-6 mr-2 inline" />
                    Hubungi Admin
                </Link>

                <DataTable
                    columns={columns}
                    data={data}
                    pagination
                    paginationTotalRows={data.length}
                    onChangePage={setCurrentPage}
                    onChangeRowsPerPage={setRowsPerPage}
                    className="mb-8"
                />

            </div>

            {isFullScreen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
                    {imageLoading && (
                        <div className="absolute flex items-center justify-center">
                            <div className="w-12 h-12 border-4 border-t-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                    )}
                    <Image
                        src={fullScreenImage}
                        alt="Full Screen Image"
                        width={800}
                        height={800}
                        className="max-w-full max-h-full object-contain"
                        onLoadingComplete={handleImageLoadComplete}
                    />
                    <Button
                        onClick={handleCloseFullScreen}
                        className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-2"
                    >
                        <BiX className="h-6 w-6" />
                    </Button>
                </div>
            )}

            {editingImage && (
                <ImageEditor
                    image={editingImage}
                    idImage={editingRow?.id}
                    onSave={handleSaveEditedImage}
                    onCancel={() => {
                        setEditingImage(null);
                        setEditingRow(null);
                    }}
                />
            )}
        </div>
    );
};

export default Result;