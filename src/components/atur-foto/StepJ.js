//BACKGROUND
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import axios from "axios";
import { useParams } from "next/navigation";
import placeholder from "../../../public/images/placeholder.png";
import { BiX } from "react-icons/bi";
import LoadingOverlay from "./LoadingOverlay";
import ModalAsset from "./ModalAsset";
import { FaImages } from "react-icons/fa";
import { id } from "date-fns/locale";

const StepJ = ({ number, nextStep, formData, setFormData, onFormChange, partName }) => {
  const params = useParams();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [images, setImages] = useState([]);   // Each entry => { url, id, file }
  const [newFiles, setNewFiles] = useState([]); // Each entry => { previewUrl, file }
  const [errors, setErrors] = useState({});
  const [remove, setRemove] = useState(false);
  const fileInputRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [statusAsset, setStatusAsset] = useState(false);

  // 1) Handle file selection
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Validate file types
    const nonImageFiles = selectedFiles.filter((file) => !file.type.startsWith("image/"));
    if (nonImageFiles.length > 0) {
      setErrors({ ...errors, images: "Only image files are allowed" });
      return;
    }

    // Validate max 5 images
    if (images.length + selectedFiles.length > 5) {
      setErrors({ ...errors, images: "Maximum upload is 5 images" });
      return;
    }

    // Generate a *stable* previewUrl for each file, and store it
    const newFileData = selectedFiles.map((file) => {
      return {
        file,
        previewUrl: URL.createObjectURL(file), // generate ONCE
      };
    });

    // Add to images for UI (each item will contain { url, id, file })
    const newImageEntries = newFileData.map((item) => ({
      url: item.previewUrl, // local preview URL
      id: null,             // no ID yet since not uploaded
      file: item.file,      // keep the raw File
      type: 'file'
    }));

    // Append to existing arrays
    setImages((prev) => [...prev, ...newImageEntries]);
    setNewFiles((prev) => [...prev, ...newFileData]);

    // Clear old error if any
    setErrors({ ...errors, images: undefined });
  };

  // 2) Handle removing image
  const handleRemoveImage = async (id, previewUrl) => {
    setRemove(true);

    if (id) {
      // ========== REMOVING A SERVER-STORED IMAGE ========== //
      try {
        const response = await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/remove-image/${id}/${params.formId}/${params.phoneNumber}`
        );

        if (response.status === 200) {
          // Filter out the removed image by ID
          const updatedImages = images.filter((image) => image.id !== id);
          setImages(updatedImages);

          // Update formData if you’re using it
          setFormData((prev) => ({
            ...prev,
            imageUrls: updatedImages.map((img) => img.url),
          }));
        } else {
          console.error("Failed to delete image on the server.");
        }
      } catch (error) {
        console.error("Error removing image:", error);
      }
    } else {
      // ========== REMOVING A LOCALLY ADDED (NOT YET UPLOADED) IMAGE ========== //
      // 1. Remove from images
      const updatedImages = images.filter((image) => image.url !== previewUrl);

      // 2. Remove from newFiles by matching the stable previewUrl
      const updatedNewFiles = newFiles.filter(
        (item) => item.previewUrl !== previewUrl
      );

      setImages(updatedImages);
      setNewFiles(updatedNewFiles);

      setFormData((prev) => ({
        ...prev,
        imageUrls: updatedImages.map((img) => img.url),
      }));
    }

    setRemove(false);
  };

  // 3) Handle uploading images
  const handleUploadClick = async () => {
    // If no files and no images left, prompt user
    if (newFiles.length === 0 && images.length === 0) {
      alert("Please select at least one image to upload.");
      return;
    }

    // If no new files but existing images are present, skip upload
    if (newFiles.length === 0 && images.length > 0) {
      nextStep();
      return;
    }

    setUploading(true);

    // Build FormData
    const fd = new FormData();
    newFiles.forEach((item) => {
      fd.append("id", item.id); // ID of the image (if any)
      fd.append("file", item.file); // only the remaining files
    });
    fd.append("partName", partName);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/upload-photo-v2/${params.formId}`,
        fd,
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
      console.log("Files uploaded successfully:", response);

      // Possibly refresh or do something else
      onFormChange();
      nextStep();
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSelectImage = (selectedAssets) => {
    if (!selectedAssets) return;
  
    const selectedArray = Array.isArray(selectedAssets)
      ? selectedAssets
      : [selectedAssets];
  
    // Convert to your `images` shape
    const newImages = selectedArray.map(asset => ({
      url: asset.imageUrl,
      id:  asset.idAsset,
      file: null,
      type: "newAsset",
    }));
  
    setImages(prev => {
      if (prev.length >= 5) {
        alert("Maksimal 5 gambar dapat dipilih.");
        return prev;
      }
      // just append, then cap at 5
      return [...prev, ...newImages].slice(0, 5);
    });
  
    setNewFiles(prevFiles => {
      const newFiles = selectedArray.map(asset => ({
        previewUrl: asset.imageUrl,
        file:       null,
        id:         asset.idAsset,
      }));
      // append, then cap at 5
      return [...prevFiles, ...newFiles].slice(0, 5);
    });
  
    setFormData(prev => ({
      ...prev,
      imageUrls: [
        ...(prev.imageUrls || []),
        ...newImages.map(img => img.url),
      ].slice(0, 5),
    }));
  };
  

  // 4) Fetch existing images from the server (already uploaded)
  const fetchData = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/get-gallery/${params.formId}/${params.phoneNumber}`,
        {
          params: {
            partName: partName,
          },
        }
      );

      const imagesData = response.data.data.map((item) => ({
        url: item.images.fileImage 
          ? `${process.env.NEXT_PUBLIC_API_URL}/images/${item.images.fileImage}`
          : `${process.env.NEXT_PUBLIC_API_URL}/images/${item.asset.file}`,
        id: item.id,
        file: null, // no local file for server-stored images
        type: item.images.fileImage ? "images" : "asset",
      }));
      setImages(imagesData);
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  useEffect(() => {
      fetchData();
  }, []);

  useEffect(() => {
    console.log('newFiles', newFiles);
    console.log('images', images);
  }, [images, newFiles]);

  // ========== RENDER ========== //
  return (
    <div className="relative min-h-screen p-4 text-center flex-grow">
      
      {/* Loading Overlay */}
      {uploading && <LoadingOverlay progress={uploadProgress} />}

      <ModalAsset isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelectImage={handleSelectImage} selectType="multiple" partName={partName} length={images.length} />

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold flex-grow text-center">{number}. {partName} (Max. 5 Foto)</h2>
          <Button
            id="btn-asset"
            onClick={() => setIsModalOpen(true)}
          >
            <FaImages className="text-lg" />
          </Button>
        </div>

      <div className="flex flex-wrap items-center justify-center mb-4 gap-4">
        {images.length > 0 ? (
          images.map((image, index) => (
            <div key={image.id || index} className="relative mt-4">
              <img
                src={image.url}
                alt={`Preview ${index + 1}`}
                width={150}
                height={150}
                className="rounded"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(image.id, image.url)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                aria-label="Remove image"
                disabled={uploading}
              >
                {remove ? (
                  <div className="w-4 h-4 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                ) : (
                  <BiX className="h-4 w-4" />
                )}
              </button>
            </div>
          ))
        ) : (
          <Image
            src={placeholder.src}
            alt="Cover"
            width={300}
            height={350}
            className="mt-4"
          />
        )}
      </div>

      {errors.images && <p className="text-red-500">{errors.images}</p>}

      <div className="flex justify-center gap-x-4 pb-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
          accept="image/*"
          multiple
        />
        <Button onClick={() => fileInputRef.current.click()} disabled={uploading}>
          {images.length > 0 ? "Ganti Foto" : "Upload Photos"}
        </Button>
        <Button
          onClick={handleUploadClick}
          disabled={uploading || (images.length === 0 && newFiles.length === 0)}
        >
          {uploading ? "Uploading..." : "Selanjutnya"}
        </Button>
      </div>
    </div>
  );
};

export default StepJ;
