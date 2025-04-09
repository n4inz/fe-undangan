//COVER
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import Joyride, { STATUS } from 'react-joyride';
import axios from "axios";
import { useParams } from "next/navigation";
import placeholder from "../../../public/images/placeholder.png";
import LoadingOverlay from "./LoadingOverlay";
import { FaImages, FaEdit } from "react-icons/fa";
import ModalAsset from "./ModalAsset";
import ImageEditor from "./ImageEditor";
import { dataURLtoBlob } from "@/utils/helpers";

const StepA = ({ number, nextStep, formData, setFormData, onFormChange, partName }) => {
  const params = useParams();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState(formData.imageUrl || null);
  const [file, setFile] = useState(null);
  const [imageExist, setImageExist] = useState(false);
  const fileInputRef = useRef(null);
  const [runTour, setRunTour] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusAsset, setStatusAsset] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const tourSteps = [
    {
      target: '#btn-asset',
      content: 'Klik tombol ini untuk memilih aset',
      disableBeacon: true,
    }
  ];

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setSelectedImage(reader.result);
        setFile(selectedFile);
        setIsEditing(true);
      });
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleEditClick = () => {
    if (selectedImage) {
      setIsEditing(true);
    }
  };

  const handleNextClick = async () => {
    setUploading(true);
    if (!file) {
      alert("Please select a file first!");
      setUploading(false);
      return;
    }

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('partName', partName);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/upload-photo-v2/${params.formId}`,
        uploadData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const { loaded, total } = progressEvent;
            const percent = Math.floor((loaded / total) * 100);
            setUploadProgress(percent);
          },
        }
      );

      onFormChange();
      nextStep();
    } catch (error) {
      console.error("Error uploading the image", error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/get-selected-photo/${params.formId}/${params.phoneNumber}`,
        {
          params: {
            partName: partName,
          },
        }
      );

      const imagesData = response.data.data;

      if (imagesData.length > 0) {
        let imageUrl;
        if (imagesData[0].ssCover) {
          imageUrl = `${process.env.NEXT_PUBLIC_API_URL}/images/${imagesData[0].ssCover}`;
        } else if (imagesData[0].fileImage || imagesData[0].file) {
          imageUrl = `${process.env.NEXT_PUBLIC_API_URL}/${response.data.type}/${response.data.type === 'images' ? imagesData[0].fileImage : imagesData[0].file}`;
          setFile(1);
        } else {
          console.error('Image data does not contain expected fields');
          return;
        }

        setSelectedImage(imageUrl);
        setUploading(false);
        onFormChange();
      } else {
        console.error('No images found');
        setUploading(false);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchData();
    let tourShown = false;
    try {
      tourShown = localStorage.getItem('tourShown');
    } catch (error) {
      console.warn('LocalStorage is not supported:', error);
    }
    if (!tourShown) {
      setRunTour(true);
      try {
        localStorage.setItem('tourShown', 'true');
      } catch (error) {
        console.warn('LocalStorage is not supported:', error);
      }
    }
  }, [params.formId, params.phoneNumber, partName]);

  const handleSelectImage = (assetData) => {
    setSelectedImage(assetData.imageUrl);
    setFile({ ...assetData, partName: partName });
    setStatusAsset(true);
  };

  return (
    <>
      <ModalAsset isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelectImage={handleSelectImage} />

      <div className="relative min-h-screen p-4 text-center flex-grow">
        <Joyride
          steps={tourSteps}
          run={runTour}
          continuous={false}
          showSkipButton={true}
          callback={handleJoyrideCallback}
          styles={{
            options: {
              primaryColor: '#4F46E5',
            }
          }}
        />

        {uploading && <LoadingOverlay progress={uploadProgress} />}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold flex-grow text-center">{number}. {partName}</h2>
          <Button
            id="btn-asset"
            onClick={() => setIsModalOpen(true)}
          >
            <FaImages className="text-lg" />
          </Button>
        </div>

        <div className="flex items-center justify-center mb-4 relative">
          <div className="relative">
            <img
              src={selectedImage || placeholder?.src}
              alt="Cover"
              width={300}
              height={350}
              className="mt-4"
            />
            {selectedImage && selectedImage !== placeholder?.src && (
              <button
                onClick={handleEditClick}
                className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
                title="Edit Image"
              >
                <FaEdit className="text-blue-500" />
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-x-4 pb-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
            accept="image/*"
          />
          <Button onClick={handleUploadClick} disabled={uploading}>
            {selectedImage ? "Ganti Foto" : "Upload Foto"}
          </Button>

          <Button onClick={handleNextClick} disabled={!file || uploading}>
            {uploading ? "Uploading..." : "Selanjutnya"}
          </Button>
        </div>

        {isEditing && selectedImage && (
          <ImageEditor
            image={selectedImage}
            onSave={(editedImage) => {
              setSelectedImage(editedImage);
              setIsEditing(false);
              // Create a file object from the edited image
              const blob = dataURLtoBlob(editedImage);
              const editedFile = new File([blob], 'edited-image.jpg', { type: 'image/jpeg' });
              setFile(editedFile);
            }}
            onCancel={() => setIsEditing(false)}
          />
        )}
      </div>
    </>
  );
};

export default StepA;