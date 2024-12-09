// GALLERY
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import axios from "axios";
import { useParams } from "next/navigation";
import placeholder from "../../../public/images/placeholder.png";
import { BiX } from "react-icons/bi";
import LoadingOverlay from "./LoadingOverlay"  // Import the LoadingOverlay component

const StepF = ({ number, nextStep, formData, setFormData, onFormChange, partName }) => {
  const params = useParams();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Track upload progress
  const [images, setImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    const nonImageFiles = selectedFiles.filter(file => !file.type.startsWith("image/"));
    if (nonImageFiles.length > 0) {
      setErrors({ ...errors, images: "Only image files are allowed" });
      return;
    }

    if (images.length + selectedFiles.length > 15) {
      setErrors({ ...errors, images: "Maximum upload is 15 images" });
      return;
    }

    setImages([...images, ...selectedFiles.map(file => ({ url: URL.createObjectURL(file), id: null }))]);
    setNewFiles([...newFiles, ...selectedFiles]);
    setErrors({ ...errors, images: undefined });
  };

  const handleUploadClick = async () => {
    if (newFiles.length === 0 && images.length === 0) {
      alert("Please select at least one image to upload.");
      return;
    }

    if (newFiles.length === 0 && images.length > 0) {
      nextStep();
      return;
    }

    setUploading(true);
    const fd = new FormData();
    newFiles.forEach(file => fd.append("file", file));
    fd.append('partName', partName);

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
            setUploadProgress(percent);  // Update progress
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
      setUploadProgress(0);  // Reset progress after upload
    }
  };

  const handleRemoveImage = async (idImage) => {
    const updatedImages = images.filter(image => image.id !== idImage);
    setImages(updatedImages);
    setFormData((prev) => ({ ...prev, imageUrls: updatedImages.map(img => img.url) }));

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/remove-image/${idImage}/${params.formId}/${params.phoneNumber}`);
    } catch (error) {
      console.error("Error removing image:", error);
    }
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/get-gallery/${params.formId}/${params.phoneNumber}`, {
        params: { partName }
      });

      const imagesData = response.data.data.map(item => ({
        url: `${process.env.NEXT_PUBLIC_API_URL}/images/${item.images.fileImage}`,
        id: item.id
      }));
      setImages(imagesData);
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="relative min-h-screen p-4 text-center flex-grow">
      {/* Use LoadingOverlay Component */}
      {uploading && <LoadingOverlay progress={uploadProgress} />}

      <h2 className="text-xl font-semibold">
        {number}. {partName} (Max. 15 Foto)
      </h2>

      <div className="flex flex-wrap items-center justify-center mb-4 gap-4">
        {images.length > 0 ? (
          images.map((image, index) => (
            <div key={image.id || index} className="relative mt-4">
              <Image src={image.url} alt={`Preview ${index + 1}`} width={150} height={150} className="rounded" />
              <button
                type="button"
                onClick={() => handleRemoveImage(image.id)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                aria-label="Remove image"
              >
                <BiX className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <Image src={placeholder.src} alt="Cover" width={300} height={350} className="mt-4" />
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
        <Button onClick={handleUploadClick} disabled={uploading || (images.length === 0 && newFiles.length === 0)}>
          {uploading ? "Uploading..." : "Selanjutnya"}
        </Button>
      </div>
    </div>
  );
};

export default StepF;
