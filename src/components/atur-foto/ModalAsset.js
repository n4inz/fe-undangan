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

const ModalAsset = ({ isOpen, onClose, onSelectImage, selectType = 'single', partName }) => {
    const params = useParams();
    const [assets, setAssets] = useState([]);
    const [selectedAssets, setSelectedAssets] = useState([]);

    const fetchData = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/asset`);
            console.log('API response:', response.data);
            setAssets(Array.isArray(response.data.data) ? response.data.data : []);
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
        if(selectType === 'single') {
            const selectedData = selectedAssets.map(asset => ({
                idAsset: asset.id,
                filename: asset.file,
                imageUrl: `${process.env.NEXT_PUBLIC_API_URL}/asset/${asset.file}`,
            }));

            onSelectImage(selectedData[0]);
        }else{
            const selectedData = selectedAssets.map(asset => ({
                idAsset: asset.id,
                filename: asset.file,
                imageUrl: `${process.env.NEXT_PUBLIC_API_URL}/asset/${asset.file}`,
                partName: partName
            }));
            try {
                const response = await axios.post(
                  `${process.env.NEXT_PUBLIC_API_URL}/add-bg-asset/${params.formId}`, selectedData
                )
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
        }
    }, [isOpen]);

    const isSelected = (assetId) => {
        return selectedAssets.some(asset => asset.id === assetId);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Pilih Aset</DialogTitle>
                    <DialogDescription>
                        {selectType === 'multiple' 
                            ? 'Silahkan pilih beberapa gambar untuk ditampilkan di undangan anda.'
                            : 'Silahkan pilih gambar untuk ditampilkan di undangan anda.'}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-2">
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

                <div className="fixed bottom-4 right-4 flex items-center gap-2">
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
            </DialogContent>
        </Dialog>
    );
};

export default ModalAsset;