"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { BiEdit, BiCrop } from "react-icons/bi";
import { useRouter } from 'next/navigation';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { Button } from '@/components/ui/button';
import { checkForm } from '@/utils/checkForm';
import ImageEditor from '@/components/atur-foto/ImageEditor'; // Import the ImageEditor component
import { FaTimes, FaWhatsapp } from 'react-icons/fa';

const DataPhotoTable = ({ params }) => {
    const router = useRouter();

    const [data, setData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [pageLoading, setPageLoading] = useState(true);
    const [imageLoading, setImageLoading] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [fullScreenImage, setFullScreenImage] = useState(null);
    const [form, setForm] = useState({});
    const [editingImage, setEditingImage] = useState(null);
    const [editingRow, setEditingRow] = useState(null);
    const [uploading, setUploading] = useState(false);

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
                    <div className="flex flex-col space-y-2">
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
                            <BiCrop className="mr-2 h-4 w-4" />
                            Crop
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChangeImage(row)}
                        >
                            <BiEdit className="mr-2 h-4 w-4" />
                            Ubah Foto
                        </Button>
                        <input
                            type="file"
                            accept="image/*"
                            id={`file-upload-${row.id}`}
                            onChange={(e) => handleFileUploadNew(e, row)}
                            className="hidden"
                        />
                    </div>
                );
            },
            width: '150px',
        },
    ];

const handleSaveEditedImage = async (base64Data) => {
    try {
        const file = dataURLtoFile(base64Data, 'edited-image.jpg');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('partName', editingRow.partName);
        formData.append('idImage', editingRow.idImage); // Add idImage
        formData.append('phoneNumber', params.phoneNumber);

        const response = await axios.put( // Change to PUT to match updatePhoto endpoint
            `${process.env.NEXT_PUBLIC_API_URL}/update-photo/${params.formId}/${editingRow.partName}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        if (response.status === 200) {
            fetchData();
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
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/get-photo-order/${params.formId}/${params.phoneNumber}`
            );
            setData(response.data.images || []);
            const formData = response.data.form || {};
            setForm({
                ...formData,
                slug: formData.linkUndangan
                    ? formData.linkUndangan
                    : `${process.env.NEXT_PUBLIC_LINK_UNDANGAN}/${formData.slug || ''}`
            });
            console.log('Form data:', response.data.form?.linkUndangan);
        } catch (error) {
            console.error('Error fetching data:', error);
            setData([]);
            setForm({});
        }
    };

    const handleImageLoadComplete = () => {
        setImageLoading(false);
    };

const handleChangeImage = (row) => {
    const input = document.getElementById(`file-upload-${row.id}`);
    if (input) {
        input.click();
    }
};

// Frontend: handleFileUpload function
// ... (other imports and code remain the same)

const handleFileUploadNew = async (e, row) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('idImage', row.idImage); // Add idImage to formData

  try {
    setUploading(true);
    await axios.put(
      `${process.env.NEXT_PUBLIC_API_URL}/update-photo/${params.formId}/${row.partName}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    fetchData();
  } catch (error) {
    console.error('Upload error:', error);
    alert('Gagal mengupload gambar: ' + error.message);
  } finally {
    setUploading(false);
    e.target.value = ''; // Reset input
  }
};

    useEffect(() => {
        fetchData();
    }, [params.formId, params.phoneNumber]);

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
        <>
              
                <DataTable
                    columns={columns}
                    data={data}
                    pagination
                    paginationTotalRows={data.length}
                    onChangePage={setCurrentPage}
                    onChangeRowsPerPage={setRowsPerPage}
                    className="mb-8"
                />

                {/* <div className="fixed right-4 bottom-4 md:mr-40 md:bottom-4">
                    <Button
                        className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-full flex items-center shadow-lg"
                    >
                        <FaWhatsapp className="mr-2 text-xl" />
                        Hubungi Admin
                    </Button>
                </div> */}

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
                        className="absolute top-4 right-4 bg-red-500 text-white rounded-full w-12 h-12 flex items-center justify-center"
                    >
                        <FaTimes className="text-2xl" /> {/* Increase the size of the X icon */}
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
            </>
    );
};

export default DataPhotoTable;