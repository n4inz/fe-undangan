// GALLERY
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import axios from "axios";
import { useParams } from "next/navigation";
import placeholder from "../../../public/images/placeholder.png";
import { BiX } from "react-icons/bi";
import LoadingOverlay from "./LoadingOverlay"; // Import the LoadingOverlay component

const StepF = ({ number, nextStep, formData, setFormData, onFormChange, partName }) => {
  const params = useParams();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // We'll store both server images and new local images here.
  // Each entry: { url: string, id: number|null, file: File|null }
  const [images, setImages] = useState([]);

  // We'll store local files yet to upload. Each entry: { previewUrl: string, file: File }
  const [newFiles, setNewFiles] = useState([]);

  const [errors, setErrors] = useState({});
  const [remove, setRemove] = useState(false);
  const fileInputRef = useRef(null);

  // ================================
  //       1. HANDLE FILE INPUT
  // ================================
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Validate only images
    const nonImageFiles = selectedFiles.filter((file) => !file.type.startsWith("image/"));
    if (nonImageFiles.length > 0) {
      setErrors((prev) => ({ ...prev, images: "Only image files are allowed" }));
      return;
    }

    // Validate max 15
    if (images.length + selectedFiles.length > 15) {
      setErrors((prev) => ({ ...prev, images: "Maximum upload is 15 images" }));
      return;
    }

    // Create stable preview URLs for each file
    const newFileData = selectedFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file), // generate once
    }));

    // Create a corresponding "image" structure for UI
    const newImageEntries = newFileData.map((item) => ({
      url: item.previewUrl, // local preview
      id: null,             // no ID yet
      file: item.file,      // store the File
    }));

    // Update state
    setImages((prev) => [...prev, ...newImageEntries]);
    setNewFiles((prev) => [...prev, ...newFileData]);

    // Clear errors if any
    setErrors((prev) => ({ ...prev, images: undefined }));
  };

  // ================================
  //       2. REMOVE AN IMAGE
  // ================================
  const handleRemoveImage = async (id, previewUrl) => {
    setRemove(true);

    // If this image has an ID, it's on the server
    if (id) {
      try {
        const response = await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/remove-image/${id}/${params.formId}/${params.phoneNumber}`
        );

        if (response.status === 200) {
          // Remove from 'images'
          const updatedImages = images.filter((img) => img.id !== id);
          setImages(updatedImages);

          // Update formData if needed
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
      // If there's no ID, it's a local image
      // Remove from 'images'
      const updatedImages = images.filter((img) => img.url !== previewUrl);

      // Remove from 'newFiles'
      const updatedNewFiles = newFiles.filter((item) => item.previewUrl !== previewUrl);

      setImages(updatedImages);
      setNewFiles(updatedNewFiles);

      setFormData((prev) => ({
        ...prev,
        imageUrls: updatedImages.map((img) => img.url),
      }));
    }

    setRemove(false);
  };

  // ================================
  //       3. UPLOAD IMAGES
  // ================================
  const handleUploadClick = async () => {
    // No local files and no images => need at least one to proceed
    if (newFiles.length === 0 && images.length === 0) {
      alert("Please select at least one image to upload.");
      return;
    }

    // If no new files left but images exist, skip directly
    if (newFiles.length === 0 && images.length > 0) {
      nextStep();
      return;
    }

    setUploading(true);
    const fd = new FormData();
    // Only append the remaining local files
    newFiles.forEach((item) => {
      fd.append("file", item.file);
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
      onFormChange();
      nextStep();
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ================================
  //    4. FETCH EXISTING IMAGES
  // ================================
  const fetchData = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/get-gallery/${params.formId}/${params.phoneNumber}`,
        {
          params: { partName },
        }
      );

      // These are server-stored images
      const imagesData = response.data.data.map((item) => ({
        url: `${process.env.NEXT_PUBLIC_API_URL}/images/${item.images.fileImage}`,
        id: item.id,
        file: null, // no local file for server images
      }));

      setImages(imagesData);
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================================
  //             RENDER
  // ================================
  return (
    <div className="relative min-h-screen p-4 text-center flex-grow">
      {/* Loading Overlay for upload progress */}
      {uploading && <LoadingOverlay progress={uploadProgress} />}

      <h2 className="text-xl font-semibold">
        {number}. {partName} (Max. 15 Foto)
      </h2>

      {/* Image previews */}
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
          <Image src={placeholder.src} alt="Cover" width={300} height={350} className="mt-4" />
        )}
      </div>

      {/* Errors */}
      {errors.images && <p className="text-red-500">{errors.images}</p>}

      {/* Controls */}
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

export default StepF;
