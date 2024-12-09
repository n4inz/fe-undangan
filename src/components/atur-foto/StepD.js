// MEMPELAI WANITA
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import axios from "axios";
import { useParams } from "next/navigation";
import placeholder from "../../../public/images/placeholder.png";
import LoadingOverlay from "./LoadingOverlay";

const StepD = ({ number, nextStep, formData, setFormData, onFormChange, partName }) => {
  const params = useParams();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Track upload progress
  const [selectedImage, setSelectedImage] = useState(formData.imageUrl || null);
  const [file, setFile] = useState(null);
  const [imageExist, setImageExist] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
        setFile(selectedFile);
        onFormChange();
      };
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
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/get-selected-photo/${params.formId}/${params.phoneNumber}`, {
        params: {
          partName: partName, // Passing as query parameter
        }
      });

      const imagesData = response.data.data;

      if (imagesData && Array.isArray(imagesData) && imagesData.length > 0) {
        let imageUrl;
        if (imagesData[0].fileImage) {
          imageUrl = `${process.env.NEXT_PUBLIC_API_URL}/images/${imagesData[0].fileImage}`;
          setFile(1);
        } else {
          console.error('Image data does not contain expected fields');
          return;
        }

        console.log(imageUrl);
        setSelectedImage(imageUrl);
        setUploading(false);

        onFormChange();
      } else {
        console.error('No images found');
        setUploading(false);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setUploading(false); // Reset uploading state in case of error
    }
  }



  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="relative min-h-screen p-4 text-center flex-grow">
      {/* Use LoadingOverlay Component */}
      {uploading && <LoadingOverlay progress={uploadProgress} />}
      <h2 className="text-xl font-semibold">{number}. {partName}</h2>

      <div className="flex items-center justify-center mb-4">
        <Image
          src={selectedImage ? selectedImage : `${placeholder.src}`}
          alt="Cover"
          width={300}
          height={350}
          className="mt-4"
        />
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
    </div>
  );
};

export default StepD;
