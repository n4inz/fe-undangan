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

const ModalAsset = ({ isOpen, onClose, onSelectImage }) => {
    const [assets, setAssets] = useState([]);
    const [selectedAsset, setSelectedAsset] = useState(null);

    const fetchData = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/asset`);
            console.log('API response:', response.data);
            setAssets(Array.isArray(response.data.data) ? response.data.data : []);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const handleSelect = (asset) => {
        setSelectedAsset(asset);
    };

    const handleOk = () => {
        if (selectedAsset) {
            const imageUrl = `${process.env.NEXT_PUBLIC_API_URL}/asset/${selectedAsset.file}`;
            const assetData = {
                idAsset: selectedAsset.id,
                filename: selectedAsset.file,
                imageUrl: imageUrl,
            };
            onSelectImage(assetData);
            onClose();
        }
    };

    // Reset selected asset when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedAsset(null);
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Pilih Aset</DialogTitle>
                    <DialogDescription>
                        Silahkan pilih gambar untuk ditampilkan di undangan anda.
                    </DialogDescription>
                </DialogHeader>
                
                {/* Grid for Image List */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-2">
                    {assets.length > 0 ? (
                        assets.map((asset) => {
                            const imageUrl = `${process.env.NEXT_PUBLIC_API_URL}/asset/${asset.file}`;
                            return (
                                <div
                                    key={asset.id}
                                    className={`text-center border-2 ${selectedAsset?.id === asset.id ? 'border-blue-500' : 'border-transparent'} rounded-lg cursor-pointer p-1`}
                                    onClick={() => handleSelect(asset)}
                                >
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

                {/* OK Button */}
                <button
                    onClick={handleOk}
                    disabled={!selectedAsset}
                    className="fixed bottom-4 right-4 px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer disabled:bg-gray-400"
                >
                    OK
                </button>
            </DialogContent>
        </Dialog>
    );
};

export default ModalAsset;
