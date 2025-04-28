//MEMPELAI PRIA
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

const StepC = ({ number, nextStep, formData, setFormData, onFormChange, partName }) => {
  const params = useParams();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Track upload progress
  const [selectedImage, setSelectedImage] = useState(formData.imageUrl || null);
  const [file, setFile] = useState(null);
  const [imageExist, setImageExist] = useState(false);
  const fileInputRef = useRef(null);
  const [runTour, setRunTour] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
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
    setStatusAsset(false);
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

  const handleNextClick = async () => {
    setUploading(true);
    if (!file) {
      alert("Please select a file first!");
      setUploading(false);
      return;
    } else if (statusAsset && selectedImage) {
      console.log('finally');

      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/upload-photo-v2/${params.formId}`, file
        )
        setSelectedImage(null);
        setFile(null);
        onFormChange();
        nextStep();
      } catch (error) {
        console.error("Error uploading the image", error);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }

    } else if (file === 1) {
      const uploadData = new FormData();
      uploadData.append('partName', partName);
      uploadData.append('dataFile', file);

      try {
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
              setUploadProgress(percent);  // Update progress
            },
          }
        );
        setImageExist(false);
        onFormChange();
        nextStep();
      } catch (error) {
        console.error("Error uploading the image", error);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    } else {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('partName', partName);

      try {
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
              setUploadProgress(percent);  // Update progress
            },
          }
        );

        setSelectedImage(null);
        setFile(null);
        onFormChange();
        nextStep();
      } catch (error) {
        console.error("Error uploading the image", error);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
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
      // const imagesDataxx = response.data;

      // console.log("Images Data:", imagesDataxx);

      if (imagesData.length > 0) {
        let imageUrl;
        if (imagesData[0].fileImage || imagesData[0].file) {
          imageUrl = `${process.env.NEXT_PUBLIC_API_URL}/${response.data.type}/${response.data.type === 'images' ? imagesData[0].fileImage : imagesData[0].file}`;
          setFile(1);
        } else {
          console.error('Image data does not contain expected fields');
          return;
        }

        console.log("Imageurl:", imageUrl);

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
      setRunTour(true); // Start the tour when the component mounts
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
    console.log('Selected asset:', assetData);
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
              primaryColor: '#4F46E5', // Indigo color to match your theme
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
                onClick={() => {
                  if (selectedImage) {
                    setIsEditing(true);
                  }
                }}
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

export default StepC;