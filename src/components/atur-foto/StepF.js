// GALLERY
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import axios from "axios";
import { useParams } from "next/navigation";
import placeholder from "../../../public/images/placeholder.png";
import { BiX } from "react-icons/bi";

const StepF = ({ number, nextStep, formData, setFormData, onFormChange, partName }) => {
  const params = useParams();
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]); // Store multiple images with URLs and IDs
  const [newFiles, setNewFiles] = useState([]); // Store files to upload
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

    setImages([...images, ...selectedFiles.map(file => ({ url: URL.createObjectURL(file), id: null }))]); // Add preview URLs with null IDs for new files
    setNewFiles([...newFiles, ...selectedFiles]); // Add files to the upload list
    setErrors({ ...errors, images: undefined });
  };

  const handleUploadClick = async () => {
    if (newFiles.length === 0 && images.length === 0) {
      alert("Please select at least one image to upload.");
      return;
    }

    if (newFiles.length === 0 && images.length > 0) {
      // Proceed to the next step if there are existing images but no new files
      nextStep();
      return;
    }

    setUploading(true);
    const fd = new FormData();
    newFiles.forEach(file => fd.append("file", file)); // Ensure field name matches
    fd.append('partName', partName);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/upload-photo-v2/${params.formId}`,
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data",
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
    }
  };

  const handleRemoveImage = async (id) => {
    // Remove the image URL from images using the ID
    const updatedImages = images.filter(image => image.id !== id);

    setImages(updatedImages);
    setFormData((prev) => ({
      ...prev,
      imageUrls: updatedImages.map(img => img.url),
    }));

    // If you also want to remove it from the server, uncomment the lines below:
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/remove-image/${id}`);
    } catch (error) {
      console.error("Error removing image:", error);
    }
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/get-gallery/${params.formId}/${params.phoneNumber}`, {
        params: {
          partName: partName,
        }
      });

      const imagesData = response.data.data.map(item => ({
        url: `${process.env.NEXT_PUBLIC_API_URL}/images/${item.images.fileImage}`,
        id: item.id // Assuming `id` is the key for image ID
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
    <div className="p-4 text-center flex-grow">
      <h2 className="text-xl font-semibold">
        {number}. {partName}
      </h2>

      <div className="flex flex-wrap items-center justify-center mb-4 gap-4">
        {images.length > 0 ? (
          images.map((image, index) => (
            <div key={image.id || index} className="relative mt-4">
              <Image
                src={image.url}
                alt={`Preview ${index + 1}`}
                width={150}
                height={150}
                className="rounded"
              />
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

      <div className="flex justify-center gap-x-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
          accept="image/*"
          multiple
        />
        <Button onClick={() => fileInputRef.current.click()} disabled={uploading}>
          {images.length > 0 ? "Change Photos" : "Upload Photos"}
        </Button>
        <Button onClick={handleUploadClick} disabled={uploading || (images.length === 0 && newFiles.length === 0)}>
          {uploading ? "Uploading..." : "Selanjutnya"}
        </Button>

      </div>
    </div>
  );
};

export default StepF;
