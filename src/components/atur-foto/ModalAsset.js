import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";
import { useEffect, useState } from "react";
import Image from 'next/image';
import { useParams } from "next/navigation";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

const ModalAsset = ({ isOpen, onClose, onSelectImage, selectType = 'single', partName, length = null }) => {
    const params = useParams();
    const [assets, setAssets] = useState([]);
    const [selectedAssets, setSelectedAssets] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    const fetchData = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/asset?page=${currentPage}&limit=${limit}`);
            console.log('API response:', response.data);
            setAssets(Array.isArray(response.data.data) ? response.data.data : []);
            setTotalPages(response.data.pageCount || 1);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleSelect = (asset) => {
        if (selectType === 'multiple') {
            setSelectedAssets(prev => {
                const isSelected = prev.some(item => item.id === asset.id);
                if (isSelected) {
                    return prev.filter(item => item.id !== asset.id);
                } else {
                    return [...prev, asset];
                }
            });
        } else {
            setSelectedAssets([asset]);
        }
    };

    const handleOk = async () => {
        if (selectedAssets.length > 0) {
            if (selectType === 'single') {
                const selectedData = selectedAssets.map(asset => ({
                    idAsset: asset.id,
                    filename: asset.file,
                    imageUrl: `${process.env.NEXT_PUBLIC_API_URL}/asset/${asset.file}`,
                }));

                onSelectImage(selectedData[0]);
            } else if (selectType === 'multiple') {
                // Check if total selected assets exceed 5
                const totalSelected = length + selectedAssets.length;
                if (totalSelected > 5) {
                    alert('Maksimal 5 gambar');
                    onClose();
                    return; // Exit early to prevent further execution
                }

                const selectedData = selectedAssets.map(asset => ({
                    idAsset: asset.id,
                    filename: asset.file,
                    imageUrl: `${process.env.NEXT_PUBLIC_API_URL}/asset/${asset.file}`,
                    partName: partName
                }));

                try {
                    const response = await axios.post(
                        `${process.env.NEXT_PUBLIC_API_URL}/add-bg-asset/${params.formId}`,
                        selectedData
                    );
                    setSelectedImage(null);
                    setFile(null);
                    onFormChange();
                    nextStep();
                } catch (error) {
                    console.error("Error uploading the image", error);
                }
            }

            onClose();
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchData();
        } else {
            setSelectedAssets([]);
            setCurrentPage(1); // Reset to first page when closing
        }
    }, [isOpen, currentPage]); // Add currentPage to dependencies

    const isSelected = (assetId) => {
        return selectedAssets.some(asset => asset.id === assetId);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="h-[100vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Pilih Aset</DialogTitle>
                    <DialogDescription>
                        {selectType === 'multiple'
                            ? 'Silahkan pilih beberapa gambar untuk ditampilkan di undangan anda.'
                            : 'Silahkan pilih gambar untuk ditampilkan di undangan anda.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 overflow-y-auto flex-1 p-2">
                    {assets.length > 0 ? (
                        assets.map((asset) => {
                            const imageUrl = `${process.env.NEXT_PUBLIC_API_URL}/asset/${asset.file}`;
                            return (
                                <div
                                    key={asset.id}
                                    className={`relative text-center border-2 ${isSelected(asset.id) ? 'border-blue-500' : 'border-transparent'} rounded-lg cursor-pointer p-1`}
                                    onClick={() => handleSelect(asset)}
                                >
                                    {selectType === 'multiple' && isSelected(asset.id) && (
                                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                            ✓
                                        </div>
                                    )}
                                    <Image
                                        src={imageUrl}
                                        alt={asset.name}
                                        width={150}
                                        height={150}
                                        className="rounded-lg w-full h-auto object-cover"
                                    />
                                    <p className="text-sm mt-1">{asset.name}</p>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center col-span-full">No assets available</p>
                    )}
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-between items-center gap-4 mt-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
                        >
                            <FaArrowLeft />
                        </button>
                        <span className="text-sm">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
                        >
                            <FaArrowRight />
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        {selectType === 'multiple' && (
                            <span className="text-sm text-gray-600">
                                Selected: {selectedAssets.length}
                            </span>
                        )}
                        <button
                            onClick={handleOk}
                            disabled={selectedAssets.length === 0}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer disabled:bg-gray-400"
                        >
                            OK
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ModalAsset;